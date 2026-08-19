const asyncHandler = require("../utils/asyncHandler");
const subscriptionCardService = require("../services/subscriptionCard.service");
const { HttpError } = require("../middleware/error.middleware");

const currentActor = (user) => ({
  name: user?.sub || "system",
  role: Array.isArray(user?.roles) && user.roles.length ? user.roles[0] : (user?.account_type || "system"),
});

function cardOut(card) {
  return {
    id: card.id,
    cardnumber: card.cardnumber,
    name: card.name,
    phonenum: card.phonenum,
    email: card.email,
    startdate: card.startdate,
    enddate: card.enddate,
    recharge: card.recharge,
    status: card.status,
    currentbalance: card.currentbalance,
    lastrechargedatetime: card.lastrechargedatetime,
    recharge_usertypeby: card.rechargeUsertypeby,
    rechargedby: card.rechargedby,
    created_at: card.createdAt,
  };
}

function rechargeLogOut(log) {
  const createdAt = log.createdAt || log.get?.("createdAt") || null;
  return {
    id: log.id,
    oldbalance: log.oldbalance,
    recharge: log.recharge,
    newbalance: log.newbalance,
    startdate: log.startdate,
    enddate: log.enddate,
    recharge_usertypeby: log.rechargeUsertypeby,
    rechargedby: log.rechargedby,
    created_at: createdAt && !Number.isNaN(new Date(createdAt).getTime())
      ? new Date(createdAt).toISOString()
      : null,
  };
}

const createCard = asyncHandler(async (req, res) => {
  res.json(cardOut(await subscriptionCardService.createSubscriptionCard(req.body, currentActor(req.user))));
});

const fetchCard = asyncHandler(async (req, res) => {
  const card = await subscriptionCardService.getSubscriptionCardByNumber(req.params.cardnumber);
  if (!card) throw new HttpError(404, "Card not found");
  res.json(cardOut(card));
});

const listCards = asyncHandler(async (req, res) => {
  res.json((await subscriptionCardService.listSubscriptionCards()).map(cardOut));
});

const updateCard = asyncHandler(async (req, res) => {
  res.json(cardOut(await subscriptionCardService.updateSubscriptionCard(req.params.cardnumber, req.body)));
});

const deleteCard = asyncHandler(async (req, res) => {
  const message = await subscriptionCardService.deleteSubscriptionCard(req.params.cardnumber);
  res.json({ message });
});

const rechargeCard = asyncHandler(async (req, res) => {
  const { recharge, startdate, enddate, status } = req.query;
  const card = await subscriptionCardService.rechargeSubscriptionCard(req.params.cardnumber, {
    rechargeAmount: Number(recharge),
    startdate,
    enddate,
    status,
  }, currentActor(req.user));
  if (!card) throw new HttpError(404, "Card not found");
  res.json(cardOut(card));
});

const getLogs = asyncHandler(async (req, res) => {
  const card = await subscriptionCardService.getSubscriptionCardByNumber(req.params.cardnumber);
  if (!card) throw new HttpError(404, "Card not found");
  res.json((await subscriptionCardService.getRechargeLogs(card.id)).map(rechargeLogOut));
});

module.exports = { createCard, listCards, fetchCard, updateCard, deleteCard, rechargeCard, getLogs };
