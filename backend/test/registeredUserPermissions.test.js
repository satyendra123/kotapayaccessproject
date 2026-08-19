const test = require("node:test");
const assert = require("node:assert/strict");

const { permissionsFromRights } = require("../src/utils/registeredUserPermissions.util");

test("maps stored qualification sections to API permissions", () => {
  const permissions = permissionsFromRights(JSON.stringify({
    GATES_MANAGEMENT: ["Machines"],
    TICKETS_MANAGEMENT: ["Customer Tickets", "Reasons"],
  }));

  assert.ok(permissions.includes("manage_gate_machines"));
  assert.ok(permissions.includes("manage_tickets"));
  assert.ok(permissions.includes("manage_reasons"));
});

test("supports explicit API permissions and safely rejects invalid JSON", () => {
  assert.deepEqual(permissionsFromRights({ CUSTOM: ["manage_shifts"] }), ["manage_shifts"]);
  assert.deepEqual(permissionsFromRights("not-json"), []);
});

test("maps the current shift and tariff UI labels", () => {
  const permissions = permissionsFromRights({
    SHIFT_MANAGEMENT: ["Manage Shifts"],
    TARIFFS_MANAGEMENT: ["Set Value (Tariffs) Management"],
  });

  assert.ok(permissions.includes("manage_shifts"));
  assert.ok(permissions.includes("manage_tariff_services"));
  assert.ok(!permissions.includes("manage_combo_services"));
});

test("maps User Management sidebar permissions", () => {
  const permissions = permissionsFromRights({
    USER_MANAGEMENT: ["users.manage"],
  });

  assert.ok(permissions.includes("view_users"));
  assert.ok(!permissions.includes("create_users"));
  assert.ok(!permissions.includes("edit_users"));
  assert.ok(!permissions.includes("delete_users"));
});

test("maps Shift Management action permissions independently", () => {
  const permissions = permissionsFromRights({
    SHIFT_MANAGEMENT: ["shifts.view", "shifts.edit"],
  });

  assert.ok(permissions.includes("shifts.view"));
  assert.ok(permissions.includes("shifts.edit"));
  assert.ok(!permissions.includes("shifts.create"));
  assert.ok(!permissions.includes("shifts.delete"));
});

test("maps Gate and Machine action permissions independently", () => {
  const permissions = permissionsFromRights({
    GATES_MANAGEMENT: ["gates.view", "gates.create", "machines.edit"],
  });

  assert.ok(permissions.includes("gates.view"));
  assert.ok(permissions.includes("gates.create"));
  assert.ok(permissions.includes("machines.edit"));
  assert.ok(!permissions.includes("gates.delete"));
  assert.ok(!permissions.includes("machines.delete"));
});

test("maps Staff and Guest action permissions independently", () => {
  const permissions = permissionsFromRights({
    GROUP_MANAGEMENT: ["staffs.view", "staffs.edit", "guests.create", "guests.delete"],
  });

  assert.ok(permissions.includes("staffs.view"));
  assert.ok(permissions.includes("staffs.edit"));
  assert.ok(permissions.includes("guests.create"));
  assert.ok(permissions.includes("guests.delete"));
  assert.ok(!permissions.includes("staffs.delete"));
  assert.ok(!permissions.includes("guests.edit"));
});
