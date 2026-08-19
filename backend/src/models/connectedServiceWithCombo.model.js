module.exports = (sequelize, DataTypes) => {
  const ConnectedServiceWithCombo = sequelize.define(
    "ConnectedServiceWithCombo",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      comboid: { type: DataTypes.INTEGER, allowNull: true },
      connectedSerID: { type: DataTypes.INTEGER, allowNull: true },
      status: { type: DataTypes.STRING(20), allowNull: true, defaultValue: "Active" },
    },
    {
      tableName: "connectedservicewithcombo",
      timestamps: false,
    }
  );

  return ConnectedServiceWithCombo;
};
