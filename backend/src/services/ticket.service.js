const { Op } = require("sequelize");
const {
  CustomerTicket,
  CustomerService,
  CustomerCombo,
  Combo,
  Reason,
  LostTicket,
  EligibleTicket,
  TariffService,
  Shift,
} = require("../models");
const { HttpError } = require("../middleware/error.middleware");

function extractIds(items, key) {
  if (!items || !items.length) return [];

  const fallbackKeys = [key];
  if (key.endsWith("_id")) fallbackKeys.push("id");

  const rawIds = [];
  for (const it of items) {
    let val = null;

    if (typeof it === "number") {
      val = it;
    } else if (it && typeof it === "object") {
      for (const k of fallbackKeys) {
        if (it[k] !== undefined && it[k] !== null) {
          const parsed = Number(it[k]);
          if (!Number.isNaN(parsed)) {
            val = parsed;
            break;
          }
        }
      }
    }

    if (val !== null && val > 0) rawIds.push(val);
  }

  return [...new Set(rawIds)];
}

async function ensureShiftExists(shiftId) {
  const shift = await Shift.findByPk(shiftId);
  if (!shift) {
    throw new HttpError(400, `Invalid shift_id: ${shiftId} (shift not found)`);
  }
}

async function generateTicketNumber() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const timeStr =
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");
  const randomNum = Math.floor(Math.random() * (9876521 - 1234567 + 1)) + 1234567;
  return `${day}${timeStr}${randomNum}`;
}

function comboUnitPrice(combo) {
  const dp = combo.discountPrice;
  const dpVal = dp != null ? Number(dp) : null;
  if (dpVal != null && dpVal > 0) return dpVal;

  const ap = combo.actualPrice;
  return Number(ap || 0);
}

function calculatePrices(ticketData, services, combos) {
  let members = parseInt(ticketData.no_of_members || 0, 10);
  if (members < 0) members = 0;

  const perMemberService = services.reduce((sum, s) => sum + Number(s.price || 0), 0);
  const perMemberCombo = combos.reduce((sum, c) => sum + comboUnitPrice(c), 0);

  const totalServicePrice = perMemberService * members;
  const totalComboPrice = perMemberCombo * members;

  const subTotal = totalServicePrice + totalComboPrice;
  const isFreePaid = (ticketData.is_ticket_free_paid || "").trim().toLowerCase();

  if (isFreePaid === "free") {
    return {
      total_service_price: totalServicePrice,
      total_combo_prices: totalComboPrice,
      discount_amount: 0.0,
      grand_total: 0.0,
    };
  }

  const discountValue = Number(ticketData.discount || 0);
  let discountAmount = 0.0;

  if (discountValue > 0) {
    discountAmount = discountValue <= 100 ? (discountValue / 100.0) * subTotal : discountValue;
  }

  const grandTotal = Math.max(subTotal - discountAmount, 0.0);

  return {
    total_service_price: totalServicePrice,
    total_combo_prices: totalComboPrice,
    discount_amount: discountAmount,
    grand_total: grandTotal,
  };
}

async function createTicket(ticketData, shiftId) {
  await ensureShiftExists(shiftId);

  let services = [];
  let combos = [];

  const serviceIds = extractIds(ticketData.selected_services, "service_id");
  const comboIds = extractIds(ticketData.selected_combos, "combo_id");

  if (serviceIds.length) {
    services = await TariffService.findAll({ where: { id: serviceIds, status: "Active" } });
  }
  if (comboIds.length) {
    combos = await Combo.findAll({ where: { id: comboIds, status: "Active" } });
  }

  const prices = calculatePrices(ticketData, services, combos);

  const ticketNumber = await generateTicketNumber();
  const qrCode = Buffer.from(ticketNumber).toString("base64");

  const userDiscountValue = Number(ticketData.discount || 0);
  const isDiscountApplied = userDiscountValue > 0 ? "Yes" : "No";

  const isFreePaid = (ticketData.is_ticket_free_paid || "").trim().toLowerCase();
  const storedPaidValue = isFreePaid !== "free" ? "paid" : "free";

  const existing = await CustomerTicket.findOne({
    where: {
      ticketGenFor: ticketData.ticket_gen_for,
      customerName: ticketData.customer_name,
      mobileNo: ticketData.mobile_no,
      noOfMembers: ticketData.no_of_members,
      totalServicePrice: prices.total_service_price,
      grandTotal: prices.grand_total,
    },
  });
  if (existing) {
    throw new HttpError(400, "Ticket already exists");
  }

  const ticket = await CustomerTicket.create({
    ticketGenFor: ticketData.ticket_gen_for,
    ticketNumber: ticketNumber,
    customerName: ticketData.customer_name,
    aadharNo: ticketData.aadhar_no,
    mobileNo: ticketData.mobile_no,
    noOfMembers: ticketData.no_of_members,
    totalServicePrice: prices.total_service_price,
    totalComboPrices: prices.total_combo_prices,
    grandTotal: prices.grand_total,
    discount: prices.discount_amount,
    isDiscountApplied,
    howDiscountApplied: String(userDiscountValue),
    qrCode,
    isTicketFreePaid: storedPaidValue,
    focReason: ticketData.foc_reason,
    ticketScanCount: ticketData.no_of_members,
    shiftId,
    ticketGeneratedShift: String(shiftId),
    ticketScannedEntryAt: null,
    ticketScannedExitAt: null,
  });

  for (const combo of combos) {
    await CustomerCombo.create({
      customerId: ticket.id,
      comboId: combo.id,
      price: comboUnitPrice(combo),
      comboWithExtra: "with",
    });
  }

  for (const service of services) {
    await CustomerService.create({
      customerId: ticket.id,
      serviceId: service.id,
      price: Number(service.price || 0),
    });
  }

  return ticket;
}

async function getTicket(ticketId) {
  return CustomerTicket.findByPk(ticketId);
}

async function getTicketsByShift(shiftId) {
  return CustomerTicket.findAll({ where: { shiftId } });
}

async function getAllTickets(skip = 0, limit = 100) {
  return CustomerTicket.findAll({ order: [["id", "DESC"]], offset: skip, limit });
}

const TICKET_ALLOWED_FIELDS = {
  ticket_gen_for: "ticketGenFor",
  customer_name: "customerName",
  aadhar_no: "aadharNo",
  mobile_no: "mobileNo",
  no_of_members: "noOfMembers",
  discount: "discount",
  is_ticket_free_paid: "isTicketFreePaid",
  foc_reason: "focReason",
  shift_id: "shiftId",
};

async function updateTicket(ticketId, payload) {
  const ticket = await CustomerTicket.findByPk(ticketId);
  if (!ticket) return null;

  if (payload.shift_id) {
    await ensureShiftExists(Number(payload.shift_id));
  }

  for (const [key, field] of Object.entries(TICKET_ALLOWED_FIELDS)) {
    if (payload[key] !== undefined) {
      ticket[field] = payload[key];
    }
  }

  try {
    const needsRecalc = ["no_of_members", "discount", "is_ticket_free_paid"].some((k) => payload[k] !== undefined);
    if (needsRecalc) {
      const svcRows = await CustomerService.findAll({ where: { customerId: ticketId } });
      const svcIds = svcRows.map((r) => Number(r.serviceId)).filter(Boolean);

      const comboRows = await CustomerCombo.findAll({ where: { customerId: ticketId } });
      const cmbIds = comboRows.map((r) => Number(r.comboId)).filter(Boolean);

      const services = svcIds.length ? await TariffService.findAll({ where: { id: svcIds } }) : [];
      const combos = cmbIds.length ? await Combo.findAll({ where: { id: cmbIds } }) : [];

      const had = ticket.howDiscountApplied;
      let tmpDiscount = 0.0;
      try {
        tmpDiscount = had != null && had !== "" && had !== "None" ? Number(had) : 0.0;
      } catch {
        tmpDiscount = 0.0;
      }

      const tmp = {
        no_of_members: Number(ticket.noOfMembers || 0),
        discount: tmpDiscount,
        is_ticket_free_paid: ticket.isTicketFreePaid,
      };

      const prices = calculatePrices(tmp, services, combos);
      ticket.totalServicePrice = prices.total_service_price;
      ticket.totalComboPrices = prices.total_combo_prices;
      ticket.grandTotal = prices.grand_total;

      ticket.discount = prices.discount_amount;
      ticket.isDiscountApplied = Number(tmp.discount || 0) > 0 ? "Yes" : "No";
      ticket.howDiscountApplied = String(Number(tmp.discount || 0));
    }
  } catch {
    // mirrors the original's best-effort recalculation (swallowed on error)
  }

  await ticket.save();
  return ticket;
}

async function deleteTicket(ticketId) {
  const ticket = await CustomerTicket.findByPk(ticketId);
  if (!ticket) return false;

  await CustomerService.destroy({ where: { customerId: ticketId } });
  await CustomerCombo.destroy({ where: { customerId: ticketId } });
  await ticket.destroy();
  return true;
}

function cleanIds(v) {
  if (!Array.isArray(v)) return [];
  const out = [];
  for (const x of v) {
    const ix = Number(x);
    if (!Number.isNaN(ix) && ix > 0) out.push(ix);
  }
  return [...new Set(out)];
}

async function addComboToTicket(payload) {
  const ticketNumber = (payload.ticket_number || "").trim();
  if (!ticketNumber) {
    throw new HttpError(400, "ticket_number is required");
  }

  const serviceIds = cleanIds(payload.service_ids);
  const comboIds = cleanIds(payload.combo_ids);

  if (!serviceIds.length && !comboIds.length) {
    throw new HttpError(400, "Provide at least one service_ids or combo_ids");
  }

  const ticket = await CustomerTicket.findOne({ where: { ticketNumber } });
  if (!ticket) {
    throw new HttpError(404, "Ticket not found");
  }

  const existingServiceRows = await CustomerService.findAll({ where: { customerId: ticket.id } });
  const existingServiceIds = new Set(existingServiceRows.map((r) => Number(r.serviceId)).filter(Boolean));

  const existingComboRows = await CustomerCombo.findAll({ where: { customerId: ticket.id } });
  const existingComboIds = new Set(existingComboRows.map((r) => Number(r.comboId)).filter(Boolean));

  const newServiceIds = serviceIds.filter((sid) => !existingServiceIds.has(sid));
  const newComboIds = comboIds.filter((cid) => !existingComboIds.has(cid));

  const newServices = newServiceIds.length
    ? await TariffService.findAll({ where: { id: newServiceIds, status: "Active" } })
    : [];
  const newCombos = newComboIds.length ? await Combo.findAll({ where: { id: newComboIds, status: "Active" } }) : [];

  for (const s of newServices) {
    await CustomerService.create({ customerId: ticket.id, serviceId: s.id, price: Number(s.price || 0) });
  }
  for (const c of newCombos) {
    await CustomerCombo.create({ customerId: ticket.id, comboId: c.id, price: comboUnitPrice(c), comboWithExtra: "with" });
  }

  if (payload.foc_reason !== undefined) {
    ticket.focReason = payload.foc_reason;
  }

  if (payload.discount_percent !== undefined && payload.discount_percent !== null) {
    const dp = Number(payload.discount_percent || 0);
    ticket.howDiscountApplied = String(dp);
    ticket.isDiscountApplied = dp > 0 ? "Yes" : "No";
  }

  await ticket.save();

  const svcRows = await CustomerService.findAll({ where: { customerId: ticket.id } });
  const svcIds = svcRows.map((r) => Number(r.serviceId)).filter(Boolean);
  const cmbRows = await CustomerCombo.findAll({ where: { customerId: ticket.id } });
  const cmbIds = cmbRows.map((r) => Number(r.comboId)).filter(Boolean);

  const services = svcIds.length ? await TariffService.findAll({ where: { id: svcIds } }) : [];
  const combos = cmbIds.length ? await Combo.findAll({ where: { id: cmbIds } }) : [];

  const had = ticket.howDiscountApplied;
  let tmpDiscount = 0.0;
  try {
    tmpDiscount = had != null && had !== "" && had !== "None" ? Number(had) : 0.0;
  } catch {
    tmpDiscount = 0.0;
  }

  const tmp = {
    no_of_members: Number(ticket.noOfMembers || 0),
    discount: tmpDiscount,
    is_ticket_free_paid: ticket.isTicketFreePaid,
  };

  const prices = calculatePrices(tmp, services, combos);
  ticket.totalServicePrice = prices.total_service_price;
  ticket.totalComboPrices = prices.total_combo_prices;
  ticket.grandTotal = prices.grand_total;
  ticket.discount = prices.discount_amount;

  await ticket.save();
  return ticket;
}

// -------------------- Simple Service/Combo creators (ticket_management.py's lightweight variants) --------------------

async function createSimpleService(data) {
  return TariffService.create({
    servicename: data.servicename,
    price: data.price,
    discountedprice: data.discountedprice ?? null,
    servicefor: data.servicefor,
    shiftId: data.shift_id,
    status: data.status || "Active",
  });
}

async function getSimpleServices() {
  return TariffService.findAll({ where: { status: "Active" } });
}

async function createSimpleCombo(data) {
  return Combo.create({
    comboname: data.comboname,
    actualPrice: data.actual_price,
    discountPrice: data.discount_price,
  });
}

async function getSimpleCombos() {
  return Combo.findAll({ where: { status: "Active" } });
}

// -------------------- Eligible tickets --------------------

async function findTicketByTicketNumber(ticketNumber) {
  return CustomerTicket.findOne({ where: { ticketNumber } });
}

async function findTicketByAadharNo(aadharNo) {
  return CustomerTicket.findOne({ where: { aadharNo } });
}

async function markEligible(ticket, markedBy, remark) {
  if (!ticket || !ticket.id) {
    throw new HttpError(400, "Invalid ticket");
  }

  const existing = await EligibleTicket.findOne({ where: { ticketId: ticket.id } });
  if (existing) return existing;

  return EligibleTicket.create({
    ticketId: ticket.id,
    markedBy: (markedBy || "").trim() || null,
    remark: (remark || "").trim() || null,
  });
}

// -------------------- Lost tickets --------------------

function namePattern(customerName) {
  return `%${(customerName || "").trim()}%`;
}

async function findLostTicketByTicketNumberAndName(ticketNumber, customerName) {
  const tno = (ticketNumber || "").trim();
  const cname = (customerName || "").trim();
  if (!tno || !cname) return null;

  return CustomerTicket.findOne({
    where: { ticketNumber: tno, customerName: { [Op.like]: namePattern(cname) } },
  });
}

async function findLostTicketByAadharAndName(aadharNo, customerName) {
  const aad = (aadharNo || "").trim();
  const cname = (customerName || "").trim();
  if (!aad || !cname) return null;

  return CustomerTicket.findOne({
    where: { aadharNo: aad, customerName: { [Op.like]: namePattern(cname) } },
  });
}

async function markLost(ticket, markedBy, remark) {
  if (!ticket || !ticket.id) {
    throw new HttpError(400, "Invalid ticket");
  }

  const existing = await LostTicket.findOne({ where: { ticketId: ticket.id } });
  if (existing) return existing;

  return LostTicket.create({
    ticketId: ticket.id,
    markedBy: (markedBy || "").trim() || null,
    remark: (remark || "").trim() || null,
  });
}

async function listLostTickets(fromDate, toDate, salesType, ticketNumber) {
  const startDt = new Date(`${fromDate}T00:00:00.000`);
  const endDt = new Date(`${toDate}T23:59:59.999`);

  const where = {
    ticketGenDateTime: { [Op.gte]: startDt, [Op.lte]: endDt },
  };
  if (ticketNumber) {
    where.ticketNumber = ticketNumber.trim();
  }

  return CustomerTicket.findAll({
    where,
    include: [{ model: LostTicket, as: "lostTickets", required: true, attributes: [] }],
  });
}

// -------------------- Reasons --------------------

async function createReason(data) {
  return Reason.create({ reason: data.reason, status: data.status });
}

async function listReasons() {
  return Reason.findAll({ order: [["id", "DESC"]] });
}

async function getReasonById(reasonId) {
  return Reason.findByPk(reasonId);
}

async function updateReason(reasonId, data) {
  const reason = await Reason.findByPk(reasonId);
  if (!reason) return null;
  if (data.reason !== undefined) reason.reason = data.reason;
  if (data.status !== undefined) reason.status = data.status;
  await reason.save();
  return reason;
}

async function deactivateReason(reasonId) {
  const reason = await Reason.findByPk(reasonId);
  if (!reason) return null;
  reason.status = "Deactive";
  await reason.save();
  return reason;
}

async function deleteReason(reasonId) {
  const reason = await Reason.findByPk(reasonId);
  if (!reason) return false;
  await reason.destroy();
  return true;
}

module.exports = {
  createTicket,
  getTicket,
  getTicketsByShift,
  getAllTickets,
  updateTicket,
  deleteTicket,
  addComboToTicket,
  createSimpleService,
  getSimpleServices,
  createSimpleCombo,
  getSimpleCombos,
  findTicketByTicketNumber,
  findTicketByAadharNo,
  markEligible,
  findLostTicketByTicketNumberAndName,
  findLostTicketByAadharAndName,
  markLost,
  listLostTickets,
  createReason,
  listReasons,
  getReasonById,
  updateReason,
  deactivateReason,
  deleteReason,
};
