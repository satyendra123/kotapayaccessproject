const { StaffCategory, Staff } = require("../models");
const { HttpError } = require("../middleware/error.middleware");

async function createStaffCategory(data) {
  return StaffCategory.create({ catgname: data.catgname, status: data.status || "Active" });
}

async function listStaffCategories() {
  return StaffCategory.findAll({ order: [["id", "DESC"]] });
}

async function getStaffCategoryById(categoryId) {
  const category = await StaffCategory.findByPk(categoryId);
  if (!category) {
    throw new HttpError(404, "Staff category not found");
  }
  return category;
}

async function updateStaffCategory(categoryId, data) {
  const category = await getStaffCategoryById(categoryId);
  category.catgname = data.catgname;
  category.status = data.status || "Active";
  await category.save();
  return category;
}

async function deactivateStaffCategory(categoryId) {
  const category = await getStaffCategoryById(categoryId);
  category.status = "Deactive";
  await category.save();
  return category;
}

async function createStaff(data) {
  return Staff.create({
    staffCategoryId: data.staff_category_id,
    name: data.name,
    gender: data.gender,
    staffType: data.staff_type,
    dob: data.dob,
    doj: data.doj,
    phoneNumber: data.phone_number,
    email: data.email,
    status: data.status || "Active",
    accessCardNumber: data.access_card_number || null,
    aadhaarCard: data.aadhaar_card || null,
  });
}

async function listStaffs() {
  return Staff.findAll({ order: [["id", "DESC"]] });
}

async function getStaffById(staffId) {
  const staff = await Staff.findByPk(staffId);
  if (!staff) {
    throw new HttpError(404, "Staff not found");
  }
  return staff;
}

async function updateStaff(staffId, data) {
  const staff = await getStaffById(staffId);
  staff.staffCategoryId = data.staff_category_id;
  staff.name = data.name;
  staff.gender = data.gender;
  staff.staffType = data.staff_type;
  staff.dob = data.dob;
  staff.doj = data.doj;
  staff.phoneNumber = data.phone_number;
  staff.email = data.email;
  staff.status = data.status || "Active";
  staff.accessCardNumber = data.access_card_number || null;
  staff.aadhaarCard = data.aadhaar_card || null;
  await staff.save();
  return staff;
}

async function deactivateStaff(staffId) {
  const staff = await getStaffById(staffId);
  staff.status = "Deactive";
  await staff.save();
  return staff;
}

async function deleteStaff(staffId) {
  const staff = await getStaffById(staffId);
  const name = staff.name;
  await staff.destroy();
  return `Staff '${name}' deleted successfully!`;
}

module.exports = {
  createStaffCategory,
  listStaffCategories,
  getStaffCategoryById,
  updateStaffCategory,
  deactivateStaffCategory,
  createStaff,
  listStaffs,
  getStaffById,
  updateStaff,
  deactivateStaff,
  deleteStaff,
};
