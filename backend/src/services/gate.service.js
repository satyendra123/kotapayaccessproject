const { sequelize, Gate, GateMachine } = require("../models");
const { HttpError } = require("../middleware/error.middleware");

async function createGate(data) {
  const existing = await Gate.findOne({ where: { gateNo: data.gate_no } });
  if (existing) {
    throw new HttpError(400, "Gate number already exists");
  }
  return Gate.create({ gateNo: data.gate_no, gateName: data.gate_name, status: data.status });
}

async function listGates() {
  return Gate.findAll();
}

async function getGate(gateId) {
  const gate = await Gate.findByPk(gateId);
  if (!gate) {
    throw new HttpError(404, "Gate not found");
  }
  return gate;
}

async function updateGate(gateId, data) {
  const gate = await getGate(gateId);
  gate.gateNo = data.gate_no;
  gate.gateName = data.gate_name;
  gate.status = data.status;
  await gate.save();
  return gate;
}

async function deleteGate(gateId) {
  const gate = await getGate(gateId);
  const name = gate.gateName;

  await sequelize.transaction(async (transaction) => {
    const machines = await GateMachine.findAll({
      where: { gateId },
      attributes: ["id"],
      transaction,
    });
    const machineIds = machines.map((machine) => machine.id);
    const replacements = { gateId, machineIds };
    const machineClause = machineIds.length ? " OR machine_id IN (:machineIds)" : "";

    // Clear all logs that have foreign keys to this gate or its machines.
    await sequelize.query(`DELETE FROM gate_connectivity_logs WHERE gate_id = :gateId${machineClause}`, { replacements, transaction });
    await sequelize.query(`DELETE FROM machine_action_logs WHERE gate_id = :gateId${machineClause}`, { replacements, transaction });
    await sequelize.query(`DELETE FROM staff_entry_exit_logs WHERE gate_id = :gateId${machineClause}`, { replacements, transaction });
    await sequelize.query(`DELETE FROM ticket_movement_logs WHERE gate_id = :gateId${machineClause}`, { replacements, transaction });
    if (machineIds.length) {
      await sequelize.query("DELETE FROM entry_exit_logs WHERE machine_id IN (:machineIds)", { replacements, transaction });
      await sequelize.query(
        "DELETE FROM staff_access_logs WHERE entry_gate_id = :gateId OR exit_gate_id = :gateId OR entry_machine_id IN (:machineIds) OR exit_machine_id IN (:machineIds)",
        { replacements, transaction }
      );
      await GateMachine.destroy({ where: { id: machineIds }, transaction });
    } else {
      await sequelize.query("DELETE FROM staff_access_logs WHERE entry_gate_id = :gateId OR exit_gate_id = :gateId", { replacements, transaction });
    }
    await gate.destroy({ transaction });
  });
  return `Gate '${name}' and its linked machines/logs deleted successfully!`;
}

async function createMachine(data) {
  const gate = await Gate.findByPk(data.gate_id);
  if (!gate) {
    throw new HttpError(404, `Gate with id ${data.gate_id} not found`);
  }
  const machine = await GateMachine.create({
    gateId: data.gate_id,
    machineUid: data.machine_uid,
    machineName: data.machine_name,
    machineIp: data.machine_ip,
    machineType: data.machine_type,
    location: data.location,
    laneNo: data.lane_no,
    startTime: data.start_time,
    endTime: data.end_time,
    status: data.status,
  });
  await machine.reload();
  return machine;
}

async function listMachines() {
  return GateMachine.findAll();
}

async function getMachine(machineId) {
  const machine = await GateMachine.findByPk(machineId);
  if (!machine) {
    throw new HttpError(404, "Machine not found");
  }
  return machine;
}

async function updateMachine(machineId, data) {
  const machine = await getMachine(machineId);
  const gate = await Gate.findByPk(data.gate_id);
  if (!gate) {
    throw new HttpError(404, `Gate with id ${data.gate_id} not found`);
  }
  machine.gateId = data.gate_id;
  machine.machineUid = data.machine_uid;
  machine.machineName = data.machine_name;
  machine.machineIp = data.machine_ip;
  machine.machineType = data.machine_type;
  machine.location = data.location;
  machine.laneNo = data.lane_no;
  machine.startTime = data.start_time;
  machine.endTime = data.end_time;
  machine.status = data.status;
  await machine.save();
  return machine;
}

async function deleteMachine(machineId) {
  const machine = await getMachine(machineId);
  const name = machine.machineName || machine.id;
  await sequelize.transaction(async (transaction) => {
    const replacements = { machineId };
    await sequelize.query("DELETE FROM entry_exit_logs WHERE machine_id = :machineId", { replacements, transaction });
    await sequelize.query("DELETE FROM gate_connectivity_logs WHERE machine_id = :machineId", { replacements, transaction });
    await sequelize.query("DELETE FROM machine_action_logs WHERE machine_id = :machineId", { replacements, transaction });
    await sequelize.query("DELETE FROM staff_entry_exit_logs WHERE machine_id = :machineId", { replacements, transaction });
    await sequelize.query("DELETE FROM ticket_movement_logs WHERE machine_id = :machineId", { replacements, transaction });
    await sequelize.query(
      "DELETE FROM staff_access_logs WHERE entry_machine_id = :machineId OR exit_machine_id = :machineId",
      { replacements, transaction }
    );
    await machine.destroy({ transaction });
  });
  return `Machine '${name}' and its linked logs deleted successfully!`;
}

module.exports = {
  createGate,
  listGates,
  getGate,
  updateGate,
  deleteGate,
  createMachine,
  listMachines,
  getMachine,
  updateMachine,
  deleteMachine,
};
