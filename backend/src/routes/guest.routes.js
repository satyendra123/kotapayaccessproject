const express = require("express");
const Joi = require("joi");

const guestController = require("../controllers/guest.controller");
const authMiddleware = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");
const { validateBody } = require("../utils/validate.util");

const router = express.Router();

router.use(authMiddleware);

const guestCreateSchema = Joi.object({
  name: Joi.string().required(),
  gender: Joi.string().required(),
  withmembers: Joi.number().integer().required(),
  phonenumber: Joi.string().required(),
  emailid: Joi.string().allow(null),
  status: Joi.string().required(),
  accesscardtype: Joi.string().required(),
  aadharcard: Joi.string().required(),
  timezone_start: Joi.date().iso().required(),
  timezone_end: Joi.date().iso().required(),
  accessgate: Joi.number().integer().required(),
  input_cards: Joi.array().items(Joi.string()).default([]),
});

const guestUpdateSchema = Joi.object({
  name: Joi.string(),
  gender: Joi.string(),
  withmembers: Joi.number().integer(),
  phonenumber: Joi.string(),
  emailid: Joi.string().allow(null),
  status: Joi.string(),
  accesscardtype: Joi.string(),
  aadharcard: Joi.string(),
  timezone_start: Joi.date().iso(),
  timezone_end: Joi.date().iso(),
  accessgate: Joi.number().integer(),
  input_cards: Joi.array().items(Joi.string()),
});

router.post("/guests/", requirePermission(["guests.create", "manage_guests"]), validateBody(guestCreateSchema), guestController.createGuest);
router.get("/guests/", requirePermission(["guests.view", "guests.create", "guests.edit", "guests.delete", "manage_guests"]), guestController.listGuests);
router.get("/guests/:guestId(\\d+)", requirePermission(["guests.edit", "manage_guests"]), guestController.getGuest);
router.put(
  "/guests/:guestId(\\d+)",
  requirePermission(["guests.edit", "manage_guests"]),
  validateBody(guestUpdateSchema),
  guestController.updateGuest
);
router.post("/guests/:guestId(\\d+)/deactivate", requirePermission(["guests.edit", "manage_guests"]), guestController.deactivateGuest);
router.delete("/guests/:guestId(\\d+)", requirePermission(["guests.delete", "manage_guests"]), guestController.deleteGuest);

router.get("/guest-cards/", requirePermission("manage_guest_cards"), guestController.listAllGuestCards);
router.get("/guests/:guestId(\\d+)/cards", requirePermission("manage_guest_cards"), guestController.listCardsByGuest);
router.delete("/guest-cards/:cardId(\\d+)", requirePermission("manage_guest_cards"), guestController.deleteCard);

module.exports = router;
