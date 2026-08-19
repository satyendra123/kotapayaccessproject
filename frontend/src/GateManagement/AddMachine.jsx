import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { getErrorMessage } from "../services/http";
import { canAccess } from "../auth/permissions";
import "./AddMachine.css";
  const API_PATH = process.env.REACT_APP_API_PATH;

export default function MachineConfig() {
  const [gates, setGates] = useState([]);
  const [machineList, setMachineList] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const [formData, setFormData] = useState({
    gate_id: "",
    machine_uid: "",
    machine_name: "",
    machine_ip: "",
    machine_type: "",
    location: "",
    lane_no: "",
    start_time: "",
    end_time: "",
    status: "",
  });

  const token = localStorage.getItem("access_token");
  const canCreateMachine = canAccess(["machines.create", "manage_gate_machines"]);
  const canEditMachine = canAccess(["machines.edit", "manage_gate_machines"]);
  const canDeleteMachine = canAccess(["machines.delete", "manage_gate_machines"]);

  // Fetch gate list
  useEffect(() => {
    axios
      .get(`${API_PATH}/api/gates/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
      .then((response) => {
        setGates(response.data);
      })
      .catch((error) => {
        console.error("Error fetching gates:", error);
      });
  }, [token]);

  // Fetch machine list
  const fetchMachineList = () => {
    axios
      .get(`${API_PATH}/api/gate-machines/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
      .then((res) => setMachineList(res.data))
      .catch((err) => console.error("Error fetching machines:", err));
  };
  useEffect(() => {
    fetchMachineList();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_PATH}/api/gate-machines/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      alert("Machine configuration submitted successfully.");

      // Clear form
      setFormData({
        gate_id: "",
        machine_uid: "",
        machine_name: "",
        machine_ip: "",
        machine_type: "",
        location: "",
        lane_no: "",
        start_time: "",
        end_time: "",
        status: "",
      });

      // Refresh machine list
      fetchMachineList();
    } catch (error) {
      console.error("Error submitting machine configuration:", error);
      alert(getErrorMessage(error, "Unable to create machine"));
    }
  };

  const getGateName = (gateId) => {
    const gate = gates.find((g) => g.id === gateId);
    return gate ? gate.gate_name : gateId;
  };
   const handleEditClick = async (id) => {
      try {
        const response = await axios.get(`${API_PATH}/api/gate-machines/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        setEditData(response.data);
        setShowEditModal(true);
      } catch (error) {
        console.error("Error fetching machine data:", error);
        alert(getErrorMessage(error, "Unable to load machine data"));
      }
    };

    const handleUpdate = async () => {
      try {
        const payload = {
          gate_id: Number(editData.gate_id),
          machine_uid: editData.machine_uid,
          machine_name: editData.machine_name,
          machine_ip: editData.machine_ip,
          machine_type: editData.machine_type,
          location: editData.location,
          lane_no: editData.lane_no,
          start_time: editData.start_time,
          end_time: editData.end_time,
          status: editData.status,
        };

        await axios.put(`${API_PATH}/api/gate-machines/${editData.id}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        alert("Machine updated successfully.");
        setShowEditModal(false);
        setEditData(null);
        fetchMachineList(); // refresh the list
      } catch (error) {
        console.error("Error updating machine:", error);
        alert(getErrorMessage(error, "Unable to update machine"));
      }
    };

    const handleDelete = async (id) => {
      const confirmDelete = window.confirm("Are you sure you want to delete this machine?");
      if (!confirmDelete) return;

      try {
        await axios.delete(`${API_PATH}/api/gate-machines/${id}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        alert("Machine deleted successfully.");
        fetchMachineList(); // Refresh list
      } catch (error) {
        console.error("Error deleting machine:", error);
        alert(getErrorMessage(error, "Unable to delete machine"));
      }
    };


  return (
    <div className="machine-config-page">
      <div className="container-fluid machine-config-container">

      <h4 className="machine-config-title">Machine Configuration</h4>

      {canCreateMachine && <form className="row g-3 machine-config-form" onSubmit={handleSubmit}>
        <div className="col-md-3">
          <label className="form-label" style={{ fontSize: "14px" }}>
            Select Gate *
          </label>
          <select
            className="form-select"
            name="gate_id"
            value={formData.gate_id}
            onChange={handleChange}
          >
            <option value="">Select Gate</option>
            {gates.map((gate) => (
              <option key={gate.id} value={gate.id}>
                {gate.gate_name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-3">
          <label className="form-label" style={{ fontSize: "14px" }}>
            Machine IP Address *
          </label>
          <input
            type="text"
            className="form-control"
            name="machine_ip"
            placeholder="e.g. 192.168.1.10"
            value={formData.machine_ip}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-3">
          <label className="form-label" style={{ fontSize: "14px" }}>
            Machine Name *
          </label>
          <input
            type="text"
            className="form-control"
            name="machine_name"
            placeholder="Enter Machine Name"
            value={formData.machine_name}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-3">
          <label className="form-label" style={{ fontSize: "14px" }}>
            Machine Unique ID *
          </label>
          <input
            type="text"
            className="form-control"
            name="machine_uid"
            placeholder="Enter Unique ID"
            value={formData.machine_uid}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-3">
          <label className="form-label" style={{ fontSize: "14px" }}>
            Machine Lane No. *
          </label>
          <input
            type="text"
            className="form-control"
            name="lane_no"
            placeholder="Enter Lane No."
            value={formData.lane_no}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-3">
          <label className="form-label" style={{ fontSize: "14px" }}>
            Machine Location *
          </label>
          <input
            type="text"
            className="form-control"
            name="location"
            placeholder="Enter Location"
            value={formData.location}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-3">
          <label className="form-label" style={{ fontSize: "12px" }}>
            Machine Type (IN/OUT or IN + OUT)
          </label>
          <select
            className="form-select"
            name="machine_type"
            value={formData.machine_type}
            onChange={handleChange}
          >
            <option value="">Select Machine Type</option>
            <option value="IN/OUT">IN/OUT</option>
            <option value="IN + OUT">IN + OUT</option>
            <option value="RFID Reader">RFID Reader</option>
            <option value="Barrier">Barrier</option>
          </select>
        </div>

        <div className="col-md-2">
          <label className="form-label" style={{ fontSize: "14px" }}>
            Machine Start Time *
          </label>
          <input
            type="time"
            className="form-control"
            name="start_time"
            value={formData.start_time}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-2">
          <label className="form-label" style={{ fontSize: "14px" }}>
            Machine End Time *
          </label>
          <input
            type="time"
            className="form-control"
            name="end_time"
            value={formData.end_time}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-2">
          <label className="form-label" style={{ fontSize: "14px" }}>
            Status *
          </label>
          <select
            className="form-select"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="">Select Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="col-md-12 text-end">
          <button type="submit" className="btn btn-danger px-4">
            Submit
          </button>
        </div>
      </form>}

      {/* Machine List Table */}
      <section className="machine-list-section">
      <h4 className="machine-list-title">Manage Housys Entry/Exit Machine</h4>
      <div className="machine-table-wrapper">
        <table className="table machine-table align-middle mb-0">
          <thead>
            <tr>
              <th>Gate ID</th>
              <th>Gate</th>
              <th>Machine Unique No.</th>
              <th>Machine Name</th>
              <th>Machine IP Address</th>
              <th>Machine Location</th>
              <th>Machine Lane No.</th>
              <th>Start and End Time</th>
              <th>Status</th>
              {(canEditMachine || canDeleteMachine) && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {machineList.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center">
                  No machines found.
                </td>
              </tr>
            ) : (
              machineList.map((m) => (
                <tr key={m.id}>
                  <td data-label="Gate ID">{m.gate_id}</td>
                  <td data-label="Gate">{getGateName(m.gate_id)}</td>
                  <td data-label="Machine Unique No.">{m.machine_uid}</td>
                  <td data-label="Machine Name">{m.machine_name}</td>
                  <td data-label="Machine IP Address">{m.machine_ip || "-"}</td>
                  <td data-label="Machine Location">{m.location}</td>
                  <td data-label="Machine Lane No.">{m.lane_no}</td>
                  <td data-label="Start and End Time">{m.start_time} - {m.end_time}</td>
                  <td data-label="Status">
                    <span className={`badge ${m.status === "Active" ? "bg-success" : "bg-secondary"}`}>
                      {m.status}
                    </span>
                  </td>
                  {(canEditMachine || canDeleteMachine) && <td data-label="Action" className="machine-actions">
                    {canEditMachine && <button className="btn btn-sm btn-primary me-2" onClick={() => handleEditClick(m.id)}>
                      <i className="bi bi-pencil"></i>
                    </button>}

                    {canDeleteMachine && <button className="btn btn-sm btn-danger" onClick={() => handleDelete(m.id)}>
                      <i className="bi bi-trash"></i>
                    </button>}

                  </td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </section>
      {canEditMachine && showEditModal && editData && (
        <div className="modal show fade d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Machine</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Gate</label>
                    <select
                      className="form-select"
                      value={editData.gate_id}
                      onChange={(e) => setEditData({ ...editData, gate_id: e.target.value })}
                    >
                      {gates.map((gate) => (
                        <option key={gate.id} value={gate.id}>{gate.gate_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Machine Type</label>
                    <select
                      className="form-select"
                      value={editData.machine_type}
                      onChange={(e) => setEditData({ ...editData, machine_type: e.target.value })}
                    >
                      <option value="IN/OUT">IN/OUT</option>
                      <option value="IN + OUT">IN + OUT</option>
                      <option value="RFID Reader">RFID Reader</option>
                      <option value="Barrier">Barrier</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Machine Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editData.machine_name}
                      onChange={(e) => setEditData({ ...editData, machine_name: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Machine UID</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editData.machine_uid}
                      onChange={(e) => setEditData({ ...editData, machine_uid: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Machine IP Address</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editData.machine_ip || ""}
                      onChange={(e) => setEditData({ ...editData, machine_ip: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editData.location}
                      onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Lane No.</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editData.lane_no}
                      onChange={(e) => setEditData({ ...editData, lane_no: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Start Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={editData.start_time}
                      onChange={(e) => setEditData({ ...editData, start_time: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">End Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={editData.end_time}
                      onChange={(e) => setEditData({ ...editData, end_time: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={editData.status}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleUpdate}>
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
