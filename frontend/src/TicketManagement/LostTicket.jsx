import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Card, Alert } from "react-bootstrap";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
const API_PATH = process.env.REACT_APP_API_PATH;
const TicketLayout = () => {
  const [ticketNumber, setTicketNumber] = useState("");
  const [aadharNo, setAadharNo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [responseData, setResponseData] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const token = localStorage.getItem("access_token");

    const response = await axios.post(
      `${API_PATH}/api/lost-ticket/`,
      {
        ticket_number: ticketNumber,
        aadhar_no: aadharNo,
        customer_name: customerName,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    setResponseData(response.data);
    setSuccessMessage("Ticket submitted successfully!");
    setErrorMessage("");

    // 🔥 hide alert after 2 seconds
    setTimeout(() => {
      setSuccessMessage("");
    }, 2000);

  } catch (error) {
    setErrorMessage(error.response?.data?.detail || error.message);
    setSuccessMessage("");
  }
};


  // Extract Date & Time safely
  const formattedDate = responseData?.ticket_gen_date_time
    ? new Date(responseData.ticket_gen_date_time).toLocaleDateString("en-IN")
    : "--";

  const formattedTime = responseData?.ticket_gen_date_time
    ? new Date(responseData.ticket_gen_date_time).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--";

  return (
    <Container fluid className="p-4">
      <Row>
        {/* Left Section - Form */}
        <Col md={6} className="mb-3">
          <Card className="p-4 shadow-sm">
             <h4>Search Ticket</h4>
             <br />
            {successMessage && <Alert variant="success">{successMessage}</Alert>}
            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label><strong>Enter Ticket No</strong></Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter Ticket No"
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                />
              </Form.Group>

              <div className="text-center fw-bold my-3">OR</div>

              <Form.Group className="mb-3">
                <Form.Label><strong>Enter Aadhar No</strong></Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Aadhar No"
                  value={aadharNo}
                  onChange={(e) => setAadharNo(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  <strong>Enter Customer Name</strong>
                  <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </Form.Group>

              <div className="d-grid">
                <Button type="submit" variant="primary">
                  Submit
                </Button>
              </div>
            </Form>
          </Card>
        </Col>

        {/* Right Section - Ticket Preview */}
        <Col md={6} className="mb-3">
          <Card className="p-4 shadow-sm text-center">
            {/* Logo */}
            <div className="d-flex justify-content-center mb-3">
              <img
                src="housys.jpeg"
                alt="logo"
                style={{ maxWidth: "150px" }}
              />
            </div>

            <h5 className="fw-bold">OXYPARK KOTA</h5>

            <Row className="text-start justify-content-center mt-3">
              <Col xs={6}><strong>Date</strong></Col>
              <Col xs={6}>{formattedDate}</Col>

              <Col xs={6}><strong>Time</strong></Col>
              <Col xs={6}>{formattedTime}</Col>

              <Col xs={6}><strong>Aadhar No</strong></Col>
              <Col xs={6}>{responseData?.aadhar_no || "--"}</Col>

              <Col xs={6}><strong>Ticket No</strong></Col>
              <Col xs={6}>{responseData?.ticket_number || "--"}</Col>

              <Col xs={6}><strong>Customer</strong></Col>
              <Col xs={6}>{responseData?.customer_name || "--"}</Col>
            </Row>

            {/* Dynamic QR Code */}
            {responseData?.qr_code && (
              <div className="d-flex justify-content-center my-3">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${responseData.qr_code}`}
                  alt="QR Code"
                />
              </div>
            )}

            <h6 className="fw-bold text-dark">
              Please do not fold the QR code
            </h6>

            <p className="text-muted">Terms & Conditions</p>
            <small className="text-muted">
              A no-responsibility disclaimer — aka no-liability disclaimer —
              helps prevent claims of civil liability by customers.
            </small>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TicketLayout;
