const WebSocket = require("ws");
const { decodeToken } = require("../utils/jwt.util");
const parkAccessService = require("../services/parkAccess.service");
const GateTCP = require("../services/gateTcp.service");
const { User, UserRole, RolePermission, Permission } = require("../models");

async function hasPermission(username, requiredPermission) {
  if (!username) return false;

  const userObj = await User.findOne({ where: { username } });
  if (!userObj) return false;

  const userRoles = await UserRole.findAll({ where: { userId: userObj.id } });
  const roleIds = userRoles.map((ur) => ur.roleId);
  if (!roleIds.length) return false;

  const rolePermissions = await RolePermission.findAll({ where: { roleId: roleIds } });
  const permissionIds = rolePermissions.map((rp) => rp.permissionId);
  if (!permissionIds.length) return false;

  const permissions = await Permission.findAll({ where: { id: permissionIds } });
  return permissions.map((p) => p.name).includes(requiredPermission);
}

/**
 * Ports app/routes/ws_scanner.py's /ws/scanner route - defined in the Python app
 * but never mounted in server.py (dead code there). Mounted here per request.
 *
 * One fix applied: the Python handler called validate_scan(machine_id=...) but
 * ParkAccessService.validate_scan only accepts machine_uid - a latent bug that
 * would have raised TypeError on every call had the route ever been reachable.
 * This version takes machine_uid directly (matching the working REST equivalent,
 * POST /api/tickets/validate-park-scan) so the feature is actually functional.
 */
function attachScannerWs(httpServer) {
  const wss = new WebSocket.Server({ server: httpServer, path: "/ws/scanner" });

  wss.on("connection", async (ws, req) => {
    let token = null;
    try {
      token = new URL(req.url, "http://localhost").searchParams.get("token");
    } catch {
      token = null;
    }

    if (!token) {
      ws.send(JSON.stringify({ error: "Unauthorized. Provide ?token=JWT" }));
      ws.close(1008);
      return;
    }

    const payload = decodeToken(token);
    if (!payload) {
      ws.send(JSON.stringify({ error: "Unauthorized. Provide ?token=JWT" }));
      ws.close(1008);
      return;
    }

    const allowed = await hasPermission(payload.sub, "manage_tickets");
    if (!allowed) {
      ws.send(JSON.stringify({ error: "Permission denied" }));
      ws.close(1008);
      return;
    }

    ws.on("message", async (raw) => {
      let data;
      try {
        data = JSON.parse(raw.toString());
      } catch {
        ws.send(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }

      const { gate_id, machine_uid, ticket_number } = data || {};
      if (!gate_id || !machine_uid || !ticket_number) {
        ws.send(JSON.stringify({ error: "gate_id, machine_uid, ticket_number required" }));
        return;
      }

      const { success } = await parkAccessService.validateScan({
        gateId: gate_id,
        machineUid: machine_uid,
        ticketNumber: ticket_number,
      });

      let deviceResponse = null;
      if (success === "valid") {
        try {
          deviceResponse = await new GateTCP().sendCommand("|OPENEN%\r\n");
        } catch (err) {
          deviceResponse = null;
        }
      }

      ws.send(
        JSON.stringify({
          gate_id,
          machine_uid,
          ticket_number,
          success,
          device_response: deviceResponse,
        })
      );
    });
  });

  return wss;
}

module.exports = attachScannerWs;
