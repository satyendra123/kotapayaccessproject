const express = require("express");
const Joi = require("joi");

const staffController = require("../controllers/staff.controller");
const authMiddleware = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");
const { validateBody } = require("../utils/validate.util");

const router = express.Router();

router.use(authMiddleware);

const categorySchema = Joi.object({
  catgname: Joi.string().required(),
  status: Joi.string().default("Active"),
});

const staffSchema = Joi.object({
  staff_category_id: Joi.number().integer().required(),
  name: Joi.string().required(),
  gender: Joi.string().required(),
  staff_type: Joi.string().required(),
  dob: Joi.string().required(),
  doj: Joi.string().required(),
  phone_number: Joi.string().required(),
  email: Joi.string().email().required(),
  status: Joi.string().default("Active"),
  access_card_number: Joi.string().allow(null),
  aadhaar_card: Joi.string().allow(null),
});

router.post(
  "/staff-categories/",
  requirePermission("manage_staff_categories"),
  validateBody(categorySchema),
  staffController.createCategory
);
router.get("/staff-categories/", requirePermission(["manage_staff_categories", "staffs.create", "staffs.edit", "manage_staff"]), staffController.listCategories);
router.get("/staff-categories/:categoryId(\\d+)", requirePermission("manage_staff_categories"), staffController.getCategory);
router.put(
  "/staff-categories/:categoryId(\\d+)",
  requirePermission("manage_staff_categories"),
  validateBody(categorySchema),
  staffController.updateCategory
);
router.patch(
  "/staff-categories/:categoryId(\\d+)/deactivate",
  requirePermission("manage_staff_categories"),
  staffController.deactivateCategory
);

router.post("/staff/", requirePermission(["staffs.create", "manage_staff"]), validateBody(staffSchema), staffController.createStaffMember);
router.get("/staff/", requirePermission(["staffs.view", "staffs.create", "staffs.edit", "staffs.delete", "manage_staff"]), staffController.listStaffMembers);
router.get("/staff/:staffId(\\d+)", requirePermission(["staffs.edit", "manage_staff"]), staffController.getStaffMember);
router.put(
  "/staff/:staffId(\\d+)",
  requirePermission(["staffs.edit", "manage_staff"]),
  validateBody(staffSchema),
  staffController.updateStaffMember
);
router.patch("/staff/:staffId(\\d+)/deactivate", requirePermission(["staffs.edit", "manage_staff"]), staffController.deactivateStaffMember);
router.delete("/staff/:staffId(\\d+)", requirePermission(["staffs.delete", "manage_staff"]), staffController.deleteStaffMember);

module.exports = router;
