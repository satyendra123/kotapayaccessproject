module.exports = (sequelize, DataTypes) => {
  const Permission = sequelize.define(
    "Permission",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    },
    {
      tableName: "permissions",
      timestamps: false,
    }
  );

  return Permission;
};
