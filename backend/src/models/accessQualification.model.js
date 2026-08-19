module.exports = (sequelize, DataTypes) => {
  const AccessQualification = sequelize.define(
    "AccessQualification",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      accessQualificationName: { type: DataTypes.STRING(120), allowNull: false, field: "access_qualification_name" },
      qualificationFor: { type: DataTypes.STRING(50), allowNull: false, field: "qualification_for" },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "Active" },
      createdAt: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW, field: "created_at" },
    },
    {
      tableName: "access_qualifications",
      timestamps: false,
      indexes: [
        {
          unique: true,
          name: "uq_qualification_name_for",
          fields: ["access_qualification_name", "qualification_for"],
        },
      ],
    }
  );

  return AccessQualification;
};
