const { UniqueConstraintError } = require("sequelize");
const { SubscriptionCard, SubscriptionCardRechargeLog } = require("../models");
const { HttpError } = require("../middleware/error.middleware");

function validateDateRange(startdate, enddate) {
  const normalizedStart = String(startdate || "").slice(0, 10);
  const normalizedEnd = String(enddate || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedStart) || !/^\d{4}-\d{2}-\d{2}$/.test(normalizedEnd)) {
    throw new HttpError(400, "startdate and enddate must be valid dates");
  }
  const start = new Date(`${normalizedStart}T00:00:00.000Z`);
  const end = new Date(`${normalizedEnd}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new HttpError(400, "startdate and enddate must be valid dates");
  }
  if (end < start) {
    throw new HttpError(400, "enddate must be on or after startdate");
  }
  return { startdate: normalizedStart, enddate: normalizedEnd };
}

async function createSubscriptionCard(data, actor = { name: "system", role: "system" }) {
  const dates = validateDateRange(data.startdate, data.enddate);
  const existing = await SubscriptionCard.findOne({ where: { cardnumber: data.cardnumber } });
  if (existing) {
    throw new HttpError(400, `Card number '${data.cardnumber}' already exists`);
  }

  const now = new Date();

  try {
    const card = await SubscriptionCard.create({
      cardnumber: data.cardnumber,
      name: data.name,
      phonenum: data.phonenum,
      email: data.email,
      startdate: dates.startdate,
      enddate: dates.enddate,
      recharge: data.recharge,
      currentbalance: data.recharge,
      lastrechargedatetime: now,
      rechargeUsertypeby: actor.role,
      rechargedby: actor.name,
      status: data.status,
      createdAt: now,
    });

    await SubscriptionCardRechargeLog.create({
      subscriptioncardsid: card.id,
      oldbalance: 0,
      recharge: data.recharge,
      newbalance: data.recharge,
      startdate: dates.startdate,
      enddate: dates.enddate,
      rechargeUsertypeby: actor.role,
      rechargedby: actor.name,
      createdAt: now,
    });

    return card;
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      throw new HttpError(400, `Card number '${data.cardnumber}' already exists`);
    }
    throw err;
  }
}

async function getSubscriptionCardByNumber(cardnumber) {
  return SubscriptionCard.findOne({ where: { cardnumber } });
}

async function listSubscriptionCards() {
  return SubscriptionCard.findAll({ order: [["id", "DESC"]] });
}

async function updateSubscriptionCard(cardnumber, data) {
  const card = await getSubscriptionCardByNumber(cardnumber);
  if (!card) throw new HttpError(404, "Card not found");
  const dates = validateDateRange(data.startdate, data.enddate);
  card.name = data.name;
  card.phonenum = data.phonenum;
  card.email = data.email;
  card.startdate = dates.startdate;
  card.enddate = dates.enddate;
  card.status = data.status;
  await card.save();
  return card;
}

async function deleteSubscriptionCard(cardnumber) {
  const card = await getSubscriptionCardByNumber(cardnumber);
  if (!card) throw new HttpError(404, "Card not found");
  await SubscriptionCardRechargeLog.destroy({ where: { subscriptioncardsid: card.id } });
  await card.destroy();
  return `Subscription card '${cardnumber}' deleted successfully`;
}

async function rechargeSubscriptionCard(cardnumber, { rechargeAmount, startdate, enddate, status }, actor = { name: "system", role: "system" }) {
  const dates = validateDateRange(startdate, enddate);
  const now = new Date();
  const card = await getSubscriptionCardByNumber(cardnumber);
  if (!card) {
    return null;
  }

  const oldbalance = card.currentbalance;
  const newbalance = oldbalance + rechargeAmount;

  card.startdate = dates.startdate;
  card.enddate = dates.enddate;
  card.recharge = rechargeAmount;
  card.currentbalance = newbalance;
  card.lastrechargedatetime = now;
  card.status = status;
  await card.save();

  await SubscriptionCardRechargeLog.create({
    subscriptioncardsid: card.id,
    oldbalance,
    recharge: rechargeAmount,
    newbalance,
    startdate: dates.startdate,
    enddate: dates.enddate,
    rechargeUsertypeby: actor.role,
    rechargedby: actor.name,
    createdAt: now,
  });

  return card;
}

async function getRechargeLogs(cardId) {
  return SubscriptionCardRechargeLog.findAll({
    where: { subscriptioncardsid: cardId },
    order: [["id", "DESC"]],
  });
}

module.exports = {
  createSubscriptionCard,
  getSubscriptionCardByNumber,
  listSubscriptionCards,
  updateSubscriptionCard,
  deleteSubscriptionCard,
  rechargeSubscriptionCard,
  getRechargeLogs,
};
