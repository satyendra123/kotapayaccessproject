const asyncHandler = require("../utils/asyncHandler");
const shiftService = require("../services/shift.service");

function shiftOut(shift) {
  return {
    id: shift.id,
    shiftname: shift.shiftname,
    shiftstarttime: shift.shiftstarttime,
    shiftendtime: shift.shiftendtime,
    status: shift.status,
    created_at: shift.createdAt,
  };
}

const createShift = asyncHandler(async (req, res) => {
  res.json(shiftOut(await shiftService.createShift(req.body)));
});

const listShifts = asyncHandler(async (req, res) => {
  res.json((await shiftService.listShifts()).map(shiftOut));
});

const getShift = asyncHandler(async (req, res) => {
  res.json(shiftOut(await shiftService.getShift(Number(req.params.shiftId))));
});

const updateShift = asyncHandler(async (req, res) => {
  res.json(shiftOut(await shiftService.updateShift(Number(req.params.shiftId), req.body)));
});

const deleteShift = asyncHandler(async (req, res) => {
  const message = await shiftService.deleteShift(Number(req.params.shiftId));
  res.json({ message });
});

module.exports = { createShift, listShifts, getShift, updateShift, deleteShift };
