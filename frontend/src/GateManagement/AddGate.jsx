import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { canAccess } from "../auth/permissions";

// Import Roboto font
const robotoFont = document.createElement("link");
robotoFont.href =
  "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap";
robotoFont.rel = "stylesheet";
document.head.appendChild(robotoFont);
const API_PATH = process.env.REACT_APP_API_PATH;

export default function GateRegistration() {
  const [gates, setGates] = useState([]);
  const [gateNo, setGateNo] = useState("");
  const [gateName, setGateName] = useState("");
  const [status, setStatus] = useState("");

  // Edit modal states
  const [editId, setEditId] = useState(null);
  const [editGateNo, setEditGateNo] = useState("");
  const [editGateName, setEditGateName] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const API_URL = `${API_PATH}/api/gates/`;
  const token = localStorage.getItem("access_token");
  const canCreateGate = canAccess(["gates.create", "manage_gates"]);
  const canEditGate = canAccess(["gates.edit", "manage_gates"]);
  const canDeleteGate = canAccess(["gates.delete", "manage_gates"]);

  const fontStyle = { fontFamily: "'Roboto', sans-serif", fontSize: "14px" };
  const headingStyle = { fontFamily: "'Roboto', sans-serif", fontWeight: 700 };
  const labelStyle = {
    fontFamily: "'Roboto', sans-serif",
    fontWeight: 500,
    fontSize: "14px",
  };
  const inputStyle = { fontFamily: "'Roboto', sans-serif", fontSize: "14px" };
  const sectionStyle = {
    backgroundColor: "#463bb3",
    color: "white",
    ...fontStyle,
  };

  // Fetch registered gates
  const fetchGates = async () => {
    try {
      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch gates");
      const data = await response.json();
      setGates(data);
    } catch (err) {
      console.error("Error fetching gates:", err);
      alert("Failed to fetch gates");
    }
  };

  useEffect(() => {
    fetchGates();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Add gate
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newGate = {
      gate_no: gateNo,
      gate_name: gateName,
      status: status,
    };
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify(newGate),
      });
      if (response.ok) {
        alert("Gate registered successfully!");
        setGateNo("");
        setGateName("");
        setStatus("");
        fetchGates();
      } else {
        const errData = await response.json();
        alert("Error: " + JSON.stringify(errData));
      }
    } catch (err) {
      console.error("Error posting gate:", err);
      alert("Failed to register gate");
    }
  };

  // Delete gate
  const handleDelete = async (gateId) => {
    if (!window.confirm("Are you sure you want to delete this gate?")) return;
    try {
      const response = await fetch(`${API_URL}${gateId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        alert("Gate deleted successfully");
        fetchGates();
      } else {
        const error = await response.json().catch(() => ({}));
        alert(error.detail || error.message || "Failed to delete gate");
      }
    } catch (err) {
      console.error("Error deleting gate:", err);
      alert("Failed to delete gate");
    }
  };

  // Open edit modal
  const handleEdit = async (id) => {
    try {
      const response = await fetch(`${API_URL}${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch gate details");
      const data = await response.json();
      setEditId(id);
      setEditGateNo(data.gate_no);
      setEditGateName(data.gate_name);
      setEditStatus(data.status);
      // Show modal
      const modal = new window.bootstrap.Modal(
        document.getElementById("editModal")
      );
      modal.show();
    } catch (err) {
      console.error("Error fetching gate details:", err);
      alert("Failed to load gate details");
    }
  };

  // Update gate
  const handleUpdate = async (e) => {
    e.preventDefault();
    const updatedGate = {
      gate_no: editGateNo,
      gate_name: editGateName,
      status: editStatus,
    };
    try {
      const response = await fetch(`${API_URL}${editId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify(updatedGate),
      });
      if (response.ok) {
        alert("Gate updated successfully!");
        fetchGates();
        document.getElementById("editCloseBtn").click();
      } else {
        const errData = await response.json();
        alert("Error: " + JSON.stringify(errData));
      }
    } catch (err) {
      console.error("Error updating gate:", err);
      alert("Failed to update gate");
    }
  };

  return (
    <div className="container my-4" style={fontStyle}>
      {/* Register Gate Form */}
      {canCreateGate && <div className="p-4 rounded shadow-sm" style={sectionStyle}>
        <h4 className="mb-4" style={headingStyle}>
          Register Gate
        </h4>
        <form className="row g-3" onSubmit={handleSubmit}>
          <div className="col-md-4">
            <label className="form-label" style={labelStyle}>
              Gate No. *
            </label>
            <input
              type="text"
              className="form-control"
              style={inputStyle}
              value={gateNo}
              onChange={(e) => setGateNo(e.target.value)}
              placeholder="Enter Gate No."
              required
            />
          </div>
          <div className="col-md-4">
            <label className="form-label" style={labelStyle}>
              Gate Name *
            </label>
            <input
              type="text"
              className="form-control"
              style={inputStyle}
              value={gateName}
              onChange={(e) => setGateName(e.target.value)}
              placeholder="Enter Gate Name"
              required
            />
          </div>
          <div className="col-md-4">
            <label className="form-label" style={labelStyle}>
              Status *
            </label>
            <select
              className="form-select"
              style={inputStyle}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
            >
              <option value="">Select Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="col-md-12 d-flex gap-2">
            <button type="submit" className="btn btn-warning fw-bold">
              Submit
            </button>
            <button type="reset" className="btn btn-danger fw-bold">
              Cancel
            </button>
          </div>
        </form>
      </div>}

      {/* Registered Gates Table */}
      <div className="mt-4 p-4 rounded shadow-sm" style={sectionStyle}>
        <h4 className="mb-4" style={headingStyle}>
          Registered Gate's
        </h4>
        <div
          className="table-responsive"
          style={{ maxHeight: "400px", overflowY: "auto" }}
        >
          <table
            className="table table-bordered align-middle text-center mb-0"
            style={{ backgroundColor: "white", color: "black", ...fontStyle }}
          >
            <thead style={{ backgroundColor: "#f1f1f1" }}>
              <tr>
                <th>#</th>
                <th>Gate No.</th>
                <th>Gate Name</th>
                <th>Status</th>
                {(canEditGate || canDeleteGate) && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {gates.length > 0 ? (
                gates.map((gate, index) => (
                  <tr key={gate.id}>
                    <td>{index + 1}</td>
                    <td>{gate.gate_no}</td>
                    <td>{gate.gate_name}</td>
                    <td>
                      <span
                        className={`badge ${
                          gate.status === "Active"
                            ? "bg-success"
                            : "bg-secondary"
                        }`}
                      >
                        {gate.status}
                      </span>
                    </td>
                    {(canEditGate || canDeleteGate) && <td>
                      {canEditGate && <button
                        className="btn btn-sm btn-warning me-2"
                        onClick={() => handleEdit(gate.id)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>}
                      {canDeleteGate && <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(gate.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>}
                    </td>}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No gates registered</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {canEditGate && <div
        className="modal fade"
        id="editModal"
        tabIndex="-1"
        aria-labelledby="editModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content" style={fontStyle}>
            <div className="modal-header">
              <h5 className="modal-title" id="editModalLabel">
                Edit Gate
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                id="editCloseBtn"
              ></button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Gate No.</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editGateNo}
                    onChange={(e) => setEditGateNo(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Gate Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editGateName}
                    onChange={(e) => setEditGateName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-warning">
                  Update
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>}
    </div>
  );
}
