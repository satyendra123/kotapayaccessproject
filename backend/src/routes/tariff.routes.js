const express = require("express");
const Joi = require("joi");

const tariffController = require("../controllers/tariff.controller");
const authMiddleware = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");
const { validateBody } = require("../utils/validate.util");

const router = express.Router();

router.use(authMiddleware);

const tariffCreateSchema = Joi.object({
  servicename: Joi.string().required(),
  shift_id: Joi.number().integer().required(),
  servicefor: Joi.string().required(),
  price: Joi.number().required(),
  status: Joi.string().required(),
  discountedprice: Joi.number().allow(null),
});

const tariffUpdateSchema = Joi.object({
  servicename: Joi.string(),
  shift_id: Joi.number().integer(),
  servicefor: Joi.string(),
  price: Joi.number(),
  status: Joi.string(),
  discountedprice: Joi.number().allow(null),
});

const comboServiceCreateSchema = Joi.object({
  combo_service: Joi.string().required(),
  shift_id: Joi.number().integer().required(),
  price: Joi.number().min(0).required(),
  status: Joi.string().default("Active"),
  discountedprice: Joi.number().min(0).allow(null),
});

const comboServiceUpdateSchema = Joi.object({
  combo_service: Joi.string(),
  shift_id: Joi.number().integer(),
  price: Joi.number().min(0),
  status: Joi.string().default("Active"),
  discountedprice: Joi.number().min(0).allow(null),
});

const comboCreateSchema = Joi.object({
  comboname: Joi.string().required(),
  actual_price: Joi.number().required(),
  discount_price: Joi.number().allow(null).default(0.0),
  selectedservices: Joi.array().items(Joi.number().integer()).default([]),
  status: Joi.string().default("Active"),
});

const comboUpdateSchema = Joi.object({
  comboname: Joi.string(),
  actual_price: Joi.number(),
  discount_price: Joi.number().allow(null),
  status: Joi.string().default("Active"),
  selectedservices: Joi.array().items(Joi.number().integer()).allow(null),
});

router.post(
  "/tariffs/",
  requirePermission(["tariffs.create", "manage_tariff_services"]),
  validateBody(tariffCreateSchema),
  tariffController.createTariff
);
router.get("/tariffs/", requirePermission(["tariffs.view", "tariffs.create", "tariffs.edit", "tariffs.delete", "manage_tariff_services"]), tariffController.listTariffs);
router.get("/tariffs/:tariffId(\\d+)", requirePermission(["tariffs.view", "tariffs.edit", "manage_tariff_services"]), tariffController.getTariff);
router.put(
  "/tariffs/:tariffId(\\d+)",
  requirePermission(["tariffs.edit", "manage_tariff_services"]),
  validateBody(tariffUpdateSchema),
  tariffController.updateTariff
);
router.delete("/tariffs/:tariffId(\\d+)", requirePermission(["tariffs.delete", "manage_tariff_services"]), tariffController.deleteTariff);

router.post(
  "/combo-services/",
  requirePermission(["combo_services.create", "manage_combo_services"]),
  validateBody(comboServiceCreateSchema),
  tariffController.createComboServiceRoute
);
router.get("/combo-services/", requirePermission(["combo_services.view", "combo_services.create", "combo_services.edit", "combo_services.delete", "manage_combo_services"]), tariffController.listComboServices);
router.get(
  "/combo-services/:comboServiceId(\\d+)",
  requirePermission(["combo_services.view", "combo_services.edit", "manage_combo_services"]),
  tariffController.getComboServiceRoute
);
router.put(
  "/combo-services/:comboServiceId(\\d+)",
  requirePermission(["combo_services.edit", "manage_combo_services"]),
  validateBody(comboServiceUpdateSchema),
  tariffController.updateComboServiceRoute
);
router.delete(
  "/combo-services/:comboServiceId(\\d+)",
  requirePermission(["combo_services.delete", "manage_combo_services"]),
  tariffController.deactivateComboServiceRoute
);

router.post(
  "/combos/",
  requirePermission(["combos.create", "manage_combos"]),
  validateBody(comboCreateSchema),
  tariffController.createComboRoute
);
router.get("/combos/", requirePermission(["combos.view", "combos.create", "combos.edit", "combos.delete", "manage_combos"]), tariffController.listCombosRoute);
router.get("/combos/:comboId(\\d+)", requirePermission(["combos.view", "combos.edit", "manage_combos"]), tariffController.getComboRoute);
router.put(
  "/combos/:comboId(\\d+)",
  requirePermission(["combos.edit", "manage_combos"]),
  validateBody(comboUpdateSchema),
  tariffController.updateComboRoute
);
router.delete("/combos/:comboId(\\d+)", requirePermission(["combos.delete", "manage_combos"]), tariffController.deleteComboRoute);

module.exports = router;
