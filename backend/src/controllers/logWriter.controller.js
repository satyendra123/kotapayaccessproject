const asyncHandler = require("../utils/asyncHandler");
const reportLogWriter = require("../services/reportLogWriter.service");

const addStaffEntryExitLog = asyncHandler(async (req, res) => {
  const { staff_name, action, staff_id, gate_id, machine_id } = req.body;
  const obj = await reportLogWriter.logStaffEntryExit({
    staffName: staff_name,
    action,
    staffId: staff_id,
    gateId: gate_id,
    machineId: machine_id,
  });
  res.json({ id: obj.id, message: "Staff entry/exit log created" });
});

const addUserActionLog = asyncHandler(async (req, res) => {
  const { username, user_type, action, user_id, meta } = req.body;
  const obj = await reportLogWriter.logUserAction({
    username,
    userType: user_type,
    action,
    userId: user_id,
    meta,
  });
  res.json({ id: obj.id, message: "User action log created" });
});

const addGateConnectivityLog = asyncHandler(async (req, res) => {
  const { gate_name, status, gate_id, machine_id, machine_name, remark } = req.body;
  const obj = await reportLogWriter.logGateConnectivity({
    gateName: gate_name,
    status,
    gateId: gate_id,
    machineId: machine_id,
    machineName: machine_name,
    remark,
  });
  res.json({ id: obj.id, message: "Gate connectivity log created" });
});

const addBlacklistEntry = asyncHandler(async (req, res) => {
  const { entry_type, value, reason } = req.body;
  const obj = await reportLogWriter.addBlacklist({
    entryType: entry_type,
    value,
    reason,
    createdBy: req.user && req.user.sub,
  });
  res.json({ id: obj.id, message: "Blacklisted successfully" });
});

module.exports = { addStaffEntryExitLog, addUserActionLog, addGateConnectivityLog, addBlacklistEntry };
