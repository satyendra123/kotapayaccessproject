import React, { useEffect, useState } from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import axios from "axios";
const API_PATH = process.env.REACT_APP_API_PATH;

const Subscription = () => {
  // ================= NEW SUBSCRIPTION =================
  const [formData, setFormData] = useState({
    name: "",
    phonenum: "",
    email: "",
    startdate: "",
    enddate: "",
    recharge: "",
    cardnumber: "",
    status: "Active",
  });

  // ================= RENEW DATA =================
  const [rechargeData, setRechargeData] = useState({
    startdate: "",
    enddate: "",
    recharge: "",
    status: "active",
  });

  const [cardNumber, setCardNumber] = useState("");
  const [cardDetails, setCardDetails] = useState(null);
  const [errors, setErrors] = useState({});
  const [rechargeErrors, setRechargeErrors] = useState({});
  const [fetchError, setFetchError] = useState("");
  const [loading, setLoading] = useState(false);
  // ================= RECHARGE LOGS =================
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState("");
  const [cards, setCards] = useState([]);
  const [cardsPage, setCardsPage] = useState(1);
  const [editingCardNumber, setEditingCardNumber] = useState("");
  const cardsPerPage = 10;

  const token = (localStorage.getItem("access_token") || "").trim();

  const emptyForm = {
    name: "", phonenum: "", email: "", startdate: "", enddate: "",
    recharge: "", cardnumber: "", status: "Active",
  };

  const fetchCards = async () => {
    try {
      const response = await axios.get(`${API_PATH}/api/subscription-cards/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCards(response.data || []);
      setCardsPage((page) => Math.max(1, Math.min(page, Math.ceil((response.data || []).length / cardsPerPage) || 1)));
    } catch (error) {
      console.error("Unable to load subscription cards", error);
    }
  };

  useEffect(() => { fetchCards(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ================= HANDLERS =================
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleRechargeChange = (e) => {
    setRechargeData({ ...rechargeData, [e.target.name]: e.target.value });
    setRechargeErrors({ ...rechargeErrors, [e.target.name]: "" });
  };

  // ================= VALIDATION =================
  const validate = () => {
    let temp = {};
    let isValid = true;

    if (!formData.name.trim()) {
      temp.name = "Full Name is required";
      isValid = false;
    }

    if (!formData.phonenum.trim()) {
      temp.phonenum = "Phone number is required";
      isValid = false;
    } else if (!/^\d{10}$/.test(formData.phonenum)) {
      temp.phonenum = "Phone number must be 10 digits";
      isValid = false;
    }

    if (!formData.startdate) {
      temp.startdate = "Start date is required";
      isValid = false;
    }

    if (!formData.enddate) {
      temp.enddate = "End date is required";
      isValid = false;
    }

    if (!formData.recharge) {
      temp.recharge = "Recharge amount required";
      isValid = false;
    } else if (isNaN(formData.recharge) || Number(formData.recharge) <= 0) {
      temp.recharge = "Enter valid recharge amount";
      isValid = false;
    }

    if (!formData.cardnumber.trim()) {
      temp.cardnumber = "Card number required";
      isValid = false;
    }

    setErrors(temp);
    return isValid;
  };

  // ================= CREATE NEW SUBSCRIPTION =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const payload = { ...formData, recharge: Number(formData.recharge) };
      const request = {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      };
      if (editingCardNumber) {
        await axios.put(`${API_PATH}/api/subscription-cards/${editingCardNumber}`, payload, request);
        alert("Subscription Card Updated Successfully");
      } else {
        await axios.post(`${API_PATH}/api/subscription-cards/`, payload, request);
        alert("Subscription Created Successfully");
      }
      setFormData(emptyForm);
      setEditingCardNumber("");
      fetchCards();
    } catch (err) {
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;

        // If status 500 but the response might contain a hint about duplicate
        if (status === 500) {
          // Check if the response text or data contains something like "duplicate" or "unique constraint"
          const errorString = JSON.stringify(data).toLowerCase();
          if (
            errorString.includes("duplicate") ||
            errorString.includes("unique") ||
            errorString.includes("already exists")
          ) {
            alert("Please enter a unique card number.");
            // Also set field error for cardnumber
            setErrors((prev) => ({
              ...prev,
              cardnumber: "This card number already exists.",
            }));
          } else {
            alert(
              "Server error (500). Please try again later or contact support.",
            );
          }
        } else if (status === 400) {
          // handle validation errors as before
          if (data.cardnumber) {
            setErrors((prev) => ({ ...prev, cardnumber: data.cardnumber }));
            alert(data.cardnumber);
          } else if (data.message) {
            alert(data.message);
          } else {
            alert("Invalid data provided.");
          }
        } else {
          alert(`Error ${status}: Failed to create subscription.`);
        }
      } else {
        alert("Network error. Please check your connection.");
      }
    }
  };

  const editCard = (card) => {
    setFormData({
      name: card.name || "", phonenum: card.phonenum || "", email: card.email || "",
      startdate: String(card.startdate || "").slice(0, 10), enddate: String(card.enddate || "").slice(0, 10),
      recharge: String(card.recharge || ""), cardnumber: card.cardnumber || "", status: card.status || "Active",
    });
    setEditingCardNumber(card.cardnumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteCard = async (cardnumber) => {
    if (!window.confirm(`Delete subscription card ${cardnumber} and its recharge history?`)) return;
    try {
      await axios.delete(`${API_PATH}/api/subscription-cards/${cardnumber}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (editingCardNumber === cardnumber) {
        setFormData(emptyForm);
        setEditingCardNumber("");
      }
      fetchCards();
      alert("Subscription card deleted successfully");
    } catch (error) {
      alert(error.response?.data?.detail || "Unable to delete subscription card");
    }
  };

  // ================= FETCH CARD FOR RENEW =================
  const fetchCardDetails = async () => {
    if (!cardNumber.trim()) {
      alert("Please enter card number");
      return;
    }

    setLoading(true);
    setFetchError("");
    setCardDetails(null);

    try {
      const res = await axios.get(
        `${API_PATH}/api/subscription-cards/${cardNumber}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setCardDetails(res.data);
      fetchRechargeLogs();

      // Prefill renew form
      setRechargeData({
        startdate: res.data.startdate,
        enddate: res.data.enddate || "",
        recharge: "",
        status: res.data.status || "active",
      });
      
    } catch (err) {
      setFetchError("Card not found or unauthorized");
    } finally {
      setLoading(false);
    }
  };

  // ================= SUBMIT RENEW (MATCHES API EXACTLY) =================
  const submitRenew = async () => {
    const { startdate, enddate, recharge, status } = rechargeData;

    if (!startdate || !enddate || !recharge) {
      alert("Fill all renew fields");
      return;
    }

    try {
      await axios.post(
        `${API_PATH}/api/subscription-cards/${cardNumber}/recharge`,
        null,
        {
          params: {
            recharge: Number(recharge),
            startdate,
            enddate,
            status,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      alert("Card Recharged / Renewed Successfully");
    } catch (err) {
      alert("Recharge failed");
    }
  };
  // ================= FETCH RECHARGE LOGS =================
  const fetchRechargeLogs = async () => {
    setLogs([]);
    setLogsError("");
    setLogsLoading(true);

    try {
      const res = await axios.get(
        `${API_PATH}/api/subscription-cards/${cardNumber}/logs`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setLogs(res.data);
    } catch (err) {
      setLogsError("Failed to fetch recharge logs");
    } finally {
      setLogsLoading(false);
    }
  };
  const totalCardsPages = Math.max(1, Math.ceil(cards.length / cardsPerPage));
  const visibleCards = cards.slice((cardsPage - 1) * cardsPerPage, cardsPage * cardsPerPage);
  return (
    <Container fluid className="p-4">
      {/* ================= NEW SUBSCRIPTION ================= */}
      <div className="p-4 mb-4 rounded" style={{ backgroundColor: "#5252D4" }}>
        <h3 className="fw-bold mb-3" style={{ color: "#FFDF8F" }}>
          {editingCardNumber ? "Edit Subscription Card" : "Sale New Subscription Card"}
        </h3>

        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col md={3}>
              <Form.Label className="text-dark">Full Name *</Form.Label>
              <Form.Control
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && (
                <small className="text-warning">{errors.name}</small>
              )}
            </Col>

            <Col md={3}>
              <Form.Label className="text-dark">Phone *</Form.Label>
              <Form.Control
                name="phonenum"
                value={formData.phonenum}
                onChange={handleChange}
              />
              {errors.phonenum && (
                <small className="text-warning">{errors.phonenum}</small>
              )}
            </Col>

            <Col md={3}>
              <Form.Label className="text-dark">Email</Form.Label>
              <Form.Control
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Col>

            <Col md={3}>
              <Form.Label className="text-dark">Start Date *</Form.Label>
              <Form.Control
                type="date"
                name="startdate"
                value={formData.startdate}
                onChange={handleChange}
              />
            </Col>

            <Col md={3}>
              <Form.Label className="text-dark">End Date *</Form.Label>
              <Form.Control
                type="date"
                name="enddate"
                value={formData.enddate}
                onChange={handleChange}
              />
            </Col>

            <Col md={3}>
              <Form.Label className="text-dark">Recharge *</Form.Label>
              <Form.Control
                name="recharge"
                value={formData.recharge}
                onChange={handleChange}
              />
              {errors.recharge && (
                <small className="text-warning">{errors.recharge}</small>
              )}
            </Col>

            <Col md={3}>
              <Form.Label className="text-dark">Card Number *</Form.Label>
              <Form.Control
                name="cardnumber"
                value={formData.cardnumber}
                onChange={handleChange}
                disabled={Boolean(editingCardNumber)}
              />
              {errors.cardnumber && (
                <small className="text-warning">{errors.cardnumber}</small>
              )}
            </Col>

            <Col md={3}>
              <Form.Label className="text-dark">Status</Form.Label>
              <Form.Select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option>Active</option>
                <option>Inactive</option>
                <option>Expired</option>
              </Form.Select>
            </Col>
          </Row>

          <div className="d-flex gap-2 mt-4">
            <Button className="flex-grow-1" type="submit">
              {editingCardNumber ? "Update Card" : "Create Card"}
            </Button>
            {editingCardNumber && <Button variant="secondary" type="button" onClick={() => { setFormData(emptyForm); setEditingCardNumber(""); }}>Cancel</Button>}
          </div>
        </Form>
      </div>

      <div className="p-4 mb-4 rounded bg-white">
        <h3 className="fw-bold mb-3">Manage Subscription Cards</h3>
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead><tr><th>Card No.</th><th>Name</th><th>Phone</th><th>Validity</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {cards.length === 0 && <tr><td colSpan="7" className="text-center">No subscription cards found.</td></tr>}
              {visibleCards.map((card) => <tr key={card.id}>
                <td>{card.cardnumber}</td><td>{card.name}</td><td>{card.phonenum}</td>
                <td>{card.startdate} → {card.enddate}</td><td>₹{card.currentbalance}</td><td>{card.status}</td>
                <td><Button size="sm" variant="outline-primary" className="me-2" onClick={() => editCard(card)}><i className="bi bi-pencil me-1" />Edit</Button><Button size="sm" variant="outline-danger" onClick={() => deleteCard(card.cardnumber)}><i className="bi bi-trash me-1" />Delete</Button></td>
              </tr>)}
            </tbody>
          </table>
        </div>
        {cards.length > cardsPerPage && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <small className="text-muted">Showing {(cardsPage - 1) * cardsPerPage + 1}–{Math.min(cardsPage * cardsPerPage, cards.length)} of {cards.length} cards</small>
            <div className="d-flex gap-2">
              <Button size="sm" variant="outline-secondary" disabled={cardsPage === 1} onClick={() => setCardsPage((page) => page - 1)}><i className="bi bi-chevron-left me-1" />Previous</Button>
              <span className="px-2 py-1 small">Page {cardsPage} of {totalCardsPages}</span>
              <Button size="sm" variant="outline-secondary" disabled={cardsPage === totalCardsPages} onClick={() => setCardsPage((page) => page + 1)}>Next<i className="bi bi-chevron-right ms-1" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* ================= RENEW SECTION ================= */}
      <div className="p-4 rounded" style={{ backgroundColor: "#5252D4" }}>
        <h3 className="text-dark mb-3">Recharge / Renew Subscription</h3>

        <Row className="g-4">
          <Col md={12}>
            <Form.Control
              placeholder="Enter Card Number"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
            />
            <Button className="w-100 mt-3" onClick={fetchCardDetails}>
              {loading ? "Fetching..." : "Fetch Card"}
            </Button>
            {fetchError && <p className="text-warning mt-2">{fetchError}</p>}
          </Col>

          <Col md={12}>
            {cardDetails && (
              <>
                <div className="bg-white p-3 rounded mb-3">
                  <p>
                    <b>Card Holder Name</b>
                    {cardDetails.name}
                  </p>
                  <p>
                    <b>Phone Number</b>
                    {cardDetails.phonenum}
                  </p>
                  <p>
                    <b>Balance:</b> ₹{cardDetails.currentbalance}
                  </p>
                  <p>
                    <b>Status:</b> {cardDetails.status}
                  </p>
                  <p>
                    <b>Validity:</b> {cardDetails.startdate} →{" "}
                    {cardDetails.enddate}
                  </p>
                </div>

                <div className="bg-white p-3 rounded">
                  <p>Validity Start Date *</p>
                  <Form.Control
                    type="date"
                    name="startdate"
                    value={rechargeData.startdate}
                    onChange={handleRechargeChange}
                    className="mb-2"
                  />
                  <p>Validity End Date *</p>
                  <Form.Control
                    type="date"
                    name="enddate"
                    value={rechargeData.enddate}
                    onChange={handleRechargeChange}
                    className="mb-2"
                  />
                  <p>Set Value Recharge (Rs.) *</p>
                  <Form.Control
                    placeholder="Recharge Amount"
                    name="recharge"
                    value={rechargeData.recharge}
                    onChange={handleRechargeChange}
                    className="mb-2"
                  />
                  <p>Status</p>
                  <Form.Select
                    name="status"
                    value={rechargeData.status}
                    onChange={handleRechargeChange}
                    className="mb-3"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>

                  <Button className="w-100" onClick={submitRenew}>
                    Submit Renew
                  </Button>
                </div>
                {cardDetails && (
                  <div className="row mt-4">
                    <div className="w-100">
                      <div className="bg-white p-3 rounded">
                        {/* Header with Refresh */}
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="mb-0">Recharge History</h5>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={fetchRechargeLogs}
                            disabled={logsLoading}
                          >
                            {logsLoading ? "Refreshing..." : "🔄 Refresh"}
                          </button>
                        </div>

                        {/* Loading */}
                        {logsLoading && <p>Loading logs...</p>}

                        {/* Error */}
                        {logsError && (
                          <p className="text-danger">{logsError}</p>
                        )}

                        {/* Table */}
                        {!logsLoading && logs.length > 0 && (
                          <div className="table-responsive">
                            <table className="table table-bordered table-striped">
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
                                      <td>
                                        {log.created_at && !Number.isNaN(new Date(log.created_at).getTime())
                                          ? new Date(log.created_at).toLocaleString("en-IN", {
                                            timeZone: "Asia/Kolkata",
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            second: "2-digit",
                                          })
                                          : "—"}
                                      </td>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Empty State */}
                        {!logsLoading && logs.length === 0 && !logsError && (
                          <p className="text-muted">No recharge logs found</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </Col>
        </Row>
      </div>
    </Container>
  );
};

export default Subscription;
