module.exports = (sequelize, DataTypes) => {
  const Staff = sequelize.define(
    "Staff",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      staffCategoryId: { type: DataTypes.INTEGER, allowNull: false, field: "staff_category_id" },
      name: { type: DataTypes.STRING(255), allowNull: false },
      gender: { type: DataTypes.STRING(20), allowNull: false },
      staffType: { type: DataTypes.STRING(50), allowNull: false, field: "staff_type" },
      dob: { type: DataTypes.STRING(10), allowNull: false },
      doj: { type: DataTypes.STRING(10), allowNull: false },
      phoneNumber: { type: DataTypes.STRING(20), allowNull: false, field: "phone_number" },
      email: { type: DataTypes.STRING(255), allowNull: false },
      status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: "Active" },
      accessCardNumber: { type: DataTypes.STRING(50), allowNull: true, field: "access_card_number" },
      aadhaarCard: { type: DataTypes.STRING(50), allowNull: true, field: "aadhaar_card" },
      createdAt: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW, field: "created_at" },
    },
    {
      tableName: "staffs",
      timestamps: false,
    }
  );

  return Staff;
};
