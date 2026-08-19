const express = require("express");
const Joi = require("joi");

const userManagementController = require("../controllers/userManagement.controller");
const authMiddleware = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");
const { validateBody } = require("../utils/validate.util");

const router = express.Router();

router.use(authMiddleware);

const userCreateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  gender: Joi.string().required(),
  user_type: Joi.string().required(),
  date_of_birth: Joi.date().required(),
  phone_number: Joi.string().pattern(/^\d{10}$/).required(),
  email: Joi.string().email().required(),
  aadhaar_number: Joi.string().pattern(/^\d{12}$/).required(),
  username: Joi.string().pattern(/^[a-zA-Z0-9._-]{3,80}$/).required(),
  access_qualification_id: Joi.number().integer().positive().allow(null),
  access_qualification: Joi.string().allow(null),
  status: Joi.string().required(),
  password: Joi.string().min(6).required(),
}).or("access_qualification_id", "access_qualification");

const userUpdateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120),
  gender: Joi.string(),
  user_type: Joi.string(),
  date_of_birth: Joi.date(),
  phone_number: Joi.string().pattern(/^\d{10}$/),
  email: Joi.string().email(),
  aadhaar_number: Joi.string().pattern(/^\d{12}$/),
  username: Joi.string().pattern(/^[a-zA-Z0-9._-]{3,80}$/),
  access_qualification_id: Joi.number().integer().positive().allow(null),
  password: Joi.string().min(6),
  access_qualification: Joi.string().allow(null),
  status: Joi.string(),
});

const qualificationCreateSchema = Joi.object({
  access_qualification_name: Joi.string().required(),
  user_type: Joi.string().required(),
  status: Joi.string().required(),
});

const qualificationUpdateSchema = Joi.object({
  access_qualification_name: Joi.string(),
  user_type: Joi.string(),
  status: Joi.string(),
});

const rightsPermissionSaveSchema = Joi.object({
  access_qualification_id: Joi.number().integer().required(),
  status: Joi.string().required(),
  permissions: Joi.object().pattern(Joi.string(), Joi.array().items(Joi.string())).required(),
});

router.get("/master/user-roles", requirePermission("view_master_data"), userManagementController.userRoles);
router.get(
  "/master/access-qualifications-static",
  requirePermission("view_master_data"),
  userManagementController.accessQualificationsStatic
);
router.get("/master/user-status", requirePermission("view_master_data"), userManagementController.userStatus);
router.get("/master/status-list", requirePermission("view_master_data"), userManagementController.statusList);
router.get(
  "/master/access-qualifications-dropdown",
  requirePermission(["view_master_data", "create_users", "edit_users", "manage_users"]),
  userManagementController.accessQualificationsDropdown
);

router.post("/users", requirePermission(["create_users", "manage_users"]), validateBody(userCreateSchema), userManagementController.createUser);
router.get("/users", requirePermission(["view_users", "manage_users"]), userManagementController.listUsers);
router.get("/users/:userId(\\d+)", requirePermission(["view_users", "manage_users"]), userManagementController.getUser);
router.put(
  "/users/:userId(\\d+)",
  requirePermission(["edit_users", "manage_users"]),
  validateBody(userUpdateSchema),
  userManagementController.updateUser
);
router.delete("/users/:userId(\\d+)", requirePermission(["delete_users", "manage_users"]), userManagementController.deleteUser);

router.post(
  "/qualifications",
  requirePermission("manage_qualifications"),
  validateBody(qualificationCreateSchema),
  userManagementController.createQualification
);
router.get("/qualifications", requirePermission("manage_qualifications"), userManagementController.listQualifications);
router.get(
  "/qualifications/:qualificationId(\\d+)",
  requirePermission("manage_qualifications"),
  userManagementController.getQualification
);
router.put(
  "/qualifications/:qualificationId(\\d+)",
  requirePermission("manage_qualifications"),
  validateBody(qualificationUpdateSchema),
  userManagementController.updateQualification
);
router.delete(
  "/qualifications/:qualificationId(\\d+)",
  requirePermission("manage_qualifications"),
  userManagementController.deleteQualification
);

router.post(
  "/qualification-rights",
  requirePermission("manage_rights_permissions"),
  validateBody(rightsPermissionSaveSchema),
  userManagementController.saveRightsPermission
);
router.delete(
  "/qualification-rights/:accessQualificationId(\\d+)",
  requirePermission("manage_rights_permissions"),
  userManagementController.deleteRightsPermission
);
router.get(
  "/qualification-rights/:accessQualificationId(\\d+)",
  requirePermission("manage_rights_permissions"),
  userManagementController.getRightsPermission
);

module.exports = router;
