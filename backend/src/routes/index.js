const express = require("express");

const authRoutes = require("./auth.routes");
const roleRoutes = require("./role.routes");
const gateRoutes = require("./gate.routes");
const shiftRoutes = require("./shift.routes");
const staffRoutes = require("./staff.routes");
const guestRoutes = require("./guest.routes");
const subscriptionCardRoutes = require("./subscriptionCard.routes");
const tariffRoutes = require("./tariff.routes");
const ticketRoutes = require("./ticket.routes");
const parkAccessRoutes = require("./parkAccess.routes");
const reportsRoutes = require("./reports.routes");
const logWriterRoutes = require("./logWriter.routes");
const liveLogsRoutes = require("./liveLogs.routes");
const dashboardRoutes = require("./dashboard.routes");
const userManagementRoutes = require("./userManagement.routes");
const applicationSettingsRoutes = require("./applicationSettings.routes");
const supportRoutes = require("./support.routes");

const router = express.Router();

// Routers mounted at a specific prefix go FIRST. Several of the routers below
// (gateRoutes, staffRoutes, guestRoutes, tariffRoutes, ticketRoutes, reportsRoutes,
// logWriterRoutes, liveLogsRoutes, userManagementRoutes) are mounted at "/" and
// apply `router.use(authMiddleware)` unconditionally - since Express enters a "/"
// mounted router for every request regardless of whether a route inside it
// actually matches, putting any of those before a specific-prefix router would
// auth-gate requests that were never meant to require auth (e.g. /dashboard/...,
// which has no auth in the original FastAPI app). Mounting specific-prefix
// routers first means Express resolves them before ever reaching the catch-alls.
router.use("/", authRoutes);
router.use("/roles", roleRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/shifts", shiftRoutes);
router.use("/subscription-cards", subscriptionCardRoutes);
router.use("/settings", applicationSettingsRoutes);
router.use("/support", supportRoutes);

router.use("/", gateRoutes);
router.use("/", staffRoutes);
router.use("/", guestRoutes);
router.use("/", tariffRoutes);
// ticketRoutes mounted before reportsRoutes: both define POST /lost-tickets and the
// FastAPI app (ticket_management_router included before reports_router) silently
// shadows the reports version - preserved here for identical runtime behavior.
router.use("/", ticketRoutes);
router.use("/", parkAccessRoutes);
router.use("/", reportsRoutes);
router.use("/", logWriterRoutes);
router.use("/", liveLogsRoutes);
router.use("/", userManagementRoutes);

module.exports = router;
