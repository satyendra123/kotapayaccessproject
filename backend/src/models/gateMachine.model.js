module.exports = (sequelize, DataTypes) => {
  const GateMachine = sequelize.define(
    "GateMachine",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      gateId: { type: DataTypes.INTEGER, allowNull: false, field: "gate_id" },
      machineUid: { type: DataTypes.STRING(100), allowNull: false, field: "machine_uid" },
      machineName: { type: DataTypes.STRING(100), allowNull: false, field: "machine_name" },
      machineIp: { type: DataTypes.STRING(45), allowNull: false, defaultValue: "", field: "machine_ip" },
      machineType: { type: DataTypes.STRING(20), allowNull: false, field: "machine_type" },
      location: { type: DataTypes.STRING(100), allowNull: false },
      laneNo: { type: DataTypes.STRING(50), allowNull: false, field: "lane_no" },
      startTime: { type: DataTypes.TIME, allowNull: false, field: "start_time" },
      endTime: { type: DataTypes.TIME, allowNull: false, field: "end_time" },
      status: { type: DataTypes.STRING(20), allowNull: false },
      lastSyncDatetime: { type: DataTypes.DATE, allowNull: true, field: "last_sync_datetime" },
      createdBy: { type: DataTypes.STRING(100), allowNull: true, field: "created_by" },
      updatedBy: { type: DataTypes.STRING(100), allowNull: true, field: "updated_by" },
    },
    {
      tableName: "gate_machines",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return GateMachine;
};
