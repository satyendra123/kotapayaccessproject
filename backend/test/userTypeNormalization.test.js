const test = require("node:test");
const assert = require("node:assert/strict");

const { normalizeUserType } = require("../src/services/userManagement.service");

test("normalizes equivalent site-in-charge role spellings", () => {
  assert.equal(normalizeUserType("Site In-Charge"), normalizeUserType("site in charge"));
  assert.equal(normalizeUserType("Site Incharge"), normalizeUserType("site-in-charge"));
});

test("treats the legacy technical manager label as technical engineer", () => {
  assert.equal(normalizeUserType("Technical Manager"), normalizeUserType("Technical Engineer"));
});
