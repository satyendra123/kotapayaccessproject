const express = require("express");
const Joi = require("joi");

const subscriptionCardController = require("../controllers/subscriptionCard.controller");
const authMiddleware = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");
const { validateBody } = require("../utils/validate.util");
const { HttpError } = require("../middleware/error.middleware");

const router = express.Router();

router.use(authMiddleware);

const createSchema = Joi.object({
  cardnumber: Joi.string().required(),
  name: Joi.string().required(),
  phonenum: Joi.string().required(),
  email: Joi.string().allow(null),
  startdate: Joi.string().isoDate().required(),
  enddate: Joi.string().isoDate().required(),
  recharge: Joi.number().positive().required(),
  status: Joi.string().required(),
});

function validateRechargeQuery(req, res, next) {
  const { recharge, startdate, enddate, status } = req.query;
  const amount = Number(recharge);
  if (!recharge || Number.isNaN(amount) || amount <= 0) {
    return next(new HttpError(400, "recharge amount must be greater than 0"));
  }
  if (!startdate || !enddate || !status) {
    return next(new HttpError(400, "startdate, enddate and status are required"));
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startdate) || !/^\d{4}-\d{2}-\d{2}$/.test(enddate)) {
    return next(new HttpError(400, "startdate and enddate must use YYYY-MM-DD format"));
  }
  next();
}

router.post("/", requirePermission(["cards.create", "manage_subscription_cards"]), validateBody(createSchema), subscriptionCardController.createCard);
router.get("/", requirePermission(["cards.view", "cards.create", "cards.edit", "cards.delete", "manage_subscription_cards"]), subscriptionCardController.listCards);
router.get("/:cardnumber", requirePermission(["cards.view", "cards.edit", "manage_subscription_cards"]), subscriptionCardController.fetchCard);
router.put("/:cardnumber", requirePermission(["cards.edit", "manage_subscription_cards"]), validateBody(createSchema), subscriptionCardController.updateCard);
router.delete("/:cardnumber", requirePermission(["cards.delete", "manage_subscription_cards"]), subscriptionCardController.deleteCard);
router.post("/:cardnumber/recharge", requirePermission(["cards.edit", "manage_subscription_cards"]), validateRechargeQuery, subscriptionCardController.rechargeCard);
router.get("/:cardnumber/logs", requirePermission(["cards.view", "cards.edit", "manage_subscription_cards"]), subscriptionCardController.getLogs);

module.exports = router;
