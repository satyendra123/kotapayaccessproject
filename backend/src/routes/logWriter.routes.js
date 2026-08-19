const express = require("express");
const Joi = require("joi");

const logWriterController = require("../controllers/logWriter.controller");
const authMiddleware = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");
const { validateBody } = require("../utils/validate.util");

const router = express.Router();

router.use(authMiddleware);

const staffLogSchema = Joi.object({
  staff_name: Joi.string().required(),
  action: Joi.string().valid("entry", "exit").required(),
  staff_id: Joi.number().integer().allow(null),
  gate_id: Joi.number().integer().allow(null),
  machine_id: Joi.number().integer().allow(null),
});

const userActionLogSchema = Joi.object({
  username: Joi.string().required(),
  user_type: Joi.string().required(),
  action: Joi.string().required(),
  user_id: Joi.number().integer().allow(null),
  meta: Joi.object().allow(null),
});

const gateConnectivityLogSchema = Joi.object({
  gate_name: Joi.string().required(),
  status: Joi.string().required(),
  gate_id: Joi.number().integer().allow(null),
  machine_id: Joi.number().integer().allow(null),
  machine_name: Joi.string().allow(null),
  remark: Joi.string().allow(null),
});

const blacklistAddSchema = Joi.object({
  entry_type: Joi.string().valid("Card", "Ticket").required(),
  value: Joi.string().required(),
  reason: Joi.string().allow(null),
});

router.post(
  "/logs/staff-entry-exit",
  requirePermission("manage_staff"),
  validateBody(staffLogSchema),
  logWriterController.addStaffEntryExitLog
);
router.post(
  "/logs/user-action",
  requirePermission("view_master_data"),
  validateBody(userActionLogSchema),
  logWriterController.addUserActionLog
);
router.post(
  "/logs/gate-connectivity",
  requirePermission("manage_gates"),
  validateBody(gateConnectivityLogSchema),
  logWriterController.addGateConnectivityLog
);
router.post(
  "/blacklist",
  requirePermission("view_master_data"),
  validateBody(blacklistAddSchema),
  logWriterController.addBlacklistEntry
);

module.exports = router;
