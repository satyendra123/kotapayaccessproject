module.exports = (sequelize, DataTypes) => {
  const CustomerCombo = sequelize.define(
    "CustomerCombo",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      customerId: { type: DataTypes.INTEGER, allowNull: false, field: "customer_id" },
      comboId: { type: DataTypes.INTEGER, allowNull: false, field: "combo_id" },
      price: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0.0 },
      comboWithExtra: { type: DataTypes.STRING(10), allowNull: true, defaultValue: "with", field: "combo_with_extra" },
      dateTime: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "date_time" },
    },
    {
      tableName: "customer_combo",
      timestamps: false,
      indexes: [
        { name: "ix_customer_combo_customer_id", fields: ["customer_id"] },
        { name: "ix_customer_combo_combo_id", fields: ["combo_id"] },
      ],
    }
  );

  return CustomerCombo;
};
