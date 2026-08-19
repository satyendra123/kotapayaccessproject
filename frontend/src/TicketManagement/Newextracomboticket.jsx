import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
const Newextracomboticket = () => {
  const navigate = useNavigate();
  return (
    <Container fluid className="p-4">
      <Row>
        <Col md={6} className="mb-3">
          <Card
            className="p-3"
            style={{ backgroundColor: "#4b47c5", color: "#fff" }}
          >
            <div className="justify-content-between d-flex align-items-center mb-3">
              {/* <button className="mb-3" onClick={() => navigate("/customer-tickets")}>+ New Ticket</button> */}
              <button
                type="button"
                className="btn btn-success"
                onClick={() => navigate("/customer-tickets")}
              >
                +New Ticket
              </button>
              <button type="button" className="btn btn-primary">
                +Extra Combo Ticket
              </button>
            </div>
            <div className="mb-3">
              <label htmlFor="exampleFormControlInput1" className="form-label">
                Ticket Number
              </label>

              <input
                type="email"
                className="form-control"
                id="exampleFormControlInput1"
                placeholder="Enter Ticket Number"
              />
            </div>
            <button type="button" className="btn btn-info">
              Ticket Verify
            </button>
            {/* Service Combos Section with Checkboxes */}
          </Card>
        </Col>
        {/* Ticket Preview Section */}
      <Col md={6} className="mb-3">
  <Card className="p-3 text-center">
    <div>
      <img
        src="housys.jpeg"
        alt="logo"
        style={{
          maxWidth: "150px",
          marginBottom: "10px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      />
    </div>

    <h6 style={{ color: "red" }}>
      CHAMBAL RIVER FRONT KOTA RAJASTHAN
    </h6>

    <p>
      <strong>Date Time:</strong> 
    </p>

    <p>
      <strong>Mobile No:</strong> 
    </p>

    <p>
      <strong>Shift:</strong> 
    </p>

    <p>
      <strong>Members:</strong>  <strong>Price:</strong> 
    </p>

    <div
      style={{
        width: "120px",
        height: "120px",
        margin: "10px auto",
        backgroundColor: "#f0f0f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #ddd",
      }}
    >
      <img
        src="qr.png"
        alt="qr code"
        style={{ width: "120px", height: "120px" }}
      />
    </div>

    <p>
      <strong>Ticket No:</strong> 
    </p>

    <h5 style={{ color: "green" }}>
      ONLY COMBOS TICKET
    </h5>
  </Card>
</Col>

      </Row>
    </Container>
  );
};
export default Newextracomboticket;
