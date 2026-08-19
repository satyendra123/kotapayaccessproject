import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Modal, Form } from "react-bootstrap";
import axios from "axios";
const API_PATH = process.env.REACT_APP_API_PATH;
const UserManagement = () => {
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState([]); // category list
  const [editMode, setEditMode] = useState(false); // add/update switch
  const [selectedId, setSelectedId] = useState(null); // edit id
  const [formData, setFormData] = useState({
    staff_category_id: "",
    name: "",
    gender: "",
    staff_type: "",
    dob: "",
    doj: "",
    phone_number: "",
    email: "",
    status: "",
    access_card_number: "",
    aadhaar_card: "",
  });

  const API_URL = `${API_PATH}/api/staff-categories/`;
  // 🔹 Fetch all categories
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("access_token");

      const res = await axios.get(API_URL, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setCategories(res.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCatModal = () => setShowCatModal(true);

  const closeCatModal = () => {
    setShowCatModal(false);
    resetForm();
  };

  // 🔹 Reset form
  const resetForm = () => {
    setCatName("");
    setStatus("");
    setMessage("");
    setEditMode(false);
    setSelectedId(null);
  };

  // 🔹 Handle Add/Update submit
  const handleCatSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("access_token");
      const payload = {
        catgname: catName,
        status: status,
      };

      if (editMode && selectedId) {
        // 🔹 Update existing
        await axios.put(`${API_URL}${selectedId}/`, payload, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        setMessage("Category updated successfully");
      } else {
        // 🔹 Add new
        await axios.post(API_URL, payload, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        setMessage("Category added successfully");
      }

      fetchCategories();
      closeCatModal();
    } catch (error) {
      console.error("Error submitting category:", error);
      setMessage("Failed to save category ");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Handle edit click
  const handleEdit = async (id) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}${id}/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = res.data;
      setCatName(data.catgname);
      setStatus(data.status);
      setSelectedId(id);
      setEditMode(true);
      setShowCatModal(true);
    } catch (error) {
      console.error("Error fetching category:", error);
    }
  };

  // 🔹 Delete Category
  const handleDeactivate = async (id) => {
    try {
      const token = localStorage.getItem("access_token");
      await axios.patch(
        `${API_PATH}/api/staff-categories/${id}/deactivate`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      alert("Category deactivated successfully!");
      fetchCategories();
    } catch (err) {
      console.error("Error deactivating category:", err);
      alert("Failed to deactivate category");
    }
  };

  // Fetch categories on mount
  useEffect(() => {
    axios
      .get(`${API_PATH}/api/staff-categories/`)
      .then((res) => setCategories(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();

    axios
      .post(`${API_PATH}/api/staff/`, formData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`, // if auth is needed
        },
      })
      .then((res) => {
        alert("Staff added successfully!");
        console.log(res.data);
        setFormData({
          staff_category_id: "",
          name: "",
          gender: "",
          staff_type: "",
          dob: "",
          doj: "",
          phone_number: "",
          email: "",
          status: "",
          access_card_number: "",
          aadhaar_card: "",
        });
      })
      .catch((err) => {
        console.error(err);
        alert("Error adding staff!");
      });
  };

  return (
    <div>
      <Button
        variant="primary"
        style={{ width: "200px" }}
        onClick={openCatModal}
      >
        + Staff Categories
      </Button>

      {/* Category Modal */}
      <Modal
        show={showCatModal}
        onHide={closeCatModal}
        onShow={fetchCategories}
        centered
        size="xl"
      >
        <div>
          <Modal.Header closeButton>
            <Modal.Title>
              {editMode ? "Edit Staff Category" : "Add Staff Category"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ maxHeight: "400px", overflowY: "auto" }}>
            <Form onSubmit={handleCatSubmit}>
              <Form.Group className="mb-3" controlId="categoryName">
                <Form.Label>
                  Category Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter Category Name"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="status">
                <Form.Label>
                  Status <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  required
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="" disabled>
                    Select
                  </option>
                  <option value="Active">Active</option>
                  <option value="Deactive">Deactive</option>
                </Form.Select>
              </Form.Group>

              {message && <p className="text-center fw-bold">{message}</p>}

              <div className="d-flex justify-content-end mb-3">
                <Button
                  variant="secondary"
                  onClick={closeCatModal}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="ms-2"
                  disabled={loading}
                >
                  {loading ? "Submitting..." : editMode ? "Update" : "Submit"}
                </Button>
              </div>
            </Form>

            {/* Show categories list */}
            <h6 className="mt-3">Registered Categories</h6>
            <table className="table table-bordered">
              <thead>
                <tr className="text-center">
                  <th>Category Name</th>
                  <th>Status</th>
                  <th style={{ width: "120px" }}>Action</th>
                </tr>
              </thead>
              <tbody className="text-center">
                {categories.length > 0 ? (
                  categories.map((cat, index) => (
                    <tr key={cat.id}>
                      <td>{cat.catgname}</td>
                      <td
                        className={
                          cat.status === "Active"
                            ? "text-success"
                            : "text-danger"
                        }
                      >
                        {cat.status}
                      </td>
                      <td className="text-center">
                        <i
                          className="bi bi-pencil text-primary me-3"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleEdit(cat.id)}
                        ></i>
                        <i
                          className="bi bi-trash text-danger"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleDeactivate(cat.id)}
                        ></i>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center text-muted">
                      No categories found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Modal.Body>
        </div>
      </Modal>

      {/* User Management form */}
      <div className="container mt-4">
        <div className="card shadow-lg border-0">
          <div
            className="card-header text-center text-white"
            style={{
              background: "linear-gradient(to right, #00c6ff, #0072ff)",
            }}
          >
            <h4 className="mb-0">User Management</h4>
          </div>
          <div className="card-body" style={{ backgroundColor: "#f8f9fa" }}>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* Staff Category */}
                <div className="col-md-3">
                  <label className="form-label text-info fw-bold">
                    Staff Category <span className="text-danger">*</span>
                  </label>
                  <select
                    name="staff_category_id"
                    className="form-select"
                    required
                    value={formData.staff_category_id}
                    onChange={handleChange}
                  >
                    <option value="">Select Staff Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.catgname}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div className="col-md-3">
                  <label className="form-label text-info fw-bold">
                    Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="User Name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                {/* Gender */}
                <div className="col-md-3">
                  <label className="form-label text-info fw-bold">
                    Gender <span className="text-danger">*</span>
                  </label>
                  <select
                    name="gender"
                    className="form-select"
                    required
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Staff Type */}
                <div className="col-md-3">
                  <label className="form-label text-info fw-bold">
                    Staff Type <span className="text-danger">*</span>
                  </label>
                  <select
                    name="staff_type"
                    className="form-select"
                    required
                    value={formData.staff_type}
                    onChange={handleChange}
                  >
                    <option value="">Select User Type</option>
                    <option value="Accessible staff">Accessible staff</option>
                    <option value="Personal staff">Personal staff</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div className="col-md-3">
                  <label className="form-label text-info fw-bold">
                    Date Of Birth <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    name="dob"
                    className="form-control"
                    required
                    value={formData.dob}
                    onChange={handleChange}
                  />
                </div>

                {/* Date of Joining */}
                <div className="col-md-3">
                  <label className="form-label text-info fw-bold">
                    Date Of Joining <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    name="doj"
                    className="form-control"
                    required
                    value={formData.doj}
                    onChange={handleChange}
                  />
                </div>

                {/* Phone Number */}
                <div className="col-md-3">
                  <label className="form-label text-info fw-bold">
                    Phone Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    name="phone_number"
                    className="form-control"
                    placeholder="Enter Phone No."
                    required
                    value={formData.phone_number}
                    onChange={handleChange}
                  />
                </div>

                {/* Email */}
                <div className="col-md-3">
                  <label className="form-label text-info fw-bold">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="Enter email (abc@xyz.com)"
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                {/* Status */}
                <div className="col-md-3">
                  <label className="form-label text-info fw-bold">
                    Status <span className="text-danger">*</span>
                  </label>
                  <select
                    name="status"
                    className="form-select"
                    required
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Access Card Number */}
                <div className="col-md-3">
                  <label className="form-label text-info fw-bold">
                    Access Card Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="access_card_number"
                    className="form-control"
                    placeholder="Enter Access Card No."
                    required
                    value={formData.access_card_number}
                    onChange={handleChange}
                  />
                </div>

                {/* Aadhaar Number */}
                <div className="col-md-3">
                  <label className="form-label text-info fw-bold">
                    Aadhaar Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    name="aadhaar_card"
                    className="form-control"
                    placeholder="Enter Aadhaar No."
                    required
                    value={formData.aadhaar_card}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end mt-4">
                <button
                  type="submit"
                  className="btn text-white px-5"
                  style={{
                    background: "linear-gradient(to right, #00c6ff, #0072ff)",
                  }}
                >
                  SUBMIT
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
