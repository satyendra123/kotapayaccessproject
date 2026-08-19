const asyncHandler = require("../utils/asyncHandler");
const liveLogsService = require("../services/liveLogs.service");
const { HttpError } = require("../middleware/error.middleware");

function formatDateTime(dt) {
  if (!dt) return null;
  const d = new Date(dt);
  return d.toISOString().slice(0, 19).replace("T", " ");
}

function rowToStaffLogOut(r) {
  const entryStr = r.entry_created_at
    ? `${formatDateTime(r.entry_created_at)} (Gate: ${r.entry_gate_name || "Unknown"} | Machine: ${r.entry_machine_name || "Unknown"})`
    : null;
  const exitStr = r.exit_created_at
    ? `${formatDateTime(r.exit_created_at)} (Gate: ${r.exit_gate_name || "Unknown"} | Machine: ${r.exit_machine_name || "Unknown"})`
    : null;

  return {
    id: r.staff_id,
    staffType: r.staff_type,
    staffName: r.staff_name,
    mobileNo: r.phone_number,
    cardNo: r.access_card_number,
    entryDateTime: entryStr,
    exitDateTime: exitStr,
  };
}

const liveStaffLogsAll = asyncHandler(async (req, res) => {
  const rows = await liveLogsService.liveStaffLogs({ search: null, staffType: null });
  res.json(rows.map(rowToStaffLogOut));
});

const liveStaffLogs = asyncHandler(async (req, res) => {
  const search = typeof req.query.search === "string" && req.query.search.trim() ? req.query.search.trim() : null;
  const staffType =
    typeof req.query.staffType === "string" && req.query.staffType.trim() ? req.query.staffType.trim() : null;

  const rows = await liveLogsService.liveStaffLogs({ search, staffType });
  res.json(rows.map(rowToStaffLogOut));
});

const addStaffLiveLog = asyncHandler(async (req, res) => {
  const { staff_id, action, gate_id, machine_id } = req.body;
  await liveLogsService.addStaffLog({ staffId: staff_id, action, gateId: gate_id, machineId: machine_id });
  res.json({ message: "Staff log created" });
});

const liveMachineLogs = asyncHandler(async (req, res) => {
  const rows = await liveLogsService.liveMachineLogs();

  const out = rows.map(({ machine, gate }) => {
    const lastSynced = machine.lastSyncDatetime ? new Date(machine.lastSyncDatetime).toISOString() : null;
    const gateName = (gate && gate.gateName) || "Unknown";
    const statusText = `${machine.machineUid} (${machine.machineType})`;

    return {
      id: machine.id,
      machine: machine.machineName,
      gate: gateName,
      status: statusText,
      lastSynced,
      actions: ["Open", "Close"],
    };
  });

  res.json(out);
});

const openMachine = asyncHandler(async (req, res) => {
  const machine = await liveLogsService.machineOpen(Number(req.params.id), {
    performedBy: req.user && req.user.sub,
    remark: req.body.remark,
  });
  if (!machine) throw new HttpError(404, "Machine not found");
  res.json({ message: "Machine opened", machine_id: machine.id });
});

const closeMachine = asyncHandler(async (req, res) => {
  const machine = await liveLogsService.machineClose(Number(req.params.id), {
    performedBy: req.user && req.user.sub,
    remark: req.body.remark,
  });
  if (!machine) throw new HttpError(404, "Machine not found");
  res.json({ message: "Machine closed", machine_id: machine.id });
});

const permanentlyOpenAll = asyncHandler(async (req, res) => {
  const count = await liveLogsService.permanentlyOpenAll({
    performedBy: req.user && req.user.sub,
    remark: req.body.remark,
  });
  res.json({ message: "All machines permanently opened", updated: count });
});

const permanentlyCloseAll = asyncHandler(async (req, res) => {
  const count = await liveLogsService.permanentlyCloseAll({
    performedBy: req.user && req.user.sub,
    remark: req.body.remark,
  });
  res.json({ message: "All machines permanently closed", updated: count });
});

const liveCustomerTickets = asyncHandler(async (req, res) => {
  const search = typeof req.query.search === "string" && req.query.search.trim() ? req.query.search.trim() : null;
  const ticketType =
    typeof req.query.ticketType === "string" && req.query.ticketType.trim() ? req.query.ticketType.trim() : null;

  const rows = await liveLogsService.liveCustomerTickets({ search, ticketType });

  res.json(
    rows.map(({ ticket: t, movement }) => ({
      id: t.id,
      ticketFor: t.ticketGenFor,
      customerName: t.customerName,
      mobileNo: t.mobileNo,
      members: t.noOfMembers,
      entryDateTime: movement.entry ? formatDateTime(movement.entry.createdAt) : null,
      exitDateTime: movement.exit ? formatDateTime(movement.exit.createdAt) : null,
      entryGateName: movement.entry?.gate?.gateName || null,
      entryMachineName: movement.entry?.machine?.machineName || null,
      usedEntries: movement.entryCount,
      remainingEntries: Math.max((Number(t.noOfMembers) || 1) - movement.entryCount, 0),
      ticketGeneratedBy: t.shift?.shiftname || "—",
    }))
  );
});

const liveAlarmLogs = asyncHandler(async (req, res) => {
  const alarms = await liveLogsService.liveAlarms(100);
  res.json(
    alarms.map((a) => ({
      id: a.id,
      alarmMessage: a.alarmMessage,
      dateTime: a.createdAt ? formatDateTime(a.createdAt) : null,
    }))
  );
});

const addAlarm = asyncHandler(async (req, res) => {
  const obj = await liveLogsService.addAlarm(req.body.alarm_message);
  res.json({ id: obj.id, message: "Alarm created" });
});

module.exports = {
  liveStaffLogsAll,
  liveStaffLogs,
  addStaffLiveLog,
  liveMachineLogs,
  openMachine,
  closeMachine,
  permanentlyOpenAll,
  permanentlyCloseAll,
  liveCustomerTickets,
  liveAlarmLogs,
  addAlarm,
};
