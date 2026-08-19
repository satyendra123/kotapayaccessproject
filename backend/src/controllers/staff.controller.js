const asyncHandler = require("../utils/asyncHandler");
const staffService = require("../services/staff.service");

function categoryOut(category) {
  return {
    id: category.id,
    catgname: category.catgname,
    status: category.status,
    created_at: category.createdAt,
  };
}

function staffOut(staff) {
  return {
    id: staff.id,
    staff_category_id: staff.staffCategoryId,
    name: staff.name,
    gender: staff.gender,
    staff_type: staff.staffType,
    dob: staff.dob,
    doj: staff.doj,
    phone_number: staff.phoneNumber,
    email: staff.email,
    status: staff.status,
    access_card_number: staff.accessCardNumber,
    aadhaar_card: staff.aadhaarCard,
    created_at: staff.createdAt,
  };
}

const createCategory = asyncHandler(async (req, res) => {
  res.json(categoryOut(await staffService.createStaffCategory(req.body)));
});

const listCategories = asyncHandler(async (req, res) => {
  res.json((await staffService.listStaffCategories()).map(categoryOut));
});

const getCategory = asyncHandler(async (req, res) => {
  res.json(categoryOut(await staffService.getStaffCategoryById(Number(req.params.categoryId))));
});

const updateCategory = asyncHandler(async (req, res) => {
  res.json(categoryOut(await staffService.updateStaffCategory(Number(req.params.categoryId), req.body)));
});

const deactivateCategory = asyncHandler(async (req, res) => {
  res.json(categoryOut(await staffService.deactivateStaffCategory(Number(req.params.categoryId))));
});

const createStaffMember = asyncHandler(async (req, res) => {
  res.json(staffOut(await staffService.createStaff(req.body)));
});

const listStaffMembers = asyncHandler(async (req, res) => {
  res.json((await staffService.listStaffs()).map(staffOut));
});

const getStaffMember = asyncHandler(async (req, res) => {
  res.json(staffOut(await staffService.getStaffById(Number(req.params.staffId))));
});

const updateStaffMember = asyncHandler(async (req, res) => {
  res.json(staffOut(await staffService.updateStaff(Number(req.params.staffId), req.body)));
});

const deactivateStaffMember = asyncHandler(async (req, res) => {
  res.json(staffOut(await staffService.deactivateStaff(Number(req.params.staffId))));
});

const deleteStaffMember = asyncHandler(async (req, res) => {
  const message = await staffService.deleteStaff(Number(req.params.staffId));
  res.json({ message });
});

module.exports = {
  createCategory,
  listCategories,
  getCategory,
  updateCategory,
  deactivateCategory,
  createStaffMember,
  listStaffMembers,
  getStaffMember,
  updateStaffMember,
  deactivateStaffMember,
  deleteStaffMember,
};
