const parseStoredRoles = () => {
  try {
    const roles = JSON.parse(localStorage.getItem("roles") || "[]");
    return Array.isArray(roles) ? roles : [];
  } catch {
    return [];
  }
};

const parseTokenPayload = () => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) return {};
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload) return {};
    const normalized = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = decodeURIComponent(
      window
        .atob(paddedPayload)
        .split("")
        .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );
    return JSON.parse(decoded);
  } catch {
    return {};
  }
};

export const getCurrentRoles = () => {
  const storedRoles = parseStoredRoles();
  const tokenRoles = parseTokenPayload().roles || [];
  const roleNames = [
    ...storedRoles.map((role) => (typeof role === "string" ? role : role?.name)),
    ...(Array.isArray(tokenRoles) ? tokenRoles : []),
  ];
  return [...new Set(roleNames.filter(Boolean).map((role) => String(role).toLowerCase()))];
};

export const getCurrentPermissions = () => {
  const rolePermissions = parseStoredRoles().flatMap((role) =>
    Array.isArray(role?.permissions) ? role.permissions : []
  );
  const tokenPermissions = parseTokenPayload().permissions || [];
  return [
    ...new Set([
      ...rolePermissions,
      ...(Array.isArray(tokenPermissions) ? tokenPermissions : []),
    ]),
  ];
};

export const isSuperUser = () => {
  const payload = parseTokenPayload();
  return payload.account_type === "system" &&
    getCurrentRoles().some((role) => role === "admin" || role === "superadmin" || role === "super admin");
};

export const canAccess = (requiredPermissions = [], requireAll = false) => {
  if (!requiredPermissions || requiredPermissions.length === 0 || isSuperUser()) return true;
  const permissions = new Set(getCurrentPermissions());
  return requireAll
    ? requiredPermissions.every((permission) => permissions.has(permission))
    : requiredPermissions.some((permission) => permissions.has(permission));
};

const defaultDestinations = [
  ["/", ["view_dashboard"]],
  ["/add-shift", ["shifts.view", "shifts.create", "shifts.edit", "shifts.delete", "manage_shifts"]],
  ["/add-gate", ["gates.view", "gates.create", "gates.edit", "gates.delete", "manage_gates"]],
  ["/add-machine", ["machines.view", "machines.create", "machines.edit", "machines.delete", "manage_gate_machines"]],
  ["/user-management", ["view_users", "create_users", "edit_users", "delete_users", "manage_users"]],
  ["/manage-staff", ["staffs.view", "staffs.create", "staffs.edit", "staffs.delete", "manage_staff"]],
  ["/manage-guest", ["guests.view", "guests.create", "guests.edit", "guests.delete", "manage_guests"]],
  ["/card-management", ["manage_subscription_cards"]],
  ["/set-value-tariff", ["manage_tariff_services"]],
  ["/combo-services", ["manage_combo_services"]],
  ["/combos", ["manage_combos"]],
  ["/manage-customer-tickets", ["tickets.view"]],
  ["/customer-tickets", ["tickets.create"]],
  ["/ticket-verify", ["tickets.scan"]],
  ["/customer-tickets", ["manage_tickets"]],
  ["/reason", ["manage_reasons"]],
  ["/report", ["view_master_data", "manage_tickets"]],
  ["/support", ["submit_support_query", "view_support_queries"]],
  ["/settings", ["manage_application_settings"]],
];

export const getDefaultAuthorizedPath = () =>
  defaultDestinations.find(([, permissions]) => canAccess(permissions))?.[0] || "/unauthorized";
