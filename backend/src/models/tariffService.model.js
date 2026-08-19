module.exports = (sequelize, DataTypes) => {
  const TariffService = sequelize.define(
    "TariffService",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      servicename: { type: DataTypes.STRING(100), allowNull: false },
      price: { type: DataTypes.FLOAT, allowNull: false },
      discountedprice: { type: DataTypes.FLOAT, allowNull: true },
      servicefor: { type: DataTypes.STRING(100), allowNull: false },
      status: { type: DataTypes.STRING(50), allowNull: true, defaultValue: "Active" },
      shiftId: { type: DataTypes.INTEGER, allowNull: false, field: "shift_id" },
    },
    {
      tableName: "tariffsnservice",
      timestamps: false,
    }
  );

  return TariffService;
};
