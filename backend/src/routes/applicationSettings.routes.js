const express = require("express");
const Joi = require("joi");

const applicationSettingsController = require("../controllers/applicationSettings.controller");
const authMiddleware = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");
const { validateBody } = require("../utils/validate.util");
const { uploadLogo } = require("../middleware/upload.middleware");

const router = express.Router();

router.use(authMiddleware);

const settingsUpdateSchema = Joi.object({
  company_name: Joi.string().allow(null),
  company_phone: Joi.string().allow(null),
  company_email: Joi.string().email().allow(null),
  startup_year: Joi.number().integer().min(1800).max(2100).allow(null),
  company_address: Joi.string().allow(null),
  print_brand_name: Joi.string().allow(null),
  powered_by: Joi.string().allow(null),
  ticket_penalty_charges: Joi.number().min(0).allow(null),
  student_discount_percentage: Joi.number().min(0).max(100).allow(null),
  member_discount_rules: Joi.array().items(Joi.object({
    min_members: Joi.number().integer().min(1).required(),
    discount_percentage: Joi.number().min(0).max(100).required(),
  })).min(1),
  terms_and_conditions: Joi.string().allow(null),
});

router.get(
  "/member-discount-rules",
  requirePermission(["manage_application_settings", "manage_tickets"]),
  applicationSettingsController.getMemberDiscountRules
);

router.use(requirePermission("manage_application_settings"));

router.get("/", applicationSettingsController.getApplicationSettings);
router.put("/", validateBody(settingsUpdateSchema), applicationSettingsController.updateApplicationSettings);
router.post("/upload-logo", uploadLogo.single("logo_file"), applicationSettingsController.uploadCompanyLogo);

module.exports = router;
