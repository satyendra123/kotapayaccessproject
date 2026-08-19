import React, { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { getErrorMessage, notify } from "../services/http";
import { canAccess } from "../auth/permissions";

const API_PATH = process.env.REACT_APP_API_PATH;

const normalizeUserType = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace("site in charge", "site incharge")
    .replace("technical manager", "technical engineer");

const getQualificationRole = (qualification) =>
  qualification.qualification_for ||
  qualification.qualificationFor ||
  qualification.user_type ||
  qualification.role_name ||
  "";

const qualificationMatchesRole = (qualification, userType) => {
  const qualificationRole = getQualificationRole(qualification);
  return !qualificationRole ||
    normalizeUserType(qualificationRole) === normalizeUserType(userType);
};

const UserManagement = () => {
  const API_URL = `${API_PATH}/api/users`;
  const ACCESS_API = `${API_PATH}/api/master/access-qualifications-dropdown`;
  const QUALIFICATION_API = `${API_PATH}/api/qualifications`;

  const token = localStorage.getItem("access_token");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    accept: "application/json",
  };

  /* ======================= STATE ======================= */
  const [users, setUsers] = useState([]);
  const [accessList, setAccessList] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessLoading, setAccessLoading] = useState(true);
  const [accessLoadError, setAccessLoadError] = useState("");
  const [roles, setRoles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    user_type: "",
    date_of_birth: "",
    phone_number: "",
    email: "",
    aadhaar_number: "",
    username: "",
    password: "",
    access_qualification_id: "",
    status: "",
  });

  const [errors, setErrors] = useState({});
  const canCreateUser = canAccess(["create_users"]);
  const canEditUser = canAccess(["edit_users"]);
  const canDeleteUser = canAccess(["delete_users"]);
  const canCreateOrEditUser = canCreateUser || canEditUser;

  /* ======================= FETCH ======================= */

  const fetchUsers = async () => {
    try {
      const res = await axios.get(API_URL, { headers });
      setUsers(res.data.data || []);
    } catch (error) {
      notify(getErrorMessage(error, "Unable to load users"), "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAccessQualification = async () => {
    setAccessLoading(true);
    setAccessLoadError("");
    try {
      const res = await axios.get(ACCESS_API, { headers });
      const qualifications = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];
      setAccessList(qualifications);
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Unable to load access qualifications");
      setAccessLoadError(errorMessage);
      notify(errorMessage, "error");
    } finally {
      setAccessLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await axios.get(QUALIFICATION_API, { headers });
      const names = (res.data?.data || []).map((item) => item.qualification_for).filter(Boolean);
      setRoles([...new Set(names)].sort());
    } catch (error) {
      notify(getErrorMessage(error, "Unable to load roles"), "error");
    }
  };

  useEffect(() => {
    fetchUsers();
    if (canCreateOrEditUser) {
      fetchAccessQualification();
      fetchRoles();
    } else {
      setAccessLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ======================= VALIDATION ======================= */

  const validateForm = (data) => {
    const newErrors = {};
    const isDuplicate = (field) => users.some((user) =>
      String(user.id) !== String(editingId) &&
      String(user[field] || "").trim().toLowerCase() === String(data[field] || "").trim().toLowerCase()
    );

    if (!data.name.trim()) newErrors.name = "Name is required";
    else if (data.name.trim().length < 2) newErrors.name = "Name must be at least 2 characters";
    if (!data.gender) newErrors.gender = "Gender is required";
    if (!data.user_type) newErrors.user_type = "User type is required";
    if (!data.date_of_birth) newErrors.date_of_birth = "Date of birth is required";

    if (!data.phone_number.trim())
      newErrors.phone_number = "Phone number is required";
    else if (!/^\d{10}$/.test(data.phone_number))
      newErrors.phone_number = "Phone number must be 10 digits";
    else if (isDuplicate("phone_number"))
      newErrors.phone_number = "Phone number is already registered";

    if (!data.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(data.email))
      newErrors.email = "Invalid email";
    else if (isDuplicate("email"))
      newErrors.email = "Email is already registered";

    if (!data.aadhaar_number.trim())
      newErrors.aadhaar_number = "Aadhaar number is required";
    else if (!/^\d{12}$/.test(data.aadhaar_number))
      newErrors.aadhaar_number = "Aadhaar must be 12 digits";
    else if (isDuplicate("aadhaar_number"))
      newErrors.aadhaar_number = "Aadhaar number is already registered";

    if (!data.username.trim()) newErrors.username = "Username is required";
    else if (!/^[a-zA-Z0-9._-]{3,80}$/.test(data.username))
      newErrors.username = "Username must be 3-80 letters, numbers, dots, hyphens, or underscores";
    else if (isDuplicate("username"))
      newErrors.username = "Username is already registered";

    if (!editingId && !data.password)
      newErrors.password = "Password is required";
    else if (data.password && data.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    if (!data.access_qualification_id)
      newErrors.access_qualification_id = "Access qualification is required";

    if (!data.status) newErrors.status = "Status required";

    return newErrors;
  };

  const handleBlur = (e) => {
    const updatedData = { ...formData, [e.target.name]: e.target.value };
    const validationErrors = validateForm(updatedData);
    setErrors((previous) => ({
      ...previous,
      [e.target.name]: validationErrors[e.target.name] || "",
    }));
  };

  /* ======================= INPUT CHANGE ======================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "user_type" &&
      !accessList.some(
        (item) =>
          String(item.id) === String(prev.access_qualification_id) &&
          qualificationMatchesRole(item, value)
      )
        ? { access_qualification_id: "" }
        : {}),
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    if (name === "user_type") {
      setErrors((prev) => ({ ...prev, access_qualification_id: "" }));
    }
  };

  /* ======================= SUBMIT USER ======================= */

  const submitUser = async () => {
    const validationErrors = validateForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        access_qualification_id: Number(formData.access_qualification_id),
      };

      if (editingId) {
        const updatePayload = { ...payload };
        if (!updatePayload.password) delete updatePayload.password;
        await axios.put(`${API_URL}/${editingId}`, updatePayload, { headers });
        setMessage("User updated successfully");
      } else {
        await axios.post(API_URL, payload, { headers });
        setMessage("User created successfully");
      }
      setMessageType("success");
      notify(editingId ? "User updated successfully" : "User created successfully", "success");

      setFormData({
        name: "",
        gender: "",
        user_type: "",
        date_of_birth: "",
        phone_number: "",
        email: "",
        aadhaar_number: "",
        username: "",
        password: "",
        access_qualification_id: "",
        status: "",
      });

      setEditingId(null);
      setErrors({});
      fetchUsers();

      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Unable to save user");
      const errorField = [
        ["email", "email"],
        ["username", "username"],
        ["phone number", "phone_number"],
        ["aadhaar number", "aadhaar_number"],
      ].find(([label]) => errorMessage.toLowerCase().startsWith(label));
      if (errorField) {
        setErrors((previous) => ({ ...previous, [errorField[1]]: errorMessage }));
      }
      setMessage(errorMessage);
      setMessageType("danger");
      notify(errorMessage, "error");
    } finally {
      setSubmitting(false);
    }
  };

  /* ======================= EDIT USER ======================= */

  const openEditForm = (user) => {
    setEditingId(user.id);

    setFormData({
      name: user.name || "",
      gender: user.gender || "",
      user_type: user.user_type || "",
      date_of_birth: user.date_of_birth || "",
      phone_number: user.phone_number || "",
      email: user.email || "",
      aadhaar_number: user.aadhaar_number || user.aadhaar_no || "",
      username: user.username || "",
      password: "",
      access_qualification_id: user.access_qualification_id || "",
      status: user.status || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* ======================= DELETE USER ======================= */

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?"))
      return;

    try {
      await axios.delete(`${API_URL}/${id}`, { headers });

      setMessage("User deleted successfully");
      setMessageType("success");
      notify("User deleted successfully", "success");
      fetchUsers();

      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Unable to delete user");
      setMessage(errorMessage);
      setMessageType("danger");
      notify(errorMessage, "error");
    }
  };

  console.log("Access List:", accessList);

  const matchingQualifications = accessList.filter(
    (item) =>
      String(item.status || "Active").toLowerCase() === "active" &&
      qualificationMatchesRole(item, formData.user_type)
  );

  return (
    <div className="container-fluid">
      {message && (
        <div className={`alert alert-${messageType}`} role="alert">
          {message}
        </div>
      )}

      {/* ================= CREATE / EDIT USER ================= */}

      {canCreateOrEditUser && <div className="p-4 rounded mb-4">
        <h3 className="fw-semibold mb-1 text-primary">

          {editingId ? "Edit User" : "User Management"}
        </h3>
        <p className="text-muted mb-4">
          Create users and assign access that matches their operational role.
        </p>

        <div className="row g-3">

          {[
            ["name", "Name"],
            ["phone_number", "Phone Number"],
            ["email", "Email"],
            ["aadhaar_number", "Aadhaar Card"],
            ["username", "Username"],
            ["password", "Password"],
          ].map(([key, label]) => (
            <div className="col-md-3" key={key}>
              <label>{label} *</label>
              <input
                type={key === "password" ? "password" : key === "email" ? "email" : key === "phone_number" ? "tel" : "text"}
                className={`form-control ${errors[key] ? "is-invalid" : ""}`}
                name={key}
                value={formData[key]}
                onChange={handleChange}
                onBlur={handleBlur}
                inputMode={["phone_number", "aadhaar_number"].includes(key) ? "numeric" : undefined}
                maxLength={key === "phone_number" ? 10 : key === "aadhaar_number" ? 12 : key === "username" ? 80 : undefined}
                disabled={key === "username" && editingId}
              />
              {errors[key] && (
                <small className="text-danger">{errors[key]}</small>
              )}
            </div>
          ))}

          <div className="col-md-3">
            <label>Gender *</label>
            <select
              className={`form-select ${errors.gender ? "is-invalid" : ""}`}
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              onBlur={handleBlur}
            >
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
            </select>
            {errors.gender && (
              <small className="text-danger">{errors.gender}</small>
            )}
          </div>

          <div className="col-md-3">
            <label>User Role *</label>
            <select
              className={`form-select ${errors.user_type ? "is-invalid" : ""}`}
              name="user_type"
              value={formData.user_type}
              onChange={handleChange}
              onBlur={handleBlur}
            >
              <option value="">Select</option>
              {roles.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
            {errors.user_type && (
              <small className="text-danger">{errors.user_type}</small>
            )}
          </div>

          <div className="col-md-3">
            <label>Date of Birth *</label>
            <input
              type="date"
              className={`form-control ${errors.date_of_birth ? "is-invalid" : ""
                }`}
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {errors.date_of_birth && (
              <small className="text-danger">{errors.date_of_birth}</small>
            )}
          </div>

          <div className="col-md-3">
            <label>Access Qualification *</label>
            <select
              className={`form-select ${errors.access_qualification_id ? "is-invalid" : ""
                }`}
              name="access_qualification_id"
              value={formData.access_qualification_id}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={!formData.user_type || accessLoading || Boolean(accessLoadError)}
            >
              <option value="">
                {accessLoading
                  ? "Loading qualifications..."
                  : accessLoadError
                    ? "Qualifications unavailable"
                    : formData.user_type
                      ? "Select qualification"
                      : "Select a user role first"}
              </option>

              {matchingQualifications.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.access_qualification_name}
                </option>
              ))}
            </select>

            {errors.access_qualification_id && (
              <small className="text-danger">
                {errors.access_qualification_id}
              </small>
            )}
            {accessLoadError && (
              <small className="text-danger d-block mt-1">
                {accessLoadError}. Check the frontend API address and retry.
              </small>
            )}
            {!accessLoading && !accessLoadError && formData.user_type && matchingQualifications.length === 0 && (
              <small className="text-muted d-block mt-1">
                No active qualification exists for this role. Create one in Access &amp; Rights first.
              </small>
            )}
          </div>

          <div className="col-md-3">
            <label>Status *</label>
            <select
              className={`form-select ${errors.status ? "is-invalid" : ""}`}
              name="status"
              value={formData.status}
              onChange={handleChange}
              onBlur={handleBlur}
            >
              <option value="">Select</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>

            {errors.status && (
              <small className="text-danger">{errors.status}</small>
            )}
          </div>

          {((!editingId && canCreateUser) || (editingId && canEditUser)) && <div className="col-md-3 d-flex align-items-end">
            <button
              className="btn btn-primary w-100 fw-semibold"
              onClick={submitUser}
              disabled={submitting}
            >
              {submitting
                ? "Saving..."
                : editingId
                  ? "Update User"
                  : "Create User"}
            </button>
          </div>}
        </div>
      </div>}

      {/* ================= USER LIST ================= */}

      <div className="p-4 rounded">
        <h3 className="fw-semibold mb-4 text-primary">
          List of Registered Users
        </h3>

        <div className="table-responsive">
          <table className="table table-bordered bg-white text-nowrap text-center">
            <thead>
              <tr>
                <th>#</th>
                <th>Name (Gender)</th>
                <th>DOB</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan="7" className="py-4 text-muted">Loading users...</td>
                </tr>
              )}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-4 text-muted">No users found.</td>
                </tr>
              )}
              {users.map((u, i) => (
                <tr key={u.id}>
                  <td>{i + 1}</td>

                  <td>
                    {u.name} ({u.gender})
                  </td>

                  <td>{u.date_of_birth}</td>

                  <td>{u.email}</td>

                  <td>{u.phone_number}</td>

                  <td>
                    <span
                      className={`badge ${u.status === "Active" ? "text-bg-success" : "text-bg-secondary"}`}
                    >
                      {u.status}
                    </span>
                  </td>

                  <td>
                    {canEditUser && <button
                      className="btn btn-sm btn-primary me-2"
                      onClick={() => openEditForm(u)}
                      aria-label={`Edit ${u.name}`}
                    >
                      <i className="bi bi-pencil"></i>
                    </button>}

                    {canDeleteUser && <button
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteUser(u.id)}
                      aria-label={`Delete ${u.name}`}
                    >
                      <i className="bi bi-trash"></i>
                    </button>}
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

export default UserManagement;
