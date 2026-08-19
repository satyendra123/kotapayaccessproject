const { Op, fn, col, where: sequelizeWhere, literal } = require("sequelize");
const { CustomerTicket, EligibleTicket, LostTicket, sequelize } = require("../models");

const GROUP_MEMBERS_THRESHOLD = 5;
const MONTH_ABBR = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function todayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return [start, end];
}

function isPaidWhere() {
  return sequelizeWhere(fn("LOWER", fn("COALESCE", col("is_ticket_free_paid"), "")), "paid");
}

async function todaysTicketGeneratedMembers() {
  const [start, end] = todayRange();
  return CustomerTicket.count({
    where: {
      [Op.and]: [
        { ticketGenDateTime: { [Op.gte]: start, [Op.lt]: end } },
        sequelizeWhere(fn("LOWER", fn("COALESCE", col("ticket_gen_for"), "")), "member"),
      ],
    },
  });
}

async function todayInside() {
  const todayStr = new Date().toISOString().slice(0, 10);

  const total = await CustomerTicket.count({
    where: {
      [Op.and]: [
        { ticketScannedEntryAt: { [Op.ne]: null } },
        { ticketScannedEntryAt: { [Op.ne]: "" } },
        { ticketScannedEntryAt: { [Op.like]: `${todayStr}%` } },
        { [Op.or]: [{ ticketScannedExitAt: null }, { ticketScannedExitAt: "" }] },
      ],
    },
  });

  return { online: total, offline: 0 };
}

async function todayOutside() {
  const todayStr = new Date().toISOString().slice(0, 10);

  const total = await CustomerTicket.count({
    where: {
      [Op.and]: [
        { ticketScannedExitAt: { [Op.ne]: null } },
        { ticketScannedExitAt: { [Op.ne]: "" } },
        { ticketScannedExitAt: { [Op.like]: `${todayStr}%` } },
      ],
    },
  });

  return { online: total, offline: 0 };
}

async function overstayCount() {
  return 0;
}

async function todayRevenue() {
  const [start, end] = todayRange();

  const result = await CustomerTicket.findOne({
    attributes: [[fn("COALESCE", fn("SUM", col("grand_total")), 0.0), "total"]],
    where: { [Op.and]: [{ ticketGenDateTime: { [Op.gte]: start, [Op.lt]: end } }, isPaidWhere()] },
    raw: true,
  });

  return { amount: Number((result && result.total) || 0), currency: "INR" };
}

async function totalLostTickets() {
  return LostTicket.count();
}

async function totalEligibleTickets() {
  return EligibleTicket.count();
}

async function totalGroupTickets() {
  return CustomerTicket.count({ where: { noOfMembers: { [Op.gte]: GROUP_MEMBERS_THRESHOLD } } });
}

async function monthlyRevenue() {
  const year = new Date().getFullYear();

  const rows = await CustomerTicket.findAll({
    attributes: [
      [fn("MONTH", col("ticket_gen_date_time")), "m"],
      [fn("COALESCE", fn("SUM", col("grand_total")), 0.0), "rev"],
    ],
    where: {
      [Op.and]: [sequelizeWhere(fn("YEAR", col("ticket_gen_date_time")), year), isPaidWhere()],
    },
    group: [fn("MONTH", col("ticket_gen_date_time"))],
    raw: true,
  });

  const byMonth = {};
  for (const r of rows) {
    if (r.m != null) byMonth[Number(r.m)] = Number(r.rev);
  }

  const out = [];
  for (let m = 1; m <= 12; m++) {
    out.push({ month: MONTH_ABBR[m], capacity: 100000, revenue: byMonth[m] || 0.0 });
  }
  return out;
}

async function todayTicketCollection() {
  const [start, end] = todayRange();

  const totalToday = await CustomerTicket.count({
    where: { ticketGenDateTime: { [Op.gte]: start, [Op.lt]: end } },
  });
  const groupedToday = await CustomerTicket.count({
    where: {
      ticketGenDateTime: { [Op.gte]: start, [Op.lt]: end },
      noOfMembers: { [Op.gte]: GROUP_MEMBERS_THRESHOLD },
    },
  });
  const normalToday = Math.max(totalToday - groupedToday, 0);

  return [
    { type: "Normal Ticket", count: normalToday },
    { type: "Grouped Ticket", count: groupedToday },
    { type: "Cards", count: 0 },
  ];
}

module.exports = {
  todaysTicketGeneratedMembers,
  todayInside,
  todayOutside,
  overstayCount,
  todayRevenue,
  totalLostTickets,
  totalEligibleTickets,
  totalGroupTickets,
  monthlyRevenue,
  todayTicketCollection,
};
