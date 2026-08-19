import { canAccess } from "./permissions";

// Feature permissions are additive. Existing broad manage permissions remain
// valid through the fallback list so current roles continue to work.
export const FEATURE_PERMISSIONS = {
  dashboard: {
    view: ["dashboard.view", "view_dashboard"],
    monthlyRevenue: ["dashboard.monthly_revenue.view", "view_monthly_revenue"],
  },
  tickets: {
    view: ["tickets.view", "manage_tickets"],
    create: ["tickets.create", "manage_tickets"],
    edit: ["tickets.edit", "manage_tickets"],
    delete: ["tickets.delete", "manage_tickets"],
    print: ["tickets.print", "manage_tickets"],
    verify: ["tickets.verify", "manage_tickets"],
  },
};

export const canUseFeature = (permissions) => canAccess(permissions);
