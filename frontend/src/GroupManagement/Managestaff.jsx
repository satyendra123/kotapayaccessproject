// ManageStaff.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Table from "react-bootstrap/Table";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import { FaEdit, FaTrash } from "react-icons/fa";
import { getErrorMessage } from "../services/http";
import { canAccess } from "../auth/permissions";
const API_PATH = process.env.REACT_APP_API_PATH;
const ManageStaff = () => {
  const [staff, setStaff] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formData, setFormData] = useState({});
  const STAFF_API = `${API_PATH}/api/staff/`;
  const CATEGORY_API = `${API_PATH}/api/staff-categories/`;
  const token = localStorage.getItem("access_token");
  const canEditStaff = canAccess(["staffs.edit", "manage_staff"]);
  const canDeleteStaff = canAccess(["staffs.delete", "manage_staff"]);
  const fetchCategories = async () => {
    try {
      const res = await axios.get(CATEGORY_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await axios.get(STAFF_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStaff(res.data || []);
    } catch (err) {
      console.error("Failed to fetch staff data:", err);
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffById = async (id) => {
    try {
      const res = await axios.get(`${STAFF_API}${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedStaff(res.data);
      setShowModal(true);
    } catch (err) {
      console.error("Error fetching staff by id:", err);
    }
  };

  useEffect(() => {
    if (selectedStaff) {
      setFormData(selectedStaff);
    }
  }, [selectedStaff]);

  useEffect(() => {
    if (!token) {
      setError("No access token found. Please login.");
      setLoading(false);
      return;
    }
    fetchCategories();
    fetchStaff();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getCategoryName = (id) => {
    const category = categories.find((cat) => cat.id === id);
    return category ? category.catgname : id;
  };

  const handleEdit = (id) => {
    fetchStaffById(id);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const payload = {
        staff_category_id: Number(formData.staff_category_id),
        name: formData.name,
        gender: formData.gender,
        staff_type: formData.staff_type,
        dob: formData.dob,
        doj: formData.doj,
        phone_number: formData.phone_number,
        email: formData.email,
        status: formData.status,
        access_card_number: formData.access_card_number || null,
        aadhaar_card: formData.aadhaar_card || null,
      };

      await axios.put(`${STAFF_API}${selectedStaff.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Staff updated successfully!");
      setShowModal(false);
      fetchStaff();
    } catch (err) {
      console.error("Error updating staff:", err);
      alert(getErrorMessage(err, "Unable to update staff"));
    }
  };

  const deleteStaff = async (id) => {
    if (!id) {
      console.error("Invalid staff ID:", id);
      return;
    }
    if (!window.confirm("Delete this staff member permanently? This cannot be undone.")) return;
    try {
      const token = localStorage.getItem("access_token");
      await axios.delete(
        `${API_PATH}/api/staff/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      alert("Staff deleted successfully");
      fetchStaff();
    } catch (err) {
      console.error(
        "Error deleting staff:",
        err.response?.data || err.message,
      );
      alert(getErrorMessage(err, "Unable to delete staff"));
    }
  };

  if (loading) return <div>Loading staff data...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Container
      fluid
      className="p-4 rounded"
      style={{
        overflowX: "hidden",
        maxWidth: "100%",
        paddingLeft: "15px",
        paddingRight: "15px",
      }}
    >
      <h3 className="mb-3">Manage Staff</h3>
      <div
        style={{
          overflowX: "auto",
          maxWidth: "100%",
          border: "1px solid #dee2e6",
          borderRadius: "0.375rem",
          boxShadow: "0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)",
        }}
      >
        <Table
          className="text-center"
          striped
          bordered
          hover
          responsive
          style={{
            whiteSpace: "nowrap",
            minWidth: "350%",
            marginBottom: "0",
            tableLayout: "fixed",
          }}
        >
          <thead className="table-primary">
            <tr>
              <th style={{ minWidth: "120px", maxWidth: "150px" }}>
                Category Name
              </th>
              <th style={{ minWidth: "120px", maxWidth: "150px" }}>Name</th>
              <th style={{ minWidth: "80px", maxWidth: "100px" }}>Gender</th>
              <th style={{ minWidth: "100px", maxWidth: "120px" }}>
                Staff Type
              </th>
              <th style={{ minWidth: "100px", maxWidth: "120px" }}>DOB</th>
              <th style={{ minWidth: "100px", maxWidth: "120px" }}>DOJ</th>
              <th style={{ minWidth: "120px", maxWidth: "150px" }}>Phone</th>
              <th style={{ minWidth: "180px", maxWidth: "220px" }}>Email</th>
              <th style={{ minWidth: "100px", maxWidth: "120px" }}>Status</th>
              <th style={{ minWidth: "150px", maxWidth: "180px" }}>
                Access Card Number
              </th>
              <th style={{ minWidth: "150px", maxWidth: "180px" }}>Aadhaar</th>
              <th style={{ minWidth: "180px", maxWidth: "220px" }}>
                Created At
              </th>
              {(canEditStaff || canDeleteStaff) && <th style={{ minWidth: "100px", maxWidth: "120px" }}>Action</th>}
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id}>
                <td
                  style={{
                    maxWidth: "150px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {getCategoryName(s.staff_category_id)}
                </td>
                <td
                  style={{
                    maxWidth: "150px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.name}
                </td>
                <td
                  style={{
                    maxWidth: "100px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.gender}
                </td>
                <td
                  style={{
                    maxWidth: "120px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.staff_type}
                </td>
                <td
                  style={{
                    maxWidth: "120px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.dob}
                </td>
                <td
                  style={{
                    maxWidth: "120px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.doj}
                </td>
                <td
                  style={{
                    maxWidth: "150px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.phone_number}
                </td>
                <td
                  style={{
                    maxWidth: "220px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.email}
                </td>
                <td
                  style={{
                    maxWidth: "120px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.status}
                </td>
                <td
                  style={{
                    maxWidth: "180px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.access_card_number}
                </td>
                <td
                  style={{
                    maxWidth: "180px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.aadhaar_card}
                </td>
                <td
                  style={{
                    maxWidth: "220px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {new Date(s.created_at).toLocaleString()}
                </td>
                {(canEditStaff || canDeleteStaff) && <td style={{ maxWidth: "120px" }}>
                  {canEditStaff && <FaEdit
                    style={{
                      cursor: "pointer",
                      marginRight: "10px",
                      color: "green",
                    }}
                    onClick={() => handleEdit(s.id)}
                  />}
                  {canDeleteStaff && <FaTrash
                    style={{ cursor: "pointer", color: "red" }}
                    onClick={() => deleteStaff(s.id)}
                  />}
                </td>}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Edit Modal */}
      {canEditStaff && <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        dialogClassName="modal-lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Staff</Modal.Title>
        </Modal.Header>
        <Modal.Body className="overflow-auto" style={{ maxHeight: "70vh" }}>
          {formData ? (
            <Form>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                }}
              >
                {/* Category */}
                <Form.Group>
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    name="staff_category_id"
                    value={formData.staff_category_id || ""}
                    onChange={handleChange}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.catgname}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {/* Name */}
                <Form.Group>
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                  />
                </Form.Group>

                {/* Gender */}
                <Form.Group>
                  <Form.Label>Gender</Form.Label>
                  <Form.Control
                    as="select"
                    name="gender"
                    value={formData.gender || ""}
                    onChange={handleChange}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Form.Control>
                </Form.Group>

                {/* Staff Type */}
                <Form.Group>
                  <Form.Label>Staff Type</Form.Label>
                  <Form.Control
                    type="text"
                    name="staff_type"
                    value={formData.staff_type || ""}
                    onChange={handleChange}
                  />
                </Form.Group>

                {/* DOB */}
                <Form.Group>
                  <Form.Label>Date of Birth</Form.Label>
                  <Form.Control
                    type="date"
                    name="dob"
                    value={formData.dob || ""}
                    onChange={handleChange}
                  />
                </Form.Group>

                {/* DOJ */}
                <Form.Group>
                  <Form.Label>Date of Joining</Form.Label>
                  <Form.Control
                    type="date"
                    name="doj"
                    value={formData.doj || ""}
                    onChange={handleChange}
                  />
                </Form.Group>

                {/* Phone */}
                <Form.Group>
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone_number"
                    value={formData.phone_number || ""}
                    onChange={handleChange}
                  />
                </Form.Group>

                {/* Email */}
                <Form.Group>
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                  />
                </Form.Group>

                {/* Status */}
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status || "Active"}
                    onChange={handleChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Deactive">Deactive</option>
                  </Form.Select>
                </Form.Group>

                {/* Access Card */}
                <Form.Group>
                  <Form.Label>Access Card Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="access_card_number"
                    value={formData.access_card_number || ""}
                    onChange={handleChange}
                  />
                </Form.Group>

                {/* Aadhaar */}
                <Form.Group>
                  <Form.Label>Aadhaar</Form.Label>
                  <Form.Control
                    type="text"
                    name="aadhaar_card"
                    value={formData.aadhaar_card || ""}
                    onChange={handleChange}
                  />
                </Form.Group>
              </div>
            </Form>
          ) : (
            <p>Loading staff details...</p>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>}
    </Container>
  );
};

export default ManageStaff;
