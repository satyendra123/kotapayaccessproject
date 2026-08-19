import React, { useEffect, useState } from "react";
import axios from "axios";
import { getErrorMessage } from "../services/http";
const API_PATH = process.env.REACT_APP_API_PATH;

const SetValueTeriff = () => {
  const [formData, setFormData] = useState({
    servicename: "",
    servicefor: "",
    price: "",
    shift_id: "",
    status: "",
    discountedprice: "",
  });

  const [shifts, setShifts] = useState([]);
  const [tariffs, setTariffs] = useState([]);
  const [editId, setEditId] = useState(null);

  /* =========================
     HANDLE INPUT CHANGE
  ========================= */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /* =========================
     FETCH SHIFTS
  ========================= */
  const fetchShifts = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const res = await axios.get(`${API_PATH}/api/shifts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setShifts(res.data);
    } catch (err) {
      console.error("Shift fetch error", err);
      alert(getErrorMessage(err, "Unable to load shifts"));
    }
  };

  /* =========================
     FETCH TARIFFS
  ========================= */
  const fetchTariffs = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const res = await axios.get(
        `${API_PATH}/api/tariffs/`,
        {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTariffs(res.data);
    } catch (err) {
      console.error("Tariff fetch error", err);
      alert(getErrorMessage(err, "Unable to load tariffs"));
    }
  };

  useEffect(() => {
    fetchShifts();
    fetchTariffs();
  }, []);

  /* =========================
     CREATE TARIFF
  ========================= */
  const handleSubmit = async () => {
    const token = localStorage.getItem("access_token");

    try {
      await axios.post(
        `${API_PATH}/api/tariffs/`,
        {
          servicename: formData.servicename,
          servicefor: formData.servicefor,
          price: Number(formData.price),
          shift_id: Number(formData.shift_id),
          status: formData.status,
          discountedprice: Number(formData.discountedprice),
        },
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Tariff added successfully");

      fetchTariffs();

      setFormData({
        servicename: "",
        servicefor: "",
        price: "",
        shift_id: "",
        status: "",
        discountedprice: "",
      });
    } catch (err) {
      console.error(err);
      alert(getErrorMessage(err, "Unable to add tariff"));
    }
  };

  /* =========================
     EDIT TARIFF
  ========================= */
  const handleEdit = (item) => {
    setFormData({
      servicename: item.servicename,
      servicefor: item.servicefor,
      price: item.price,
      shift_id: item.shift_id,
      status: item.status,
      discountedprice: item.discountedprice,
    });

    setEditId(item.id);
  };

  /* =========================
     UPDATE TARIFF
  ========================= */
  const handleUpdate = async () => {
    const token = localStorage.getItem("access_token");

    try {
      await axios.put(
        `${API_PATH}/api/tariffs/${editId}`,
        {
          servicename: formData.servicename,
          servicefor: formData.servicefor,
          price: Number(formData.price),
          shift_id: Number(formData.shift_id),
          status: formData.status,
          discountedprice: Number(formData.discountedprice),
        },
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Tariff updated successfully");

      fetchTariffs();
      setEditId(null);

      setFormData({
        servicename: "",
        servicefor: "",
        price: "",
        shift_id: "",
        status: "",
        discountedprice: "",
      });
    } catch (error) {
      console.error("Update error:", error);
      alert(getErrorMessage(error, "Unable to update tariff"));
    }
  };

  /* =========================
     DELETE TARIFF
  ========================= */
  const handleDelete = async (id) => {
    const token = localStorage.getItem("access_token");

    if (!window.confirm("Are you sure you want to delete this tariff?"))
      return;

    try {
      await axios.delete(
        `${API_PATH}/api/tariffs/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Tariff deleted successfully");
      fetchTariffs();
    } catch (err) {
      console.error("Delete error", err);
      alert(getErrorMessage(err, "Unable to delete tariff"));
    }
  };

  /* =========================
     SHIFT LABEL
  ========================= */
  const getShiftLabel = (shiftId) => {
    const shift = shifts.find((s) => s.id === shiftId);
    return shift
      ? `${shift.shiftname}:${shift.shiftstarttime}-${shift.shiftendtime}`
      : "N/A";
  };

  return (
    <div
      className="container-fluid p-4"
      style={{ backgroundColor: "#4B52A6", minHeight: "100vh" }}
    >
      <h3 className="fw-bold text-warning mb-4">
        Tariffs Information
      </h3>

      {/* ================= FORM ================= */}

      <div className="row g-3">
        <div className="col-md-3">
          <label className="text-dark fw-bold">
            Service Name *
          </label>
          <input
            className="form-control"
            name="servicename"
            value={formData.servicename}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-3">
          <label className="text-dark fw-bold">Shift *</label>
          <select
            className="form-select"
            name="shift_id"
            value={formData.shift_id}
            onChange={handleChange}
          >
            <option value="">Select Shift</option>

            {shifts.map((shift) => (
              <option key={shift.id} value={shift.id}>
                {shift.shiftname}:{shift.shiftstarttime}-
                {shift.shiftendtime}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-3">
          <label className="text-dark fw-bold">
            Service For *
          </label>
          <select
            className="form-select"
            name="servicefor"
            value={formData.servicefor}
            onChange={handleChange}
          >
            <option value="">Select</option>
            <option value="INDIAN">Indian Visitor</option>
            <option value="FOREIGNER">
              Foreigner Visitor
            </option>
            <option value="Student">Student</option>
            <option value="Student Group">
              Student Group
            </option>
            <option value="Pre Wedding">
              Pre Wedding
            </option>
            <option value="GOLF">
              Indian Golf Court
            </option>
          </select>
        </div>

        <div className="col-md-2">
          <label className="text-dark fw-bold">
            Price *
          </label>
          <input
            type="number"
            className="form-control"
            name="price"
            value={formData.price}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-2">
          <label className="text-dark fw-bold">
            Status *
          </label>
          <select
            className="form-select"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="">Select</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="col-md-1 d-flex align-items-end">
          <button
            type="button"
            className={`btn w-100 ${
              editId ? "btn-primary" : "btn-danger"
            }`}
            onClick={editId ? handleUpdate : handleSubmit}
          >
            {editId ? "Update" : "Submit"}
          </button>
        </div>
      </div>

      {/* ================= TABLE ================= */}

      <div className="mt-5">
        <h3 className="fw-bold text-warning mb-3">
          Manage Set Value (Tariffs)
        </h3>

        <div className="table-responsive">
          <table className="table table-bordered align-middle text-dark">
            <thead className="text-center">
              <tr>
                <th>#</th>
                <th>Service Name</th>
                <th>Service For</th>
                <th>Shift</th>
                <th>Price</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {tariffs.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.servicename}</td>
                  <td>{item.servicefor}</td>
                  <td>
                    {getShiftLabel(item.shift_id)}
                  </td>
                  <td>₹{item.price}</td>

                  <td>
                    <span
                      className={`badge ${
                        item.status === "Active"
                          ? "bg-success"
                          : "bg-secondary"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td className="text-center">
                    <button
                      className="btn btn-sm btn-primary me-2"
                      onClick={() =>
                        handleEdit(item)
                      }
                    >
                      <i className="bi bi-pencil"></i>
                    </button>

                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() =>
                        handleDelete(item.id)
                      }
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}

              {tariffs.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center"
                  >
                    No Tariffs Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SetValueTeriff;
