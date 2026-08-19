module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      hashedPassword: { type: DataTypes.STRING(100), allowNull: false, field: "hashed_password" },
      createdBy: { type: DataTypes.STRING(50), allowNull: true, field: "created_by" },
      updatedBy: { type: DataTypes.STRING(50), allowNull: true, field: "updated_by" },
    },
    {
      tableName: "users",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return User;
};
