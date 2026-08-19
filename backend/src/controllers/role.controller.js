const asyncHandler = require("../utils/asyncHandler");
const roleService = require("../services/role.service");

const createRole = asyncHandler(async (req, res) => {
  const data = await roleService.createRole(req.body.name);
  res.json({ message: "Role created!", data, performed_by: req.user.sub });
});

const getRoles = asyncHandler(async (req, res) => {
  const roles = await roleService.getRoles();
  res.json({ roles, performed_by: req.user.sub });
});

const updateRole = asyncHandler(async (req, res) => {
  const role = await roleService.updateRole(Number(req.params.roleId), req.body.name);
  res.json({ message: `Role '${role.name}' updated!`, data: { id: role.id }, performed_by: req.user.sub });
});

const deleteRole = asyncHandler(async (req, res) => {
  const role = await roleService.deleteRole(Number(req.params.roleId));
  res.json({ message: `Role '${role.name}' deleted!`, performed_by: req.user.sub });
});

const createPermission = asyncHandler(async (req, res) => {
  const data = await roleService.createPermission(req.body.name);
  res.json({ message: "Permission created!", data, performed_by: req.user.sub });
});

const getPermissions = asyncHandler(async (req, res) => {
  const permissions = await roleService.getPermissions();
  res.json({ permissions, performed_by: req.user.sub });
});

const updatePermission = asyncHandler(async (req, res) => {
  const permission = await roleService.updatePermission(Number(req.params.permissionId), req.body.name);
  res.json({
    message: `Permission '${permission.name}' updated!`,
    data: { id: permission.id },
    performed_by: req.user.sub,
  });
});

const deletePermission = asyncHandler(async (req, res) => {
  const permission = await roleService.deletePermission(Number(req.params.permissionId));
  res.json({ message: `Permission '${permission.name}' deleted!`, performed_by: req.user.sub });
});

const assignRole = asyncHandler(async (req, res) => {
  await roleService.assignRoleToUser(Number(req.body.user_id), Number(req.body.role_id));
  res.json({ message: "Role assigned!", performed_by: req.user.sub });
});

const assignPermission = asyncHandler(async (req, res) => {
  await roleService.assignPermissionToRole(Number(req.body.role_id), Number(req.body.permission_id));
  res.json({ message: "Permission assigned!", performed_by: req.user.sub });
});

const updateRolePermissions = asyncHandler(async (req, res) => {
  await roleService.updateRolePermissions(Number(req.params.roleId), req.body.permission_ids);
  res.json({ message: "Role permissions updated!", performed_by: req.user.sub });
});

const getUserRolesPermissions = asyncHandler(async (req, res) => {
  const data = await roleService.getUserRolesPermissions(Number(req.params.userId));
  res.json({ performed_by: req.user.sub, data });
});

module.exports = {
  createRole,
  getRoles,
  updateRole,
  deleteRole,
  createPermission,
  getPermissions,
  updatePermission,
  deletePermission,
  assignRole,
  assignPermission,
  updateRolePermissions,
  getUserRolesPermissions,
};
