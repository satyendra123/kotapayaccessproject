module.exports = (sequelize, DataTypes) => sequelize.define("PasswordResetToken", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING(120), allowNull: false },
  tokenHash: { type: DataTypes.STRING(64), allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false, field: "expires_at" },
  usedAt: { type: DataTypes.DATE, allowNull: true, field: "used_at" },
}, { tableName: "password_reset_tokens", timestamps: true, createdAt: "created_at", updatedAt: false });
