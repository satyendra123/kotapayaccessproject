const { StaffEntryExitLog, UserActionLog, GateConnectivityLog, BlacklistEntry } = require("../models");

async function logStaffEntryExit({ staffName, action, staffId = null, gateId = null, machineId = null }) {
  return StaffEntryExitLog.create({ staffId, staffName, action, gateId, machineId });
}

async function logUserAction({ username, userType, action, userId = null, meta = null }) {
  return UserActionLog.create({ userId, username, userType, action, meta });
}

async function logGateConnectivity({ gateName, status, gateId = null, machineId = null, machineName = null, remark = null }) {
  return GateConnectivityLog.create({ gateId, machineId, gateName, machineName, status, remark });
}

async function addBlacklist({ entryType, value, reason = null, createdBy = null }) {
  return BlacklistEntry.create({ entryType, value, reason, createdBy });
}

module.exports = { logStaffEntryExit, logUserAction, logGateConnectivity, addBlacklist };
