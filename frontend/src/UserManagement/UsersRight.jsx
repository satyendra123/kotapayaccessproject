import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { getErrorMessage, notify } from "../services/http";

const API_PATH = process.env.REACT_APP_API_PATH;

const permissionSections = [
  {
    title: "DASHBOARD",
    items: [
      { label: "View Dashboard", value: "view_dashboard" },
      { label: "Today Ticket Members", value: "dashboard.ticket_members.view" },
      { label: "Today Inside Count", value: "dashboard.inside_count.view" },
      { label: "Today Outside Count", value: "dashboard.outside_count.view" },
      { label: "Overstay Count", value: "dashboard.overstay.view" },
      { label: "Today Revenue", value: "dashboard.today_revenue.view" },
      { label: "Lost Tickets Count", value: "dashboard.lost_tickets.view" },
      { label: "Eligible Tickets Count", value: "dashboard.eligible_tickets.view" },
      { label: "Group Tickets Count", value: "dashboard.group_tickets.view" },
      { label: "Monthly Revenue Graph", value: "view_monthly_revenue" },
      { label: "Today Ticket Collection", value: "dashboard.ticket_collection.view" },
      { label: "Live Staff Logs", value: "dashboard.live_staff.view" },
      { label: "Live Machine Logs", value: "dashboard.live_machines.view" },
      { label: "Live Customer Logs", value: "dashboard.live_customers.view" },
      { label: "Live Alarm Logs", value: "dashboard.live_alarms.view" },
    ],
  },
  {
    title: "SHIFT_MANAGEMENT",
    items: [
      { label: "Manage Shifts", value: "shifts.manage" },
      { label: "View shifts", value: "shifts.view" },
      { label: "Create shifts", value: "shifts.create" },
      { label: "Edit shifts", value: "shifts.edit" },
      { label: "Delete shifts", value: "shifts.delete" },
    ],
  },
  {
    title: "GATES_MANAGEMENT",
    items: [
      { label: "Manage Gates", value: "gates.manage" },
      { label: "View gates", value: "gates.view" },
      { label: "Create gates", value: "gates.create" },
      { label: "Edit gates", value: "gates.edit" },
      { label: "Delete gates", value: "gates.delete" },
      { label: "Manage Machines", value: "machines.manage" },
      { label: "View machines", value: "machines.view" },
      { label: "Create machines", value: "machines.create" },
      { label: "Edit machines", value: "machines.edit" },
      { label: "Delete machines", value: "machines.delete" },
    ],
  },
  {
    title: "LIVE_LOGS",
    items: ["Visitors Live Logs", "Staff Live Logs", "Alarm Live Logs", "Event Live Logs"],
  },
  {
    title: "USER_MANAGEMENT",
    items: [
      { label: "Access & Rights", value: "access.rights" },
      { label: "Manage Users", value: "users.manage" },
      { label: "View users", value: "users.view" },
      { label: "Create users", value: "users.create" },
      { label: "Edit users", value: "users.edit" },
      { label: "Delete users", value: "users.delete" },
    ],
  },
  {
    title: "GROUP_MANAGEMENT",
    items: [
      { label: "Manage Staff", value: "staffs.manage" },
      { label: "View staff", value: "staffs.view" },
      { label: "Create staff", value: "staffs.create" },
      { label: "Edit staff", value: "staffs.edit" },
      { label: "Delete staff", value: "staffs.delete" },
      { label: "Manage Guests", value: "guests.manage" },
      { label: "View guests", value: "guests.view" },
      { label: "Create guests", value: "guests.create" },
      { label: "Edit guests", value: "guests.edit" },
      { label: "Delete guests", value: "guests.delete" },
    ],
  },
  {
    title: "CARDS_MANAGEMENT",
    items: [
      { label: "Manage Subscription Cards", value: "cards.manage" },
      { label: "View subscription cards", value: "cards.view" },
      { label: "Create subscription cards", value: "cards.create" },
      { label: "Edit subscription cards", value: "cards.edit" },
      { label: "Delete subscription cards", value: "cards.delete" },
    ],
  },
  {
    title: "TARIFFS_MANAGEMENT",
    items: [
      { label: "Manage Tariff Values", value: "tariffs.manage" },
      { label: "View tariff values", value: "tariffs.view" },
      { label: "Create tariff values", value: "tariffs.create" },
      { label: "Edit tariff values", value: "tariffs.edit" },
      { label: "Delete tariff values", value: "tariffs.delete" },
      { label: "Manage Combo Services", value: "combo_services.manage" },
      { label: "View combo services", value: "combo_services.view" },
      { label: "Create combo services", value: "combo_services.create" },
      { label: "Edit combo services", value: "combo_services.edit" },
      { label: "Delete combo services", value: "combo_services.delete" },
      { label: "Manage Service Combos", value: "combos.manage" },
      { label: "View service combos", value: "combos.view" },
      { label: "Create service combos", value: "combos.create" },
      { label: "Edit service combos", value: "combos.edit" },
      { label: "Delete service combos", value: "combos.delete" },
    ],
  },
  {
    title: "TICKETS_MANAGEMENT",
    items: [
      { label: "View / manage tickets", value: "tickets.view" },
      { label: "Generate new ticket", value: "tickets.create" },
      { label: "Edit tickets", value: "tickets.edit" },
      { label: "Delete tickets", value: "tickets.delete" },
      { label: "Print tickets", value: "tickets.print" },
      { label: "Scan & verify QR ticket", value: "tickets.scan" },
      { label: "Search lost tickets", value: "tickets.lost.view" },
      { label: "Check eligible tickets", value: "tickets.eligible.view" },
      { label: "Manage FOC reasons", value: "tickets.reasons.manage" },
      { label: "Add extra combo to ticket", value: "tickets.combo.add" },
    ],
  },
  { title: "REPORTS", items: ["Reports"] },
  { title: "SUPPORT", items: ["Support"] },
  { title: "SETTINGS", items: ["Settings"] },
];

// Older records may contain a JSON string or a flat array. The API expects an
// object in the shape { SECTION_NAME: ["permission", ...] }.
const normalizePermissions = (value) => {
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return {};
    }
  }
  if (!value || Array.isArray(value) || typeof value !== "object") return {};

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, permissions]) => Array.isArray(permissions))
      .map(([section, permissions]) => [section, permissions.filter((permission) => typeof permission === "string")])
  );
};

const keepVisiblePermissions = (permissions) =>
  Object.fromEntries(
    Object.entries(permissions).map(([section, selected]) => {
      if (section !== "TICKETS_MANAGEMENT") return [section, selected];
      const sectionConfig = permissionSections.find((item) => item.title === section);
      if (!sectionConfig) return [section, selected];
      const visibleValues = sectionConfig.items.map((item) => (typeof item === "string" ? item : item.value));
      return [section, selected.filter((permission) => visibleValues.includes(permission))];
    })
  );

const UsersRight = () => {
  const QUALIFICATION_API = `${API_PATH}/api/qualifications`;
  const RIGHTS_API = `${API_PATH}/api/qualification-rights`;

  const [accessQualificationName, setAccessQualificationName] = useState("");
  const [userType, setUserType] = useState("");
  const [status, setStatus] = useState("Active");
  const [editingId, setEditingId] = useState(null);
  const [qualifications, setQualifications] = useState([]);
  const [selectedQualification, setSelectedQualification] = useState("");
  const [permissionStatus, setPermissionStatus] = useState("Active");
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [assignedRights, setAssignedRights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const availableRoles = useMemo(
    () => [...new Set(qualifications.map((row) => row.qualification_for).filter(Boolean))].sort(),
    [qualifications]
  );

  const loadRights = useCallback(async (rows) => {
    const results = await Promise.all(
      rows.map(async (qualification) => {
        try {
          const response = await axios.get(`${RIGHTS_API}/${qualification.id}`);
          return {
            ...response.data.data,
            permissions: normalizePermissions(response.data.data.permissions),
            qualification_for: qualification.qualification_for,
          };
        } catch (error) {
          if (error.response?.status === 404) return null;
          throw error;
        }
      })
    );
    setAssignedRights(results.filter(Boolean));
  }, [RIGHTS_API]);

  const fetchQualifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(QUALIFICATION_API);
      const rows = response.data?.data || [];
      setQualifications(rows);
      await loadRights(rows);
    } catch (error) {
      notify(getErrorMessage(error, "Unable to load qualifications"), "error");
    } finally {
      setLoading(false);
    }
  }, [QUALIFICATION_API, loadRights]);

  useEffect(() => {
    fetchQualifications();
  }, [fetchQualifications]);

  const resetQualificationForm = () => {
    setAccessQualificationName("");
    setUserType("");
    setStatus("Active");
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!accessQualificationName.trim() || !status) {
      notify("Complete all qualification fields", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        access_qualification_name: accessQualificationName.trim(),
        user_type: userType.trim() || accessQualificationName.trim(),
        status,
      };
      if (editingId) await axios.put(`${QUALIFICATION_API}/${editingId}`, payload);
      else await axios.post(QUALIFICATION_API, payload);
      notify(editingId ? "Qualification updated" : "Qualification created");
      resetQualificationForm();
      await fetchQualifications();
    } catch (error) {
      notify(getErrorMessage(error, "Unable to save qualification"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setAccessQualificationName(row.access_qualification_name);
    setUserType(row.qualification_for);
    setStatus(row.status === "Deactive" ? "Inactive" : row.status);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this qualification? Users assigned to it may be affected.")) return;
    try {
      await axios.delete(`${QUALIFICATION_API}/${id}`);
      notify("Qualification deleted");
      await fetchQualifications();
    } catch (error) {
      notify(getErrorMessage(error, "Unable to delete qualification"), "error");
    }
  };

  const handleQualificationSelection = async (value) => {
    setSelectedQualification(value);
    setSelectedPermissions({});
    setPermissionStatus("Active");
    if (!value) return;

    try {
      const response = await axios.get(`${RIGHTS_API}/${value}`);
      setSelectedPermissions(keepVisiblePermissions(normalizePermissions(response.data.data.permissions)));
      setPermissionStatus(response.data.data.status || "Active");
    } catch (error) {
      if (error.response?.status !== 404) {
        notify(getErrorMessage(error, "Unable to load permissions"), "error");
      }
    }
  };

  const handlePermissionChange = (section, item) => {
    setSelectedPermissions((currentPermissions) => {
      const current = currentPermissions[section] || [];
      return {
        ...currentPermissions,
        [section]: current.includes(item)
          ? current.filter((permission) => permission !== item)
          : [...current, item],
      };
    });
  };

  const toggleSectionPermissions = (section, items) => {
    const values = items.map((item) => (typeof item === "string" ? item : item.value));
    setSelectedPermissions((currentPermissions) => {
      const selected = currentPermissions[section] || [];
      const allSelected = values.every((value) => selected.includes(value));
      return { ...currentPermissions, [section]: allSelected ? [] : values };
    });
  };

  const selectedCount = useMemo(
    () => Object.values(selectedPermissions).reduce((sum, items) => sum + items.length, 0),
    [selectedPermissions]
  );

  const handlePermissionSubmit = async () => {
    if (!selectedQualification || !permissionStatus) {
      notify("Select a qualification and status", "error");
      return;
    }

    setSaving(true);
    try {
      await axios.post(RIGHTS_API, {
        access_qualification_id: Number(selectedQualification),
        status: permissionStatus,
        permissions: keepVisiblePermissions(normalizePermissions(selectedPermissions)),
      });
      notify("Permissions saved successfully");
      await loadRights(qualifications);
      setSelectedQualification("");
      setSelectedPermissions({});
      setPermissionStatus("Active");
    } catch (error) {
      notify(getErrorMessage(error, "Unable to save permissions"), "error");
    } finally {
      setSaving(false);
    }
  };

  const editSavedPermissions = async (right) => {
    await handleQualificationSelection(String(right.access_qualification_id));
    document.getElementById("role-permissions")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const deleteSavedPermissions = async (right) => {
    if (!window.confirm(`Remove all saved permissions for ${right.access_qualification_name}?`)) return;

    setSaving(true);
    try {
      await axios.delete(`${RIGHTS_API}/${right.access_qualification_id}`);
      if (String(selectedQualification) === String(right.access_qualification_id)) {
        setSelectedPermissions({});
        setPermissionStatus("Active");
      }
      notify("Permissions removed successfully");
      await loadRights(qualifications);
    } catch (error) {
      notify(getErrorMessage(error, "Unable to remove permissions"), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid">
      <section className="p-4 rounded mb-4">
        <h3 className="fw-semibold text-primary mb-1">Roles &amp; Access</h3>
        <p className="text-muted mb-4">Create a role, then select which user actions it may perform.</p>

        <form className="row g-3" onSubmit={handleSubmit}>
          <div className="col-md-4">
            <label htmlFor="qualification-name">Qualification Name</label>
            <input
              id="qualification-name"
              className="form-control"
              value={accessQualificationName}
              onChange={(event) => setAccessQualificationName(event.target.value)}
              placeholder="Example: Gate Operator"
              required
            />
          </div>
          <div className="col-md-3">
            <label htmlFor="qualification-role">Role name</label>
            <input
              id="qualification-role"
              className="form-control"
              value={userType}
              onChange={(event) => setUserType(event.target.value)}
              placeholder="Same as role name for a new role"
              list="existing-roles"
            />
            <datalist id="existing-roles">
              {availableRoles.map((role) => <option key={role} value={role} />)}
            </datalist>
          </div>
          <div className="col-md-3">
            <label htmlFor="qualification-status">Status *</label>
            <select
              id="qualification-status"
              className="form-select"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
          <div className="col-md-2 d-flex align-items-end gap-2">
            <button className="btn btn-primary flex-grow-1" type="submit" disabled={saving}>
              {editingId ? "Update" : "Create"}
            </button>
            {editingId && (
              <button className="btn btn-outline-secondary" type="button" onClick={resetQualificationForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="p-4 rounded mb-4">
        <h3 className="fw-semibold text-primary mb-3">Manage Roles</h3>
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Qualification Name</th>
                <th>Role</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="4" className="empty-state">Loading roles...</td></tr>}
              {!loading && qualifications.length === 0 && (
                <tr><td colSpan="4" className="empty-state">No roles found.</td></tr>
              )}
              {qualifications.map((qualification) => (
                <tr key={qualification.id}>
                  <td>{qualification.access_qualification_name}</td>
                  <td>{qualification.qualification_for}</td>
                  <td>
                    <span className={`badge ${qualification.status === "Active" ? "text-bg-success" : "text-bg-secondary"}`}>
                      {qualification.status}
                    </span>
                  </td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(qualification)} aria-label={`Edit ${qualification.access_qualification_name}`}>
                      <i className="bi bi-pencil" />
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(qualification.id)} aria-label={`Delete ${qualification.access_qualification_name}`}>
                      <i className="bi bi-trash" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="role-permissions" className="p-4 rounded">
        <h3 className="fw-semibold text-primary mb-1">Role Permissions</h3>
        <p className="text-muted mb-4">Choose the areas and actions available to users assigned to this role.</p>
        <div className="row g-3 mb-4">
          <div className="col-md-5">
              <label htmlFor="rights-qualification">Role *</label>
            <select id="rights-qualification" className="form-select" value={selectedQualification} onChange={(event) => handleQualificationSelection(event.target.value)}>
              <option value="">Select role</option>
              {qualifications.filter((qualification) => qualification.status === "Active").map((qualification) => (
                <option key={qualification.id} value={qualification.id}>
                  {qualification.access_qualification_name} — {qualification.qualification_for}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label htmlFor="rights-status">Status *</label>
            <select id="rights-status" className="form-select" value={permissionStatus} onChange={(event) => setPermissionStatus(event.target.value)}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>

        <div className="permission-grid">
          {permissionSections.map((section) => (
            <fieldset key={section.title} className="permission-group">
              <legend>{section.title.replaceAll("_", " ")}</legend>
              {section.items.length > 1 && (() => {
                const values = section.items.map((item) => typeof item === "string" ? item : item.value);
                const allSelected = values.every((value) => (selectedPermissions[section.title] || []).includes(value));
                return (
                  <div className="form-check mb-2 border-bottom pb-2">
                    <input
                      id={`${section.title}-select-all`}
                      type="checkbox"
                      className="form-check-input"
                      checked={allSelected}
                      onChange={() => toggleSectionPermissions(section.title, section.items)}
                    />
                    <label htmlFor={`${section.title}-select-all`} className="form-check-label fw-semibold">Select all</label>
                  </div>
                );
              })()}
              {section.items.map((item) => {
                const itemLabel = typeof item === "string" ? item : item.label;
                const itemValue = typeof item === "string" ? item : item.value;
                return <div key={itemValue} className="form-check">
                  <input
                    id={`${section.title}-${itemValue}`}
                    type="checkbox"
                    className="form-check-input"
                    checked={(selectedPermissions[section.title] || []).includes(itemValue)}
                    onChange={() => handlePermissionChange(section.title, itemValue)}
                  />
                  <label htmlFor={`${section.title}-${itemValue}`} className="form-check-label">{itemLabel}</label>
                </div>
              })}
            </fieldset>
          ))}
        </div>

        <div className="d-flex align-items-center gap-3 mt-4">
          <button className="btn btn-primary" onClick={handlePermissionSubmit} disabled={saving || !selectedQualification}>
            Save Permissions
          </button>
          <span className="text-muted">{selectedCount} permission{selectedCount === 1 ? "" : "s"} selected</span>
        </div>

        {assignedRights.length > 0 && (
          <div className="table-responsive mt-4">
            <table className="table align-middle">
              <thead><tr><th>Qualification</th><th>Role</th><th>Status</th><th>Granted rights</th><th className="text-end">Actions</th></tr></thead>
              <tbody>
                {assignedRights.map((right) => (
                  <tr key={right.access_qualification_id}>
                    <td>{right.access_qualification_name}</td>
                    <td>{right.qualification_for}</td>
                    <td><span className={`badge ${right.status === "Active" ? "text-bg-success" : "text-bg-secondary"}`}>{right.status}</span></td>
                    <td>{Object.values(right.permissions || {}).reduce((sum, items) => sum + items.length, 0)}</td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => editSavedPermissions(right)} disabled={saving}>
                        <i className="bi bi-pencil" /> Edit
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => deleteSavedPermissions(right)} disabled={saving}>
                        <i className="bi bi-trash" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default UsersRight;
