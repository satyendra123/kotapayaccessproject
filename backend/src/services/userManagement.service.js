const { Op } = require("sequelize");
const { RegisteredUser, AccessQualification, QualificationRightsPermission } = require("../models");
const { getPasswordHash } = require("../utils/password.util");
const { HttpError } = require("../middleware/error.middleware");

async function getQualificationByName(qualificationName, userType) {
  const qualifications = await AccessQualification.findAll({
    where: { accessQualificationName: qualificationName, status: "Active" },
  });
  return qualifications.find(
    (qualification) => normalizeUserType(qualification.qualificationFor) === normalizeUserType(userType)
  ) || null;
}

function normalizeUserType(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace("site in charge", "site incharge")
    .replace("technical manager", "technical engineer");
}

async function resolveQualification(payload, targetUserType) {
  if (payload.access_qualification_id !== undefined) {
    if (payload.access_qualification_id === null) return null;
    const qualification = await AccessQualification.findByPk(payload.access_qualification_id);
    if (!qualification) throw new HttpError(400, "Selected access qualification does not exist");
    if (String(qualification.status).toLowerCase() !== "active") {
      throw new HttpError(400, "Selected access qualification is inactive");
    }
    if (normalizeUserType(qualification.qualificationFor) !== normalizeUserType(targetUserType)) {
      throw new HttpError(400, `Selected access qualification is for ${qualification.qualificationFor}, not ${targetUserType}`);
    }
    return qualification;
  }

  if (payload.access_qualification !== undefined) {
    if (payload.access_qualification === null) return null;
    const qualification = await getQualificationByName(payload.access_qualification, targetUserType);
    if (!qualification) {
      throw new HttpError(400, "Select an active access qualification that matches the user role");
    }
    return qualification;
  }

  return undefined;
}

function duplicateFieldMessage(user, payload) {
  const checks = [
    ["email", "email", "Email"],
    ["username", "username", "Username"],
    ["phone_number", "phoneNumber", "Phone number"],
    ["aadhaar_number", "aadhaarNumber", "Aadhaar number"],
  ];
  const match = checks.find(([payloadKey, modelField]) =>
    payload[payloadKey] !== undefined &&
    String(user[modelField] || "").trim().toLowerCase() === String(payload[payloadKey] || "").trim().toLowerCase()
  );
  return match ? `${match[2]} is already registered` : "A user with these details is already registered";
}

async function createUser(payload) {
  const existing = await RegisteredUser.findOne({
    where: {
      [Op.or]: [
        { email: payload.email },
        { username: payload.username },
        { phoneNumber: payload.phone_number },
        { aadhaarNumber: payload.aadhaar_number },
      ],
    },
  });
  if (existing) {
    throw new HttpError(409, duplicateFieldMessage(existing, payload));
  }

  const qualification = await resolveQualification(payload, payload.user_type);
  const qualificationId = qualification ? qualification.id : null;

  const user = await RegisteredUser.create({
    name: payload.name,
    gender: payload.gender,
    userType: payload.user_type,
    dateOfBirth: payload.date_of_birth,
    phoneNumber: payload.phone_number,
    email: payload.email,
    aadhaarNumber: payload.aadhaar_number,
    username: payload.username,
    passwordHash: await getPasswordHash(payload.password),
    accessQualificationId: qualificationId,
    status: payload.status,
  });

  return getUser(user.id);
}

async function listUsers() {
  return RegisteredUser.findAll({ include: [{ model: AccessQualification, as: "accessQualification" }] });
}

async function getUser(userId) {
  const user = await RegisteredUser.findByPk(userId, {
    include: [{ model: AccessQualification, as: "accessQualification" }],
  });
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  return user;
}

async function updateUser(userId, payload) {
  const user = await getUser(userId);

  const uniqueChecks = [
    ["email", "email"],
    ["username", "username"],
    ["phone_number", "phoneNumber"],
    ["aadhaar_number", "aadhaarNumber"],
  ];
  const duplicateConditions = uniqueChecks
    .filter(([payloadKey]) => payload[payloadKey] !== undefined)
    .map(([payloadKey, modelField]) => ({ [modelField]: payload[payloadKey] }));

  if (duplicateConditions.length > 0) {
    const duplicate = await RegisteredUser.findOne({
      where: {
        id: { [Op.ne]: userId },
        [Op.or]: duplicateConditions,
      },
    });
    if (duplicate) {
      throw new HttpError(409, duplicateFieldMessage(duplicate, payload));
    }
  }

  if (payload.password !== undefined) {
    user.passwordHash = await getPasswordHash(payload.password);
  }

  if (payload.access_qualification_id !== undefined || payload.access_qualification !== undefined) {
    const targetUserType = payload.user_type !== undefined ? payload.user_type : user.userType;
    const qualification = await resolveQualification(payload, targetUserType);
    user.accessQualificationId = qualification ? qualification.id : null;
  } else if (payload.user_type !== undefined && user.accessQualificationId) {
    const qualification = await AccessQualification.findByPk(user.accessQualificationId);
    if (
      qualification &&
      normalizeUserType(qualification.qualificationFor) !== normalizeUserType(payload.user_type)
    ) {
      throw new HttpError(400, "Select an access qualification that matches the new user role");
    }
  }

  const fieldMap = {
    name: "name",
    gender: "gender",
    user_type: "userType",
    date_of_birth: "dateOfBirth",
    phone_number: "phoneNumber",
    email: "email",
    aadhaar_number: "aadhaarNumber",
    username: "username",
    status: "status",
  };
  for (const [key, field] of Object.entries(fieldMap)) {
    if (payload[key] !== undefined) {
      user[field] = payload[key];
    }
  }

  await user.save();
  return getUser(userId);
}

async function deleteUser(userId) {
  const user = await getUser(userId);
  await user.destroy();
  return "User deleted successfully";
}

async function createQualification(payload) {
  const existing = await AccessQualification.findOne({
    where: { accessQualificationName: payload.access_qualification_name, qualificationFor: payload.user_type },
  });
  if (existing) {
    throw new HttpError(400, "Qualification already exists for this user type");
  }

  return AccessQualification.create({
    accessQualificationName: payload.access_qualification_name,
    qualificationFor: payload.user_type,
    status: payload.status,
  });
}

async function listQualifications() {
  return AccessQualification.findAll();
}

async function getQualification(qualificationId) {
  const obj = await AccessQualification.findByPk(qualificationId);
  if (!obj) {
    throw new HttpError(404, "Qualification not found");
  }
  return obj;
}

async function updateQualification(qualificationId, payload) {
  const obj = await getQualification(qualificationId);

  if (payload.user_type !== undefined) {
    obj.qualificationFor = payload.user_type;
  }
  if (payload.access_qualification_name !== undefined) {
    obj.accessQualificationName = payload.access_qualification_name;
  }
  if (payload.status !== undefined) {
    obj.status = payload.status;
  }

  await obj.save();
  return obj;
}

async function deleteQualification(qualificationId) {
  const obj = await getQualification(qualificationId);
  const [assignedUsers, savedRights] = await Promise.all([
    RegisteredUser.count({ where: { accessQualificationId: qualificationId } }),
    QualificationRightsPermission.count({ where: { accessQualificationId: qualificationId } }),
  ]);
  if (assignedUsers > 0 || savedRights > 0) {
    throw new HttpError(
      409,
      "This qualification is in use. Mark it inactive instead of deleting it"
    );
  }
  await obj.destroy();
  return "Qualification deleted successfully";
}

async function saveRightsPermission(payload) {
  const qual = await AccessQualification.findByPk(payload.access_qualification_id);
  if (!qual) {
    throw new HttpError(404, "Access qualification not found");
  }

  const existing = await QualificationRightsPermission.findOne({
    where: { accessQualificationId: payload.access_qualification_id },
  });

  if (existing) {
    existing.status = payload.status;
    existing.permissions = payload.permissions;
    await existing.save();
    return existing;
  }

  return QualificationRightsPermission.create({
    accessQualificationId: payload.access_qualification_id,
    status: payload.status,
    permissions: payload.permissions,
  });
}

async function deleteRightsPermission(accessQualificationId) {
  const rights = await QualificationRightsPermission.findOne({ where: { accessQualificationId } });
  if (!rights) throw new HttpError(404, "Saved permissions not found");
  await rights.destroy();
  return "Permissions deleted successfully";
}

async function getRightsPermissionByQualification(accessQualificationId) {
  const rights = await QualificationRightsPermission.findOne({
    where: { accessQualificationId },
    include: [{ model: AccessQualification, as: "accessQualification" }],
  });

  if (!rights) {
    throw new HttpError(404, "Rights/Permission not found for this qualification");
  }

  return { rights, qualification: rights.accessQualification };
}

module.exports = {
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
  getRightsPermissionByQualification,
  normalizeUserType,
};
