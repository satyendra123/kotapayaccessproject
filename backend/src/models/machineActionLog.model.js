module.exports = (sequelize, DataTypes) => {
  const MachineActionLog = sequelize.define(
    "MachineActionLog",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      machineId: { type: DataTypes.INTEGER, allowNull: false, field: "machine_id" },
      gateId: { type: DataTypes.INTEGER, allowNull: true, field: "gate_id" },
      action: { type: DataTypes.STRING(20), allowNull: false },
      status: { type: DataTypes.STRING(50), allowNull: true },
      remark: { type: DataTypes.STRING(255), allowNull: true },
      performedBy: { type: DataTypes.STRING(100), allowNull: true, field: "performed_by" },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "created_at" },
    },
    {
      tableName: "machine_action_logs",
      timestamps: false,
      indexes: [
        { name: "ix_machine_action_logs_machine_id", fields: ["machine_id"] },
        { name: "ix_machine_action_logs_created_at", fields: ["created_at"] },
      ],
    }
  );

  return MachineActionLog;
};
