module.exports = (sequelize, DataTypes) => {
  const TicketMovementLog = sequelize.define(
    "TicketMovementLog",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      ticketId: { type: DataTypes.INTEGER, allowNull: true, field: "ticket_id" },
      ticketNumber: { type: DataTypes.STRING(150), allowNull: true, field: "ticket_number" },
      gateId: { type: DataTypes.INTEGER, allowNull: true, field: "gate_id" },
      machineId: { type: DataTypes.INTEGER, allowNull: true, field: "machine_id" },
      area: { type: DataTypes.STRING(20), allowNull: false },
      action: { type: DataTypes.STRING(20), allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "created_at" },
    },
    {
      tableName: "ticket_movement_logs",
      timestamps: false,
      indexes: [
        { name: "ix_ticket_movement_logs_ticket_number_created_at", fields: ["ticket_number", "created_at"] },
        { name: "ix_ticket_movement_logs_area_action", fields: ["area", "action"] },
        { name: "ix_ticket_movement_logs_gate_id", fields: ["gate_id"] },
        { name: "ix_ticket_movement_logs_ticket_area_action", fields: ["ticket_number", "area", "action"] },
      ],
    }
  );

  return TicketMovementLog;
};
