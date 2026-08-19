const express = require("express");
const Joi = require("joi");
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");
const { validateBody } = require("../utils/validate.util");

// strict: true so "/users/" (this router's auth-agnostic user list, no permission
// check) stays distinct from user_management's "/users" (RegisteredUser CRUD) -
// FastAPI treats these as two separate exact paths; Express's default non-strict
// routing would otherwise let whichever router mounts first swallow both.
const router = express.Router({ strict: true });

const loginSchema = Joi.object({
  username: Joi.string().trim().required(),
  password: Joi.string().required(),
});
const registerSchema = loginSchema.keys({
  role_id: Joi.number().integer().positive().required(),
});
const refreshSchema = Joi.object({ refresh_token: Joi.string().required() });
const resetRequestSchema = Joi.object({ email: Joi.string().email().required() });
const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required(),
  password: Joi.string().min(6).required(),
});

router.post(
  "/register",
  authMiddleware,
  requirePermission("manage_users"),
  validateBody(registerSchema),
  authController.register
);
router.post("/login", validateBody(loginSchema), authController.login);
router.post("/forgot-password", validateBody(resetRequestSchema), authController.requestPasswordReset);
router.post("/reset-password", validateBody(resetPasswordSchema), authController.resetPassword);
router.post("/logout", validateBody(refreshSchema), authController.logout);
router.post("/logout-all", validateBody(refreshSchema), authController.logoutAll);
router.post("/refresh", validateBody(refreshSchema), authController.refresh);
router.get("/secure-endpoint/", authMiddleware, authController.secureEndpoint);
router.get("/users/", authMiddleware, requirePermission("manage_users"), authController.getUsers);

module.exports = router;
