const express = require("express");
const Joi = require("joi");

const ticketController = require("../controllers/ticket.controller");
const authMiddleware = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");
const { validateBody } = require("../utils/validate.util");

const router = express.Router();

router.use(authMiddleware);

const selectedItemSchema = Joi.alternatives().try(Joi.number(), Joi.object().unknown(true));

const ticketCreateSchema = Joi.object({
  ticket_gen_for: Joi.string().required(),
  customer_name: Joi.string().required(),
  mobile_no: Joi.string().required(),
  no_of_members: Joi.number().integer().required(),
  total_service_price: Joi.number().required(),
  total_combo_prices: Joi.number().required(),
  grand_total: Joi.number().required(),
  discount: Joi.number().default(0),
  is_ticket_free_paid: Joi.string().required(),
  foc_reason: Joi.string().trim().allow(null, ""),
  aadhar_no: Joi.string().allow(null),
  shift_id: Joi.number().integer().required(),
  selected_services: Joi.array().items(selectedItemSchema).default([]),
  selected_combos: Joi.array().items(selectedItemSchema).default([]),
});

const ticketUpdateSchema = Joi.object({
  ticket_gen_for: Joi.string(),
  customer_name: Joi.string(),
  aadhar_no: Joi.string().allow(null),
  mobile_no: Joi.string(),
  no_of_members: Joi.number().integer(),
  discount: Joi.number(),
  is_ticket_free_paid: Joi.string(),
  foc_reason: Joi.string().trim().allow(null, ""),
  shift_id: Joi.number().integer(),
});

const serviceCreateSchema = Joi.object({
  servicename: Joi.string().required(),
  price: Joi.number().required(),
  discountedprice: Joi.number().allow(null),
  servicefor: Joi.string().required(),
  shift_id: Joi.number().integer().required(),
  status: Joi.string().default("Active"),
});

const comboCreateSchema = Joi.object({
  comboname: Joi.string().required(),
  actual_price: Joi.number().allow(null),
  discount_price: Joi.number().allow(null),
});

const eligibleTicketQuerySchema = Joi.object({
  ticket_number: Joi.string().allow(null),
  aadhar_no: Joi.string().allow(null),
});

const lostTicketsReportQuerySchema = Joi.object({
  from_date: Joi.date().required(),
  to_date: Joi.date().required(),
  sales_type: Joi.string().allow(null),
  ticket_number: Joi.string().allow(null),
});

const lostTicketQuerySchema = Joi.object({
  ticket_number: Joi.string().allow(null),
  aadhar_no: Joi.string().allow(null),
  customer_name: Joi.string().required(),
});

const reasonCreateSchema = Joi.object({ reason: Joi.string().required(), status: Joi.string().required() });
const reasonUpdateSchema = Joi.object({ reason: Joi.string(), status: Joi.string() });

const ticketScanSchema = Joi.object({
  gate_id: Joi.number().integer().allow(null),
  machine_id: Joi.number().integer().allow(null),
  scanned_by: Joi.string().allow(null),
});

const addComboRequestSchema = Joi.object({
  ticket_number: Joi.string().required(),
  service_ids: Joi.array().items(Joi.number().integer()).default([]),
  combo_ids: Joi.array().items(Joi.number().integer()).default([]),
  discount_percent: Joi.number().allow(null),
  foc_reason: Joi.string().allow(null),
});

//router.post("/tickets", requirePermission("manage_tickets"), validateBody(ticketCreateSchema), ticketController.createTicket);
router.post("/tickets", requirePermission(["tickets.create", "manage_tickets"]), validateBody(ticketCreateSchema), ticketController.createTicket);
router.get("/tickets/:ticketId(\\d+)", requirePermission(["tickets.view", "manage_tickets"]), ticketController.getTicket);
router.post("/tickets/:ticketId(\\d+)/print", requirePermission(["tickets.print", "manage_tickets"]), ticketController.printCustomerTicket);
router.get("/tickets/", requirePermission(["tickets.view", "manage_tickets"]), ticketController.listTicketsByShift);
router.get("/all-tickets/", requirePermission(["tickets.view", "manage_tickets"]), ticketController.getAllTickets);
router.put(
  "/tickets/:ticketId(\\d+)",
  requirePermission(["tickets.edit", "manage_tickets"]),
  validateBody(ticketUpdateSchema),
  ticketController.updateTicket
);
router.delete("/tickets/:ticketId(\\d+)", requirePermission(["tickets.delete", "manage_tickets"]), ticketController.deleteTicket);

router.post("/services/", requirePermission("manage_services"), validateBody(serviceCreateSchema), ticketController.createService);
router.get("/services/", requirePermission("manage_services"), ticketController.listServices);

router.post("/ticket-combos/", requirePermission("manage_combos"), validateBody(comboCreateSchema), ticketController.createTicketCombo);
router.get("/ticket-combos/", requirePermission("manage_combos"), ticketController.listTicketCombos);

router.post(
  "/eligible-ticket/",
  requirePermission(["tickets.view", "manage_tickets"]),
  validateBody(eligibleTicketQuerySchema),
  ticketController.getEligibleTicket
);

router.post(
  "/lost-tickets",
  requirePermission(["tickets.view", "manage_tickets"]),
  validateBody(lostTicketsReportQuerySchema),
  ticketController.listLostTicketsReport
);

router.post(
  "/lost-ticket/",
  requirePermission(["tickets.view", "manage_tickets"]),
  validateBody(lostTicketQuerySchema),
  ticketController.searchLostTicket
);

router.post("/reasons/", requirePermission("manage_reasons"), validateBody(reasonCreateSchema), ticketController.createReason);
router.get("/reasons/", requirePermission("manage_reasons"), ticketController.listReasons);
router.get("/reasons/:reasonId(\\d+)", requirePermission("manage_reasons"), ticketController.getReasonById);
router.put(
  "/reasons/:reasonId(\\d+)",
  requirePermission("manage_reasons"),
  validateBody(reasonUpdateSchema),
  ticketController.updateReason
);
router.put("/reasons/deactivate/:reasonId(\\d+)", requirePermission("manage_reasons"), ticketController.deactivateReason);
router.delete("/reasons/:reasonId(\\d+)", requirePermission("manage_reasons"), ticketController.deleteReason);

router.post(
  "/:ticketId(\\d+)/scan-entry",
  requirePermission(["tickets.scan", "manage_tickets"]),
  validateBody(ticketScanSchema),
  ticketController.scanEntry
);
router.post(
  "/:ticketId(\\d+)/scan-exit",
  requirePermission(["tickets.scan", "manage_tickets"]),
  validateBody(ticketScanSchema),
  ticketController.scanExit
);

router.post(
  "/tickets/add-combo",
  requirePermission(["tickets.edit", "manage_tickets"]),
  validateBody(addComboRequestSchema),
  ticketController.addComboToTicket
);

module.exports = router;
