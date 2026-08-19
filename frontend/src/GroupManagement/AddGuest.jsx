import React, { useEffect, useState } from "react";
import { Form, Row, Col, Button, Card } from "react-bootstrap";
import axios from "axios";
const API_PATH = process.env.REACT_APP_API_PATH;
const GuestManagement = () => {
  const [gates, setGates] = useState([]);
  const [cards, setCards] = useState([]);
  const [cardInput, setCardInput] = useState("");
  // form fields
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    withmembers: "",
    phonenumber: "",
    emailid: "",
    status: "",
    accesscardtype: "",
    aadharcard: "",
    timezone_start: "",
    timezone_end: "",
    accessgate: "",
  });

  // fetch active gates
  useEffect(() => {
    const fetchGates = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await axios.get(
          `${API_PATH}/api/gates/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const activeGates = response.data.filter(
          (gate) =>
            gate.status.toLowerCase() === "active" ||
            gate.status.toLowerCase() === "open"
        );

        setGates(activeGates);
      } catch (error) {
        console.error("Error fetching gates:", error);
      }
    };

    fetchGates();
  }, []);

  // handle form change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // add card
  const handleAddCard = () => {
    if (cardInput.trim()) {
      setCards([...cards, cardInput.trim()]);
      setCardInput("");
    }
  };

  // submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("access_token");

      // Prepare final payload
      const payload = {
        ...formData,
        withmembers: parseInt(formData.withmembers),
        accessgate: parseInt(formData.accessgate),
        timezone_start: new Date(
          `2025-08-19T${formData.timezone_start}:00Z`
        ).toISOString(),
        timezone_end: new Date(
          `2025-08-19T${formData.timezone_end}:00Z`
        ).toISOString(),
        input_cards: cards,
      };

      const response = await axios.post(
        `${API_PATH}/api/guests/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Guest saved successfully:", response.data);
      alert("Guest saved successfully ✅");

      // reset form
      setFormData({
        name: "",
        gender: "",
        withmembers: "",
        phonenumber: "",
        emailid: "",
        status: "",
        accesscardtype: "",
        aadharcard: "",
        timezone_start: "",
        timezone_end: "",
        accessgate: "",
      });
      setCards([]);
    } catch (error) {
      console.error("Error saving guest:", error);
      alert("Failed to save guest ❌");
    }
  };

  return (
    <Card className="p-4" style={{ backgroundColor: "#4a4ac7", color: "#fff" }}>
      <h4 className="mb-4" style={{ color: "#f9a825" }}>
        Guest Management
      </h4>

      <Form onSubmit={handleSubmit}>
        {/* Row 1 */}
        <Row className="mb-3">
          <Col md={3}>
            <Form.Group>
              <Form.Label>
                Guest Name<span style={{ color: "red" }}>*</span>
              </Form.Label>
              <Form.Control
                name="name"
                value={formData.name}
                onChange={handleChange}
                type="text"
                placeholder="Enter Guest Name"
              />
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group>
              <Form.Label>
                Gender<span style={{ color: "red" }}>*</span>
              </Form.Label>
              <Form.Select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option>Male</option>
                <option>Female</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group>
              <Form.Label>
                With No. of Members<span style={{ color: "red" }}>*</span>
              </Form.Label>
              <Form.Control
                name="withmembers"
                value={formData.withmembers}
                onChange={handleChange}
                type="number"
                placeholder="No. of Members"
              />
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group>
              <Form.Label>
                Phone Number<span style={{ color: "red" }}>*</span>
              </Form.Label>
              <Form.Control
                name="phonenumber"
                value={formData.phonenumber}
                onChange={handleChange}
                type="text"
                placeholder="Enter Phone Number"
              />
            </Form.Group>
          </Col>
        </Row>

        {/* Row 2 */}
        <Row className="mb-3">
          <Col md={3}>
            <Form.Group>
              <Form.Label>
                Email <span style={{ color: "#ccc" }}>(Optional)</span>
              </Form.Label>
              <Form.Control
                name="emailid"
                value={formData.emailid}
                onChange={handleChange}
                type="email"
                placeholder="Enter Email"
              />
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group>
              <Form.Label>
                Status<span style={{ color: "red" }}>*</span>
              </Form.Label>
              <Form.Select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="">Select Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group>
              <Form.Label>
                Access Card Type<span style={{ color: "red" }}>*</span>
              </Form.Label>
              <Form.Select
                name="accesscardtype"
                value={formData.accesscardtype}
                onChange={handleChange}
              >
                <option value="">Select Access Card Type</option>
                <option>Single card</option>
                <option>Bulk cards</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group>
              <Form.Label>
                Aadhaar Card<span style={{ color: "red" }}>*</span>
              </Form.Label>
              <Form.Control
                name="aadharcard"
                value={formData.aadharcard}
                onChange={handleChange}
                type="text"
                placeholder="Enter Aadhaar Card"
              />
            </Form.Group>
          </Col>
        </Row>

        {/* Row 3 */}
        <Row className="mb-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>
                TimeZone (Start Time)<span style={{ color: "red" }}>*</span>
              </Form.Label>
              <Form.Control
                name="timezone_start"
                value={formData.timezone_start}
                onChange={handleChange}
                type="time"
              />
            </Form.Group>
          </Col>

          <Col md={4}>
            <Form.Group>
              <Form.Label>
                TimeZone (End Time)<span style={{ color: "red" }}>*</span>
              </Form.Label>
              <Form.Control
                name="timezone_end"
                value={formData.timezone_end}
                onChange={handleChange}
                type="time"
              />
            </Form.Group>
          </Col>

          <Col md={4}>
            <Form.Group>
              <Form.Label>
                On which gate access Allow?
                <span style={{ color: "red" }}>*</span>
              </Form.Label>
              <Form.Select
                name="accessgate"
                value={formData.accessgate}
                onChange={handleChange}
              >
                <option value="">Select Access Gate</option>
                {gates.map((gate) => (
                  <option key={gate.id} value={gate.id}>
                    {gate.gate_name} ({gate.gate_no})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        {/* Row 4 */}
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label style={{ color: "#9cf" }}>
                Assign Access Cards (Required: {formData.withmembers || 0})
              </Form.Label>
              <div className="input-group">
                <Form.Control
                  type="text"
                  value={cardInput}
                  onChange={(e) => setCardInput(e.target.value)}
                  placeholder="Enter Card Number"
                  disabled={!formData.withmembers} // disable until members count is set
                />
                <Button
                  variant="info"
                  onClick={handleAddCard}
                  disabled={!formData.withmembers}
                >
                  + Card
                </Button>
              </div>

              <div className="mt-2">
                {cards.map((c, i) => (
                  <span key={i} className="badge bg-secondary me-2">
                    {c}
                  </span>
                ))}
              </div>

              {/* Validation Message */}
              {formData.withmembers &&
                cards.length !== parseInt(formData.withmembers) && (
                  <div className="text-warning mt-2">
                    You need {formData.withmembers} card(s), but you have{" "}
                    {cards.length}.
                  </div>
                )}
            </Form.Group>
          </Col>
        </Row>

        {/* Buttons */}
        <div className="mt-4 d-flex gap-3">
          <Button variant="warning" type="submit">
            Submit
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setFormData({
                name: "",
                gender: "",
                withmembers: "",
                phonenumber: "",
                emailid: "",
                status: "",
                accesscardtype: "",
                aadharcard: "",
                timezone_start: "",
                timezone_end: "",
                accessgate: "",
              });
              setCards([]);
            }}
          >
            Cancel
          </Button>
        </div>
      </Form>
    </Card>
  );
};

export default GuestManagement;
