import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { canAccess } from "../auth/permissions";
const API_PATH = process.env.REACT_APP_API_PATH;
const API_BASE = `${API_PATH}/api/shifts`;
const ShiftManagement = () => {
  const [shiftname, setShiftname] = useState("");
  const [shiftstarttime, setShiftstarttime] = useState("");
  const [shiftendtime, setShiftendtime] = useState("");
  const [status, setStatus] = useState("");
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const canCreateShift = canAccess(["shifts.create", "manage_shifts"]);
  const canEditShift = canAccess(["shifts.edit", "manage_shifts"]);
  const canDeleteShift = canAccess(["shifts.delete", "manage_shifts"]);
  const token = localStorage.getItem("access_token");
  const axiosAuth = axios.create({
    baseURL: API_BASE,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  // Add response interceptor for better error handling
  axiosAuth.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error("API Error:", error);
      return Promise.reject(error);
    }
  );
  const fetchShifts = async () => {
    try {
      setLoading(true);
      const res = await axiosAuth.get("/");
      setShifts(res.data);
    } catch (err) {
      console.error("Error fetching shifts:", err);
      if (err.response && err.response.status === 401) {
        alert("Session expired. Please login again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shiftname || !shiftstarttime || !shiftendtime || !status) {
      alert("Please fill all required fields");
      return;
    }
    try {
      await axiosAuth.post("/", {
        shiftname,
        shiftstarttime,
        shiftendtime,
        status,
      });
      alert("Shift added successfully!");
      setShiftname("");
      setShiftstarttime("");
      setShiftendtime("");
      setStatus("");
      fetchShifts();
    } catch (err) {
      console.error("Error adding shift:", err);
      if (err.response) {
        alert(`Error: ${err.response.data?.detail || "Failed to add shift"}`);
      } else {
        alert("Network error. Please try again.");
      }
    }
  };

  useEffect(() => {
    if (!token) {
      alert("You are not logged in. Please log in first.");
      return;
    }
    fetchShifts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEdit = async (id) => {
    try {
      const res = await axiosAuth.get(`/${id}`);
      const shiftData = res.data;
      setShiftname(shiftData.shiftname);
      setShiftstarttime(shiftData.shiftstarttime);
      setShiftendtime(shiftData.shiftendtime);
      setStatus(shiftData.status);
      setEditId(id);
      setShowModal(true);
    } catch (err) {
      console.error("Error fetching shift for edit:", err);
      if (err.response) {
        alert(`Error: ${err.response.data?.detail || "Failed to fetch shift data"}`);
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!shiftname || !shiftstarttime || !shiftendtime || !status) {
      alert("Please fill all required fields");
      return;
    }
    try {
      await axiosAuth.put(`/${editId}`, {
        shiftname,
        shiftstarttime,
        shiftendtime,
        status,
      });
      alert("Shift updated successfully!");
      setShowModal(false);
      setEditId(null);
      fetchShifts();
    } catch (err) {
      console.error("Error updating shift:", err);
      if (err.response) {
        alert(`Error: ${err.response.data?.detail || "Failed to update shift"}`);
      }
    }
  };

  const handleDelete = async (id) => {
    const shiftToDelete = shifts.find(s => s.id === id);
    
    if (!shiftToDelete) {
      alert("Shift not found!");
      return;
    }
    
    const shiftName = shiftToDelete.shiftname || `ID: ${id}`;
    // All shifts can now be permanently deleted by the API, including their
    // linked tariff and ticket test data.
    const isSystemShift = false;
    
    let message = `Delete Shift: ${shiftName}\n\n`;
    
    if (isSystemShift) {
      message += "⚠️ This is a system shift and cannot be permanently deleted.\n";
      message += "Would you like to mark it as inactive instead?";
      
      if (window.confirm(message)) {
        try {
          await axiosAuth.put(`/${id}`, {
            shiftname: shiftToDelete.shiftname,
            shiftstarttime: shiftToDelete.shiftstarttime,
            shiftendtime: shiftToDelete.shiftendtime,
            status: "Inactive"
          });
          alert("Shift marked as inactive.");
          fetchShifts();
        } catch (err) {
          console.error("Error marking shift as inactive:", err);
          if (err.response) {
            alert(`Failed to update: ${err.response.data?.message || err.message}`);
          } else {
            alert("Network error. Please try again.");
          }
        }
      }
    } else {
      message += "This permanently deletes linked tariffs, tickets, and ticket records.\n\nAre you sure you want to continue?";
      
      if (window.confirm(message)) {
        try {
          setDeletingId(id);
          await axiosAuth.delete(`/${id}`);
          alert("Shift deleted successfully!");
          fetchShifts();
        } catch (err) {
          console.error("Error deleting shift:", err);
          const status = err.response?.status;
          const errorMsg = err.response?.data?.detail || err.message;
          
          // A 409 now means an unexpected dependency; never silently change
          // the requested permanent deletion into an inactive shift.
          if (status === 409 && false) {
            if (window.confirm(
              `Cannot delete - this shift is currently in use.\n\n` +
              `Error: ${errorMsg}\n\n` +
              `Would you like to mark it as inactive instead?`
            )) {
              try {
                await axiosAuth.put(`/${id}`, {
                  shiftname: shiftToDelete.shiftname,
                  shiftstarttime: shiftToDelete.shiftstarttime,
                  shiftendtime: shiftToDelete.shiftendtime,
                  status: "Inactive"
                });
                alert("Shift marked as inactive.");
                fetchShifts();
              } catch (updateErr) {
                alert(`Failed to mark as inactive: ${updateErr.response?.data?.detail || updateErr.message}`);
              }
            }
          } else {
            alert(`Delete failed: ${errorMsg}`);
          }
        } finally {
          setDeletingId(null);
        }
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditId(null);
    setShiftname("");
    setShiftstarttime("");
    setShiftendtime("");
    setStatus("");
  };

  return (
    <div className="container my-4">
      {/* Shift Management */}
      {canCreateShift && <div className="p-4 rounded" style={{ background: "#4a4bc2" }}>
        <h4 className="mb-3" style={{ color: "#ff5858" }}>
          <b>Shifts Management</b>
        </h4>
        <form className="row g-3 align-items-end" onSubmit={handleSubmit}>
          <div className="col-md-3">
            <label className="form-label text-dark">
              Shift Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter Shift Name"
              value={shiftname}
              onChange={(e) => setShiftname(e.target.value)}
              required
            />
          </div>

          <div className="col-md-2">
            <label className="form-label text-dark">
              Shift Start Time <span className="text-danger">*</span>
            </label>
            <input
              type="time"
              className="form-control"
              value={shiftstarttime}
              onChange={(e) => setShiftstarttime(e.target.value)}
              required
            />
          </div>

          <div className="col-md-2">
            <label className="form-label text-dark">
              Shift End Time <span className="text-danger">*</span>
            </label>
            <input
              type="time"
              className="form-control"
              value={shiftendtime}
              onChange={(e) => setShiftendtime(e.target.value)}
              required
            />
          </div>

          <div className="col-md-3">
            <label className="form-label text-dark">
              Status <span className="text-danger">*</span>
            </label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
            >
              <option value="">Select Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="col-md-2">
            <button
              type="submit"
              className="btn w-100"
              style={{ background: "#ff5858", color: "white" }}
            >
              Submit
            </button>
          </div>
        </form>
      </div>}

      {/* List of Registered Shifts */}
      <div className="p-4 rounded mt-4" style={{ background: "#4a4bc2" }}>
        <h4 className="mb-3" style={{ color: "#ff5858" }}>
          <b>List of Registered Shifts</b>
        </h4>
        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle">
            <thead
              style={{
                background: "#1f1f1f",
                color: "white",
                textAlign: "center",
              }}
            >
              <tr>
                <th>ID</th>
                <th>Shift Name</th>
                <th>Start and End Time</th>
                <th>Status</th>
                {(canEditShift || canDeleteShift) && <th>Action</th>}
              </tr>
            </thead>
            <tbody className="text-center">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center text-dark">
                    <div className="spinner-border spinner-border-sm text-light me-2"></div>
                    Loading...
                  </td>
                </tr>
              ) : shifts.length > 0 ? (
                shifts.map((shift, index) => (
                  <tr key={shift.id}>
                   
                    <td>
                      {shift.id}
                      {shift.id === 1 && (
                        <span className="badge bg-info ms-1" title="System Shift">System</span>
                      )}
                    </td>
                    <td>{shift.shiftname}</td>
                    <td>
                      {shift.shiftstarttime} - {shift.shiftendtime}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          shift.status === "Active"
                            ? "bg-success"
                            : "bg-danger"
                        }`}
                      >
                        {shift.status}
                      </span>
                    </td>
                    {(canEditShift || canDeleteShift) && <td>
                      {canEditShift && <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => handleEdit(shift.id)}
                        title="Edit"
                      >
                        <i className="bi bi-pencil"></i> Edit
                      </button>}
                      {canDeleteShift && <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(shift.id)}
                        title="Delete"
                        disabled={deletingId === shift.id}
                      >
                        <i className="bi bi-trash"></i> {deletingId === shift.id ? "Deleting..." : "Delete"}
                      </button>}
                    </td>}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-dark">
                    No shifts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Edit Shift {editId === 1 && "(System Shift)"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <form onSubmit={handleUpdate}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">
                      Shift Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={shiftname}
                      onChange={(e) => setShiftname(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      Shift Start Time <span className="text-danger">*</span>
                    </label>
                    <input
                      type="time"
                      className="form-control"
                      value={shiftstarttime}
                      onChange={(e) => setShiftstarttime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      Shift End Time <span className="text-danger">*</span>
                    </label>
                    <input
                      type="time"
                      className="form-control"
                      value={shiftendtime}
                      onChange={(e) => setShiftendtime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      Status <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      required
                    >
                      <option value="">Select Status</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  {editId === 1 && (
                    <div className="alert alert-info">
                      <small>
                        <i className="bi bi-info-circle me-1"></i>
                        This is a system shift. It cannot be permanently deleted but can be marked as inactive.
                      </small>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update Shift
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftManagement;
