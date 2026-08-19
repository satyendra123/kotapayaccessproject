const asyncHandler = require("../utils/asyncHandler");
const userManagementService = require("../services/userManagement.service");
const { AccessQualification } = require("../models");

const USER_ROLES = [
  { id: 1, role_name: "Operator" },
  { id: 2, role_name: "Supervisor" },
  { id: 3, role_name: "Manager" },
  { id: 4, role_name: "Site In-Charge" },
  { id: 5, role_name: "Technical Engineer" },
];
const ACCESS_QUALIFICATIONS_STATIC = [
  { id: 1, qualification: "Gate Access" },
  { id: 2, qualification: "Admin Panel Access" },
  { id: 3, qualification: "Report View Access" },
];
const USER_STATUS = [{ value: "Active" }, { value: "Inactive" }, { value: "Blocked" }];
const STATUS_LIST = [{ value: "Active" }, { value: "Inactive" }];

function apiResponse(data, message) {
  const body = { status: true };
  if (message !== undefined) body.message = message;
  if (data !== undefined) body.data = data;
  return body;
}

function userDetailOut(user) {
  return {
    id: user.id,
    name: user.name,
    gender: user.gender,
    user_type: user.userType,
    date_of_birth: user.dateOfBirth,
    email: user.email,
    phone_number: user.phoneNumber,
    last_login_datetime: user.lastLoginDatetime,
    status: user.status,
    aadhaar_number: user.aadhaarNumber,
    username: user.username,
    access_qualification_id: user.accessQualificationId,
    access_qualification: user.accessQualification ? user.accessQualification.accessQualificationName : null,
  };
}

function qualificationOut(q) {
  return {
    id: q.id,
    access_qualification_name: q.accessQualificationName,
    qualification_for: q.qualificationFor,
    status: q.status,
    created_at: q.createdAt,
  };
}

const userRoles = asyncHandler(async (req, res) => res.json(apiResponse(USER_ROLES)));
const accessQualificationsStatic = asyncHandler(async (req, res) => res.json(apiResponse(ACCESS_QUALIFICATIONS_STATIC)));
const userStatus = asyncHandler(async (req, res) => res.json(apiResponse(USER_STATUS)));
const statusList = asyncHandler(async (req, res) => res.json(apiResponse(STATUS_LIST)));

const accessQualificationsDropdown = asyncHandler(async (req, res) => { 
  const rows = await AccessQualification.findAll({ where: { status: "Active" }, order: [["accessQualificationName", "ASC"]] });
  res.json(apiResponse(rows.map((r) => ({
    id: r.id,
    access_qualification_name: r.accessQualificationName,
    qualification_for: r.qualificationFor,
    status: r.status,
  }))));
});

const createUser = asyncHandler(async (req, res) => {
  const user = await userManagementService.createUser(req.body);
  res.json(apiResponse(userDetailOut(user), "User created successfully"));
});

const listUsers = asyncHandler(async (req, res) => {
  const users = await userManagementService.listUsers();
  res.json(apiResponse(users.map(userDetailOut), "Users fetched successfully"));
});

const getUser = asyncHandler(async (req, res) => {
  const user = await userManagementService.getUser(Number(req.params.userId));
  res.json(apiResponse(userDetailOut(user)));
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userManagementService.updateUser(Number(req.params.userId), req.body);
  res.json(apiResponse(userDetailOut(user), "User updated successfully"));
});

const deleteUser = asyncHandler(async (req, res) => {
  const message = await userManagementService.deleteUser(Number(req.params.userId));
  res.json(apiResponse(undefined, message));
});

const createQualification = asyncHandler(async (req, res) => {
  const obj = await userManagementService.createQualification(req.body);
  res.json(apiResponse(qualificationOut(obj), "Qualification created successfully"));
});

const listQualifications = asyncHandler(async (req, res) => {
  const rows = await userManagementService.listQualifications();
  res.json(apiResponse(rows.map(qualificationOut), "Qualifications fetched successfully"));
});

const getQualification = asyncHandler(async (req, res) => {
  const obj = await userManagementService.getQualification(Number(req.params.qualificationId));
  res.json(apiResponse(qualificationOut(obj)));
});

const updateQualification = asyncHandler(async (req, res) => {
  const obj = await userManagementService.updateQualification(Number(req.params.qualificationId), req.body);
  res.json(apiResponse(qualificationOut(obj), "Qualification updated successfully"));
});

const deleteQualification = asyncHandler(async (req, res) => {
  const message = await userManagementService.deleteQualification(Number(req.params.qualificationId));
  res.json(apiResponse(undefined, message));
});

const saveRightsPermission = asyncHandler(async (req, res) => {
  await userManagementService.saveRightsPermission(req.body);
  res.json(apiResponse(undefined, "Rights/Permission saved successfully"));
});

const deleteRightsPermission = asyncHandler(async (req, res) => {
  const message = await userManagementService.deleteRightsPermission(Number(req.params.accessQualificationId));
  res.json(apiResponse(undefined, message));
});

const getRightsPermission = asyncHandler(async (req, res) => {
  const { rights, qualification } = await userManagementService.getRightsPermissionByQualification(
    Number(req.params.accessQualificationId)
  );
  res.json(
    apiResponse({
      access_qualification_id: qualification.id,
      access_qualification_name: qualification.accessQualificationName,
      status: rights.status,
      permissions: rights.permissions,
      updated_at: rights.updatedAt,
    })
  );
});

module.exports = {
  userRoles,
  accessQualificationsStatic,
  userStatus,
  statusList,
  accessQualificationsDropdown,
  createUser,
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  createQualification,
  listQualifications,
  getQualification,
  updateQualification,
  deleteQualification,
  saveRightsPermission,
  deleteRightsPermission,
  getRightsPermission,
};
