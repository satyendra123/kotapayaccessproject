module.exports = (sequelize, DataTypes) => {
  const Reason = sequelize.define(
    "Reason",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      reason: { type: DataTypes.STRING(255), allowNull: false },
      status: { type: DataTypes.STRING(20), allowNull: false },
    },
    {
      tableName: "reasonmang",
      timestamps: false,
      indexes: [{ name: "ix_reason_status", fields: ["status"] }],
    }
  );

  return Reason;
};
