module.exports = (sequelize, DataTypes) => {
  const RegisteredUser = sequelize.define(
    "RegisteredUser",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      gender: { type: DataTypes.STRING(20), allowNull: false },
      userType: { type: DataTypes.STRING(50), allowNull: false, field: "user_type" },
      dateOfBirth: { type: DataTypes.DATEONLY, allowNull: false, field: "date_of_birth" },
      phoneNumber: { type: DataTypes.STRING(20), allowNull: false, unique: "uq_users_phone", field: "phone_number" },
      email: { type: DataTypes.STRING(120), allowNull: false, unique: "uq_users_email" },
      aadhaarNumber: { type: DataTypes.STRING(20), allowNull: false, unique: "uq_users_aadhaar", field: "aadhaar_number" },
      username: { type: DataTypes.STRING(80), allowNull: false, unique: "uq_users_username" },
      passwordHash: { type: DataTypes.STRING(255), allowNull: false, field: "password_hash" },
      accessQualificationId: { type: DataTypes.INTEGER, allowNull: true, field: "access_qualification_id" },
      lastLoginDatetime: { type: DataTypes.DATE, allowNull: true, field: "last_login_datetime" },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "Active" },
      createdAt: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW, field: "created_at" },
    },
    {
      tableName: "registered_users",
      timestamps: false,
    }
  );

  return RegisteredUser;
};
