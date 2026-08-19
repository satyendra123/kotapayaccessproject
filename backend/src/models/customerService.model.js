module.exports = (sequelize, DataTypes) => {
  const CustomerService = sequelize.define(
    "CustomerService",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      customerId: { type: DataTypes.INTEGER, allowNull: false, field: "customer_id" },
      serviceId: { type: DataTypes.INTEGER, allowNull: false, field: "service_id" },
      price: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0.0 },
      dateTime: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "date_time" },
    },
    {
      tableName: "customer_service",
      timestamps: false,
      indexes: [
        { name: "ix_customer_service_customer_id", fields: ["customer_id"] },
        { name: "ix_customer_service_service_id", fields: ["service_id"] },
      ],
    }
  );

  return CustomerService;
};
