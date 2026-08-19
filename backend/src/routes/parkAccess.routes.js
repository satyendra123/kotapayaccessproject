const express = require("express");
const Joi = require("joi");

const parkAccessController = require("../controllers/parkAccess.controller");
const authMiddleware = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");
const { validateBody } = require("../utils/validate.util");

const router = express.Router();

const parkScanSchema = Joi.object({
  gate_id: Joi.number().integer().required(),
  machine_uid: Joi.string().required(),
  ticket_number: Joi.string().allow(null),
});

router.post(
  "/tickets/validate-park-scan",
  authMiddleware,
  requirePermission("manage_tickets"),
  validateBody(parkScanSchema),
  parkAccessController.validateParkScan
);

module.exports = router;
