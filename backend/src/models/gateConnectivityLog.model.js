module.exports = (sequelize, DataTypes) => {
  const GateConnectivityLog = sequelize.define(
    "GateConnectivityLog",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      gateId: { type: DataTypes.INTEGER, allowNull: true, field: "gate_id" },
      machineId: { type: DataTypes.INTEGER, allowNull: true, field: "machine_id" },
      gateName: { type: DataTypes.STRING(100), allowNull: false, field: "gate_name" },
      machineName: { type: DataTypes.STRING(100), allowNull: true, field: "machine_name" },
      status: { type: DataTypes.STRING(30), allowNull: false },
      remark: { type: DataTypes.STRING(255), allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "created_at" },
    },
    {
      tableName: "gate_connectivity_logs",
      timestamps: false,
      indexes: [
        { name: "ix_gate_connectivity_logs_created_at", fields: ["created_at"] },
        { name: "ix_gate_connectivity_logs_gate_name", fields: ["gate_name"] },
        { name: "ix_gate_connectivity_logs_status", fields: ["status"] },
      ],
    }
  );

  return GateConnectivityLog;
};
