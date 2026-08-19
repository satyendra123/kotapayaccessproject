module.exports = (sequelize, DataTypes) => {
  const UserActionLog = sequelize.define(
    "UserActionLog",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: DataTypes.INTEGER, allowNull: true, field: "user_id" },
      username: { type: DataTypes.STRING(100), allowNull: false },
      userType: { type: DataTypes.STRING(50), allowNull: false, field: "user_type" },
      action: { type: DataTypes.STRING(200), allowNull: false },
      meta: { type: DataTypes.JSON, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "created_at" },
    },
    {
      tableName: "user_action_logs",
      timestamps: false,
      indexes: [
        { name: "ix_user_action_logs_created_at", fields: ["created_at"] },
        { name: "ix_user_action_logs_username", fields: ["username"] },
        { name: "ix_user_action_logs_user_type", fields: ["user_type"] },
      ],
    }
  );

  return UserActionLog;
};
