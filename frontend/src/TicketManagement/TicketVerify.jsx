import React, { useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import axios from "axios";
import { getErrorMessage } from "../services/http";

const API_PATH = process.env.REACT_APP_API_PATH;
const STORAGE_KEY = "ticket_verifier_settings";

const resultCopy = {
  valid: { title: "Valid Ticket", message: "Ticket verified successfully. Entry has been recorded.", variant: "success", icon: "bi-check-circle-fill" },
  invalid: { title: "Invalid Ticket", message: "This ticket could not be verified.", variant: "danger", icon: "bi-x-circle-fill" },
  invalid_same_gate: { title: "Already Used at This Gate", message: "This ticket has already been scanned at the selected gate.", variant: "warning", icon: "bi-exclamation-triangle-fill" },
  invalid_limit_reached: { title: "Usage Limit Reached", message: "This ticket has reached its allowed entry limit.", variant: "warning", icon: "bi-exclamation-triangle-fill" },
};

export default function TicketVerify() {
  const scanInputRef = useRef(null);
  const [ticketNumber, setTicketNumber] = useState("");
  const [gateId, setGateId] = useState("");
  const [machineUid, setMachineUid] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved) {
        setGateId(saved.gateId || "");
        setMachineUid(saved.machineUid || "");
      }
    } catch {
      // Ignore malformed saved settings.
    }
    scanInputRef.current?.focus();
  }, []);

  const focusScanner = () => window.setTimeout(() => scanInputRef.current?.focus(), 0);

  const handleVerify = async (event) => {
    event?.preventDefault();
    const scannedTicket = ticketNumber.trim();

    if (!scannedTicket) {
      setResult({ variant: "danger", title: "Scan a Ticket", message: "Scan the QR code or enter a ticket number first.", icon: "bi-qr-code-scan" });
      focusScanner();
      return;
    }
    if (!gateId || !machineUid.trim()) {
      setResult({ variant: "warning", title: "Scanner Setup Required", message: "Enter the gate ID and registered machine UID before scanning.", icon: "bi-gear-fill" });
      return;
    }

    setIsVerifying(true);
    setResult(null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ gateId, machineUid: machineUid.trim() }));
      const token = localStorage.getItem("access_token");
      const response = await axios.post(
        `${API_PATH}/api/tickets/validate-park-scan`,
        { gate_id: Number(gateId), machine_uid: machineUid.trim(), ticket_number: scannedTicket },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const status = response.data?.success || "invalid";
      setResult({ ...resultCopy[status] || resultCopy.invalid, ticketNumber: scannedTicket, persons: response.data?.no_of_persons });
      setTicketNumber("");
      if (status === "valid") {
        setGateId("");
        setMachineUid("");
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      setResult({ variant: "danger", title: "Verification Failed", message: getErrorMessage(error, "Unable to verify this ticket."), icon: "bi-x-circle-fill", ticketNumber: scannedTicket });
    } finally {
      setIsVerifying(false);
      focusScanner();
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="justify-content-center">
        <Col xl={8} lg={10}>
          <Card className="border-0 shadow-sm overflow-hidden">
            <Card.Header className="border-0 text-white p-4" style={{ background: "linear-gradient(135deg, #243b75, #5570f1)" }}>
              <div className="d-flex align-items-center gap-3">
                <span className="d-inline-flex align-items-center justify-content-center rounded-circle bg-white text-primary" style={{ width: 50, height: 50 }}><i className="bi bi-qr-code-scan fs-3" /></span>
                <div><h4 className="mb-1">Scan & Verify Ticket</h4><p className="mb-0 opacity-75">Scan a ticket QR code using the connected scanner.</p></div>
              </div>
            </Card.Header>
            <Card.Body className="p-4 p-md-5">
              <Form onSubmit={handleVerify}>
                <Row className="g-3 mb-4">
                  <Col md={4}>
                    <Form.Label className="fw-semibold">Gate ID</Form.Label>
                    <Form.Control type="number" min="1" value={gateId} onChange={(event) => setGateId(event.target.value)} placeholder="e.g. 1" required />
                  </Col>
                  <Col md={8}>
                    <Form.Label className="fw-semibold">Registered Machine UID</Form.Label>
                    <Form.Control value={machineUid} onChange={(event) => setMachineUid(event.target.value)} placeholder="Machine UID configured for this gate" required />
                  </Col>
                </Row>

                <div className="rounded-4 p-4" style={{ background: "#f4f6ff", border: "1px solid #dfe5ff" }}>
                  <Form.Label className="fw-bold fs-5 mb-2">Scan Ticket QR Code</Form.Label>
                  <Form.Text className="d-block mb-3">Keep this field active, then scan. Most USB scanners submit automatically with Enter.</Form.Text>
                  <div className="d-flex gap-2">
                    <Form.Control ref={scanInputRef} size="lg" value={ticketNumber} onChange={(event) => setTicketNumber(event.target.value)} placeholder="Waiting for scanner..." autoComplete="off" disabled={isVerifying} />
                    <Button type="submit" variant="primary" size="lg" disabled={isVerifying}>{isVerifying ? "Verifying..." : "Verify"}</Button>
                  </div>
                </div>
              </Form>

              {result && (
                <Alert variant={result.variant} className="mt-4 mb-0 d-flex align-items-center gap-3" aria-live="assertive">
                  <i className={`bi ${result.icon} fs-2`} />
                  <div><div className="fw-bold fs-5">{result.title}</div><div>{result.message}</div>{result.ticketNumber && <small className="d-block mt-1">Ticket: <strong>{result.ticketNumber}</strong></small>}</div>
                </Alert>
              )}
              <p className="small text-muted mt-4 mb-0"><i className="bi bi-info-circle me-1" />A successful verification records a gate movement, so use the configured gate and machine details.</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
