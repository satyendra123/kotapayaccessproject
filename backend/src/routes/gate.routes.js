const express = require("express");
const Joi = require("joi");

const gateController = require("../controllers/gate.controller");
const authMiddleware = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");
const { validateBody } = require("../utils/validate.util");

const router = express.Router();

router.use(authMiddleware);

const gateSchema = Joi.object({
  gate_no: Joi.string().required(),
  gate_name: Joi.string().required(),
  status: Joi.string().required(),
});

const gateMachineSchema = Joi.object({
  gate_id: Joi.number().integer().required(),
  machine_uid: Joi.string().required(),
  machine_name: Joi.string().required(),
  machine_ip: Joi.string().ip({ version: ["ipv4", "ipv6"] }).required(),
  machine_type: Joi.string().required(),
  location: Joi.string().required(),
  lane_no: Joi.string().required(),
  start_time: Joi.string().required(),
  end_time: Joi.string().required(),
  status: Joi.string().required(),
});

router.post("/gates/", requirePermission(["gates.create", "manage_gates"]), validateBody(gateSchema), gateController.createGate);
router.get("/gates/", requirePermission(["gates.view", "gates.create", "gates.edit", "gates.delete", "machines.view", "machines.create", "machines.edit", "manage_gates", "manage_gate_machines"]), gateController.listGates);
router.get("/gates/:gateId(\\d+)", requirePermission(["gates.view", "gates.edit", "manage_gates"]), gateController.getGate);
router.put("/gates/:gateId(\\d+)", requirePermission(["gates.edit", "manage_gates"]), validateBody(gateSchema), gateController.updateGate);
router.delete("/gates/:gateId(\\d+)", requirePermission(["gates.delete", "manage_gates"]), gateController.deleteGate);

router.post(
  "/gate-machines/",
  requirePermission(["machines.create", "manage_gate_machines"]),
  validateBody(gateMachineSchema),
  gateController.createMachine
);
router.get("/gate-machines/", requirePermission(["machines.view", "machines.create", "machines.edit", "machines.delete", "manage_gate_machines"]), gateController.listMachines);
router.get("/gate-machines/:machineId(\\d+)", requirePermission(["machines.view", "machines.edit", "manage_gate_machines"]), gateController.getMachine);
router.put(
  "/gate-machines/:machineId(\\d+)",
  requirePermission(["machines.edit", "manage_gate_machines"]),
  validateBody(gateMachineSchema),
  gateController.updateMachine
);
router.delete("/gate-machines/:machineId(\\d+)", requirePermission(["machines.delete", "manage_gate_machines"]), gateController.deleteMachine);

module.exports = router;
