const { Role, Permission, UserRole, RolePermission } = require("../models");
const { HttpError } = require("../middleware/error.middleware");

async function createRole(name) {
  if (!name || !name.trim()) {
    throw new HttpError(400, "Role name cannot be empty");
  }

  const existing = await Role.findOne({ where: { name } });
  if (existing) {
    throw new HttpError(400, "Role already exists");
  }

  const role = await Role.create({ name });
  return { id: role.id, name: role.name };
}

async function getRoles() {
  const roles = await Role.findAll();
  return roles.map((r) => ({ id: r.id, name: r.name }));
}

async function updateRole(roleId, name) {
  const role = await Role.findByPk(roleId);
  if (!role) {
    throw new HttpError(404, "Role not found");
  }
  if (!name || !name.trim()) {
    throw new HttpError(400, "Role name cannot be empty");
  }

  role.name = name;
  await role.save();
  return role;
}

async function deleteRole(roleId) {
  const role = await Role.findByPk(roleId);
  if (!role) {
    throw new HttpError(404, "Role not found");
  }
  await role.destroy();
  return role;
}

async function createPermission(name) {
  if (!name || !name.trim()) {
    throw new HttpError(400, "Permission name is required");
  }

  const existing = await Permission.findOne({ where: { name } });
  if (existing) {
    throw new HttpError(400, "Permission already exists");
  }

  const permission = await Permission.create({ name });
  return { id: permission.id, name: permission.name };
}

async function getPermissions() {
  const permissions = await Permission.findAll();
  return permissions.map((p) => ({ id: p.id, name: p.name }));
}

async function updatePermission(permissionId, name) {
  const permission = await Permission.findByPk(permissionId);
  if (!permission) {
    throw new HttpError(404, "Permission not found");
  }

  if (name != null) {
    if (!name.trim()) {
      throw new HttpError(400, "Permission name cannot be empty");
    }
    permission.name = name;
  }

  await permission.save();
  return permission;
}

async function deletePermission(permissionId) {
  const permission = await Permission.findByPk(permissionId);
  if (!permission) {
    throw new HttpError(404, "Permission not found");
  }
  await permission.destroy();
  return permission;
}

async function assignRoleToUser(userId, roleId) {
  const exists = await UserRole.findOne({ where: { userId, roleId } });
  if (exists) {
    throw new HttpError(400, "Role already assigned");
  }
  await UserRole.create({ userId, roleId });
}

async function assignPermissionToRole(roleId, permissionId) {
  const exists = await RolePermission.findOne({ where: { roleId, permissionId } });
  if (exists) {
    throw new HttpError(400, "Permission already assigned to role");
  }
  await RolePermission.create({ roleId, permissionId });
}

async function updateRolePermissions(roleId, permissionIds) {
  await RolePermission.destroy({ where: { roleId } });
  for (const permissionId of permissionIds) {
    await RolePermission.create({ roleId, permissionId });
  }
}

async function getUserRolesPermissions(userId) {
  const userRoles = await UserRole.findAll({ where: { userId } });
  if (!userRoles.length) {
    throw new HttpError(404, "No roles found");
  }

  const roles = [];
  const permissions = new Set();

  for (const ur of userRoles) {
    const role = await Role.findByPk(ur.roleId);
    roles.push({ id: role.id, name: role.name });

    const rolePermissions = await RolePermission.findAll({ where: { roleId: role.id } });
    const permissionIds = rolePermissions.map((rp) => rp.permissionId);
    if (permissionIds.length) {
      const perms = await Permission.findAll({ where: { id: permissionIds } });
      perms.forEach((p) => permissions.add(p.name));
    }
  }

  return { roles, permissions: Array.from(permissions).sort() };
}

module.exports = {
  createRole,
  getRoles,
  updateRole,
  deleteRole,
  createPermission,
  getPermissions,
  updatePermission,
  deletePermission,
  assignRoleToUser,
  assignPermissionToRole,
  updateRolePermissions,
  getUserRolesPermissions,
};
