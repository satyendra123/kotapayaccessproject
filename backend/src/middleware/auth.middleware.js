const { decodeToken } = require("../utils/jwt.util");

/**
 * Verifies the Authorization: Bearer <token> header and attaches the decoded
 * JWT payload directly to req.user (no {user: {...}} wrapper - that was an
 * internal inconsistency in the original FastAPI code, not part of any
 * response contract).
 */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return res.status(401).json({ detail: "Not authenticated" });
  }

  const token = header.slice(7).trim();
  const payload = decodeToken(token);

  if (!payload) {
    return res.status(401).json({ detail: "Invalid or expired token" });
  }

  req.user = payload;
  next();
}

module.exports = authMiddleware;
