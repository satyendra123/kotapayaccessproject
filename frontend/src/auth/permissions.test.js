import {
  canAccess,
  getCurrentPermissions,
  getDefaultAuthorizedPath,
  isSuperUser,
} from "./permissions";

beforeEach(() => {
  localStorage.clear();
});

test("only grants permissions stored for the logged-in role", () => {
  localStorage.setItem(
    "roles",
    JSON.stringify([{ name: "Operator", permissions: ["manage_tickets"] }])
  );

  expect(getCurrentPermissions()).toEqual(["manage_tickets"]);
  expect(canAccess(["manage_tickets"])).toBe(true);
  expect(canAccess(["manage_users"])).toBe(false);
  expect(getDefaultAuthorizedPath()).toBe("/customer-tickets");
});

test("requires every permission when a screen depends on multiple permissions", () => {
  localStorage.setItem(
    "roles",
    JSON.stringify([{ name: "Manager", permissions: ["manage_qualifications"] }])
  );

  expect(
    canAccess(["manage_qualifications", "manage_rights_permissions"], true)
  ).toBe(false);
});

test("keeps the configured admin role unrestricted", () => {
  localStorage.setItem("roles", JSON.stringify([{ name: "admin", permissions: [] }]));

  expect(isSuperUser()).toBe(true);
  expect(canAccess(["manage_users"])).toBe(true);
  expect(getDefaultAuthorizedPath()).toBe("/");
});
