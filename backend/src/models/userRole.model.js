module.exports = (sequelize, DataTypes) => {
  const UserRole = sequelize.define(
    "UserRole",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: DataTypes.INTEGER, allowNull: false, field: "user_id" },
      roleId: { type: DataTypes.INTEGER, allowNull: false, field: "role_id" },
    },
    {
      tableName: "user_roles",
      timestamps: false,
      indexes: [{ fields: ["user_id"] }, { fields: ["role_id"] }],
    }
  );

  return UserRole;
};
