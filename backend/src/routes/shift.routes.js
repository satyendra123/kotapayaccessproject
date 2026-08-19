const express = require("express");
const Joi = require("joi");

const shiftController = require("../controllers/shift.controller");
const authMiddleware = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");
const { validateBody } = require("../utils/validate.util");

const router = express.Router();

router.use(authMiddleware);

const shiftCreateSchema = Joi.object({
  shiftname: Joi.string().required(),
  shiftstarttime: Joi.string().required(),
  shiftendtime: Joi.string().required(),
  status: Joi.string().required(),
});

const shiftUpdateSchema = Joi.object({
  shiftname: Joi.string(),
  shiftstarttime: Joi.string(),
  shiftendtime: Joi.string(),
  status: Joi.string(),
});

router.post("/", requirePermission(["shifts.create", "manage_shifts"]), validateBody(shiftCreateSchema), shiftController.createShift);
router.get("/", requirePermission(["shifts.view", "shifts.create", "shifts.edit", "shifts.delete", "manage_shifts", "tickets.create", "manage_tickets"]), shiftController.listShifts);
router.get("/:shiftId(\\d+)", requirePermission(["shifts.edit", "manage_shifts"]), shiftController.getShift);
router.put(
  "/:shiftId(\\d+)",
  requirePermission(["shifts.edit", "manage_shifts"]),
  validateBody(shiftUpdateSchema),
  shiftController.updateShift
);
router.delete("/:shiftId(\\d+)", requirePermission(["shifts.delete", "manage_shifts"]), shiftController.deleteShift);

module.exports = router;
