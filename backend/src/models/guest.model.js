module.exports = (sequelize, DataTypes) => {
  const Guest = sequelize.define(
    "Guest",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(100), allowNull: false },
      gender: { type: DataTypes.STRING(10), allowNull: false },
      withmembers: { type: DataTypes.INTEGER, allowNull: false },
      phonenumber: { type: DataTypes.STRING(20), allowNull: false },
      emailid: { type: DataTypes.STRING(100), allowNull: true },
      status: { type: DataTypes.STRING(20), allowNull: false },
      accesscardtype: { type: DataTypes.STRING(20), allowNull: false },
      aadharcard: { type: DataTypes.STRING(20), allowNull: false },
      timezoneStart: { type: DataTypes.DATE, allowNull: false, field: "timezone_start" },
      timezoneEnd: { type: DataTypes.DATE, allowNull: false, field: "timezone_end" },
      accessgate: { type: DataTypes.INTEGER, allowNull: false },
      cardsconnected: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    },
    {
      tableName: "guestsmanagement",
      timestamps: true,
      createdAt: "createdat",
      updatedAt: "updatedat",
    }
  );

  return Guest;
};
