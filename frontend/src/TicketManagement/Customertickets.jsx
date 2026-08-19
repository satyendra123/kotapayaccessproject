import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, Card } from "react-bootstrap";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import { getErrorMessage } from "../services/http";

const API_PATH = process.env.REACT_APP_API_PATH;

const Customertickets = ({ shifts: parentShifts, currentShift: parentCurrentShift, onShiftSelect }) => {
  // Shift Selection State
  const [shifts, setShifts] = useState(parentShifts || []);
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedShiftData, setSelectedShiftData] = useState(parentCurrentShift || null);
  const [isShiftSelected, setIsShiftSelected] = useState(!!parentCurrentShift);
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);
  
  // Ticket Form State
  const [ticketType, setTicketType] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [aadhar, setAadhar] = useState("");
  const [mobile, setMobile] = useState("");
  const [members, setMembers] = useState(1);
  const [tariffs, setTariffs] = useState([]);
  const [combos, setCombos] = useState([]);
  const [selectedCombos, setSelectedCombos] = useState([]);
  const [selectedTariffs, setSelectedTariffs] = useState([]);
  const [foc, setFoc] = useState(false);
  const [focReason, setFocReason] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountRules, setDiscountRules] = useState([
    { min_members: 51, discount_percentage: 25 },
    { min_members: 101, discount_percentage: 50 },
  ]);
  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastGeneratedTicket, setLastGeneratedTicket] = useState(null);

  // Get token with validation
  const getToken = () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      throw new Error("No authentication token found");
    }
    return token;
  };

  // Fetch shifts from API if not provided as props
  const fetchShifts = async () => {
    if (parentShifts && parentShifts.length > 0) {
      setShifts(parentShifts);
      return;
    }
    
    setIsLoadingShifts(true);
    try {
      const token = getToken();
      const response = await axios.get(`${API_PATH}/api/shifts/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("Fetched shifts:", response.data);
      // Filter only active shifts
      const activeShifts = response.data.filter(shift => shift.status === "Active");
      setShifts(activeShifts);
      
      if (activeShifts.length === 0) {
        alert("No active shifts found. Please contact administrator.");
      }
    } catch (error) {
      console.error("Error fetching shifts:", error);
      if (error.response?.status === 401) {
        alert("Session expired! Please login again.");
        localStorage.removeItem("access_token");
        window.location.href = "/login";
      } else {
        alert("Failed to fetch shifts. Please check your connection.");
      }
    } finally {
      setIsLoadingShifts(false);
    }
  };

  // Fetch tariffs from API
  const fetchTariffs = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_PATH}/api/tariffs/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTariffs((response.data || []).filter(
        (tariff) => String(tariff.status).toLowerCase() === "active"
      ));
    } catch (error) {
      console.error("Error fetching tariffs:", error);
    }
  };

  // Fetch combos from API
  const fetchCombos = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_PATH}/api/combos/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCombos((response.data || []).map((combo) => ({
        ...combo,
        combo_service: combo.comboname,
        price: Number(combo.discount_price) > 0
          ? Number(combo.discount_price)
          : Number(combo.actual_price || 0),
      })));
    } catch (error) {
      console.error("Error fetching combos:", error);
    }
  };

  // Handle shift selection
  const handleShiftProceed = () => {
    if (!selectedShift) {
      alert("Please select a shift to continue");
      return;
    }
    
    // Store the selected shift details
    const shift = shifts.find(s => s.id === parseInt(selectedShift));
    setSelectedShiftData(shift);
    setIsShiftSelected(true);
    
    // Notify parent App about shift selection
    if (onShiftSelect) {
      onShiftSelect(parseInt(selectedShift));
    }
    
    // Fetch all data after shift is selected
    fetchTariffs();
    fetchCombos();
    fetchTickets();
  };

  // Radio inputs normally cannot be unchecked. Toggle the selected service
  // off when the user clicks it again, while still allowing only one service.
  const handleTariffChange = (tariff) => {
    setSelectedTariffs((current) =>
      current.some((selected) => selected.id === tariff.id) ? [] : [tariff]
    );
  };

  // Handle combo selection (checkbox, multiple allowed)
  const handleComboChange = (combo, isChecked) => {
    if (isChecked) {
      setSelectedCombos((prev) => [...prev, combo]);
    } else {
      setSelectedCombos((prev) => prev.filter((c) => c.id !== combo.id));
    }
  };

  const handleMembersChange = (value) => {
    const nextMembers = parseInt(value, 10) || 1;
    setMembers(nextMembers);
    const appliedRule = discountRules.find((rule) => Number(rule.discount_percentage) === discount);
    if (appliedRule && nextMembers < Number(appliedRule.min_members)) {
      setDiscount(0);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    
    // If shift is already selected (from parent), load data
    if (parentCurrentShift) {
      setSelectedShiftData(parentCurrentShift);
      setSelectedShift(parentCurrentShift.id.toString());
      setIsShiftSelected(true);
      fetchTariffs();
      fetchCombos();
      fetchTickets();
    } else {
      fetchShifts();
    }
    axios.get(`${API_PATH}/api/settings/member-discount-rules`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        let rules = response.data?.data;
        if (typeof rules === "string") {
          try { rules = JSON.parse(rules); } catch { rules = null; }
        }
        if (Array.isArray(rules)) setDiscountRules(rules);
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Validate form before submission
  const validateForm = () => {
    const errors = [];

    if (!customerName.trim()) {
      errors.push("Customer name is required");
    }

    if (!mobile.trim()) {
      errors.push("Mobile number is required");
    } else if (!/^[6-9]\d{9}$/.test(mobile)) {
      errors.push("Enter a valid 10-digit Indian mobile number");
    }

    if (selectedTariffs.length === 0 && selectedCombos.length === 0 && !ticketType.trim()) {
      errors.push("Please select at least one service or combo");
    }

    if (aadhar.trim() !== "" && !/^\d{12}$/.test(aadhar)) {
      errors.push("Aadhar number must be 12 digits");
    }

    if (members <= 0) {
      errors.push("Members must be at least 1");
    }

    if (foc && focReason.trim() === "") {
      errors.push("FOC reason is required when ticket is FREE");
    }

    if (foc && discount > 0) {
      errors.push("Cannot apply discount on FOC ticket");
    }

    if (errors.length > 0) {
      alert("❌ " + errors.join("\n"));
      return false;
    }

    return true;
  };

  // Calculate totals based on current selections
  const calculateTotals = () => {
    const combosTotal = selectedCombos.reduce(
      (sum, combo) => sum + combo.price,
      0
    );
    const totalComboPrices = combosTotal * members;

    const tariffsTotal = selectedTariffs.reduce(
      (sum, tariff) => sum + tariff.price,
      0
    );
    const totalServicePrices = tariffsTotal * members;

    let grandTotal = totalComboPrices + totalServicePrices;

    if (discount > 0 && !foc) {
      const discountAmount = grandTotal * (discount / 100);
      grandTotal = grandTotal - discountAmount;
    }

    if (foc) {
      return {
        totalComboPrices: 0,
        totalServicePrices: 0,
        grandTotal: 0,
      };
    }

    return {
      totalComboPrices: parseFloat(totalComboPrices.toFixed(2)),
      totalServicePrices: parseFloat(totalServicePrices.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2)),
    };
  };

  // Submit ticket data to backend
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const token = getToken();

      const { totalComboPrices, totalServicePrices, grandTotal } =
        calculateTotals();

      let ticketForDisplay = "";
      const allSelections = [];

      if (selectedCombos.length > 0) {
        allSelections.push(...selectedCombos.map((c) => c.combo_service));
      }
      if (selectedTariffs.length > 0) {
        allSelections.push(...selectedTariffs.map((t) => t.servicename));
      }
      if (ticketType.trim()) {
        allSelections.push(ticketType);
      }

      ticketForDisplay = allSelections.join(", ");

      const ticketData = {
        ticket_gen_for: ticketForDisplay,
        customer_name: customerName,
        mobile_no: mobile,
        no_of_members: parseInt(members),
        total_service_price: totalServicePrices,
        total_combo_prices: totalComboPrices,
        grand_total: grandTotal,
        discount: parseFloat(discount.toFixed(2)),
        is_ticket_free_paid: foc ? "FREE" : "PAID",
        foc_reason: foc ? focReason.trim() : null,
        aadhar_no: aadhar || null,
        shift_id: parseInt(selectedShift),
        selected_services: selectedTariffs.map((t) => t.id),
        selected_combos: selectedCombos.map((c) => c.id),
      };

      const cleanTicketData = Object.fromEntries(
        Object.entries(ticketData).filter(([_, v]) => v != null)
      );

      const response = await axios.post(
        `${API_PATH}/api/tickets/`,
        cleanTicketData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ Ticket sent successfully:", response.data);

      setTicket(response.data);
      setLastGeneratedTicket(response.data);

      alert("Ticket Generated Successfully! Please Print the Ticket.");

      fetchTickets().catch(console.error);
      resetForm();
    } catch (error) {
      console.error("❌ Error sending ticket:", error);

      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);

        if (error.response.status === 401) {
          alert("Authentication failed! Please login again.");
          localStorage.removeItem("access_token");
          window.location.href = "/login";
        } else if (error.response.status === 403) {
          alert("You don't have permission to perform this action.");
        } else {
          alert(getErrorMessage(error, "Unable to generate ticket"));
        }
      } else if (error.request) {
        alert("Network error! Please check your connection and try again.");
      } else {
        alert("Error: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch tickets
  const fetchTickets = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_PATH}/api/tickets/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.data && response.data.length > 0) {
        const latestTicket = response.data[response.data.length - 1];
        if (
          !ticket ||
          new Date(latestTicket.ticket_gen_date_time) >
            new Date(ticket.ticket_gen_date_time)
        ) {
          setTicket(latestTicket);
        }
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      if (error.response?.status === 401) {
        alert("Session expired! Please login again.");
        localStorage.removeItem("access_token");
        window.location.href = "/login";
      }
    }
  };

  // Reset form fields
  const resetForm = () => {
    setTicketType("");
    setCustomerName("");
    setAadhar("");
    setMobile("");
    setMembers(1);
    setSelectedCombos([]);
    setSelectedTariffs([]);
    setFoc(false);
    setFocReason("");
    setDiscount(0);
  };

  const { totalComboPrices, totalServicePrices, grandTotal } = calculateTotals();

  const isComboSelected = (comboId) => {
    return selectedCombos.some((combo) => combo.id === comboId);
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "-";
    try {
      return new Date(dateTimeString).toLocaleString();
    } catch {
      return dateTimeString;
    }
  };

  // Send receipt commands directly to the thermal printer. Browser printing uses
  // the driver's full page size and adds browser headers/footers on some systems.
  const handlePrint = async () => {
    if (!ticket?.id) return;

    setIsLoading(true);
    try {
      const token = getToken();
      const response = await axios.post(
        `${API_PATH}/api/tickets/${ticket.id}/print`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data?.message || "Ticket sent to printer.");
    } catch (error) {
      alert(getErrorMessage(error, "Ticket could not be sent to the printer."));
    } finally {
      setIsLoading(false);
    }
  };

  // Change shift handler
  const handleChangeShift = () => {
    setIsShiftSelected(false);
    setSelectedShift("");
    setSelectedShiftData(null);
    setTicket(null);
    resetForm();
    fetchShifts();
    // Clear shift from parent
    if (onShiftSelect) {
      onShiftSelect(null);
    }
  };

  // Refresh shifts handler
  const handleRefreshShifts = async () => {
    await fetchShifts();
  };

  // Shift Selection Screen
  if (!isShiftSelected) {
    return (
      <Container className="mt-5">
        <style type="text/css">
          {`
            .shift-card {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            .shift-card .card-body {
              padding: 3rem;
            }
            .shift-select {
              font-size: 1.1rem;
              padding: 12px;
              border-radius: 10px;
              border: 2px solid #e0e0e0;
            }
            .proceed-btn {
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              border: none;
              padding: 12px;
              font-size: 1.1rem;
              font-weight: bold;
              border-radius: 10px;
              transition: transform 0.2s;
            }
            .proceed-btn:hover:not(:disabled) {
              transform: translateY(-2px);
            }
            .refresh-btn {
              background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
              border: none;
              padding: 10px;
              border-radius: 10px;
              transition: transform 0.2s;
            }
            .refresh-btn:hover:not(:disabled) {
              transform: translateY(-2px);
            }
          `}
        </style>
        <Card className="shift-card text-white">
          <Card.Body className="text-center">
            <h2 className="mb-3">🎟️ WELCOME, {localStorage.getItem("username") || "Admin"}</h2>
            <h5 className="mb-4">Select Shift and continue...</h5>
            
            <Form>
              <Form.Group className="mb-4">
                <Form.Label className="h5">Please Select Shift and continue..</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Select
                    value={selectedShift}
                    onChange={(e) => setSelectedShift(e.target.value)}
                    className="shift-select text-dark"
                    disabled={isLoadingShifts}
                  >
                    <option value="">{isLoadingShifts ? "Loading shifts..." : "Select Shift"}</option>
                    {shifts.map((shift) => (
                      <option key={shift.id} value={shift.id}>
                        {shift.shiftname} - {shift.shiftstarttime} to {shift.shiftendtime}
                        {shift.status === "Active" && " ✅"}
                      </option>
                    ))}
                  </Form.Select>
                  <Button 
                    className="refresh-btn"
                    onClick={handleRefreshShifts}
                    disabled={isLoadingShifts}
                    variant="light"
                    title="Refresh shifts"
                  >
                    🔄
                  </Button>
                </div>
                {shifts.length === 0 && !isLoadingShifts && (
                  <div className="text-warning mt-2">
                    ⚠️ No active shifts found. Please contact administrator.
                  </div>
                )}
                {shifts.length > 0 && (
                  <div className="text-light mt-2 small">
                    📍 Total {shifts.length} active shift(s) available
                  </div>
                )}
              </Form.Group>
              
              <Button 
                className="proceed-btn w-100"
                onClick={handleShiftProceed}
                disabled={!selectedShift || isLoadingShifts}
              >
                🚀 PROCEED TO TICKET MANAGEMENT
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  // Ticket Management Screen
  return (
    <Container fluid className="p-4">
      <style type="text/css">
        {`
          @media print {
            @page {
              size: 80mm 100mm;
              margin: 2mm;
            }
            html, body {
              width: 80mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
            }
            .container-fluid,
            .row,
            .col,
            [class*="col-"] {
              display: block !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .no-print {
              display: none !important;
            }
            .ticket-preview {
              display: block !important;
              width: 76mm !important;
              max-width: 76mm !important;
              margin: 0 auto !important;
              padding: 2mm !important;
              border: 0 !important;
              box-shadow: none !important;
              color: #000 !important;
              background: #fff !important;
              font-size: 9px !important;
              line-height: 1.15 !important;
            }
            .ticket-preview h5,
            .ticket-preview h6,
            .ticket-preview p {
              margin-top: 1mm !important;
              margin-bottom: 1mm !important;
            }
            .ticket-preview h5 {
              font-size: 11px !important;
            }
            .ticket-preview h6 {
              font-size: 10px !important;
            }
            .ticket-preview .mt-2,
            .ticket-preview .mb-3,
            .ticket-preview .p-2 {
              margin-top: 1mm !important;
              margin-bottom: 1mm !important;
              padding: 1mm !important;
            }
            .ticket-preview img,
            .ticket-preview canvas {
              display: block !important;
              max-width: 100% !important;
              margin-left: auto !important;
              margin-right: auto !important;
            }
            .ticket-preview img {
              max-width: 28mm !important;
              margin-bottom: 1mm !important;
            }
            .ticket-preview canvas {
              width: 24mm !important;
              height: 24mm !important;
            }
          }
        `}
      </style>

      <Row>
        {/* Form Column */}
        <Col md={6} className="mb-3 no-print">
          <Card className="p-3" style={{ backgroundColor: "#4b47c5", color: "#fff" }}>
            <div className="justify-content-between d-flex align-items-center mb-3">
              <h5 className="mb-0">🎫 Ticket Generation System</h5>
              <Button 
                variant="outline-light" 
                size="sm"
                onClick={handleChangeShift}
              >
                🔄 Change Shift
              </Button>
            </div>

            {/* Individual Tariffs Section */}
            <Card className="p-3 border-primary mb-3" style={{ backgroundColor: "#f8f9fa", color: "#000" }}>
              <h6 className="text-success fw-bold text-center mb-3">
                📋 INDIVIDUAL SERVICES (Select One)
              </h6>
              <Row className="mb-3">
                {tariffs.map((tariff) => (
                  <Col xs={12} sm={6} md={4} key={tariff.id}>
                    <Form.Check
                      type="radio"
                      name="tariffRadio"
                      id={`tariff-${tariff.id}`}
                      label={`${tariff.servicename} (₹${tariff.price})`}
                      checked={selectedTariffs.some((t) => t.id === tariff.id)}
                      onClick={() => handleTariffChange(tariff)}
                      disabled={isLoading}
                    />
                  </Col>
                ))}
              </Row>

              {selectedTariffs.length > 0 && (
                <div className="alert alert-info">
                  <strong>✅ Selected Service:</strong>
                  <ul className="mb-0 mt-1">
                    {selectedTariffs.map((tariff) => (
                      <li key={tariff.id}>
                        {tariff.servicename} - ₹{tariff.price} per member
                      </li>
                    ))}
                  </ul>
                  <div className="mt-1">
                    <strong>💰 Total Service Price for {members} member(s):</strong>{" "}
                    ₹{totalServicePrices.toFixed(2)}
                  </div>
                </div>
              )}
            </Card>

            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>👤 Customer Name *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter Customer Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      disabled={isLoading}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>🆔 Aadhar No (Optional)</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="Enter Aadhar No."
                      value={aadhar}
                      onChange={(e) => setAadhar(e.target.value)}
                      disabled={isLoading}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>📱 Mobile Number *</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="Enter Mobile No."
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      disabled={isLoading}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>👥 No. of Members *</Form.Label>
                    <Form.Control
                      type="number"
                      value={members}
                      onChange={(e) => handleMembersChange(e.target.value)}
                      disabled={isLoading}
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Combo Services Section */}
              <Card className="p-3 border-primary mb-3" style={{ backgroundColor: "#f8f9fa", color: "#000" }}>
                <h6 className="text-success fw-bold text-center mb-3">
                  🎁 COMBO SERVICES (Select Multiple)
                </h6>
                <Row className="mb-3">
                  {combos.map((combo) => (
                    <Col xs={12} sm={6} key={combo.id}>
                      <Form.Check
                        type="checkbox"
                        name="comboCheckbox"
                        id={`combo-${combo.id}`}
                        label={`${combo.combo_service} (₹${combo.price})`}
                        checked={isComboSelected(combo.id)}
                        onChange={(e) =>
                          handleComboChange(combo, e.target.checked)
                        }
                        disabled={isLoading}
                      />
                    </Col>
                  ))}
                </Row>

                {selectedCombos.length > 0 && (
                  <div className="alert alert-info">
                    <strong>✅ Selected Combos ({selectedCombos.length}):</strong>
                    <ul className="mb-0 mt-1">
                      {selectedCombos.map((combo) => (
                        <li key={combo.id}>
                          {combo.combo_service} - ₹{combo.price} per member
                        </li>
                      ))}
                    </ul>
                    <div className="mt-1">
                      <strong>💰 Total Combo Price for {members} member(s):</strong>{" "}
                      ₹{totalComboPrices.toFixed(2)}
                    </div>
                  </div>
                )}
              </Card>

              {/* FOC Toggle */}
              <Form.Check
                type="switch"
                id="foc-ticket"
                label="🎟️ FOC Ticket (Free)"
                checked={foc}
                onChange={() => setFoc(!foc)}
                disabled={isLoading}
                style={{ color: "#fff" }}
                className="mb-3"
              />

              {foc && (
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Enter FOC Ticket Reason"
                  value={focReason}
                  onChange={(e) => setFocReason(e.target.value)}
                  className="mb-3"
                  disabled={isLoading}
                />
              )}

              {/* Discount Buttons */}
              <Card className="p-3 border-primary mb-3" style={{ backgroundColor: "#f8f9fa", color: "#000" }}>
                <h6 className="text-success fw-bold text-center mb-3">
                  💸 APPLY DISCOUNT
                </h6>
                <Row className="text-center">
                  <Col xs={12} md={6} className="mb-2 mb-md-0">
                    <Button
                      variant="secondary"
                      className="w-100"
                      disabled={foc || isLoading || members < Number(discountRules[0]?.min_members || Infinity)}
                      onClick={() => setDiscount(Number(discountRules[0]?.discount_percentage || 0))}
                    >
                      Apply {discountRules[0]?.discount_percentage || 0}% Discount
                    </Button>
                  </Col>
                  <Col xs={12} md={6}>
                    <Button
                      variant="secondary"
                      className="w-100"
                      disabled={foc || isLoading || members < Number(discountRules[1]?.min_members || Infinity)}
                      onClick={() => setDiscount(Number(discountRules[1]?.discount_percentage || 0))}
                    >
                      Apply {discountRules[1]?.discount_percentage || 0}% Discount
                    </Button>
                  </Col>
                </Row>
                <small className="d-block text-muted text-center mt-2">
                  {discountRules.map((rule) => `${rule.discount_percentage}% discount: ${rule.min_members}+ members`).join(" · ")}
                </small>
                {discount > 0 && (
                  <div className="text-center mt-2">
                    <span className="text-warning">
                      🏷️ Applied: {discount}% discount
                    </span>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="ms-2"
                      onClick={() => setDiscount(0)}
                      disabled={isLoading}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </Card>

              {/* Order Summary */}
              {(selectedCombos.length > 0 || selectedTariffs.length > 0) && (
                <Card className="p-3 border-success mb-3" style={{ backgroundColor: "#f8f9fa", color: "#000" }}>
                  <h6 className="text-primary fw-bold text-center mb-3">
                    📊 ORDER SUMMARY
                  </h6>
                  <div className="text-center">
                    {selectedCombos.length > 0 && (
                      <>
                        <p className="mb-1">
                          <strong>Selected Combos:</strong>{" "}
                          {selectedCombos
                            .map((c) => c.combo_service)
                            .join(", ")}
                        </p>
                        <p className="mb-1">
                          <strong>Combos Selected:</strong>{" "}
                          {selectedCombos.length}
                        </p>
                      </>
                    )}
                    {selectedTariffs.length > 0 && (
                      <p className="mb-1">
                        <strong>Selected Service:</strong>{" "}
                        {selectedTariffs[0].servicename}
                      </p>
                    )}
                    <p className="mb-1">
                      <strong>Members:</strong> {members}
                    </p>
                    {selectedCombos.length > 0 && (
                      <p className="mb-1">
                        <strong>Total Combo Price:</strong> ₹
                        {totalComboPrices.toFixed(2)}
                      </p>
                    )}
                    {selectedTariffs.length > 0 && (
                      <p className="mb-1">
                        <strong>Total Service Price:</strong> ₹
                        {totalServicePrices.toFixed(2)}
                      </p>
                    )}
                    <p className="mb-1">
                      <strong>Subtotal:</strong> ₹
                      {(totalComboPrices + totalServicePrices).toFixed(2)}
                    </p>
                    {discount > 0 && !foc && (
                      <p className="mb-1">
                        <strong>Discount:</strong> {discount}%
                      </p>
                    )}
                    {foc && (
                      <p className="mb-1 text-danger">
                        <strong>🎟️ Ticket is FREE</strong>
                      </p>
                    )}
                    <h5 className="text-success mt-2">
                      <strong>Grand Total:</strong> ₹{grandTotal.toFixed(2)}
                    </h5>
                  </div>
                </Card>
              )}

              <div className="d-grid gap-2">
                <Button
                  variant="danger"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? "⏳ Generating Ticket..." : "✅ Submit Ticket Details"}
                </Button>
                <Button
                  variant="outline-light"
                  className="text-dark"
                  onClick={resetForm}
                  disabled={isLoading}
                >
                  🔄 Reset Form
                </Button>
              </div>
            </Form>
          </Card>
        </Col>

        {/* Ticket Preview Column */}
        <Col md={6} className="mb-3">
          <Card className="p-3 text-center ticket-preview">
            <img
              src="housys.jpeg"
              alt="logo"
              style={{
                maxWidth: "150px",
                marginBottom: "10px",
                marginLeft: "auto",
                marginRight: "auto",
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <h6 style={{ color: "red" }}>🏞️ CHAMBAL RIVER FRONT KOTA RAJASTHAN</h6>
            
            {/* Shift Details Display - Added here below the header */}
            {selectedShiftData && (
              <div className="mt-2 mb-3 p-2" style={{ 
                backgroundColor: "#f0f8ff", 
                borderRadius: "8px",
                borderLeft: "4px solid #4b47c5"
              }}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>📍 Shift:</strong> {selectedShiftData.shiftname}
                  </div>
                  <div>
                    <strong>⏰ Time:</strong> {selectedShiftData.shiftstarttime} - {selectedShiftData.shiftendtime}
                  </div>
                  <div>
                    <span className="badge bg-success">Active</span>
                  </div>
                </div>
              </div>
            )}

            <p>
              <strong>📅 Date Time:</strong>{" "}
              {ticket ? formatDateTime(ticket.ticket_gen_date_time) : "-"}
            </p>
            <p>
              <strong>👤 Customer Name:</strong> {ticket?.customer_name || "-"}
            </p>
            <p>
              <strong>📱 Mobile No:</strong> {ticket?.mobile_no || "-"}
            </p>
            <p>
              <strong>🎫 Ticket For:</strong> {ticket?.ticket_gen_for || "-"}
            </p>
            {ticket?.combo_services && (
              <p>
                <strong>🎁 Combo Services:</strong> {ticket.combo_services}
              </p>
            )}
            <p>
              <strong>👥 Members:</strong> {ticket?.no_of_members || 0}, <strong>💰 Price:</strong> ₹{ticket?.grand_total || 0}
            </p>
            {ticket?.ticket_number && (
              <QRCodeCanvas
                value={ticket.ticket_number}
                size={120}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
                style={{ margin: "10px auto" }}
              />
            )}

            <p>
              <strong>🎫 Ticket No:</strong>{" "}
              {ticket?.ticket_number || "AUTO_GEN_123"}
            </p>
            <h5>⚠️ Please do not fold the QR code</h5>

            {lastGeneratedTicket && lastGeneratedTicket.id === ticket?.id && (
              <div className="text-success mt-2">
                <small>✨ Newly Generated Ticket</small>
              </div>
            )}

            {/* Print Button */}
            {ticket && (
              <div className="d-grid gap-2 mt-3 no-print">
                <Button
                  variant="success"
                  onClick={handlePrint}
                  disabled={isLoading}
                  size="lg"
                >
                  🖨️ Print Ticket (One Copy)
                </Button>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Customertickets;
