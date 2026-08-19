const asyncHandler = require("../utils/asyncHandler");
const applicationSettingsService = require("../services/applicationSettings.service");
const { HttpError } = require("../middleware/error.middleware");

const getApplicationSettings = asyncHandler(async (req, res) => {
  const settings = await applicationSettingsService.getSettings();
  res.json({
    status: "success",
    data: {
      company_name: settings.companyName,
      company_phone: settings.companyPhone,
      company_email: settings.companyEmail,
      startup_year: settings.startupYear,
      company_address: settings.companyAddress,
      logo_url: settings.logoUrl,
      print_brand_name: settings.printBrandName,
      powered_by: settings.poweredBy,
      ticket_penalty_charges: settings.ticketPenaltyCharges,
      student_discount_percentage: settings.studentDiscountPercentage,
      member_discount_rules: settings.memberDiscountRules || [
        { min_members: 51, discount_percentage: 25 },
        { min_members: 101, discount_percentage: 50 },
      ],
      terms_and_conditions: settings.termsAndConditions,
    },
  });
});

const updateApplicationSettings = asyncHandler(async (req, res) => {
  await applicationSettingsService.updateSettings(req.body);
  res.json({ status: "success", message: "Settings updated successfully" });
});

const getMemberDiscountRules = asyncHandler(async (req, res) => {
  const settings = await applicationSettingsService.getSettings();
  res.json({ data: settings.memberDiscountRules || [
    { min_members: 51, discount_percentage: 25 },
    { min_members: 101, discount_percentage: 50 },
  ] });
});

const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

const uploadCompanyLogo = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new HttpError(400, "logo_file is required");
  }
  if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
    throw new HttpError(400, "Only image files are allowed (png/jpg/jpeg/webp)");
  }

  const logoUrl = `/uploads/company_logos/${req.file.filename}`;
  await applicationSettingsService.updateLogoUrl(logoUrl);

  res.json({ status: "success", logo_url: logoUrl });
});

module.exports = { getApplicationSettings, updateApplicationSettings, getMemberDiscountRules, uploadCompanyLogo };
