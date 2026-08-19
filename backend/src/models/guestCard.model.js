module.exports = (sequelize, DataTypes) => {
  const GuestCard = sequelize.define(
    "GuestCard",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      guestid: { type: DataTypes.INTEGER, allowNull: false },
      cardnumber: { type: DataTypes.STRING(100), allowNull: false },
    },
    {
      tableName: "guestcards",
      timestamps: false,
    }
  );

  return GuestCard;
};
