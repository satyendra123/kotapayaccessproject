const asyncHandler = require("../utils/asyncHandler");
const ticketService = require("../services/ticket.service");
const reportLogWriter = require("../services/reportLogWriter.service");
const { Gate, GateMachine, CustomerTicket } = require("../models");
const { HttpError } = require("../middleware/error.middleware");
const { printTicket } = require("../services/ticketPrinter.service");

function ticketOut(t) {
  return {
    id: t.id,
    ticket_gen_for: t.ticketGenFor,
    customer_name: t.customerName,
    mobile_no: t.mobileNo,
    no_of_members: t.noOfMembers,
    total_service_price: t.totalServicePrice,
    total_combo_prices: t.totalComboPrices,
    grand_total: t.grandTotal,
    discount: t.discount,
    is_ticket_free_paid: t.isTicketFreePaid,
    foc_reason: t.focReason,
    ticket_number: t.ticketNumber,
    aadhar_no: t.aadharNo,
    qr_code: t.qrCode,
    ticket_gen_date_time: t.ticketGenDateTime,
    shift_id: t.shiftId,
    is_discount_applied: t.isDiscountApplied,
    how_discount_applied: t.howDiscountApplied,
    ticket_generated_shift: t.ticketGeneratedShift,
    ticket_scan_count: t.ticketScanCount,
    ticket_scanned_entry_at: t.ticketScannedEntryAt,
    ticket_scanned_exit_at: t.ticketScannedExitAt,
  };
}

function serviceOut(s) {
  return {
    id: s.id,
    servicename: s.servicename,
    price: s.price,
    discountedprice: s.discountedprice,
    servicefor: s.servicefor,
    shift_id: s.shiftId,
    status: s.status,
  };
}

function simpleComboOut(c) {
  return {
    id: c.id,
    comboname: c.comboname,
    actual_price: c.actualPrice,
    discount_price: c.discountPrice,
    status: c.status,
  };
}

function lostTicketReportOut(t) {
  return {
    ticket_number: t.ticketNumber,
    customer_name: t.customerName,
    aadhar_no: t.aadharNo,
    ticket_gen_date_time: t.ticketGenDateTime,
    qr_code: t.qrCode,
  };
}

const createTicket = asyncHandler(async (req, res) => {
  if (!req.body.shift_id) {
    throw new HttpError(400, "shift_id is required");
  }
  const ticket = await ticketService.createTicket(req.body, req.body.shift_id);
  res.json(ticketOut(ticket));
});

const getTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.getTicket(Number(req.params.ticketId));
  if (!ticket) throw new HttpError(404, "Ticket not found");
  res.json(ticketOut(ticket));
});

const printCustomerTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.getTicket(Number(req.params.ticketId));
  if (!ticket) throw new HttpError(404, "Ticket not found");
  try {
    const printer = await printTicket(ticket);
    res.json({ message: "Ticket sent to printer", printer });
  } catch (error) {
    throw new HttpError(503, `Ticket could not be printed: ${error.message}`);
  }
});

const listTicketsByShift = asyncHandler(async (req, res) => {
  const shiftId = req.query.shift_id;
  if (!shiftId) throw new HttpError(400, "shift_id query param is required");
  res.json((await ticketService.getTicketsByShift(Number(shiftId))).map(ticketOut));
});

const getAllTickets = asyncHandler(async (req, res) => {
  const skip = Number(req.query.skip || 0);
  const limit = Number(req.query.limit || 100);
  res.json((await ticketService.getAllTickets(skip, limit)).map(ticketOut));
});

const updateTicket = asyncHandler(async (req, res) => {
  const updated = await ticketService.updateTicket(Number(req.params.ticketId), req.body);
  if (!updated) throw new HttpError(404, "Ticket not found");
  res.json(ticketOut(updated));
});

const deleteTicket = asyncHandler(async (req, res) => {
  const ok = await ticketService.deleteTicket(Number(req.params.ticketId));
  if (!ok) throw new HttpError(404, "Ticket not found");
  res.json({ message: "Ticket deleted!" });
});

const createService = asyncHandler(async (req, res) => {
  res.json(serviceOut(await ticketService.createSimpleService(req.body)));
});

const listServices = asyncHandler(async (req, res) => {
  res.json((await ticketService.getSimpleServices()).map(serviceOut));
});

const createTicketCombo = asyncHandler(async (req, res) => {
  res.json(simpleComboOut(await ticketService.createSimpleCombo(req.body)));
});

const listTicketCombos = asyncHandler(async (req, res) => {
  res.json((await ticketService.getSimpleCombos()).map(simpleComboOut));
});

const getEligibleTicket = asyncHandler(async (req, res) => {
  const { ticket_number, aadhar_no } = req.body;

  let ticket = null;
  if (ticket_number) {
    ticket = await ticketService.findTicketByTicketNumber(ticket_number);
  } else if (aadhar_no) {
    ticket = await ticketService.findTicketByAadharNo(aadhar_no);
  } else {
    throw new HttpError(400, "Provide ticket_number or aadhar_no");
  }

  if (!ticket) throw new HttpError(404, "Ticket not found");

  await ticketService.markEligible(ticket, req.user && req.user.sub, "Marked eligible via API");
  res.json({
    ticket_number: ticket.ticketNumber,
    ticket_gen_date_time: ticket.ticketGenDateTime,
    customer_name: ticket.customerName,
    aadhar_no: ticket.aadharNo,
    qr_code: ticket.qrCode,
  });
});

const listLostTicketsReport = asyncHandler(async (req, res) => {
  const { from_date, to_date, sales_type, ticket_number } = req.body;
  const rows = await ticketService.listLostTickets(from_date, to_date, sales_type, ticket_number);
  res.json(rows.map(lostTicketReportOut));
});

const searchLostTicket = asyncHandler(async (req, res) => {
  const { ticket_number, aadhar_no, customer_name } = req.body;
  const customerName = (customer_name || "").trim();
  if (!customerName) throw new HttpError(400, "Customer name is required");

  let ticket = null;
  if (ticket_number) {
    ticket = await ticketService.findLostTicketByTicketNumberAndName(ticket_number, customerName);
  } else if (aadhar_no) {
    ticket = await ticketService.findLostTicketByAadharAndName(aadhar_no, customerName);
  } else {
    throw new HttpError(400, "Provide ticket_number or aadhar_no");
  }

  if (!ticket) throw new HttpError(404, "Ticket not found");

  await ticketService.markLost(ticket, req.user && req.user.sub, "Marked lost via API");
  res.json(lostTicketReportOut(ticket));
});

const createReason = asyncHandler(async (req, res) => {
  res.json(await ticketService.createReason(req.body));
});

const listReasons = asyncHandler(async (req, res) => {
  res.json(await ticketService.listReasons());
});

const getReasonById = asyncHandler(async (req, res) => {
  const reason = await ticketService.getReasonById(Number(req.params.reasonId));
  if (!reason) throw new HttpError(404, "Reason not found");
  res.json(reason);
});

const updateReason = asyncHandler(async (req, res) => {
  const reason = await ticketService.updateReason(Number(req.params.reasonId), req.body);
  if (!reason) throw new HttpError(404, "Reason not found");
  res.json(reason);
});

const deactivateReason = asyncHandler(async (req, res) => {
  const reason = await ticketService.deactivateReason(Number(req.params.reasonId));
  if (!reason) throw new HttpError(404, "Reason not found");
  res.json(reason);
});

const deleteReason = asyncHandler(async (req, res) => {
  const ok = await ticketService.deleteReason(Number(req.params.reasonId));
  if (!ok) throw new HttpError(404, "Reason not found");
  res.json({ message: "Reason deleted!" });
});

async function resolveGateMachine(gateId, machineId) {
  let gateName = "Unknown Gate";
  let machineName = "Unknown Machine";

  if (gateId) {
    const gate = await Gate.findByPk(gateId);
    if (gate) gateName = gate.gateName || `Gate ${gateId}`;
  }
  if (machineId) {
    const machine = await GateMachine.findByPk(machineId);
    if (machine) machineName = machine.machineName || `Machine ${machineId}`;
  }

  return { gateName, machineName };
}

function scanStr(mode, gateName, machineName, scannedBy) {
  const base = new Date()
    .toISOString()
    .replace("T", " ")
    .slice(0, 19);
  const who = scannedBy ? ` | By: ${scannedBy}` : "";
  return `${base} (Gate: ${gateName} | Machine: ${machineName} | Mode: ${mode}${who})`;
}

const scanEntry = asyncHandler(async (req, res) => {
  const ticketId = Number(req.params.ticketId);
  const { gate_id, machine_id, scanned_by } = req.body;

  const ticket = await CustomerTicket.findByPk(ticketId);
  if (!ticket) throw new HttpError(404, "Ticket not found");

  const { gateName, machineName } = await resolveGateMachine(gate_id, machine_id);
  ticket.ticketScannedEntryAt = scanStr("entry", gateName, machineName, scanned_by);
  await ticket.save();

  try {
    await reportLogWriter.logStaffEntryExit({
      staffName: scanned_by || "Unknown",
      action: "entry",
      staffId: null,
      gateId: gate_id,
      machineId: machine_id,
    });
  } catch {
    // best-effort logging, matches original swallowed exception
  }

  res.json({
    message: "Entry scanned",
    ticket_id: ticket.id,
    ticket_scanned_entry_at: ticket.ticketScannedEntryAt,
    gate_name: gateName,
    machine_name: machineName,
  });
});

const scanExit = asyncHandler(async (req, res) => {
  const ticketId = Number(req.params.ticketId);
  const { gate_id, machine_id, scanned_by } = req.body;

  const ticket = await CustomerTicket.findByPk(ticketId);
  if (!ticket) throw new HttpError(404, "Ticket not found");

  if (!ticket.ticketScannedEntryAt) {
    throw new HttpError(400, "Entry not scanned yet");
  }

  const { gateName, machineName } = await resolveGateMachine(gate_id, machine_id);
  ticket.ticketScannedExitAt = scanStr("exit", gateName, machineName, scanned_by);
  await ticket.save();

  try {
    await reportLogWriter.logStaffEntryExit({
      staffName: scanned_by || "Unknown",
      action: "exit",
      staffId: null,
      gateId: gate_id,
      machineId: machine_id,
    });
  } catch {
    // best-effort logging, matches original swallowed exception
  }

  res.json({
    message: "Exit scanned",
    ticket_id: ticket.id,
    ticket_scanned_exit_at: ticket.ticketScannedExitAt,
    gate_name: gateName,
    machine_name: machineName,
  });
});

const addComboToTicket = asyncHandler(async (req, res) => {
  res.json(ticketOut(await ticketService.addComboToTicket(req.body)));
});

module.exports = {
  createTicket,
  getTicket,
  printCustomerTicket,
  listTicketsByShift,
  getAllTickets,
  updateTicket,
  deleteTicket,
  createService,
  listServices,
  createTicketCombo,
  listTicketCombos,
  getEligibleTicket,
  listLostTicketsReport,
  searchLostTicket,
  createReason,
  listReasons,
  getReasonById,
  updateReason,
  deactivateReason,
  deleteReason,
  scanEntry,
  scanExit,
  addComboToTicket,
};
