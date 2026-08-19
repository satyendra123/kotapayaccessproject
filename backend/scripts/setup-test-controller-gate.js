require("dotenv").config();

const { Gate, GateMachine, sequelize } = require("../src/models");
const env = require("../src/config/env");

const machineUid = env.PI_MACHINE_UID || `PI-${env.PI_HOST}-ENTRY`;

async function setup() {
  await sequelize.authenticate();
  await sequelize.sync();

  const transaction = await sequelize.transaction();
  try {
    let machine = await GateMachine.findOne({ where: { machineUid }, transaction });
    let gate;

    if (machine) {
      gate = await Gate.findByPk(machine.gateId, { transaction });
    } else {
      gate = await Gate.create(
        { gateNo: "TEST-ENTRY-01", gateName: "Test Entry Gate", status: "Active" },
        { transaction }
      );
      machine = await GateMachine.create(
        {
          gateId: gate.id,
          machineUid,
          machineName: "Controller QR Scanner & Relay",
          machineIp: env.PI_HOST,
          machineType: "QR Scanner",
          location: "Test Entry",
          laneNo: "1",
          startTime: "00:00:00",
          endTime: "23:59:59",
          status: "Active",
          createdBy: "setup-script",
        },
        { transaction }
      );
    }

    await transaction.commit();
    console.log(`Controller test mapping ready: gate_id=${gate.id}, machine_uid=${machine.machineUid}, controller=${env.PI_HOST}:${env.PI_PORT}`);
  } catch (error) {
    await transaction.rollback();
    throw error;
  } finally {
    await sequelize.close();
  }
}

setup().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
