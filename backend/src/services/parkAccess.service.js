const { Op, fn, col, where: sequelizeWhere } = require("sequelize");
const { Gate, GateMachine, CustomerTicket, TicketMovementLog } = require("../models");

async function getGate(gateId) {
  return Gate.findByPk(gateId);
}

async function getMachineForGate(gateId, machineUid) {
  const mu = (machineUid || "").trim();
  return GateMachine.findOne({ where: { gateId, machineUid: mu } });
}

function resolveGateType(gate) {
  const gt = (gate.gateType || "").trim().toUpperCase();
  if (gt === "PARK" || gt === "PUBLIC") return gt;

  const name = (gate.gateName || "").toLowerCase();
  if (name.includes("public")) return "PUBLIC";
  return "PARK";
}

async function findTicket(ticketNumber) {
  const tn = (ticketNumber || "").trim().toLowerCase();
  return CustomerTicket.findOne({
    where: sequelizeWhere(fn("LOWER", col("ticket_number")), tn),
  });
}

async function lastPublicAction(ticketNumber) {
  const tn = (ticketNumber || "").trim().toLowerCase();
  const log = await TicketMovementLog.findOne({
    where: {
      [Op.and]: [
        sequelizeWhere(fn("LOWER", fn("COALESCE", col("ticket_number"), "")), tn),
        { area: "PUBLIC" },
        { action: { [Op.in]: ["ENTRY", "EXIT"] } },
      ],
    },
    order: [["createdAt", "DESC"]],
  });
  return log ? log.action : null;
}

async function ticketUsageCount(ticketNumber) {
  const tn = (ticketNumber || "").trim().toLowerCase();
  return TicketMovementLog.count({
    where: sequelizeWhere(fn("LOWER", fn("COALESCE", col("ticket_number"), "")), tn),
  });
}

async function ticketUsedOnGate(ticketNumber, gateId) {
  const tn = (ticketNumber || "").trim().toLowerCase();
  const count = await TicketMovementLog.count({
    where: {
      [Op.and]: [sequelizeWhere(fn("LOWER", fn("COALESCE", col("ticket_number"), "")), tn), { gateId }],
    },
  });
  return count > 0;
}

async function parkEntryCount(ticketNumber, gateId) {
  const tn = (ticketNumber || "").trim().toLowerCase();
  return TicketMovementLog.count({
    where: {
      [Op.and]: [
        sequelizeWhere(fn("LOWER", fn("COALESCE", col("ticket_number"), "")), tn),
        { gateId },
        { area: "PARK" },
        { action: "ENTRY" },
      ],
    },
  });
}

async function logMovement({ gateId, machineDbId, area, action, ticket = null, ticketNumber = null }) {
  return TicketMovementLog.create({
    ticketId: ticket ? ticket.id : null,
    ticketNumber: ticketNumber || (ticket ? ticket.ticketNumber : null),
    gateId,
    machineId: machineDbId,
    area,
    action,
  });
}

/**
 * Returns { success, noOfPersons }. The original Python service returns a 3-tuple
 * (success, no_of_persons, meta) but both callers only unpack 2 values - a latent
 * bug there. meta is kept here for callers that want it but ignored by default.
 */
async function validateScan({ gateId, machineUid, ticketNumber }) {
  const meta = {
    gate_id: gateId,
    machine_uid: (machineUid || "").trim(),
    gate_type: null,
    area: null,
    ticket_number: ticketNumber ? ticketNumber.trim() : null,
    usage_count: null,
    allowed_entries: null,
    remaining_entries: null,
    same_gate_used: null,
    action: null,
    log_id: null,
    reason: null,
  };

  const gate = await getGate(gateId);
  if (!gate) {
    meta.reason = "gate_not_found";
    return { success: "invalid", noOfPersons: null, meta };
  }

  const machine = await getMachineForGate(gateId, machineUid);
  if (!machine) {
    meta.reason = "machine_not_found_for_gate";
    return { success: "invalid", noOfPersons: null, meta };
  }

  const gateType = resolveGateType(gate);
  meta.gate_type = gateType;
  if (gateType !== "PARK" && gateType !== "PUBLIC") {
    meta.reason = "unknown_gate_type";
    return { success: "invalid", noOfPersons: null, meta };
  }

  const machineDbId = machine.id;

  if (gateType === "PUBLIC") {
    meta.area = "PUBLIC";

    if (!ticketNumber || !ticketNumber.trim()) {
      const log = await logMovement({ gateId, machineDbId, area: "PUBLIC", action: "VISITOR" });
      meta.action = "VISITOR";
      meta.log_id = log.id;
      return { success: "valid", noOfPersons: null, meta };
    }

    const ticket = await findTicket(ticketNumber);
    if (!ticket) {
      meta.reason = "ticket_not_found";
      return { success: "invalid", noOfPersons: null, meta };
    }

    const sameGate = await ticketUsedOnGate(ticketNumber, gateId);
    meta.same_gate_used = sameGate;
    if (sameGate) {
      meta.reason = "invalid_same_gate";
      return { success: "invalid_same_gate", noOfPersons: null, meta };
    }

    const usageCount = await ticketUsageCount(ticketNumber);
    meta.usage_count = usageCount;
    if (usageCount >= 4) {
      meta.reason = "invalid_limit_reached";
      return { success: "invalid_limit_reached", noOfPersons: null, meta };
    }

    const lastAction = await lastPublicAction(ticketNumber);
    const nextAction = lastAction === null || lastAction === "EXIT" ? "ENTRY" : "EXIT";

    const log = await logMovement({ gateId, machineDbId, area: "PUBLIC", action: nextAction, ticket });
    meta.action = nextAction;
    meta.log_id = log.id;
    return { success: "valid", noOfPersons: null, meta };
  }

  // PARK gate flow
  meta.area = "PARK";

  if (!ticketNumber || !ticketNumber.trim()) {
    meta.reason = "ticket_required_for_park";
    return { success: "invalid", noOfPersons: null, meta };
  }

  const ticket = await findTicket(ticketNumber);
  if (!ticket) {
    meta.reason = "ticket_not_found";
    return { success: "invalid", noOfPersons: null, meta };
  }

  // A group ticket may be scanned once per paid member at its configured PARK gate.
  // PUBLIC-gate entry/exit rules above intentionally remain unchanged.
  const allowedEntries = Math.max(Number(ticket.noOfMembers) || 1, 1);
  const entryCount = await parkEntryCount(ticketNumber, gateId);
  meta.usage_count = entryCount;
  meta.allowed_entries = allowedEntries;
  meta.remaining_entries = Math.max(allowedEntries - entryCount, 0);

  if (entryCount >= allowedEntries) {
    meta.reason = "member_limit_reached";
    return { success: "invalid_member_limit_reached", noOfPersons: allowedEntries, meta };
  }

  const log = await logMovement({ gateId, machineDbId, area: "PARK", action: "ENTRY", ticket });
  meta.action = "ENTRY";
  meta.log_id = log.id;
  meta.remaining_entries = allowedEntries - entryCount - 1;
  return { success: "valid", noOfPersons: allowedEntries, meta };
}

module.exports = { validateScan, resolveGateType };
