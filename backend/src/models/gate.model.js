module.exports = (sequelize, DataTypes) => {
  const Gate = sequelize.define(
    "Gate",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      gateNo: { type: DataTypes.STRING(50), allowNull: false, field: "gate_no" },
      gateName: { type: DataTypes.STRING(100), allowNull: false, field: "gate_name" },
      status: { type: DataTypes.STRING(20), allowNull: false },
    },
    {
      tableName: "gates",
      timestamps: false,
    }
  );

  return Gate;
};
