import React, { useState } from "react";
import { Container, Table, Button, Form, Row, Col, Spinner } from "react-bootstrap";
import axios from "axios";
const API_PATH = process.env.REACT_APP_API_PATH;

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
};

const SubscriptionRechargeLogs = () => {
  const [cardNumber, setCardNumber] = useState("");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const token = (localStorage.getItem("access_token") || "").trim();
  // ================= FETCH LOGS =================
  const fetchLogs = async () => {
    if (!cardNumber.trim()) {
      alert("Please enter card number");
      return;
    }

    setLoading(true);
    setError("");
    setLogs([]);

    try {
      const res = await axios.get(
        `${API_PATH}/api/subscription-cards/${cardNumber}/logs`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setLogs(res.data);
    } catch (err) {
      setError("Failed to fetch recharge logs");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="p-4">
      <div className="p-4 rounded" style={{ backgroundColor: "#5252D4" }}>
        <h3 className="text-white mb-3">Subscription Recharge Logs</h3>

        {/* ================= SEARCH ================= */}
        <Row className="mb-3">
          <Col md={4}>
            <Form.Control
              placeholder="Enter Card Number"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
            />
          </Col>
          <Col md={2}>
            <Button className="w-100" onClick={fetchLogs}>
              Fetch Logs
            </Button>
          </Col>
        </Row>

        {/* ================= ERROR ================= */}
        {error && <p className="text-warning">{error}</p>}

        {/* ================= LOADER ================= */}
        {loading && (
          <div className="text-center text-white">
            <Spinner animation="border" />
          </div>
        )}

        {/* ================= TABLE ================= */}
        {!loading && logs.length > 0 && (
          <div className="bg-white p-3 rounded">
            <Table striped bordered hover responsive>
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Old Balance</th>
                  <th>Recharge</th>
                  <th>New Balance</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Recharged By</th>
                  <th>User Type</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={log.id}>
                    <td>{index + 1}</td>
                    <td>₹{log.oldbalance}</td>
                    <td>₹{log.recharge}</td>
                    <td>₹{log.newbalance}</td>
                    <td>{log.startdate}</td>
                    <td>{log.enddate}</td>
                    <td>{log.rechargedby}</td>
                    <td>{log.recharge_usertypeby}</td>
                    <td>
                      {formatDateTime(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        {/* ================= NO DATA ================= */}
        {!loading && logs.length === 0 && !error && (
          <p className="text-white mt-3">No recharge logs found</p>
        )}
      </div>
    </Container>
  );
};

export default SubscriptionRechargeLogs;
