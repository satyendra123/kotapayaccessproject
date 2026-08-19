import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import axios from "axios";
import "bootstrap-icons/font/bootstrap-icons.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./App.css";

import About from "./About/About";
import SubscriptionCard from "./CardManagement/SubscriptionCard";
import ToastCenter from "./components/ToastCenter";
import Dashboard from "./Dashboard/Dashboard";
import AddGate from "./GateManagement/AddGate";
import AddMachine from "./GateManagement/AddMachine";
import AddGuest from "./GroupManagement/AddGuest";
import AddStaff from "./GroupManagement/AddStaff";
import GroupManagement from "./GroupManagement/GroupManagement";
import ManageGuest from "./GroupManagement/ManageGuest";
import Managestaff from "./GroupManagement/Managestaff";
import AlarmLiveLogs from "./LiveLogs/AlarmLiveLogs";
import EventLiveLogs from "./LiveLogs/EventLiveLogs";
import StaffLiveLogs from "./LiveLogs/StaffLiveLogs";
import VisitorLiveLogs from "./LiveLogs/VisitorLiveLogs";
import Login from "./Login/Login";
import ProtectedRoute from "./ProtectedRoute/ProtectedRoute";
import Unauthorized from "./Unauthoriged/Unauthoriged";
import Report from "./Report/Report";
import Setting from "./Setting/Setting";
import AddShift from "./ShiftManagement/AddShift";
import ManageShift from "./ShiftManagement/ManageShift";
import Sidebar from "./Sidebar/Sidebar";
import Support from "./Support/support";
import Combos from "./TarrifManagement/Combos";
import ComboServices from "./TarrifManagement/ComboServices";
import SetValueTeriff from "./TarrifManagement/SetValueTeriff";
import TariffManagement from "./TarrifManagement/Tarrif";
import Customertickets from "./TicketManagement/Customertickets";
import EneligibleTicket from "./TicketManagement/EneligibleTicket";
import LostTicket from "./TicketManagement/LostTicket";
import ManageCustomer from "./TicketManagement/ManageCustomer";
import Newextracomboticket from "./TicketManagement/Newextracomboticket";
import Reason from "./TicketManagement/Reason";
import TicketManagement from "./TicketManagement/Ticket";
import TicketVerify from "./TicketManagement/TicketVerify";
import UserManagement from "./UserManagement/UserManagement";
import UserRight from "./UserManagement/UsersRight";
import { getErrorMessage, notify } from "./services/http";
import { canAccess, getDefaultAuthorizedPath } from "./auth/permissions";

const API_PATH = process.env.REACT_APP_API_PATH;

const Protected = ({ isLoggedIn, permissions, requireAll, children }) => (
  <ProtectedRoute isLoggedIn={isLoggedIn} permissions={permissions} requireAll={requireAll}>
    {children}
  </ProtectedRoute>
);

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 992);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(localStorage.getItem("access_token")));
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [shifts, setShifts] = useState([]);

  const clearShiftData = useCallback(() => {
    setCurrentShift(null);
    setShifts([]);
    localStorage.removeItem("selected_shift_id");
  }, []);

  const fetchShifts = useCallback(async () => {
    if (!localStorage.getItem("access_token")) {
      clearShiftData();
      return;
    }
    if (!canAccess(["shifts.view", "shifts.create", "shifts.edit", "shifts.delete", "manage_shifts", "tickets.create", "manage_tickets"])) {
      clearShiftData();
      return;
    }

    try {
      const response = await axios.get(`${API_PATH}/api/shifts/`);
      const activeShifts = (response.data || []).filter((shift) => shift.status === "Active");
      setShifts(activeShifts);
      const storedShiftId = Number(localStorage.getItem("selected_shift_id"));
      const storedShift = activeShifts.find((shift) => shift.id === storedShiftId) || null;
      setCurrentShift(storedShift);
      if (!storedShift) localStorage.removeItem("selected_shift_id");
    } catch (error) {
      if (error.response?.status !== 401) {
        notify(getErrorMessage(error, "Unable to load active shifts"), "error");
      }
    }
  }, [clearShiftData]);

  useEffect(() => {
    if (isLoggedIn) fetchShifts();
    else clearShiftData();
  }, [clearShiftData, fetchShifts, isLoggedIn]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    ["access_token", "refresh_token", "user_name", "roles", "selected_shift_id"].forEach((key) =>
      localStorage.removeItem(key)
    );
    setIsLoggedIn(false);
    setShowUserMenu(false);
    window.location.assign("/login");
  };

  const updateCurrentShift = (shiftId) => {
    const shift = shifts.find((item) => item.id === Number(shiftId)) || null;
    setCurrentShift(shift);
    if (shift) localStorage.setItem("selected_shift_id", String(shift.id));
    else localStorage.removeItem("selected_shift_id");
  };

  const toggleSidebar = () => setSidebarOpen((open) => !open);
  const protect = (component, permissions = [], requireAll = false) => (
    <Protected isLoggedIn={isLoggedIn} permissions={permissions} requireAll={requireAll}>
      {component}
    </Protected>
  );

  return (
    <Router>
      <div className="App">
        <ToastCenter />
        {isLoggedIn && (
          <>
            <aside className={`sidebar-wrapper ${sidebarOpen ? "open" : ""}`}>
              <div className={`sidebar-custom ${sidebarOpen ? "open" : "collapsed"}`}>
                <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
              </div>
            </aside>
            {isMobile && sidebarOpen && (
              <button className="sidebar-backdrop active" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />
            )}
          </>
        )}

        <main className={`main-content ${isLoggedIn ? (sidebarOpen ? "with-sidebar" : "with-sidebar-collapsed") : ""}`}>
          {isLoggedIn && (
            <nav className="navbar navbar-light">
              <div className="d-flex align-items-center overflow-hidden">
                <button
                  type="button"
                  className="mobile-menu-trigger"
                  onClick={toggleSidebar}
                  aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
                >
                  <i className={sidebarOpen ? "bi bi-x-lg" : "bi bi-list"} />
                </button>
                <span className="navbar-brand mb-0">Chambal River Front</span>
                {currentShift && (
                  <div className="shift-info">
                    <i className="fas fa-clock" />
                    <strong>{currentShift.shiftname}</strong>
                    <span className="shift-time">{currentShift.shiftstarttime}–{currentShift.shiftendtime}</span>
                  </div>
                )}
              </div>
              <div className="ms-auto d-flex align-items-center gap-2">
                <div className="notification-wrap position-relative">
                  <button
                    type="button"
                    className="notification-trigger"
                    onClick={() => setShowNotifications((open) => !open)}
                    aria-label="Open notifications"
                    aria-expanded={showNotifications}
                  >
                    <i className="fas fa-bell" />
                    <span className="notification-count">3</span>
                  </button>
                  {showNotifications && (
                    <div className="notification-menu">
                      <div className="notification-heading"><strong>Notifications</strong><span>3 new</span></div>
                      <div className="notification-item"><i className="fas fa-ticket-alt notification-icon ticket" /><div><strong>Tickets are being generated</strong><small>Live activity is available now</small></div></div>
                      <div className="notification-item"><i className="fas fa-clock notification-icon shift" /><div><strong>Shift status updated</strong><small>Review the active shift details</small></div></div>
                      <div className="notification-item"><i className="fas fa-circle-check notification-icon success" /><div><strong>System is running smoothly</strong><small>All services are online</small></div></div>
                      <button type="button" className="notification-footer" onClick={() => setShowNotifications(false)}>Mark all as read</button>
                    </div>
                  )}
                </div>
              <div className="position-relative">
                <button className="user-menu-trigger" onClick={() => setShowUserMenu((open) => !open)} aria-expanded={showUserMenu}>
                  <i className="fas fa-user-circle" />
                  <span>{localStorage.getItem("user_name") || "User"}</span>
                  <i className="fas fa-chevron-down" />
                </button>
                {showUserMenu && (
                  <div className="user-menu">
                    <button onClick={handleLogout}><i className="fas fa-sign-out-alt" /> Logout</button>
                  </div>
                )}
              </div>
              </div>
            </nav>
          )}

          <div className={`content-wrapper ${!isLoggedIn ? "content-wrapper--public" : ""}`}>
            <Routes>
              <Route path="/login" element={isLoggedIn ? <Navigate to={getDefaultAuthorizedPath()} replace /> : <Login onLoginSuccess={() => setIsLoggedIn(true)} />} />
              <Route path="/" element={protect(<Dashboard />, ["view_dashboard"])} />
              <Route path="/add-shift" element={protect(<AddShift />, ["shifts.view", "shifts.create", "shifts.edit", "shifts.delete", "manage_shifts"])} />
              <Route path="/manage-shift" element={protect(<ManageShift />, ["shifts.view", "shifts.create", "shifts.edit", "shifts.delete", "manage_shifts"])} />
              <Route path="/add-staff" element={protect(<AddStaff />, ["staffs.create", "manage_staff"])} />
              <Route path="/manage-staff" element={protect(<Managestaff />, ["staffs.view", "staffs.create", "staffs.edit", "staffs.delete", "manage_staff"])} />
              <Route path="/add-guest" element={protect(<AddGuest />, ["guests.create", "manage_guests"])} />
              <Route path="/manage-guest" element={protect(<ManageGuest />, ["guests.view", "guests.create", "guests.edit", "guests.delete", "manage_guests"])} />
              <Route path="/group-management" element={protect(<GroupManagement />, ["manage_staff", "manage_guests"])} />
              <Route path="/add-gate" element={protect(<AddGate />, ["gates.view", "gates.create", "gates.edit", "gates.delete", "manage_gates"])} />
              <Route path="/add-machine" element={protect(<AddMachine />, ["machines.view", "machines.create", "machines.edit", "machines.delete", "manage_gate_machines"])} />
              <Route path="/staff-logs" element={protect(<StaffLiveLogs />, ["view_master_data"])} />
              <Route path="/visitor-live-logs" element={protect(<VisitorLiveLogs />, ["view_master_data"])} />
              <Route path="/alarm-logs" element={protect(<AlarmLiveLogs />, ["view_master_data"])} />
              <Route path="/event-logs" element={protect(<EventLiveLogs />, ["view_master_data"])} />
              <Route path="/user-management" element={protect(<UserManagement />, ["view_users", "create_users", "edit_users", "delete_users", "manage_users"])} />
              <Route path="/user-right" element={protect(<UserRight />, ["manage_qualifications", "manage_rights_permissions"], true)} />
              <Route path="/card-management" element={protect(<SubscriptionCard />, ["cards.view", "cards.create", "cards.edit", "cards.delete", "manage_subscription_cards"])} />
              <Route path="/tariff-management" element={protect(<TariffManagement />, ["manage_tariff_services", "manage_combo_services", "manage_combos"])} />
              <Route path="/set-value-tariff" element={protect(<SetValueTeriff />, ["tariffs.view", "tariffs.create", "tariffs.edit", "tariffs.delete", "manage_tariff_services"])} />
              <Route path="/combo-services" element={protect(<ComboServices />, ["combo_services.view", "combo_services.create", "combo_services.edit", "combo_services.delete", "manage_combo_services"])} />
              <Route path="/combos" element={protect(<Combos />, ["combos.view", "combos.create", "combos.edit", "combos.delete", "manage_combos"])} />
              <Route path="/ticket-management" element={protect(<TicketManagement />, ["tickets.view", "tickets.create", "tickets.scan", "manage_tickets", "manage_reasons"])} />
              <Route path="/customer-tickets" element={protect(<Customertickets shifts={shifts} currentShift={currentShift} onShiftSelect={updateCurrentShift} />, ["tickets.create", "manage_tickets"])} />
              <Route path="/ticket-verify" element={protect(<TicketVerify />, ["tickets.scan", "manage_tickets"])} />
              <Route path="/manage-customer-tickets" element={protect(<ManageCustomer />, ["tickets.view", "manage_tickets"])} />
              <Route path="/lost-tickets" element={protect(<LostTicket />, ["tickets.view", "manage_tickets"])} />
              <Route path="/eneligible-tickets" element={protect(<EneligibleTicket />, ["tickets.view", "manage_tickets"])} />
              <Route path="/reason" element={protect(<Reason />, ["manage_reasons"])} />
              <Route path="/report" element={protect(<Report />, ["view_master_data"])} />
              <Route path="/support" element={protect(<Support />, ["submit_support_query", "view_support_queries", "reply_support_queries", "delete_support_queries"])} />
              <Route path="/settings" element={protect(<Setting />, ["manage_application_settings"])} />
              <Route path="/about" element={protect(<About />)} />
              <Route path="/new-extra-combo-ticket" element={protect(<Newextracomboticket />, ["manage_tickets", "manage_combos"])} />
              <Route path="/unauthorized" element={isLoggedIn ? <Unauthorized /> : <Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to={isLoggedIn ? getDefaultAuthorizedPath() : "/login"} replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
