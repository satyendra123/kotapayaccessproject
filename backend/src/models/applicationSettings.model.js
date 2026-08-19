module.exports = (sequelize, DataTypes) => {
  const ApplicationSettings = sequelize.define(
    "ApplicationSettings",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      companyName: { type: DataTypes.STRING(255), allowNull: true, field: "company_name" },
      companyPhone: { type: DataTypes.STRING(50), allowNull: true, field: "company_phone" },
      companyEmail: { type: DataTypes.STRING(255), allowNull: true, field: "company_email" },
      startupYear: { type: DataTypes.INTEGER, allowNull: true, field: "startup_year" },
      companyAddress: { type: DataTypes.TEXT, allowNull: true, field: "company_address" },
      logoUrl: { type: DataTypes.TEXT, allowNull: true, field: "logo_url" },
      printBrandName: { type: DataTypes.STRING(255), allowNull: true, field: "print_brand_name" },
      poweredBy: { type: DataTypes.STRING(255), allowNull: true, field: "powered_by" },
      ticketPenaltyCharges: { type: DataTypes.DECIMAL(12, 2), allowNull: true, field: "ticket_penalty_charges" },
      studentDiscountPercentage: { type: DataTypes.DECIMAL(5, 2), allowNull: true, field: "student_discount_percentage" },
      memberDiscountRules: { type: DataTypes.JSON, allowNull: true, field: "member_discount_rules" },
      termsAndConditions: { type: DataTypes.TEXT, allowNull: true, field: "terms_and_conditions" },
    },
    {
      tableName: "application_settings",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return ApplicationSettings;
};
