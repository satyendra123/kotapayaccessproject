const asyncHandler = require("../utils/asyncHandler");
const gateService = require("../services/gate.service");

function gateOut(gate) {
  return { id: gate.id, gate_no: gate.gateNo, gate_name: gate.gateName, status: gate.status };
}

function machineOut(machine) {
  return {
    id: machine.id,
    gate_id: machine.gateId,
    machine_uid: machine.machineUid,
    machine_name: machine.machineName,
    machine_ip: machine.machineIp,
    machine_type: machine.machineType,
    location: machine.location,
    lane_no: machine.laneNo,
    start_time: machine.startTime,
    end_time: machine.endTime,
    status: machine.status,
    created_at: machine.createdAt,
    updated_at: machine.updatedAt,
    last_sync_datetime: machine.lastSyncDatetime,
    created_by: machine.createdBy,
    updated_by: machine.updatedBy,
  };
}

const createGate = asyncHandler(async (req, res) => {
  const gate = await gateService.createGate(req.body);
  res.json(gateOut(gate));
});

const listGates = asyncHandler(async (req, res) => {
  res.json((await gateService.listGates()).map(gateOut));
});

const getGate = asyncHandler(async (req, res) => {
  res.json(gateOut(await gateService.getGate(Number(req.params.gateId))));
});

const updateGate = asyncHandler(async (req, res) => {
  res.json(gateOut(await gateService.updateGate(Number(req.params.gateId), req.body)));
});

const deleteGate = asyncHandler(async (req, res) => {
  const message = await gateService.deleteGate(Number(req.params.gateId));
  res.json({ message });
});

const createMachine = asyncHandler(async (req, res) => {
  res.json(machineOut(await gateService.createMachine(req.body)));
});

const listMachines = asyncHandler(async (req, res) => {
  res.json((await gateService.listMachines()).map(machineOut));
});

const getMachine = asyncHandler(async (req, res) => {
  res.json(machineOut(await gateService.getMachine(Number(req.params.machineId))));
});

const updateMachine = asyncHandler(async (req, res) => {
  res.json(machineOut(await gateService.updateMachine(Number(req.params.machineId), req.body)));
});

const deleteMachine = asyncHandler(async (req, res) => {
  const message = await gateService.deleteMachine(Number(req.params.machineId));
  res.json({ message });
});

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
