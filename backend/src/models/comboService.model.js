module.exports = (sequelize, DataTypes) => {
  const ComboService = sequelize.define(
    "ComboService",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      comboService: { type: DataTypes.STRING(100), allowNull: false, field: "combo_service" },
      shiftId: { type: DataTypes.INTEGER, allowNull: false, field: "shift_id" },
      price: { type: DataTypes.INTEGER, allowNull: false },
      discountedprice: { type: DataTypes.INTEGER, allowNull: true },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "Active" },
    },
    {
      tableName: "combo_services",
      timestamps: false,
      indexes: [{ fields: ["shift_id"] }],
    }
  );

  return ComboService;
};
