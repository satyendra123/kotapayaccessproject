import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { canAccess } from "../auth/permissions";
import "./Sidebar.css";

const menu = [
  { label: "Dashboard", icon: "bi-grid-1x2", to: "/", permissions: ["view_dashboard"] },
  {
    label: "Shift Management",
    icon: "bi-clock-history",
    children: [{ label: "Manage Shifts", to: "/add-shift", permissions: ["shifts.view", "shifts.create", "shifts.edit", "shifts.delete", "manage_shifts"] }],
  },
  {
    label: "Gate Management",
    icon: "bi-door-open",
    children: [
      { label: "Manage Gates", to: "/add-gate", permissions: ["gates.view", "gates.create", "gates.edit", "gates.delete", "manage_gates"] },
      { label: "Manage Machines", to: "/add-machine", permissions: ["machines.view", "machines.create", "machines.edit", "machines.delete", "manage_gate_machines"] },
    ],
  },
  {
    label: "Live Logs",
    icon: "bi-activity",
    children: [
      { label: "Visitor Logs", to: "/visitor-live-logs", permissions: ["view_master_data"] },
      { label: "Staff Logs", to: "/staff-logs", permissions: ["view_master_data"] },
      { label: "Alarm Logs", to: "/alarm-logs", permissions: ["view_master_data"] },
      { label: "Event Logs", to: "/event-logs", permissions: ["view_master_data"] },
    ],
  },
  {
    label: "User Management",
    icon: "bi-people",
    children: [
      {
        label: "Access & Rights",
        to: "/user-right",
        permissions: ["manage_qualifications", "manage_rights_permissions"],
        requireAll: true,
      },
      {
        label: "Manage Users",
        to: "/user-management",
        permissions: ["view_users", "create_users", "edit_users", "delete_users", "manage_users"],
      },
    ],
  },
  {
    label: "Staff & Guests",
    icon: "bi-person-badge",
    children: [
      {
        label: "Staff Setup",
        to: "/add-staff",
        permissions: ["staffs.create", "manage_staff"],
      },
      { label: "Manage Staff", to: "/manage-staff", permissions: ["staffs.view", "staffs.create", "staffs.edit", "staffs.delete", "manage_staff"] },
      { label: "Add Guest", to: "/add-guest", permissions: ["guests.create", "manage_guests"] },
      { label: "Manage Guests", to: "/manage-guest", permissions: ["guests.view", "guests.create", "guests.edit", "guests.delete", "manage_guests"] },
    ],
  },
  {
    label: "Cards",
    icon: "bi-credit-card-2-front",
    children: [{ label: "Subscription Cards", to: "/card-management", permissions: ["cards.view", "cards.create", "cards.edit", "cards.delete", "manage_subscription_cards"] }],
  },
  {
    label: "Tariffs",
    icon: "bi-cash-stack",
    children: [
      { label: "Set Tariff Values", to: "/set-value-tariff", permissions: ["tariffs.view", "tariffs.create", "tariffs.edit", "tariffs.delete", "manage_tariff_services"] },
      { label: "Combo Services", to: "/combo-services", permissions: ["combo_services.view", "combo_services.create", "combo_services.edit", "combo_services.delete", "manage_combo_services"] },
      { label: "Service Combos", to: "/combos", permissions: ["combos.view", "combos.create", "combos.edit", "combos.delete", "manage_combos"] },
    ],
  },
  {
    label: "Tickets",
    icon: "bi-ticket-perforated",
    children: [
      { label: "Generate Ticket", to: "/customer-tickets", permissions: ["tickets.create", "manage_tickets"] },
      { label: "Scan & Verify Ticket", to: "/ticket-verify", permissions: ["tickets.scan", "manage_tickets"] },
      { label: "Manage Tickets", to: "/manage-customer-tickets", permissions: ["tickets.view", "manage_tickets"] },
      { label: "Lost Ticket", to: "/lost-tickets", permissions: ["tickets.view", "manage_tickets"] },
      { label: "Eligible Ticket", to: "/eneligible-tickets", permissions: ["tickets.view", "manage_tickets"] },
      { label: "FOC Reasons", to: "/reason", permissions: ["manage_reasons"] },
    ],
  },
  { label: "Reports", icon: "bi-bar-chart-line", to: "/report", permissions: ["view_master_data"] },
];

const footerMenu = [
  {
    label: "Support",
    icon: "bi-life-preserver",
    to: "/support",
    permissions: ["submit_support_query", "view_support_queries", "reply_support_queries", "delete_support_queries"],
  },
  { label: "Settings", icon: "bi-gear", to: "/settings", permissions: ["manage_application_settings"] },
  { label: "About", icon: "bi-info-circle", to: "/about" },
];

const Sidebar = ({ sidebarOpen, toggleSidebar }) => {
  const location = useLocation();
  const [openGroup, setOpenGroup] = useState("");
  const currentPath = location.pathname.toLowerCase();
  const visibleMenu = menu
    .map((item) =>
      item.children
        ? {
            ...item,
            children: item.children.filter((child) =>
              canAccess(child.permissions, child.requireAll)
            ),
          }
        : item
    )
    .filter((item) =>
      item.children
        ? item.children.length > 0
        : canAccess(item.permissions, item.requireAll)
    );

  useEffect(() => {
    const activeGroup = visibleMenu.find((item) =>
      item.children?.some((child) => child.to.toLowerCase() === currentPath)
    );
    if (activeGroup) setOpenGroup(activeGroup.label);
  }, [currentPath]); // eslint-disable-line react-hooks/exhaustive-deps

  const isActive = (path) => path.toLowerCase() === currentPath;

  const toggleGroup = (label) => {
    if (!sidebarOpen) {
      toggleSidebar();
      setOpenGroup(label);
      return;
    }
    setOpenGroup((current) => (current === label ? "" : label));
  };

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.REACT_APP_API_PATH}/api/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: localStorage.getItem("refresh_token") || "unavailable" }),
      });
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_name");
      localStorage.removeItem("roles");
      window.location.assign("/login");
    }
  };

  const renderLink = (item, child = false) => (
    <Link
      key={item.to}
      to={item.to}
      className={`sidebar-link ${child ? "sidebar-sublink" : ""} ${isActive(item.to) ? "active" : ""}`}
      title={!sidebarOpen ? item.label : undefined}
    >
      {!child && <i className={`bi ${item.icon}`} aria-hidden="true" />}
      {sidebarOpen && <span>{item.label}</span>}
    </Link>
  );

  return (
    <aside className={`app-sidebar ${sidebarOpen ? "expanded" : "collapsed"}`} aria-label="Primary navigation">
      <div className="sidebar-brand">
        {sidebarOpen && (
          <div className="sidebar-brand-copy">
            <img src="/housys.jpeg" alt="Housys" />
          
          </div>
        )}
        <button type="button" onClick={toggleSidebar} aria-label={sidebarOpen ? "Collapse navigation" : "Expand navigation"}>
          <i className="bi bi-list" />
        </button>
      </div>

      <nav className="sidebar-nav">
        {visibleMenu.map((item) => {
          if (!item.children) return renderLink(item);
          const active = item.children.some((child) => isActive(child.to));
          const expanded = openGroup === item.label;
          return (
            <div className={`sidebar-group ${active ? "active" : ""}`} key={item.label}>
              <button
                type="button"
                className="sidebar-link sidebar-group-toggle"
                onClick={() => toggleGroup(item.label)}
                aria-expanded={expanded}
                title={!sidebarOpen ? item.label : undefined}
              >
                <i className={`bi ${item.icon}`} aria-hidden="true" />
                {sidebarOpen && (
                  <>
                    <span>{item.label}</span>
                    <i className={`bi bi-chevron-down sidebar-chevron ${expanded ? "open" : ""}`} />
                  </>
                )}
              </button>
              {sidebarOpen && expanded && (
                <div className="sidebar-submenu">{item.children.map((child) => renderLink(child, true))}</div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {footerMenu
          .filter((item) => canAccess(item.permissions, item.requireAll))
          .map((item) => renderLink(item))}
        <button type="button" className="sidebar-link sidebar-logout" onClick={handleLogout} title={!sidebarOpen ? "Logout" : undefined}>
          <i className="bi bi-box-arrow-right" />
          {sidebarOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
