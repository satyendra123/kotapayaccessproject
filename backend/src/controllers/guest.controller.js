const asyncHandler = require("../utils/asyncHandler");
const guestService = require("../services/guest.service");
const { HttpError } = require("../middleware/error.middleware");

const createGuest = asyncHandler(async (req, res) => {
  res.json(await guestService.createGuest(req.body));
});

const listGuests = asyncHandler(async (req, res) => {
  res.json(await guestService.getAllGuests());
});

const getGuest = asyncHandler(async (req, res) => {
  const guest = await guestService.getGuestById(Number(req.params.guestId));
  if (!guest) throw new HttpError(404, "Guest not found");
  res.json(guest);
});

const updateGuest = asyncHandler(async (req, res) => {
  const guest = await guestService.updateGuest(Number(req.params.guestId), req.body);
  if (!guest) throw new HttpError(404, "Guest not found");
  res.json(guest);
});

const deactivateGuest = asyncHandler(async (req, res) => {
  const guest = await guestService.deactivateGuest(Number(req.params.guestId));
  if (!guest) throw new HttpError(404, "Guest not found");
  res.json(guest);
});

const deleteGuest = asyncHandler(async (req, res) => {
  const deleted = await guestService.deleteGuest(Number(req.params.guestId));
  if (!deleted) throw new HttpError(404, "Guest not found");
  res.json({ message: `Guest ${req.params.guestId} deleted successfully` });
});

const listAllGuestCards = asyncHandler(async (req, res) => {
  res.json(await guestService.listAllGuestCards());
});

const listCardsByGuest = asyncHandler(async (req, res) => {
  res.json(await guestService.listGuestCardsByGuestId(Number(req.params.guestId)));
});

const deleteCard = asyncHandler(async (req, res) => {
  const deleted = await guestService.deleteGuestCard(Number(req.params.cardId));
  if (!deleted) throw new HttpError(404, "Card not found");
  res.json({ message: `Card ${req.params.cardId} deleted successfully` });
});

module.exports = {
  createGuest,
  listGuests,
  getGuest,
  updateGuest,
  deactivateGuest,
  deleteGuest,
  listAllGuestCards,
  listCardsByGuest,
  deleteCard,
};
