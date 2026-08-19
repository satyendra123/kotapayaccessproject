module.exports = (sequelize, DataTypes) => {
  const QualificationRightsPermission = sequelize.define(
    "QualificationRightsPermission",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      accessQualificationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        field: "access_qualification_id",
      },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "Active" },
      permissions: { type: DataTypes.JSON, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW, field: "created_at" },
      updatedAt: { type: DataTypes.DATE, allowNull: true, field: "updated_at" },
    },
    {
      tableName: "qualification_rights_permissions",
      timestamps: false,
    }
  );

  return QualificationRightsPermission;
};
