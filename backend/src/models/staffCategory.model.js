module.exports = (sequelize, DataTypes) => {
  const StaffCategory = sequelize.define(
    "StaffCategory",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      catgname: { type: DataTypes.STRING(255), allowNull: false },
      status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: "Active" },
      createdAt: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW, field: "created_at" },
    },
    {
      tableName: "staffcategories",
      timestamps: false,
    }
  );

  return StaffCategory;
};
