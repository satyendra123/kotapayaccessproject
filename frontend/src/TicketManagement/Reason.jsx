import React, { useEffect, useState } from "react";
import axios from "axios";
const API_PATH = process.env.REACT_APP_API_PATH;
const API_URL = `${API_PATH}/api/reasons/`;

const Reason = () => {
  const [reasonName, setReasonName] = useState("");
  const [status, setStatus] = useState("");
  const [reasons, setReasons] = useState([]);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});

  const access_token = localStorage.getItem("access_token");

  const headers = {
    Authorization: `Bearer ${access_token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // ================= FETCH REASONS =================
  useEffect(() => {
    fetchReasons();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReasons = () => {
    axios
      .get(API_URL, { headers })
      .then((res) => setReasons(res.data))
      .catch((err) => console.error("Fetch error:", err));
  };

  // ================= VALIDATION =================
  const validate = () => {
    const newErrors = {};
    if (!reasonName.trim()) newErrors.reason = "Reason name is required";
    if (!status) newErrors.status = "Status is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ================= CREATE / UPDATE =================
  const handleSubmit = () => {
    if (!validate()) return;

    const payload = {
      reason: reasonName,
      status: status.toLowerCase(),
    };

    const request = editId
      ? axios.put(`${API_URL}${editId}/`, payload, { headers })
      : axios.post(API_URL, payload, { headers });

    request
      .then(() => {
        alert(editId ? "Reason updated successfully" : "Reason created successfully");
        resetForm();
        fetchReasons();
      })
      .catch((err) => {
        console.error("Submit error:", err);
        alert("Operation failed");
      });
  };

  // ================= EDIT =================
  const handleEdit = (reason) => {
    setEditId(reason.id);
    setReasonName(reason.reason);
    setStatus(reason.status);
  };

  // ================= DELETE =================
  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this reason?")) return;

    axios
      .delete(`${API_URL}${id}/`, { headers })
      .then(() => {
        alert("Reason deleted successfully");
        fetchReasons();
      })
      .catch((err) => {
        console.error("Delete error:", err);
        alert("Delete failed");
      });
  };

  const resetForm = () => {
    setReasonName("");
    setStatus("");
    setEditId(null);
    setErrors({});
  };

  return (
    <div
      className="container-fluid p-4"
      style={{ backgroundColor: "#4B52A6", minHeight: "100vh" }}
    >
      {/* HEADER */}
      <h3 className="fw-bold text-warning mb-4">Register Reason</h3>

      {/* FORM */}
      <div className="row g-3">
        <div className="col-md-4 col-sm-6">
          <label className="text-dark fw-bold">Reason Name *</label>
          <input
            type="text"
            className={`form-control ${errors.reason ? "is-invalid" : ""}`}
            placeholder="Enter Reason Name"
            value={reasonName}
            onChange={(e) => setReasonName(e.target.value)}
          />
          <div className="invalid-feedback">{errors.reason}</div>
        </div>

        <div className="col-md-6 col-sm-6">
          <label className="text-dark fw-bold">Status *</label>
          <select
            className={`form-select ${errors.status ? "is-invalid" : ""}`}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Select Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="invalid-feedback">{errors.status}</div>
        </div>

        <div className="col-md-2 col-sm-6 d-flex align-items-end">
          <button className="btn btn-danger w-100" onClick={handleSubmit}>
            {editId ? "Update" : "Submit"}
          </button>
        </div>
      </div>

      {/* MANAGE TABLE */}
      <div className="mt-5">
        <h3 className="fw-bold text-warning mb-3">Manage Reason</h3>

        <div className="table-responsive">
          <table className="table table-bordered align-middle text-dark">
            <thead className="text-center">
              <tr>
                <th>Reason Name</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {reasons.length === 0 ? (
                <tr className="text-center">
                  <td colSpan="3">No data found</td>
                </tr>
              ) : (
                reasons.map((item) => (
                  <tr key={item.id} className="text-center">
                    <td>{item.reason}</td>
                    <td>
                      <span
                        className={`badge ${
                          item.status === "active" ? "bg-success" : "bg-secondary"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary me-2"
                        onClick={() => handleEdit(item)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(item.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reason;
