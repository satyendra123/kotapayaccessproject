import React, { useEffect, useState } from "react";
import axios from "axios";

const API_PATH = process.env.REACT_APP_API_PATH;

const Combos = () => {
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [comboName, setComboName] = useState("");
  const [actualPrice, setActualPrice] = useState(0);
  const [discountPrice, setDiscountPrice] = useState("");
  const [status, setStatus] = useState("");
  const [combos, setCombos] = useState([]);
  const [errors, setErrors] = useState({});

  // ✅ EDIT STATE
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);

  const access_token = localStorage.getItem("access_token");

  // ================= FETCH SERVICES =================
  useEffect(() => {
    axios
      .get(`${API_PATH}/api/tariffs/`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/json",
        },
      })
      .then((res) => setServices((res.data || []).filter(
        (service) => String(service.status).toLowerCase() === "active"
      )))
      .catch((err) =>
        console.error("Error fetching services:", err)
      );
  }, [access_token]);

  // ================= FETCH COMBOS =================
  useEffect(() => {
    axios
      .get(`${API_PATH}/api/combos/`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/json",
        },
      })
      .then((res) => setCombos(res.data))
      .catch((err) =>
        console.error("Error fetching combos:", err)
      );
  }, [access_token]);

  // ================= CHECKBOX =================
  const handleCheckboxChange = (id) => {
    setSelectedServices((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];

      const total = services
        .filter((s) => updated.includes(s.id))
        .reduce((sum, s) => sum + Number(s.price), 0);

      setActualPrice(total);
      return updated;
    });
  };

  // ================= VALIDATION =================
  const validateForm = () => {
    const newErrors = {};

    if (!comboName.trim())
      newErrors.comboName = "Combo name is required";

    if (selectedServices.length === 0)
      newErrors.services = "Select at least one service";

    if (actualPrice <= 0)
      newErrors.actualPrice = "Combo price must be greater than 0";

    if (!discountPrice)
      newErrors.discountPrice = "Discount price is required";
    else if (Number(discountPrice) <= 0)
      newErrors.discountPrice =
        "Discount price must be greater than 0";
    else if (Number(discountPrice) > actualPrice)
      newErrors.discountPrice =
        "Discount price cannot exceed combo price";

    if (!status)
      newErrors.status = "Status is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ================= RESET FORM =================
  const resetForm = () => {
    setComboName("");
    setActualPrice(0);
    setDiscountPrice("");
    setStatus("");
    setSelectedServices([]);
    setErrors({});
    setIsEdit(false);
    setEditId(null);
  };

  // ================= EDIT =================
  const handleEdit = (combo) => {
    setIsEdit(true);
    setEditId(combo.id);

    setComboName(combo.comboname);
    setActualPrice(combo.actual_price);
    setDiscountPrice(combo.discount_price);
    setStatus(combo.status);

    const ids = combo.services?.map((s) => s.id) || [];
    setSelectedServices(ids);
  };

  // ================= DELETE =================
  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this combo?")) return;

    axios
      .delete(`${API_PATH}/api/combos/${id}/`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then(() => {
        alert("Combo deleted successfully");
        setCombos((prev) => prev.filter((c) => c.id !== id));
      })
      .catch((err) => {
        console.error("Delete error:", err);
        alert("Failed to delete combo");
      });
  };

  // ================= SUBMIT (CREATE + UPDATE) =================
  const handleSubmit = () => {
    if (!validateForm()) return;

    const payload = {
      comboname: comboName,
      actual_price: Number(actualPrice),
      discount_price: Number(discountPrice),
      status: status,
      selectedservices: selectedServices,
    };

    const request = isEdit
      ? axios.put(
          `${API_PATH}/api/combos/${editId}/`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
              "Content-Type": "application/json",
            },
          }
        )
      : axios.post(
          `${API_PATH}/api/combos/`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
              "Content-Type": "application/json",
            },
          }
        );

    request
      .then((res) => {
        alert(isEdit ? "Combo updated successfully" : "Combo created successfully");

        if (isEdit) {
          setCombos((prev) =>
            prev.map((c) => (c.id === editId ? res.data : c))
          );
        } else {
          setCombos((prev) => [...prev, res.data]);
        }

        resetForm();
      })
      .catch((err) => {
        console.error("Error:", err);
        alert("Operation failed");
      });
  };

  const isFormValid =
    comboName &&
    selectedServices.length > 0 &&
    actualPrice > 0 &&
    discountPrice &&
    status &&
    Number(discountPrice) <= actualPrice;

  return (
    <div>
      {/* ================= CREATE / UPDATE ================= */}
      <div
        className="container-fluid p-4"
        style={{ backgroundColor: "#4B52A6", borderRadius: "8px" }}
      >
        <h2 className="fw-bold text-warning mb-4">
          {isEdit ? "Update Combo" : "Generate New Combos"}
        </h2>

        <div className="row g-3">
          <div className="col-md-3 col-sm-6">
            <label className="text-white fw-bold">
              Enter Combo name *
            </label>
            <input
              type="text"
              className={`form-control ${
                errors.comboName ? "is-invalid" : ""
              }`}
              value={comboName}
              onChange={(e) => setComboName(e.target.value)}
            />
            <div className="invalid-feedback">
              {errors.comboName}
            </div>
          </div>

          <div className="col-md-3 col-sm-6">
            <label className="text-white fw-bold">
              Combo Price *
            </label>
            <div className="input-group">
              <span className="input-group-text">Rs.</span>
              <input
                type="number"
                className={`form-control ${
                  errors.actualPrice ? "is-invalid" : ""
                }`}
                value={actualPrice}
                readOnly
              />
            </div>
          </div>

          <div className="col-md-3 col-sm-6">
            <label className="text-white fw-bold">
              Combo Discounted Price *
            </label>
            <div className="input-group">
              <span className="input-group-text">Rs.</span>
              <input
                type="number"
                className={`form-control ${
                  errors.discountPrice ? "is-invalid" : ""
                }`}
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
              />
            </div>
            <div className="invalid-feedback d-block">
              {errors.discountPrice}
            </div>
          </div>

          <div className="col-md-3 col-sm-6">
            <label className="text-white fw-bold">
              Status *
            </label>
            <select
              className={`form-select ${
                errors.status ? "is-invalid" : ""
              }`}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Select Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <div className="invalid-feedback">
              {errors.status}
            </div>
          </div>
        </div>

        {/* SERVICES */}
        <h5 className="fw-bold text-white mt-4">
          Select Services *
        </h5>

        <div className="row g-3">
          {services.map((service) => (
            <div
              key={service.id}
              className="col-md-3 col-sm-6 d-flex align-items-center"
            >
              <input
                type="checkbox"
                className="me-2"
                checked={selectedServices.includes(service.id)}
                onChange={() =>
                  handleCheckboxChange(service.id)
                }
              />
              <span className="text-warning fw-bold">
                {service.servicename} (Rs.{service.price})
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <button
            className="btn w-25"
            style={{
              backgroundColor: "#FFC75F",
              color: "#000",
              fontWeight: "bold",
            }}
            onClick={handleSubmit}
            disabled={!isFormValid}
          >
            {isEdit ? "Update Combo" : "Submit"}
          </button>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div
        className="container-fluid mt-4 p-4"
        style={{ backgroundColor: "#4B52A6", borderRadius: "8px" }}
      >
        <h3 className="fw-bold text-warning mb-3">
          Manage Combo
        </h3>

        <div className="table-responsive">
          <table className="table table-bordered text-center text-white">
            <thead>
              <tr>
                <th>#</th>
                <th>Combo Name</th>
                <th>Services</th>
                <th>Actual</th>
                <th>Discount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {combos.map((combo, index) => (
                <tr key={combo.id}>
                  <td>{index + 1}</td>
                  <td>{combo.comboname}</td>
                  <td>
                    {combo.services?.map((s) => s.servicename).join(", ")}
                  </td>
                  <td>Rs.{combo.actual_price}</td>
                  <td>Rs.{combo.discount_price}</td>
                  <td>{combo.status}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-warning me-2"
                      onClick={() => handleEdit(combo)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(combo.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Combos;
