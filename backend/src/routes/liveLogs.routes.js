const express = require("express");
const Joi = require("joi");

const liveLogsController = require("../controllers/liveLogs.controller");
const authMiddleware = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");
const { validateBody } = require("../utils/validate.util");

const router = express.Router();

router.use(authMiddleware);

const staffLiveLogInSchema = Joi.object({
  staff_id: Joi.number().integer().required(),
  action: Joi.string().required(),
  gate_id: Joi.number().integer().allow(null),
  machine_id: Joi.number().integer().allow(null),
});

const machineActionSchema = Joi.object({ remark: Joi.string().allow(null) });
const alarmAddSchema = Joi.object({ alarm_message: Joi.string().required(), meta: Joi.object().allow(null) });

router.get("/staff/live-logs/all", requirePermission("view_master_data"), liveLogsController.liveStaffLogsAll);
router.get("/staff/live-logs", requirePermission("view_master_data"), liveLogsController.liveStaffLogs);
router.post(
  "/staff/live-logs/add",
  requirePermission("manage_staff"),
  validateBody(staffLiveLogInSchema),
  liveLogsController.addStaffLiveLog
);

router.get("/machines/live-logs", requirePermission("view_master_data"), liveLogsController.liveMachineLogs);
router.post(
  "/machines/:id(\\d+)/open",
  requirePermission("manage_gates"),
  validateBody(machineActionSchema),
  liveLogsController.openMachine
);
router.post(
  "/machines/:id(\\d+)/close",
  requirePermission("manage_gates"),
  validateBody(machineActionSchema),
  liveLogsController.closeMachine
);
router.post(
  "/machines/permanently-open-all",
  requirePermission("manage_gates"),
  validateBody(machineActionSchema),
  liveLogsController.permanentlyOpenAll
);
router.post(
  "/machines/permanently-close-all",
  requirePermission("manage_gates"),
  validateBody(machineActionSchema),
  liveLogsController.permanentlyCloseAll
);

router.get("/customers/live-tickets", requirePermission("view_master_data"), liveLogsController.liveCustomerTickets);

router.get("/alarms/live-logs", requirePermission("view_master_data"), liveLogsController.liveAlarmLogs);
router.post(
  "/alarms/live-logs/add",
  requirePermission("view_master_data"),
  validateBody(alarmAddSchema),
  liveLogsController.addAlarm
);

module.exports = router;
