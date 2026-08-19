const { Op, fn, col, where: sequelizeWhere } = require("sequelize");
const {
  CustomerTicket,
  LostTicket,
  EligibleTicket,
  StaffEntryExitLog,
  UserActionLog,
  GateConnectivityLog,
  BlacklistEntry,
  Gate,
  GateMachine,
  TicketMovementLog,
  CustomerService,
  CustomerCombo,
  TariffService,
  Combo,
} = require("../models");

function dateRange(fromDate, toDate) {
  return [new Date(`${fromDate}T00:00:00.000`), new Date(`${toDate}T23:59:59.999`)];
}

function dtRange(fromDate, toDate, fromTimeStr, toTimeStr) {
  const startTime = fromTimeStr ? `${fromTimeStr}:00` : "00:00:00";
  const endTime = toTimeStr ? `${toTimeStr}:00` : "23:59:59.999";
  return [new Date(`${fromDate}T${startTime}`), new Date(`${toDate}T${endTime}`)];
}

async function staffEntryExitLogs(fromDate, toDate, staffName) {
  const [start, end] = dateRange(fromDate, toDate);

  const where = { createdAt: { [Op.gte]: start, [Op.lte]: end } };
  if (staffName) {
    where.staffName = { [Op.like]: `%${staffName.trim()}%` };
  }

  const rows = await StaffEntryExitLog.findAll({
    where,
    include: [{ model: Gate, as: "gate" }, { model: GateMachine, as: "machine" }],
    order: [["createdAt", "DESC"]],
  });

  return rows.map((r) => ({
    id: r.id,
    staff_name: r.staffName,
    action: r.action,
    gate_name: r.gate ? r.gate.gateName : null,
    machine_name: r.machine ? r.machine.machineName : null,
    created_at: r.createdAt,
  }));
}

async function userActionLogs(fromDate, toDate, userType, username) {
  const [start, end] = dateRange(fromDate, toDate);

  const andConditions = [{ createdAt: { [Op.gte]: start, [Op.lte]: end } }];
  if (userType) {
    andConditions.push(sequelizeWhere(fn("LOWER", col("user_type")), userType.trim().toLowerCase()));
  }
  if (username) {
    andConditions.push({ username: { [Op.like]: `%${username.trim()}%` } });
  }

  return UserActionLog.findAll({ where: { [Op.and]: andConditions }, order: [["createdAt", "DESC"]] });
}

async function salesRevenue(payload) {
  const [start, end] = dtRange(payload.from_date, payload.to_date, payload.from_time, payload.to_time);

  const andConditions = [{ ticketGenDateTime: { [Op.gte]: start, [Op.lte]: end } }];

  if (payload.ticket_type) {
    andConditions.push(sequelizeWhere(fn("LOWER", col("ticket_gen_for")), payload.ticket_type.trim().toLowerCase()));
  }
  if (payload.ticket_number) {
    andConditions.push({ ticketNumber: payload.ticket_number.trim() });
  }
  if (payload.paid_only) {
    andConditions.push(sequelizeWhere(fn("LOWER", fn("COALESCE", col("is_ticket_free_paid"), "")), "paid"));
  }

  const rows = await CustomerTicket.findAll({ where: { [Op.and]: andConditions }, order: [["ticketGenDateTime", "DESC"]] });

  const totalCount = rows.length;
  const totalRevenue = rows.reduce((sum, r) => sum + Number(r.grandTotal || 0), 0);

  return { rows, totalCount, totalRevenue };
}

async function lostTickets(fromDate, toDate, ticketNumber) {
  const [start, end] = dateRange(fromDate, toDate);

  const ticketWhere = {};
  if (ticketNumber) ticketWhere.ticketNumber = ticketNumber.trim();

  const rows = await LostTicket.findAll({
    where: { createdAt: { [Op.gte]: start, [Op.lte]: end } },
    include: [{ model: CustomerTicket, as: "ticket", required: true, where: ticketWhere }],
    order: [["createdAt", "DESC"]],
  });

  return rows.map((lost) => ({ lost, ticket: lost.ticket }));
}

async function eligibleTickets(fromDate, toDate, ticketNumber) {
  const [start, end] = dateRange(fromDate, toDate);

  const ticketWhere = {};
  if (ticketNumber) ticketWhere.ticketNumber = ticketNumber.trim();

  const rows = await EligibleTicket.findAll({
    where: { createdAt: { [Op.gte]: start, [Op.lte]: end } },
    include: [{ model: CustomerTicket, as: "ticket", required: true, where: ticketWhere }],
    order: [["createdAt", "DESC"]],
  });

  return rows.map((elig) => ({ elig, ticket: elig.ticket }));
}

async function gatesConnectivityLogs(fromDate, toDate, gateName, status) {
  const [start, end] = dateRange(fromDate, toDate);

  const andConditions = [{ createdAt: { [Op.gte]: start, [Op.lte]: end } }];
  if (gateName) andConditions.push({ gateName: { [Op.like]: `%${gateName.trim()}%` } });
  if (status) andConditions.push(sequelizeWhere(fn("LOWER", col("status")), status.trim().toLowerCase()));

  return GateConnectivityLog.findAll({ where: { [Op.and]: andConditions }, order: [["createdAt", "DESC"]] });
}

async function blacklist(fromDate, toDate, entryType) {
  const [start, end] = dateRange(fromDate, toDate);

  const andConditions = [{ createdAt: { [Op.gte]: start, [Op.lte]: end } }];
  if (entryType) andConditions.push(sequelizeWhere(fn("LOWER", col("entry_type")), entryType.trim().toLowerCase()));

  return BlacklistEntry.findAll({ where: { [Op.and]: andConditions }, order: [["createdAt", "DESC"]] });
}

async function ticketEntryReport(ticketNumber) {
  const ticket = await CustomerTicket.findOne({
    where: { ticketNumber: ticketNumber.trim() },
    include: [
      { model: CustomerService, as: "services", include: [{ model: TariffService, as: "service" }] },
      { model: CustomerCombo, as: "combos", include: [{ model: Combo, as: "combo" }] },
    ],
  });

  if (!ticket) return null;

  const movements = await TicketMovementLog.findAll({
    where: { ticketNumber: ticket.ticketNumber },
    include: [
      { model: Gate, as: "gate" },
      { model: GateMachine, as: "machine" },
    ],
    order: [["createdAt", "ASC"]],
  });

  const allowedEntries = Math.max(Number(ticket.noOfMembers) || 1, 1);
  const usedEntries = movements.filter((movement) => movement.area === "PARK" && movement.action === "ENTRY").length;

  return {
    ticket: {
      id: ticket.id,
      ticket_number: ticket.ticketNumber,
      customer_name: ticket.customerName,
      mobile_no: ticket.mobileNo,
      aadhar_no: ticket.aadharNo,
      ticket_type: ticket.ticketGenFor,
      ticket_generated_at: ticket.ticketGenDateTime,
      paid_status: ticket.isTicketFreePaid,
      members: allowedEntries,
      used_entries: usedEntries,
      remaining_entries: Math.max(allowedEntries - usedEntries, 0),
      service_total: Number(ticket.totalServicePrice || 0),
      combo_total: Number(ticket.totalComboPrices || 0),
      discount: Number(ticket.discount || 0),
      grand_total: Number(ticket.grandTotal || 0),
    },
    services: ticket.services.map((item) => ({
      name: item.service ? item.service.servicename : `Service ${item.serviceId}`,
      price: Number(item.price || 0),
    })),
    combos: ticket.combos.map((item) => ({
      name: item.combo ? item.combo.comboname : `Combo ${item.comboId}`,
      price: Number(item.price || 0),
    })),
    entries: movements.map((movement) => ({
      id: movement.id,
      area: movement.area,
      action: movement.action,
      scanned_at: movement.createdAt,
      gate_no: movement.gate ? movement.gate.gateNo : null,
      gate_name: movement.gate ? movement.gate.gateName : null,
      machine_name: movement.machine ? movement.machine.machineName : null,
    })),
  };
}

module.exports = {
  staffEntryExitLogs,
  userActionLogs,
  salesRevenue,
  lostTickets,
  eligibleTickets,
  gatesConnectivityLogs,
  blacklist,
  ticketEntryReport,
};
