module.exports = (sequelize, DataTypes) => {
  const EligibleTicket = sequelize.define(
    "EligibleTicket",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      ticketId: { type: DataTypes.INTEGER, allowNull: false, unique: true, field: "ticket_id" },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "created_at" },
      markedBy: { type: DataTypes.STRING(100), allowNull: true, field: "marked_by" },
      remark: { type: DataTypes.STRING(255), allowNull: true },
    },
    {
      tableName: "eligible_ticket",
      timestamps: false,
      indexes: [
        { name: "ix_eligible_ticket_ticket_id", fields: ["ticket_id"] },
        { name: "ix_eligible_ticket_created_at", fields: ["created_at"] },
      ],
    }
  );
  return EligibleTicket;
};
