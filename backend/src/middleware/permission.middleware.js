const {
  User,
  UserRole,
  RolePermission,
  Permission,
  RegisteredUser,
  AccessQualification,
  QualificationRightsPermission,
} = require("../models");
const { permissionsFromRights } = require("../utils/registeredUserPermissions.util");

/**
 * Re-queries the DB on every request (User -> UserRole -> RolePermission -> Permission)
 * instead of trusting the JWT's embedded roles/permissions claims - mirrors the Python
 * check_permission() exactly, so revoked roles/permissions take effect immediately
 * rather than only after the access token expires.
 */
function requirePermission(requiredPermission) {
  return async function permissionMiddleware(req, res, next) {
    try {
      const username = req.user && req.user.sub;
      if (!username) {
        return res.status(401).json({ detail: "Invalid token: username missing" });
      }

      const userObj = req.user.account_type === "registered"
        ? null
        : await User.findOne({ where: { username } });
      if (!userObj) {
        const registeredUser = await RegisteredUser.findOne({
          where: { username },
          include: [{ model: AccessQualification, as: "accessQualification" }],
        });
        if (!registeredUser) {
          return res.status(404).json({ detail: "User not found" });
        }
        if (String(registeredUser.status).toLowerCase() !== "active") {
          return res.status(403).json({ detail: "User account is not active" });
        }

        const qualification = registeredUser.accessQualification;
        if (!qualification || String(qualification.status).toLowerCase() !== "active") {
          return res.status(403).json({ detail: "No active access qualification assigned" });
        }

        const rights = await QualificationRightsPermission.findOne({
          where: { accessQualificationId: qualification.id, status: "Active" },
        });
        const permissionNames = permissionsFromRights(rights && rights.permissions);
        const requiredPermissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
        if (!requiredPermissions.some((permission) => permissionNames.includes(permission))) {
          return res.status(403).json({ detail: "Permission denied" });
        }
        return next();
      }

      const userRoles = await UserRole.findAll({ where: { userId: userObj.id } });
      const roleIds = userRoles.map((ur) => ur.roleId);
      if (roleIds.length === 0) {
        return res.status(403).json({ detail: "No roles assigned to user" });
      }

      const rolePermissions = await RolePermission.findAll({ where: { roleId: roleIds } });
      const permissionIds = rolePermissions.map((rp) => rp.permissionId);
      if (permissionIds.length === 0) {
        return res.status(403).json({ detail: "No permissions found for roles" });
      }

      const permissions = await Permission.findAll({ where: { id: permissionIds } });
      const permissionNames = permissions.map((p) => p.name);

      const requiredPermissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
      if (!requiredPermissions.some((permission) => permissionNames.includes(permission))) {
        return res.status(403).json({ detail: "Permission denied" });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = requirePermission;
