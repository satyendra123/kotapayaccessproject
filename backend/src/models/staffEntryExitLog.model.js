module.exports = (sequelize, DataTypes) => {
  const StaffEntryExitLog = sequelize.define(
    "StaffEntryExitLog",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      staffId: { type: DataTypes.INTEGER, allowNull: true, field: "staff_id" },
      staffName: { type: DataTypes.STRING(255), allowNull: false, field: "staff_name" },
      action: { type: DataTypes.STRING(20), allowNull: false },
      gateId: { type: DataTypes.INTEGER, allowNull: true, field: "gate_id" },
      machineId: { type: DataTypes.INTEGER, allowNull: true, field: "machine_id" },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "created_at" },
    },
    {
      tableName: "staff_entry_exit_logs",
      timestamps: false,
      indexes: [
        { name: "ix_staff_entry_exit_logs_created_at", fields: ["created_at"] },
        { name: "ix_staff_entry_exit_logs_staff_name", fields: ["staff_name"] },
        { name: "ix_staff_entry_exit_logs_action", fields: ["action"] },
      ],
    }
  );

  return StaffEntryExitLog;
};
