const SECTION_PERMISSIONS = {
  DASHBOARD: ["view_dashboard"],
  SHIFT_MANAGEMENT: ["manage_shifts"],
  GATES_MANAGEMENT: ["manage_gates", "manage_gate_machines"],
  LIVE_LOGS: ["view_master_data", "view_live_logs", "manage_live_logs"],
  USER_MANAGEMENT: [
    "view_master_data",
    "manage_users",
    "manage_qualifications",
    "manage_rights_permissions",
  ],
  GROUP_MANAGEMENT: [
    "manage_staff_categories",
    "manage_staff",
    "manage_guests",
    "manage_guest_cards",
  ],
  CARDS_MANAGEMENT: ["manage_subscription_cards"],
  TARIFFS_MANAGEMENT: [
    "manage_tariff_services",
    "manage_combo_services",
    "manage_combos",
  ],
  TICKETS_MANAGEMENT: [
    "manage_tickets",
    "manage_services",
    "manage_combos",
    "manage_reasons",
  ],
  REPORTS: ["view_master_data", "manage_tickets", "view_reports", "manage_reports"],
  SUPPORT: [
    "submit_support_query",
    "view_support_queries",
    "reply_support_queries",
    "delete_support_queries",
  ],
  SETTINGS: ["manage_application_settings"],
};

const ITEM_PERMISSIONS = {
  SHIFT_MANAGEMENT: {
    "Manage Shifts": ["manage_shifts"],
  },
  GATES_MANAGEMENT: {
    Machines: ["manage_gates", "manage_gate_machines"],
  },
  LIVE_LOGS: {
    "Visitors Live Logs": ["view_master_data"],
    "Staff Live Logs": ["view_master_data"],
    "Alarm Live Logs": ["view_master_data"],
    "Event Live Logs": ["view_master_data"],
  },
  USER_MANAGEMENT: {
    "Users (Operators / Supervisor / Manager / Site-In-Charge / Technical Engineer)": [
      "view_master_data",
      "manage_users",
      "manage_qualifications",
      "manage_rights_permissions",
    ],
  },
  GROUP_MANAGEMENT: {
    "Staff Management": ["manage_staff_categories", "manage_staff"],
    "Guest Management": ["manage_guests", "manage_guest_cards"],
  },
  CARDS_MANAGEMENT: {
    "Subscription Cards Management": ["manage_subscription_cards"],
  },
  TARIFFS_MANAGEMENT: {
    "Set Value (Tariffs) Management": ["manage_tariff_services"],
    "Tariff Combo Management": ["manage_combo_services", "manage_combos"],
    "Set Value (Tariff’s) Management": ["manage_tariff_services"],
    "Tariff’s Combo Management": ["manage_combo_services", "manage_combos"],
  },
  TICKETS_MANAGEMENT: {
    // Legacy saved roles may still contain this label. It must only grant
    // ticket access, never tariff or combo-management access.
    "Customer Tickets": ["manage_tickets"],
    "Lost Tickets": ["manage_tickets"],
    "Eligible Tickets": ["manage_tickets"],
    Reasons: ["manage_reasons"],
  },
  REPORTS: {
    Reports: ["view_master_data", "manage_tickets"],
  },
  SUPPORT: {
    Support: [
      "submit_support_query",
      "view_support_queries",
      "reply_support_queries",
      "delete_support_queries",
    ],
  },
  SETTINGS: {
    Settings: ["manage_application_settings"],
  },
};

// Action-level permissions used by the dynamic User Management roles screen.
// The older "Users (...)" value is intentionally retained above so existing
// saved access profiles continue to work.
const ACTION_PERMISSIONS = {
  "cards.manage": "cards.view", "cards.view": "cards.view", "cards.create": "cards.create", "cards.edit": "cards.edit", "cards.delete": "cards.delete",
  "tariffs.manage": "tariffs.view", "tariffs.view": "tariffs.view", "tariffs.create": "tariffs.create", "tariffs.edit": "tariffs.edit", "tariffs.delete": "tariffs.delete",
  "combo_services.manage": "combo_services.view", "combo_services.view": "combo_services.view", "combo_services.create": "combo_services.create", "combo_services.edit": "combo_services.edit", "combo_services.delete": "combo_services.delete",
  "combos.manage": "combos.view", "combos.view": "combos.view", "combos.create": "combos.create", "combos.edit": "combos.edit", "combos.delete": "combos.delete",
  "staffs.manage": "staffs.view",
  "staffs.view": "staffs.view",
  "staffs.create": "staffs.create",
  "staffs.edit": "staffs.edit",
  "staffs.delete": "staffs.delete",
  "guests.manage": "guests.view",
  "guests.view": "guests.view",
  "guests.create": "guests.create",
  "guests.edit": "guests.edit",
  "guests.delete": "guests.delete",
  "gates.manage": "gates.view",
  "gates.view": "gates.view",
  "gates.create": "gates.create",
  "gates.edit": "gates.edit",
  "gates.delete": "gates.delete",
  "machines.manage": "machines.view",
  "machines.view": "machines.view",
  "machines.create": "machines.create",
  "machines.edit": "machines.edit",
  "machines.delete": "machines.delete",
  "shifts.manage": "shifts.view",
  "shifts.view": "shifts.view",
  "shifts.create": "shifts.create",
  "shifts.edit": "shifts.edit",
  "shifts.delete": "shifts.delete",
  "access.rights": ["manage_qualifications", "manage_rights_permissions"],
  // This controls visibility of the Manage Users module only. Individual
  // user actions are granted exclusively by the View/Create/Edit/Delete boxes.
  "users.manage": "view_users",
  "users.view": "view_users",
  "users.create": "create_users",
  "users.edit": "edit_users",
  "users.delete": "delete_users",
  "roles.manage": ["manage_qualifications", "manage_rights_permissions"],
};

function permissionsFromRights(rights) {
  if (typeof rights === "string") {
    try {
      rights = JSON.parse(rights);
    } catch {
      return [];
    }
  }
  if (!rights || typeof rights !== "object" || Array.isArray(rights)) return [];

  const permissions = new Set();
  for (const [section, selectedItems] of Object.entries(rights)) {
    if (!Array.isArray(selectedItems) || selectedItems.length === 0) continue;

    let matchedKnownItem = false;
    for (const item of selectedItems) {
      if (ACTION_PERMISSIONS[item]) {
        matchedKnownItem = true;
        for (const permission of [].concat(ACTION_PERMISSIONS[item])) permissions.add(permission);
        continue;
      }
      const mapped = ITEM_PERMISSIONS[section]?.[item] || [];
      if (mapped.length) matchedKnownItem = true;
      for (const permission of mapped) permissions.add(permission);

      // Also support storing backend permission names directly in future clients.
      if (typeof item === "string" && /^[a-z][a-z0-9_.]*$/.test(item)) {
        permissions.add(item);
      }
    }

    // Preserve compatibility with older clients that saved custom labels.
    if (!matchedKnownItem && !selectedItems.some((item) => /^[a-z][a-z0-9_.]*$/.test(item))) {
      for (const permission of SECTION_PERMISSIONS[section] || []) permissions.add(permission);
    }
  }

  return [...permissions];
}

module.exports = { permissionsFromRights };
