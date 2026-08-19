const { ApplicationSettings } = require("../models");

const DEFAULT_SINGLETON_ID = 1;

async function getOrCreateSingleton() {
  let settings = await ApplicationSettings.findByPk(DEFAULT_SINGLETON_ID);
  if (!settings) {
    await ApplicationSettings.create({ id: DEFAULT_SINGLETON_ID });
    settings = await ApplicationSettings.findByPk(DEFAULT_SINGLETON_ID);
  }
  return settings;
}

async function getSettings() {
  return getOrCreateSingleton();
}

const UPDATABLE_FIELDS = {
  company_name: "companyName",
  company_phone: "companyPhone",
  company_email: "companyEmail",
  startup_year: "startupYear",
  company_address: "companyAddress",
  print_brand_name: "printBrandName",
  powered_by: "poweredBy",
  ticket_penalty_charges: "ticketPenaltyCharges",
  student_discount_percentage: "studentDiscountPercentage",
  member_discount_rules: "memberDiscountRules",
  terms_and_conditions: "termsAndConditions",
};

async function updateSettings(payload) {
  const settings = await getOrCreateSingleton();

  for (const [key, field] of Object.entries(UPDATABLE_FIELDS)) {
    if (payload[key] !== undefined) {
      settings[field] = payload[key];
    }
  }

  await settings.save();
  return settings;
}

async function updateLogoUrl(logoUrl) {
  const settings = await getOrCreateSingleton();
  settings.logoUrl = logoUrl;
  await settings.save();
  return settings;
}

module.exports = { getSettings, updateSettings, updateLogoUrl };
