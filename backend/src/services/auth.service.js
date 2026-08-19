const {
  User,
  UserRole,
  Role,
  Permission,
  RolePermission,
  UserRefreshToken,
  RegisteredUser,
  AccessQualification,
  QualificationRightsPermission,
  PasswordResetToken,
} = require("../models");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { verifyPassword, getPasswordHash } = require("../utils/password.util");
const { createAccessToken, createRefreshToken, decodeToken, hashToken } = require("../utils/jwt.util");
const { HttpError } = require("../middleware/error.middleware");
const { permissionsFromRights } = require("../utils/registeredUserPermissions.util");
const env = require("../config/env");

const ACCESS_TOKEN_MINUTES = env.ACCESS_TOKEN_EXPIRE_MINUTES;
const REFRESH_TOKEN_DAYS = env.REFRESH_TOKEN_EXPIRE_DAYS;

async function buildRolesList(userId) {
  const userRoles = await UserRole.findAll({ where: { userId } });

  const rolesList = [];
  for (const ur of userRoles) {
    const role = await Role.findByPk(ur.roleId);
    if (!role) continue;

    const rolePermissions = await RolePermission.findAll({ where: { roleId: role.id } });
    const permissionIds = rolePermissions.map((rp) => rp.permissionId);
    const permissions = permissionIds.length
      ? await Permission.findAll({ where: { id: permissionIds }, attributes: ["name"] })
      : [];

    rolesList.push({
      id: role.id,
      name: role.name,
      permissions: permissions.map((p) => p.name),
    });
  }

  return rolesList;
}

async function registerUser({ username, password, roleId }) {
  const existing = await User.findOne({ where: { username } });
  if (existing) {
    throw new HttpError(400, "Username already registered");
  }

  const hashedPassword = await getPasswordHash(password);
  const newUser = await User.create({ username, hashedPassword });

  await UserRole.create({ userId: newUser.id, roleId });

  return { message: "User registered successfully", user_id: newUser.id, role_id: roleId };
}

async function login({ username, password }) {
  const user = await User.findOne({ where: { username } });
  if (user && (await verifyPassword(password, user.hashedPassword))) {
    const rolesList = await buildRolesList(user.id);
    const allPermissions = rolesList.flatMap((r) => r.permissions);

    const accessToken = createAccessToken(
      { sub: user.username, account_type: "system", roles: rolesList.map((r) => r.name), permissions: allPermissions },
      ACCESS_TOKEN_MINUTES
    );

    const refreshToken = createRefreshToken({ sub: user.username, account_type: "system" }, REFRESH_TOKEN_DAYS);
    const refreshPayload = decodeToken(refreshToken);
    if (!refreshPayload || refreshPayload.type !== "refresh") {
      throw new HttpError(500, "Failed to create refresh token");
    }

    await UserRefreshToken.create({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      jti: refreshPayload.jti,
      revoked: false,
      createdBy: user.username,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "Bearer",
      username: user.username,
      roles: rolesList,
      created_at: user.created_at,
      created_by: user.createdBy,
      updated_at: user.updated_at,
      updated_by: user.updatedBy,
    };
  }

  const registeredUser = await RegisteredUser.findOne({
    where: { username },
    include: [{ model: AccessQualification, as: "accessQualification" }],
  });
  if (!registeredUser || !(await verifyPassword(password, registeredUser.passwordHash))) {
    throw new HttpError(401, "Invalid credentials");
  }
  if (String(registeredUser.status).toLowerCase() !== "active") {
    throw new HttpError(403, "User account is not active");
  }

  let permissions = [];
  const qualification = registeredUser.accessQualification;
  if (qualification && String(qualification.status).toLowerCase() === "active") {
    const rights = await QualificationRightsPermission.findOne({
      where: { accessQualificationId: qualification.id, status: "Active" },
    });
    permissions = permissionsFromRights(rights && rights.permissions);
  }

  const rolesList = [{
    id: qualification ? qualification.id : null,
    name: registeredUser.userType,
    permissions,
  }];
  const accessToken = createAccessToken(
    {
      sub: registeredUser.username,
      account_type: "registered",
      roles: [registeredUser.userType],
      permissions,
    },
    ACCESS_TOKEN_MINUTES
  );

  registeredUser.lastLoginDatetime = new Date();
  await registeredUser.save();

  return {
    access_token: accessToken,
    token_type: "Bearer",
    username: registeredUser.username,
    roles: rolesList,
    created_at: registeredUser.createdAt,
  };
}

const tokenHash = (value) => crypto.createHash("sha256").update(value).digest("hex");

async function requestPasswordReset({ email }) {
  const user = await RegisteredUser.findOne({ where: { email } });
  if (!user || String(user.status).toLowerCase() !== "active") return { message: "This mail is not Registered ." };
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) throw new HttpError(500, "Email service is not configured. Contact the administrator.");
  const code = String(crypto.randomInt(100000, 1000000));
  await PasswordResetToken.destroy({ where: { email: user.email, usedAt: null } });
  await PasswordResetToken.create({ email: user.email, tokenHash: tokenHash(code), expiresAt: new Date(Date.now() + 15 * 60 * 1000) });
  const transporter = nodemailer.createTransport({ host: env.SMTP_HOST, port: env.SMTP_PORT, secure: env.SMTP_PORT === 465, auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } });
  await transporter.sendMail({ from: env.SMTP_FROM, to: user.email, subject: "Pay Access password reset code", text: `Your Pay Access password reset code is ${code}. It expires in 15 minutes.` });
  return { message: "Reset code sent to your registered email." };
}

async function resetRegisteredUserPassword({ email, code, password }) {
  const user = await RegisteredUser.findOne({ where: { email } });
  const token = await PasswordResetToken.findOne({ where: { email, tokenHash: tokenHash(code), usedAt: null } });
  if (!user || !token || token.expiresAt < new Date()) throw new HttpError(400, "Invalid or expired reset code");
  user.passwordHash = await getPasswordHash(password);
  await user.save();
  token.usedAt = new Date();
  await token.save();
  return { message: "Password reset successfully. Please sign in with your new password." };
}

async function logout({ refreshToken }) {
  const payload = decodeToken(refreshToken);
  if (!payload) {
    return { message: "Logged out successfully" };
  }
  if (payload.type !== "refresh") {
    throw new HttpError(400, "Not a refresh token");
  }

  const tokenH = hashToken(refreshToken);
  const rt = await UserRefreshToken.findOne({ where: { tokenHash: tokenH } });

  if (rt && !rt.revoked) {
    rt.revoked = true;
    rt.revokedAt = new Date();
    await rt.save();
  }

  return { message: "Logged out successfully" };
}

async function logoutAll({ refreshToken }) {
  const payload = decodeToken(refreshToken);
  if (!payload) {
    return { message: "Logged out successfully" };
  }
  if (payload.type !== "refresh") {
    throw new HttpError(400, "Not a refresh token");
  }

  const username = payload.sub;
  if (!username) {
    return { message: "Logged out successfully" };
  }

  const user = await User.findOne({ where: { username } });
  if (!user) {
    return { message: "Logged out successfully" };
  }

  await UserRefreshToken.update(
    { revoked: true, revokedAt: new Date() },
    { where: { userId: user.id } }
  );

  return { message: "Logged out from all sessions" };
}

async function refresh({ refreshToken }) {
  const payload = decodeToken(refreshToken);
  if (!payload) {
    throw new HttpError(401, "Invalid token");
  }
  if (payload.type !== "refresh") {
    throw new HttpError(400, "Not a refresh token");
  }

  const username = payload.sub;
  if (!username) {
    throw new HttpError(401, "Invalid token");
  }

  const tokenH = hashToken(refreshToken);
  const rt = await UserRefreshToken.findOne({ where: { tokenHash: tokenH } });
  if (!rt || rt.revoked) {
    throw new HttpError(401, "Token revoked");
  }

  rt.revoked = true;
  rt.revokedAt = new Date();
  await rt.save();

  const user = await User.findOne({ where: { username } });
  if (!user) {
    throw new HttpError(401, "Invalid token");
  }

  const rolesList = await buildRolesList(user.id);
  const allPermissions = rolesList.flatMap((r) => r.permissions);

  const newAccessToken = createAccessToken(
    { sub: user.username, roles: rolesList.map((r) => r.name), permissions: allPermissions },
    ACCESS_TOKEN_MINUTES
  );

  const newRefreshToken = createRefreshToken({ sub: user.username }, REFRESH_TOKEN_DAYS);
  const newPayload = decodeToken(newRefreshToken);
  if (!newPayload || newPayload.type !== "refresh") {
    throw new HttpError(500, "Failed to create refresh token");
  }

  await UserRefreshToken.create({
    userId: user.id,
    tokenHash: hashToken(newRefreshToken),
    jti: newPayload.jti,
    revoked: false,
    createdBy: user.username,
  });

  return {
    access_token: newAccessToken,
    refresh_token: newRefreshToken,
    token_type: "Bearer",
  };
}

async function listUsers() {
  const users = await User.findAll();
  if (!users.length) {
    throw new HttpError(404, "No users found");
  }
  return users.map((u) => ({ id: u.id, username: u.username }));
}

module.exports = { registerUser, login, requestPasswordReset, resetRegisteredUserPassword, logout, logoutAll, refresh, listUsers };
