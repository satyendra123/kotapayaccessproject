module.exports = (sequelize, DataTypes) => {
  const Shift = sequelize.define(
    "Shift",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      shiftname: { type: DataTypes.STRING(100), allowNull: false },
      shiftstarttime: { type: DataTypes.STRING(50), allowNull: false },
      shiftendtime: { type: DataTypes.STRING(50), allowNull: false },
      status: { type: DataTypes.STRING(20), allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "created_at" },
    },
    {
      tableName: "shifts",
      timestamps: false,
    }
  );

  return Shift;
};
