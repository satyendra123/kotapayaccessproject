module.exports = (sequelize, DataTypes) => {
  const AlarmLog = sequelize.define(
    "AlarmLog",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      alarmMessage: { type: DataTypes.STRING(255), allowNull: false, field: "alarmMessage" },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "created_at" },
    },
    {
      tableName: "alarm_logs",
      timestamps: false,
    }
  );

  return AlarmLog;
};
