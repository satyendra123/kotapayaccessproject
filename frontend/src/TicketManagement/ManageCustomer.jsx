import React, { useEffect, useState } from "react";
import {
  Table,
  Container,
  Spinner,
  Button,
  Modal,
  Form,
} from "react-bootstrap";
import axios from "axios";
import { canUseFeature } from "../auth/featurePermissions";
const API_PATH = process.env.REACT_APP_API_PATH;
const TicketTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [skip, setSkip] = useState(0);
  const [limit] = useState(100);

  // Edit Modal State
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState({
    id: "",
    ticket_gen_for: "",
    customer_name: "",
    mobile_no: "",
    no_of_members: "",
    aadhar_no: "",
  });

  const token = localStorage.getItem("access_token");
  const canEditTickets = canUseFeature(["tickets.edit", "manage_tickets"]);
  const canDeleteTickets = canUseFeature(["tickets.delete", "manage_tickets"]);

  // ================= FETCH ALL TICKETS =================
  const fetchTickets = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_PATH}/api/all-tickets/?skip=${skip}&limit=${limit}`,
        {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setData(response.data || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);

      if (error.response?.status === 401) {
        alert("Session expired! Please login again.");
        localStorage.removeItem("access_token");
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [skip]); // eslint-disable-line react-hooks/exhaustive-deps

  // ================= DELETE TICKET =================
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete?");
    if (!confirmDelete) return;

    try {
      await axios.delete(
        `${API_PATH}/api/tickets/${id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setData(data.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error deleting ticket:", error);
    }
  };

  // ================= OPEN EDIT MODAL =================
  const handleEdit = (item) => {
    setEditData(item);
    setShowEdit(true);
  };

  // ================= UPDATE TICKET =================
  const saveUpdatedTicket = async () => {
    try {
      const payload = {
        ticket_gen_for: editData.ticket_gen_for,
        customer_name: editData.customer_name,
        mobile_no: editData.mobile_no,
        no_of_members: Number(editData.no_of_members),
        aadhar_no: editData.aadhar_no || null,
      };
      const response = await axios.put(
        `${API_PATH}/api/tickets/${editData.id}/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setData(
        data.map((row) =>
          row.id === editData.id ? response.data : row
        )
      );

      setShowEdit(false);
      alert("Ticket updated successfully!");
    } catch (error) {
      console.error("Error updating ticket:", error);
    }
  };

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h4 className="mb-3">Ticket Details</h4>
      <Table striped bordered hover responsive>
        <thead style={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
          <tr className="text-center">
            <th>Ticket Generated For</th>
            <th>Customer Name</th>
            <th>Mobile No</th>
            <th>No. of Members</th>
            <th style={{ width: "150px" }}>Actions</th>
          </tr>
        </thead>
        <tbody className="text-center">
          {data.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center text-muted">
                No tickets found
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={item.id}>
                <td>{item.ticket_gen_for || "-"}</td>
                <td>{item.customer_name || "-"}</td>
                <td>{item.mobile_no || "-"}</td>
                <td>{item.no_of_members || "-"}</td>
                <td>
                  <div className="d-flex justify-content-center align-items-center gap-2 flex-nowrap">
                   {canEditTickets && <Button
                    variant="primary"
                    size="sm"
                    className="d-inline-flex align-items-center text-nowrap"
                  onClick={() => handleEdit(item)}
                  >
                    <i className="bi bi-pencil me-1" /> Edit
                   </Button>}

                   {canDeleteTickets && <Button
                    variant="danger"
                    className="d-inline-flex align-items-center text-nowrap"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    <i className="bi bi-trash me-1" /> Delete
                   </Button>}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
      {/* PAGINATION CONTROLS */}
      <div className="d-flex justify-content-between mt-3">
        <Button
          variant="outline-secondary"
          disabled={skip === 0}
          onClick={() => setSkip((prev) => Math.max(prev - limit, 0))}
        >
          Previous
        </Button>
        <Button
          variant="outline-primary"
          disabled={data.length < limit}
          onClick={() => setSkip((prev) => prev + limit)}
        >
          Next
        </Button>
      </div>

      {/* ================= EDIT MODAL ================= */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Ticket</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Ticket Generated For</Form.Label>
              <Form.Control
                type="text"
                value={editData.ticket_gen_for}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    ticket_gen_for: e.target.value,
                  })
                }
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Customer Name</Form.Label>
              <Form.Control
                type="text"
                value={editData.customer_name}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    customer_name: e.target.value,
                  })
                }
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Mobile No</Form.Label>
              <Form.Control
                type="text"
                value={editData.mobile_no}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    mobile_no: e.target.value,
                  })
                }
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>No. of Members</Form.Label>
              <Form.Control
                type="number"
                value={editData.no_of_members}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    no_of_members: e.target.value,
                  })
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Aadhar No</Form.Label>
              <Form.Control
                type="text"
                value={editData.aadhar_no}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    aadhar_no: e.target.value,
                  })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEdit(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={saveUpdatedTicket}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};
export default TicketTable;
