const express = require("express");
const Joi = require("joi");

const roleController = require("../controllers/role.controller");
const authMiddleware = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");
const { validateBody } = require("../utils/validate.util");

const router = express.Router();

router.use(authMiddleware);

const nameSchema = Joi.object({ name: Joi.string().required() });
const optionalNameSchema = Joi.object({ name: Joi.string().allow(null) });
const assignRoleSchema = Joi.object({ user_id: Joi.number().integer().required(), role_id: Joi.number().integer().required() });
const assignPermissionSchema = Joi.object({
  role_id: Joi.number().integer().required(),
  permission_id: Joi.number().integer().required(),
});
const rolePermissionUpdateSchema = Joi.object({
  permission_ids: Joi.array().items(Joi.number().integer()).required(),
});

// Role CRUD
router.post("/", requirePermission("manage_roles"), validateBody(nameSchema), roleController.createRole);
router.get("/", requirePermission("view_roles"), roleController.getRoles);
router.put("/:roleId(\\d+)", requirePermission("manage_roles"), validateBody(nameSchema), roleController.updateRole);
router.delete("/:roleId(\\d+)", requirePermission("manage_roles"), roleController.deleteRole);

// Permission CRUD
router.post(
  "/permissions/",
  requirePermission("manage_permissions"),
  validateBody(nameSchema),
  roleController.createPermission
);
router.get("/permissions/", requirePermission("view_permissions"), roleController.getPermissions);
router.put(
  "/permissions/:permissionId(\\d+)",
  requirePermission("manage_permissions"),
  validateBody(optionalNameSchema),
  roleController.updatePermission
);
router.delete("/permissions/:permissionId(\\d+)", requirePermission("manage_permissions"), roleController.deletePermission);

// Assignments
router.post(
  "/assign-role/",
  requirePermission("assign_roles"),
  validateBody(assignRoleSchema),
  roleController.assignRole
);
router.post(
  "/assign-permission/",
  requirePermission("assign_permissions"),
  validateBody(assignPermissionSchema),
  roleController.assignPermission
);

router.put(
  "/:roleId(\\d+)/permissions/",
  requirePermission("manage_permissions"),
  validateBody(rolePermissionUpdateSchema),
  roleController.updateRolePermissions
);

router.get(
  "/user/:userId(\\d+)/roles-permissions/",
  requirePermission("view_roles"),
  roleController.getUserRolesPermissions
);

module.exports = router;
