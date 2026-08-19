const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/auth.service");

const register = asyncHandler(async (req, res) => {
  const { username, password, role_id } = req.body;
  const result = await authService.registerUser({ username, password, roleId: Number(role_id) });
  res.json(result);
});

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const result = await authService.login({ username, password });
  res.json(result);
});

const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetRegisteredUserPassword(req.body);
  res.json(result);
});
const requestPasswordReset = asyncHandler(async (req, res) => res.json(await authService.requestPasswordReset(req.body)));

const logout = asyncHandler(async (req, res) => {
  const result = await authService.logout({ refreshToken: req.body.refresh_token });
  res.json(result);
});

const logoutAll = asyncHandler(async (req, res) => {
  const result = await authService.logoutAll({ refreshToken: req.body.refresh_token });
  res.json(result);
});

const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh({ refreshToken: req.body.refresh_token });
  res.json(result);
});

const secureEndpoint = asyncHandler(async (req, res) => {
  res.json({ message: "Secure Data Accessed Successfully!" });
});

const getUsers = asyncHandler(async (req, res) => {
  const result = await authService.listUsers();
  res.json(result);
});

module.exports = { register, login, requestPasswordReset, resetPassword, logout, logoutAll, refresh, secureEndpoint, getUsers };
