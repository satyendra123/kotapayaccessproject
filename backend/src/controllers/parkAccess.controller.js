const asyncHandler = require("../utils/asyncHandler");
const parkAccessService = require("../services/parkAccess.service");

const validateParkScan = asyncHandler(async (req, res) => {
  const { gate_id, machine_uid, ticket_number } = req.body;
  const { success, noOfPersons } = await parkAccessService.validateScan({
    gateId: gate_id,
    machineUid: machine_uid,
    ticketNumber: ticket_number,
  });
  res.json({ success, no_of_persons: noOfPersons });
});

module.exports = { validateParkScan };
