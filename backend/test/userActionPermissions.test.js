const test = require("node:test");
const assert = require("node:assert/strict");

const { permissionsFromRights } = require("../src/utils/registeredUserPermissions.util");

test("maps dynamic user role actions to separate API permissions", () => {
  const permissions = permissionsFromRights({
    USER_MANAGEMENT: ["users.view", "users.edit", "roles.manage"],
  });

  assert.deepEqual(permissions.sort(), [
    "edit_users",
    "manage_qualifications",
    "manage_rights_permissions",
    "view_users",
  ]);
});
