const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const env = require("../config/env");

function hashToken(token) {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

/**
 * data: payload object (e.g. { sub, roles, permissions }).
 * expiresInMinutes: defaults to ACCESS_TOKEN_EXPIRE_MINUTES env value.
 */
function createAccessToken(data, expiresInMinutes) {
  const minutes = expiresInMinutes != null ? expiresInMinutes : env.ACCESS_TOKEN_EXPIRE_MINUTES;
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    ...data,
    iat: now,
    jti: uuidv4(),
    type: "access",
  };

  return jwt.sign(payload, env.SECRET_KEY, {
    algorithm: env.ALGORITHM,
    expiresIn: `${minutes}m`,
  });
}

/**
 * data: payload object (e.g. { sub }).
 * expiresInDays: defaults to REFRESH_TOKEN_EXPIRE_DAYS env value.
 */
function createRefreshToken(data, expiresInDays) {
  const days = expiresInDays != null ? expiresInDays : env.REFRESH_TOKEN_EXPIRE_DAYS;
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    ...data,
    iat: now,
    jti: uuidv4(),
    type: "refresh",
  };

  return jwt.sign(payload, env.SECRET_KEY, {
    algorithm: env.ALGORITHM,
    expiresIn: `${days}d`,
  });
}

/**
 * Decodes+verifies a JWT. Returns the payload, or null if invalid/expired.
 */
function decodeToken(token) {
  try {
    return jwt.verify(token, env.SECRET_KEY, { algorithms: [env.ALGORITHM] });
  } catch (err) {
    return null;
  }
}

function assertTokenType(payload, expected) {
  if (!payload || payload.type !== expected) {
    throw new Error(`Invalid token type. Expected '${expected}'.`);
  }
}

module.exports = {
  hashToken,
  createAccessToken,
  createRefreshToken,
  decodeToken,
  assertTokenType,
};
