import React, { useEffect, useState } from "react";
import axios from "axios";
import { Modal, Button } from "react-bootstrap";
import { getErrorMessage } from "../services/http";

const API_PATH = process.env.REACT_APP_API_PATH;
const API_URL = `${API_PATH}/api/combo-services/`;
const SHIFT_API_URL = `${API_PATH}/api/shifts`;

const ComboServices = () => {
  /* 🔐 Always read fresh token */
  const getToken = () => localStorage.getItem("access_token");

  const getAxiosConfig = () => ({
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
  });

  const [comboService, setComboService] = useState("");
  const [price, setPrice] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [status, setStatus] = useState("");
  const [comboList, setComboList] = useState([]);
  const [shifts, setShifts] = useState([]);

  /* Modal state */
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);

  /* READ */
  useEffect(() => {
    axios
      .get(API_URL, getAxiosConfig())
      .then((res) => setComboList(res.data))
      .catch((err) => alert(getErrorMessage(err, "Unable to load combo services")));

    axios
      .get(SHIFT_API_URL, getAxiosConfig())
      .then((res) => {
        const activeShifts = res.data.filter(
          (shift) => shift.status.toLowerCase() === "active"
        );
        setShifts(activeShifts);
      })
      .catch((err) => alert(getErrorMessage(err, "Unable to load shifts")));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* CREATE */
  const handleSubmit = () => {
    if (!comboService || !price || !shiftId || !status) {
      alert("Please fill all required fields");
      return;
    }

    const payload = {
      combo_service: comboService,
      price: Number(price),
      discountedprice: discountedPrice
        ? Number(discountedPrice)
        : null,
      shift_id: Number(shiftId),
      status,
    };

    axios
      .post(API_URL, payload, getAxiosConfig())
      .then((res) => {
        setComboList([...comboList, res.data]);
        resetForm();
      })
      .catch((err) => {
        console.error("CREATE ERROR:", err.response);
        alert(getErrorMessage(err, "Unable to create combo service"));
      });
  };

  /* OPEN EDIT MODAL */
  const handleEdit = (item) => {
    setEditId(item.id);
    setComboService(item.combo_service);
    setPrice(item.price);
    setDiscountedPrice(item.discountedprice ?? "");
    setShiftId(item.shift_id);
    setStatus(item.status);
    setShowModal(true);
  };

  /* UPDATE */
  const handleUpdate = () => {
    if (!comboService || !price || !shiftId || !status) {
      alert("Please fill all required fields");
      return;
    }

    const payload = {
      combo_service: comboService,
      price: Number(price),
      discountedprice: discountedPrice
        ? Number(discountedPrice)
        : null,
      shift_id: Number(shiftId),
      status,
    };

    axios
      .put(`${API_URL}${editId}/`, payload, getAxiosConfig())
      .then((res) => {
        setComboList(
          comboList.map((item) =>
            item.id === editId ? res.data : item
          )
        );
        setShowModal(false);
        resetForm();
      })
      .catch((err) => {
        console.error("UPDATE ERROR:", err.response);
        alert(getErrorMessage(err, "Unable to update combo service"));
      });
  };

  /* DELETE */
  const handleDelete = (id) => {
    axios
      .delete(`${API_URL}${id}/`, getAxiosConfig())
      .then(() => {
        setComboList(comboList.filter((item) => item.id !== id));
      })
      .catch((err) => {
        console.error("DELETE ERROR:", err.response);
        alert(getErrorMessage(err, "Unable to delete combo service"));
      });
  };

  /* RESET FORM */
  const resetForm = () => {
    setComboService("");
    setPrice("");
    setDiscountedPrice("");
    setShiftId("");
    setStatus("");
    setEditId(null);
  };

  const getShiftLabel = (id) => {
    const shift = shifts.find((s) => s.id === id);
    return shift
      ? `${shift.shiftname} (${shift.shiftstarttime} - ${shift.shiftendtime})`
      : "—";
  };

  return (
    <div
      className="container-fluid p-4"
      style={{ backgroundColor: "#4B52A6", minHeight: "100vh" }}
    >
      <h3 className="fw-bold text-warning mb-4">
        Combo Services Information
      </h3>

      {/* CREATE FORM */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <label className="text-dark fw-bold">Name</label>
          <input
            type="text"
            className="form-control"
            value={comboService}
            onChange={(e) => setComboService(e.target.value)}
          />
        </div>

        <div className="col-md-2">
          <label className="text-dark fw-bold">Shift</label>
          <select
            className="form-select"
            value={shiftId}
            onChange={(e) => setShiftId(e.target.value)}
          >
            <option value="">Select Shift</option>
            {shifts.map((shift) => (
              <option key={shift.id} value={shift.id}>
                {shift.shiftname} ({shift.shiftstarttime} - {shift.shiftendtime})
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-2">
          <label className="text-dark fw-bold">Price</label>
          <input
            type="number"
            min="0"
            className="form-control no-spinner"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div className="col-md-2">
          <label className="text-dark fw-bold">
            Discounted Price
          </label>
          <input
            type="number"
            min="0"
            className="form-control no-spinner"
            value={discountedPrice}
            onChange={(e) =>
              setDiscountedPrice(e.target.value)
            }
          />
        </div>

        <div className="col-md-2">
          <label className="text-dark fw-bold">Status</label>
          <select
            className="form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Select</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>

        <div className="col-md-1 d-flex align-items-end">
          <button
            className="btn btn-danger w-100"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-responsive">
        <table className="table table-bordered text-dark text-center">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Shift</th>
              <th>Price</th>
              <th>Discounted</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {comboList.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.combo_service}</td>
                <td>{getShiftLabel(item.shift_id)}</td>
                <td>{item.price}</td>
                <td>{item.discountedprice}</td>
                <td>{item.status}</td>
                <td>
                  <button
                    className="btn btn-sm btn-warning me-2"
                    onClick={() => handleEdit(item)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(item.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Combo Service</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <label>Name</label>
          <input
            className="form-control mb-2"
            value={comboService}
            onChange={(e) => setComboService(e.target.value)}
          />

          <label>Shift</label>
          <select
            className="form-select mb-2"
            value={shiftId}
            onChange={(e) => setShiftId(e.target.value)}
          >
            <option value="">Select Shift</option>
            {shifts.map((shift) => (
              <option key={shift.id} value={shift.id}>
                {shift.shiftname} ({shift.shiftstarttime} - {shift.shiftendtime})
              </option>
            ))}
          </select>

          <label>Price</label>
          <input
            type="number"
            min="0"
            className="form-control mb-2"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <label>Discounted Price</label>
          <input
            type="number"
            min="0"
            className="form-control mb-2"
            value={discountedPrice}
            onChange={(e) =>
              setDiscountedPrice(e.target.value)
            }
          />

          <label>Status</label>
          <select
            className="form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowModal(false)}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdate}>
            Update
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ComboServices;
