const asyncHandler = require("../utils/asyncHandler");
const reportsService = require("../services/reports.service");
const { HttpError } = require("../middleware/error.middleware");

const staffEntryExitLogs = asyncHandler(async (req, res) => {
  const { from_date, to_date, staff_name } = req.body;
  res.json(await reportsService.staffEntryExitLogs(from_date, to_date, staff_name));
});

const userActionLogs = asyncHandler(async (req, res) => {
  const { from_date, to_date, user_type, username } = req.body;
  const rows = await reportsService.userActionLogs(from_date, to_date, user_type, username);
  res.json(
    rows.map((r) => ({
      id: r.id,
      user_type: r.userType,
      username: r.username,
      action: r.action,
      created_at: r.createdAt,
    }))
  );
});

const salesRevenue = asyncHandler(async (req, res) => {
  const { rows, totalCount, totalRevenue } = await reportsService.salesRevenue(req.body);
  res.json({
    total_count: totalCount,
    total_revenue: totalRevenue,
    rows: rows.map((r) => ({
      ticket_number: r.ticketNumber,
      ticket_gen_date_time: r.ticketGenDateTime,
      ticket_type: r.ticketGenFor,
      customer_name: r.customerName,
      grand_total: Number(r.grandTotal || 0),
      is_ticket_free_paid: r.isTicketFreePaid,
    })),
  });
});

const lostTickets = asyncHandler(async (req, res) => {
  const { from_date, to_date, ticket_number } = req.body;
  const rows = await reportsService.lostTickets(from_date, to_date, ticket_number);
  res.json(
    rows.map(({ lost, ticket }) => ({
      ticket_number: ticket.ticketNumber,
      customer_name: ticket.customerName,
      aadhar_no: ticket.aadharNo,
      ticket_gen_date_time: ticket.ticketGenDateTime,
      lost_marked_at: lost.createdAt,
      marked_by: lost.markedBy,
      remark: lost.remark,
    }))
  );
});

const eligibleTickets = asyncHandler(async (req, res) => {
  const { from_date, to_date, ticket_number } = req.body;
  const rows = await reportsService.eligibleTickets(from_date, to_date, ticket_number);
  res.json(
    rows.map(({ elig, ticket }) => ({
      ticket_number: ticket.ticketNumber,
      customer_name: ticket.customerName,
      aadhar_no: ticket.aadharNo,
      ticket_gen_date_time: ticket.ticketGenDateTime,
      eligible_marked_at: elig.createdAt,
      marked_by: elig.markedBy,
      remark: elig.remark,
    }))
  );
});

const gatesConnectivityLogs = asyncHandler(async (req, res) => {
  const { from_date, to_date, gate_name, status } = req.body;
  const rows = await reportsService.gatesConnectivityLogs(from_date, to_date, gate_name, status);
  res.json(
    rows.map((r) => ({
      id: r.id,
      gate_name: r.gateName,
      machine_name: r.machineName,
      status: r.status,
      created_at: r.createdAt,
      remark: r.remark,
    }))
  );
});

const blacklistCardTickets = asyncHandler(async (req, res) => {
  const { from_date, to_date, cards_or_tickets } = req.body;
  const rows = await reportsService.blacklist(from_date, to_date, cards_or_tickets);
  res.json(
    rows.map((r) => ({
      id: r.id,
      entry_type: r.entryType,
      value: r.value,
      reason: r.reason,
      created_by: r.createdBy,
      created_at: r.createdAt,
    }))
  );
});

const ticketEntryReport = asyncHandler(async (req, res) => {
  const report = await reportsService.ticketEntryReport(req.body.ticket_number);
  if (!report) throw new HttpError(404, "Ticket not found");
  res.json(report);
});

module.exports = {
  staffEntryExitLogs,
  userActionLogs,
  salesRevenue,
  lostTickets,
  eligibleTickets,
  gatesConnectivityLogs,
  blacklistCardTickets,
  ticketEntryReport,
};
