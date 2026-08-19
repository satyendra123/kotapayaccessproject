module.exports = (sequelize, DataTypes) => {
  const BlacklistEntry = sequelize.define(
    "BlacklistEntry",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      entryType: { type: DataTypes.STRING(20), allowNull: false, field: "entry_type" },
      value: { type: DataTypes.STRING(120), allowNull: false },
      reason: { type: DataTypes.STRING(255), allowNull: true },
      createdBy: { type: DataTypes.STRING(100), allowNull: true, field: "created_by" },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "created_at" },
    },
    {
      tableName: "blacklist_entries",
      timestamps: false,
      indexes: [
        { name: "ix_blacklist_entries_created_at", fields: ["created_at"] },
        { name: "ix_blacklist_entries_type", fields: ["entry_type"] },
        { name: "ix_blacklist_entries_value", fields: ["value"] },
      ],
    }
  );

  return BlacklistEntry;
};
