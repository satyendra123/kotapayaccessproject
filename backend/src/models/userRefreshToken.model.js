module.exports = (sequelize, DataTypes) => {
  const UserRefreshToken = sequelize.define(
    "UserRefreshToken",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: DataTypes.INTEGER, allowNull: false, field: "user_id" },
      tokenHash: { type: DataTypes.STRING(64), allowNull: false, unique: true, field: "token_hash" },
      jti: { type: DataTypes.STRING(36), allowNull: false, unique: true },
      revoked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      revokedAt: { type: DataTypes.DATE, allowNull: true, field: "revoked_at" },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "created_at" },
      createdBy: { type: DataTypes.STRING(50), allowNull: true, field: "created_by" },
    },
    {
      tableName: "user_refresh_tokens",
      timestamps: false,
      indexes: [{ name: "ix_refresh_user_revoked", fields: ["user_id", "revoked"] }],
    }
  );

  return UserRefreshToken;
};
