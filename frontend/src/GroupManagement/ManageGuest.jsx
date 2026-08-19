// Guests.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Table from "react-bootstrap/Table";
import Container from "react-bootstrap/Container";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { FaEdit, FaTrash } from "react-icons/fa";
import { getErrorMessage } from "../services/http";
import { canAccess } from "../auth/permissions";
const API_PATH = process.env.REACT_APP_API_PATH;
const Guests = () => {
  const [guests, setGuests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const token = localStorage.getItem("access_token");
  const canEditGuest = canAccess(["guests.edit", "manage_guests"]);
  const canDeleteGuest = canAccess(["guests.delete", "manage_guests"]);
  useEffect(() => {
    fetchGuests();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps
  const fetchGuests = () => {
    axios
      .get(`${API_PATH}/api/guests/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => setGuests(response.data))
      .catch((error) => alert(getErrorMessage(error, "Unable to load guests")));
  };

  // ✅ Open Modal with API call for a single guest
  const handleEdit = (id) => {
    axios
      .get(`${API_PATH}/api/guests/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setSelectedGuest(response.data);
        setShowModal(true);
      })
      .catch((error) => alert(getErrorMessage(error, "Unable to load guest details")));
  };

  const handleClose = () => {
    setShowModal(false);
    setSelectedGuest(null);
  };

  // Send only fields accepted by the update API. The GET response also contains
  // read-only fields such as id/cardsconnected, which Joi correctly rejects.
  const handleSave = () => {
    if (!selectedGuest) return;

    const payload = {
      name: selectedGuest.name,
      gender: selectedGuest.gender,
      withmembers: Number(selectedGuest.withmembers),
      phonenumber: selectedGuest.phonenumber,
      emailid: selectedGuest.emailid || null,
      status: selectedGuest.status,
      accesscardtype: selectedGuest.accesscardtype,
      aadharcard: selectedGuest.aadharcard,
      timezone_start: selectedGuest.timezone_start,
      timezone_end: selectedGuest.timezone_end,
      accessgate: Number(selectedGuest.accessgate),
    };

    axios
      .put(`${API_PATH}/api/guests/${selectedGuest.id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        alert("Guest updated successfully");

        // Update local state (refresh guest list)
        fetchGuests();
        setShowModal(false);
      })
      .catch((error) => {
        console.error("Error updating guest:", error);
        alert(getErrorMessage(error, "Unable to update guest"));
      });
  };

  // ✅ Delete Guest (function)
  const handleDelete = async (id) => {
    console.log("Delete clicked", id); // 👈 add this

    if (window.confirm("Are you sure you want to delete this guest?")) {
      try {
        await axios.delete(`${API_PATH}/api/guests/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        fetchGuests();
      } catch (error) {
        console.error("Error deleting guest:", error);
        alert(getErrorMessage(error, "Unable to delete guest"));
      }
    }
  };

  return (
    <Container
      fluid
      className="p-4 rounded"
      style={{
        overflowX: "hidden", // Prevents horizontal scroll on container
        maxWidth: "100%",
        paddingLeft: "15px",
        paddingRight: "15px",
      }}
    >
      <h3 className="mb-3">Guest Management</h3>
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
            minWidth: "1400px",
            marginBottom: "0", // Remove default margin
            tableLayout: "fixed", // Optional: gives more consistent column widths
          }}
        >
          <thead>
            <tr>
              <th style={{ minWidth: "50px", maxWidth: "70px" }}>ID</th>
              <th style={{ minWidth: "120px", maxWidth: "150px" }}>Name</th>
              <th style={{ minWidth: "80px", maxWidth: "100px" }}>Gender</th>
              <th style={{ minWidth: "80px", maxWidth: "100px" }}>Members</th>
              <th style={{ minWidth: "120px", maxWidth: "150px" }}>Phone</th>
              <th style={{ minWidth: "180px", maxWidth: "220px" }}>Email</th>
              <th style={{ minWidth: "100px", maxWidth: "120px" }}>Status</th>
              <th style={{ minWidth: "100px", maxWidth: "130px" }}>
                Card Type
              </th>
              <th style={{ minWidth: "150px", maxWidth: "180px" }}>Aadhar</th>
              <th style={{ minWidth: "180px", maxWidth: "220px" }}>
                Start Time
              </th>
              <th style={{ minWidth: "180px", maxWidth: "220px" }}>End Time</th>
              <th style={{ minWidth: "120px", maxWidth: "150px" }}>
                Access Gate
              </th>
              <th style={{ minWidth: "120px", maxWidth: "150px" }}>
                Cards Connected
              </th>
              {(canEditGuest || canDeleteGuest) && <th style={{ minWidth: "100px", maxWidth: "120px" }}>Action</th>}
            </tr>
          </thead>
          <tbody>
            {guests.map((guest) => (
              <tr key={guest.id}>
                <td
                  style={{
                    maxWidth: "70px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {guest.id}
                </td>
                <td
                  style={{
                    maxWidth: "150px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {guest.name}
                </td>
                <td
                  style={{
                    maxWidth: "100px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {guest.gender}
                </td>
                <td
                  style={{
                    maxWidth: "100px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {guest.withmembers}
                </td>
                <td
                  style={{
                    maxWidth: "150px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {guest.phonenumber}
                </td>
                <td
                  style={{
                    maxWidth: "220px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {guest.emailid}
                </td>
                <td
                  style={{
                    maxWidth: "120px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {guest.status}
                </td>
                <td
                  style={{
                    maxWidth: "130px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {guest.accesscardtype}
                </td>
                <td
                  style={{
                    maxWidth: "180px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {guest.aadharcard}
                </td>
                <td
                  style={{
                    maxWidth: "220px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {new Date(guest.timezone_start).toLocaleString()}
                </td>
                <td
                  style={{
                    maxWidth: "220px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {new Date(guest.timezone_end).toLocaleString()}
                </td>
                <td
                  style={{
                    maxWidth: "150px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {guest.accessgate}
                </td>
                <td
                  style={{
                    maxWidth: "150px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {guest.cardsconnected}
                </td>
                {(canEditGuest || canDeleteGuest) && <td style={{ maxWidth: "120px" }}>
                  {canEditGuest && <FaEdit
                    style={{
                      cursor: "pointer",
                      marginRight: "10px",
                      color: "green",
                    }}
                    onClick={() => handleEdit(guest.id)}
                  />}
                  {canDeleteGuest && <FaTrash
                    style={{ cursor: "pointer", color: "red" }}
                    onClick={() => handleDelete(guest.id)}
                  />}
                </td>}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* ✅ Edit Guest Modal */}
      {canEditGuest && <Modal show={showModal} onHide={handleClose} dialogClassName="modal-lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Guest</Modal.Title>
        </Modal.Header>
        <Modal.Body className="overflow-auto" style={{ maxHeight: "70vh" }}>
          {selectedGuest && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedGuest.name || ""}
                  onChange={(e) =>
                    setSelectedGuest({
                      ...selectedGuest,
                      name: e.target.value,
                    })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Gender</Form.Label>
                <Form.Select
                  value={selectedGuest.gender || ""}
                  onChange={(e) =>
                    setSelectedGuest({
                      ...selectedGuest,
                      gender: e.target.value,
                    })
                  }
                >
                  <option value="">-- Select Gender --</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Members</Form.Label>
                <Form.Control
                  type="number"
                  value={selectedGuest.withmembers || ""}
                  onChange={(e) =>
                    setSelectedGuest({
                      ...selectedGuest,
                      withmembers: e.target.value,
                    })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Phone</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedGuest.phonenumber || ""}
                  onChange={(e) =>
                    setSelectedGuest({
                      ...selectedGuest,
                      phonenumber: e.target.value,
                    })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={selectedGuest.emailid || ""}
                  onChange={(e) =>
                    setSelectedGuest({
                      ...selectedGuest,
                      emailid: e.target.value,
                    })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={selectedGuest.status || ""}
                  onChange={(e) =>
                    setSelectedGuest({
                      ...selectedGuest,
                      status: e.target.value,
                    })
                  }
                >
                  <option value="">-- Select Status --</option>
                  <option value="Active">Active</option>
                  <option value="Deactive">Deactive</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Card Type</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedGuest.accesscardtype || ""}
                  onChange={(e) =>
                    setSelectedGuest({
                      ...selectedGuest,
                      accesscardtype: e.target.value,
                    })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Aadhar</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedGuest.aadharcard || ""}
                  onChange={(e) =>
                    setSelectedGuest({
                      ...selectedGuest,
                      aadharcard: e.target.value,
                    })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Start Time</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={
                    selectedGuest.timezone_start
                      ? new Date(selectedGuest.timezone_start)
                          .toISOString()
                          .slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    setSelectedGuest({
                      ...selectedGuest,
                      timezone_start: new Date(e.target.value).toISOString(),
                    })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>End Time</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={
                    selectedGuest.timezone_end
                      ? new Date(selectedGuest.timezone_end)
                          .toISOString()
                          .slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    setSelectedGuest({
                      ...selectedGuest,
                      timezone_end: new Date(e.target.value).toISOString(),
                    })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Access Gate</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedGuest.accessgate || ""}
                  onChange={(e) =>
                    setSelectedGuest({
                      ...selectedGuest,
                      accessgate: e.target.value,
                    })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Cards Connected</Form.Label>
                <Form.Control
                  type="number"
                  value={selectedGuest.cardsconnected || ""}
                  onChange={(e) =>
                    setSelectedGuest({
                      ...selectedGuest,
                      cardsconnected: e.target.value,
                    })
                  }
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>}
    </Container>
  );
};
export default Guests;
