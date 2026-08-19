module.exports = (sequelize, DataTypes) => {
  const Combo = sequelize.define(
    "Combo",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      comboname: { type: DataTypes.STRING(100), allowNull: false },
      actualPrice: { type: DataTypes.FLOAT, allowNull: true, field: "actual_price" },
      discountPrice: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0.0, field: "discount_price" },
      createdby: { type: DataTypes.INTEGER, allowNull: true },
      status: { type: DataTypes.STRING(20), allowNull: true, defaultValue: "Active" },
      createdat: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedat: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "combo",
      timestamps: false,
      indexes: [{ name: "ix_combo_status", fields: ["status"] }],
    }
  );

  return Combo;
};
