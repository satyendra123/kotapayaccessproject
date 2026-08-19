require("dotenv").config();

const bcrypt = require("bcryptjs");
const { sequelize, User, Role, Permission, UserRole, RolePermission } = require("../src/models");

const username = process.env.SUPERADMIN_USERNAME || "superadmin";
const password = process.env.SUPERADMIN_PASSWORD;

// These are every permission currently checked by the API routes.
const permissionNames = [
  "assign_permissions", "assign_roles", "cards.create", "cards.delete", "cards.edit", "cards.view",
  "combo_services.create", "combo_services.delete", "combo_services.edit", "combo_services.view",
  "combos.create", "combos.delete", "combos.edit", "combos.view", "create_users", "delete_support_queries",
  "delete_users", "edit_users", "gates.create", "gates.delete", "gates.edit", "gates.view", "guests.create",
  "guests.delete", "guests.edit", "guests.view", "machines.create", "machines.delete", "machines.edit",
  "machines.view", "manage_application_settings", "manage_combo_services", "manage_combos", "manage_gate_machines",
  "manage_gates", "manage_guest_cards", "manage_guests", "manage_permissions", "manage_qualifications",
  "manage_reasons", "manage_rights_permissions", "manage_roles", "manage_services", "manage_shifts", "manage_staff",
  "manage_staff_categories", "manage_subscription_cards", "manage_tariff_services", "manage_tickets", "manage_users",
  "reply_support_queries", "shifts.create", "shifts.delete", "shifts.edit", "shifts.view", "staffs.create",
  "staffs.delete", "staffs.edit", "staffs.view", "submit_support_query", "tariffs.create", "tariffs.delete",
  "tariffs.edit", "tariffs.view", "tickets.create", "tickets.delete", "tickets.edit", "tickets.print", "tickets.scan",
  "tickets.view", "view_master_data", "view_permissions", "view_roles", "view_support_queries", "view_users"
];

async function seed() {
  if (!password) throw new Error("Set SUPERADMIN_PASSWORD before running this script.");

  await sequelize.authenticate();
  await sequelize.sync();

  const transaction = await sequelize.transaction();
  try {
    const [role] = await Role.findOrCreate({ where: { name: "SuperAdmin" }, defaults: { name: "SuperAdmin" }, transaction });
    const permissions = [];
    for (const name of permissionNames) {
      const [permission] = await Permission.findOrCreate({ where: { name }, defaults: { name }, transaction });
      permissions.push(permission);
    }

    const existingUser = await User.findOne({ where: { username }, transaction });
    const user = existingUser || await User.create({
      username,
      hashedPassword: await bcrypt.hash(password, 12),
      createdBy: "setup-script",
    }, { transaction });

    await UserRole.findOrCreate({ where: { userId: user.id, roleId: role.id }, defaults: { userId: user.id, roleId: role.id }, transaction });
    for (const permission of permissions) {
      await RolePermission.findOrCreate({
        where: { roleId: role.id, permissionId: permission.id },
        defaults: { roleId: role.id, permissionId: permission.id },
        transaction,
      });
    }

    await transaction.commit();
    console.log(`SuperAdmin setup complete: ${username} has ${permissions.length} permissions.${existingUser ? " Existing password was kept." : ""}`);
  } catch (error) {
    await transaction.rollback();
    throw error;
  } finally {
    await sequelize.close();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
