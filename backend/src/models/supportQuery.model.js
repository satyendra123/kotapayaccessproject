module.exports = (sequelize, DataTypes) => {
  const SupportQuery = sequelize.define(
    "SupportQuery",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: DataTypes.INTEGER, allowNull: false, field: "user_id" },
      queryText: { type: DataTypes.TEXT, allowNull: false, field: "query_text" },
      replyText: { type: DataTypes.TEXT, allowNull: true, field: "reply_text" },
    },
    {
      tableName: "support_queries",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return SupportQuery;
};
