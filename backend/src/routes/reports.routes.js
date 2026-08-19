const express = require("express");
const Joi = require("joi");

const reportsController = require("../controllers/reports.controller");
const authMiddleware = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");
const { validateBody } = require("../utils/validate.util");

const router = express.Router();

router.use(authMiddleware);

const staffEntryExitLogsSchema = Joi.object({
  from_date: Joi.date().required(),
  to_date: Joi.date().required(),
  staff_name: Joi.string().allow(null),
});

const userActionLogsSchema = Joi.object({
  from_date: Joi.date().required(),
  to_date: Joi.date().required(),
  user_type: Joi.string().allow(null),
  username: Joi.string().allow(null),
});

const salesRevenueSchema = Joi.object({
  report_type: Joi.string().default("All Reports"),
  from_date: Joi.date().required(),
  to_date: Joi.date().required(),
  from_time: Joi.string().allow(null),
  to_time: Joi.string().allow(null),
  ticket_type: Joi.string().allow(null),
  ticket_number: Joi.string().allow(null),
  paid_only: Joi.boolean().default(false),
});

const lostTicketsSchema = Joi.object({
  from_date: Joi.date().required(),
  to_date: Joi.date().required(),
  sales_type: Joi.string().allow(null),
  ticket_number: Joi.string().allow(null),
});

const eligibleTicketsSchema = Joi.object({
  from_date: Joi.date().required(),
  to_date: Joi.date().required(),
  sales_type: Joi.string().allow(null),
  ticket_number: Joi.string().allow(null),
});

const gatesConnectivityLogsSchema = Joi.object({
  from_date: Joi.date().required(),
  to_date: Joi.date().required(),
  gate_name: Joi.string().allow(null),
  status: Joi.string().allow(null),
});

const blacklistSchema = Joi.object({
  from_date: Joi.date().required(),
  to_date: Joi.date().required(),
  cards_or_tickets: Joi.string().valid("Card", "Ticket").allow(null),
});

const ticketEntryReportSchema = Joi.object({
  ticket_number: Joi.string().trim().required(),
});

router.post(
  "/staff-entry-exit-logs",
  requirePermission("view_master_data"),
  validateBody(staffEntryExitLogsSchema),
  reportsController.staffEntryExitLogs
);
router.post(
  "/user-action-logs",
  requirePermission("view_master_data"),
  validateBody(userActionLogsSchema),
  reportsController.userActionLogs
);
router.post(
  "/sales-revenue",
  requirePermission("manage_tickets"),
  validateBody(salesRevenueSchema),
  reportsController.salesRevenue
);
router.post(
  "/lost-tickets",
  requirePermission("manage_tickets"),
  validateBody(lostTicketsSchema),
  reportsController.lostTickets
);
router.post(
  "/eligible-tickets",
  requirePermission("manage_tickets"),
  validateBody(eligibleTicketsSchema),
  reportsController.eligibleTickets
);
router.post(
  "/gates-connectivity-logs",
  requirePermission("view_master_data"),
  validateBody(gatesConnectivityLogsSchema),
  reportsController.gatesConnectivityLogs
);
router.post(
  "/blacklist-card-tickets",
  requirePermission("view_master_data"),
  validateBody(blacklistSchema),
  reportsController.blacklistCardTickets
);
router.post(
  "/ticket-entry-report",
  requirePermission("manage_tickets"),
  validateBody(ticketEntryReportSchema),
  reportsController.ticketEntryReport
);

module.exports = router;
