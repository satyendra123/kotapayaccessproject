const { Op } = require("sequelize");
const { sequelize, Staff, GateMachine, Gate, CustomerTicket, AlarmLog, MachineActionLog, StaffEntryExitLog, TicketMovementLog, Shift } = require("../models");
const { HttpError } = require("../middleware/error.middleware");

async function liveStaffLogs({ search = null, staffType = null } = {}) {
  const conditions = [];
  const replacements = {};

  if (staffType && staffType.trim()) {
    conditions.push("LOWER(s.staff_type) = :staffType");
    replacements.staffType = staffType.trim().toLowerCase();
  }

  if (search && search.trim()) {
    conditions.push(
      "(LOWER(s.name) LIKE :search OR LOWER(s.phone_number) LIKE :search OR LOWER(COALESCE(s.access_card_number, '')) LIKE :search)"
    );
    replacements.search = `%${search.trim().toLowerCase()}%`;
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT
      s.id AS staff_id,
      s.staff_type AS staff_type,
      s.name AS staff_name,
      s.phone_number AS phone_number,
      s.access_card_number AS access_card_number,
      el.created_at AS entry_created_at,
      eg.gate_name AS entry_gate_name,
      em.machine_name AS entry_machine_name,
      xl.created_at AS exit_created_at,
      xg.gate_name AS exit_gate_name,
      xm.machine_name AS exit_machine_name
    FROM staffs s
    LEFT JOIN staff_entry_exit_logs el ON el.id = (
      SELECT id FROM staff_entry_exit_logs
      WHERE staff_id = s.id AND UPPER(action) = 'ENTRY'
      ORDER BY created_at DESC LIMIT 1
    )
    LEFT JOIN gates eg ON eg.id = el.gate_id
    LEFT JOIN gate_machines em ON em.id = el.machine_id
    LEFT JOIN staff_entry_exit_logs xl ON xl.id = (
      SELECT id FROM staff_entry_exit_logs
      WHERE staff_id = s.id AND UPPER(action) = 'EXIT'
      ORDER BY created_at DESC LIMIT 1
    )
    LEFT JOIN gates xg ON xg.id = xl.gate_id
    LEFT JOIN gate_machines xm ON xm.id = xl.machine_id
    ${whereSql}
    ORDER BY s.id DESC
  `;

  const [rows] = await sequelize.query(sql, { replacements });
  return rows;
}

async function liveMachineLogs() {
  const machines = await GateMachine.findAll({
    include: [{ model: Gate, as: "gate" }],
    order: [["id", "DESC"]],
  });
  return machines.map((machine) => ({ machine, gate: machine.gate }));
}

async function machineOpen(machineId, { performedBy, remark }) {
  const machine = await GateMachine.findByPk(machineId);
  if (!machine) return null;

  await MachineActionLog.create({
    machineId: machine.id,
    gateId: machine.gateId,
    action: "OPEN",
    status: "OPEN",
    remark,
    performedBy,
  });

  machine.status = "Open";
  await machine.save();
  return machine;
}

async function machineClose(machineId, { performedBy, remark }) {
  const machine = await GateMachine.findByPk(machineId);
  if (!machine) return null;

  await MachineActionLog.create({
    machineId: machine.id,
    gateId: machine.gateId,
    action: "CLOSE",
    status: "CLOSE",
    remark,
    performedBy,
  });

  machine.status = "Close";
  await machine.save();
  return machine;
}

async function permanentlyOpenAll({ performedBy, remark }) {
  const machines = await GateMachine.findAll();
  for (const m of machines) {
    m.status = "Open";
    await m.save();
    await MachineActionLog.create({
      machineId: m.id,
      gateId: m.gateId,
      action: "PERMANENT_OPEN",
      status: "OPEN",
      remark,
      performedBy,
    });
  }
  return machines.length;
}

async function permanentlyCloseAll({ performedBy, remark }) {
  const machines = await GateMachine.findAll();
  for (const m of machines) {
    m.status = "Close";
    await m.save();
    await MachineActionLog.create({
      machineId: m.id,
      gateId: m.gateId,
      action: "PERMANENT_CLOSE",
      status: "CLOSE",
      remark,
      performedBy,
    });
  }
  return machines.length;
}

async function liveCustomerTickets({ search = null, ticketType = null } = {}) {
  const where = {};
  const andConditions = [];

  if (ticketType && ticketType.trim()) {
    andConditions.push(sequelize.where(sequelize.fn("LOWER", sequelize.col("ticket_gen_for")), ticketType.trim().toLowerCase()));
  }

  if (search && search.trim()) {
    const s = `%${search.trim().toLowerCase()}%`;
    andConditions.push({
      [Op.or]: [
        sequelize.where(sequelize.fn("LOWER", sequelize.col("customer_name")), { [Op.like]: s }),
        sequelize.where(sequelize.fn("LOWER", sequelize.col("mobile_no")), { [Op.like]: s }),
        sequelize.where(sequelize.fn("LOWER", sequelize.col("ticket_number")), { [Op.like]: s }),
        sequelize.where(sequelize.fn("LOWER", sequelize.fn("COALESCE", sequelize.col("aadhar_no"), "")), { [Op.like]: s }),
      ],
    });
  }

  if (andConditions.length) {
    where[Op.and] = andConditions;
  }

  const tickets = await CustomerTicket.findAll({
    where,
    include: [{ model: Shift, as: "shift" }],
    order: [["id", "DESC"]],
  });

  const ticketIds = tickets.map((ticket) => ticket.id);
  const logs = ticketIds.length
    ? await TicketMovementLog.findAll({
        where: { ticketId: ticketIds },
        include: [{ model: Gate, as: "gate" }, { model: GateMachine, as: "machine" }],
        order: [["createdAt", "DESC"]],
      })
    : [];

  const movementByTicket = new Map();
  for (const log of logs) {
    const existing = movementByTicket.get(log.ticketId) || { entry: null, exit: null, entryCount: 0 };
    if (log.area === "PARK" && log.action === "ENTRY") {
      existing.entryCount += 1;
      if (!existing.entry) existing.entry = log;
    }
    if (log.action === "EXIT" && !existing.exit) existing.exit = log;
    movementByTicket.set(log.ticketId, existing);
  }

  return tickets.map((ticket) => ({ ticket, movement: movementByTicket.get(ticket.id) || { entry: null, exit: null, entryCount: 0 } }));
}

async function liveAlarms(limit = 100) {
  return AlarmLog.findAll({ order: [["createdAt", "DESC"]], limit });
}

async function addStaffLog({ staffId, action, gateId = null, machineId = null }) {
  const staff = await Staff.findByPk(staffId);
  if (!staff) {
    throw new HttpError(404, "Staff not found");
  }

  await StaffEntryExitLog.create({
    staffId,
    staffName: staff.name,
    action: action.trim().toUpperCase(),
    gateId,
    machineId,
  });
}

async function addAlarm(alarmMessage) {
  return AlarmLog.create({ alarmMessage });
}

module.exports = {
  liveStaffLogs,
  liveMachineLogs,
  machineOpen,
  machineClose,
  permanentlyOpenAll,
  permanentlyCloseAll,
  liveCustomerTickets,
  liveAlarms,
  addStaffLog,
  addAlarm,
};
