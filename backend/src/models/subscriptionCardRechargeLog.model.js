module.exports = (sequelize, DataTypes) => {
  const SubscriptionCardRechargeLog = sequelize.define(
    "SubscriptionCardRechargeLog",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      subscriptioncardsid: { type: DataTypes.INTEGER, allowNull: false },
      oldbalance: { type: DataTypes.FLOAT, allowNull: false },
      recharge: { type: DataTypes.FLOAT, allowNull: false },
      newbalance: { type: DataTypes.FLOAT, allowNull: false },
      startdate: { type: DataTypes.STRING(20), allowNull: false },
      enddate: { type: DataTypes.STRING(20), allowNull: false },
      rechargeUsertypeby: { type: DataTypes.STRING(50), allowNull: false, field: "recharge_usertypeby" },
      rechargedby: { type: DataTypes.STRING(50), allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW, field: "created_at" },
    },
    {
      tableName: "subscriptioncards_rech_logs",
      timestamps: false,
    }
  );

  return SubscriptionCardRechargeLog;
};
