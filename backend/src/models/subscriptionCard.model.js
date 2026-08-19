module.exports = (sequelize, DataTypes) => {
  const SubscriptionCard = sequelize.define(
    "SubscriptionCard",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      cardnumber: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(100), allowNull: false },
      phonenum: { type: DataTypes.STRING(20), allowNull: false },
      email: { type: DataTypes.STRING(100), allowNull: true },
      startdate: { type: DataTypes.STRING(20), allowNull: false },
      enddate: { type: DataTypes.STRING(20), allowNull: false },
      recharge: { type: DataTypes.FLOAT, allowNull: false },
      currentbalance: { type: DataTypes.FLOAT, allowNull: false },
      lastrechargedatetime: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
      rechargeUsertypeby: { type: DataTypes.STRING(50), allowNull: false, field: "recharge_usertypeby" },
      rechargedby: { type: DataTypes.STRING(50), allowNull: false },
      status: { type: DataTypes.STRING(20), allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW, field: "created_at" },
    },
    {
      tableName: "subscriptioncards",
      timestamps: false,
    }
  );

  return SubscriptionCard;
};
