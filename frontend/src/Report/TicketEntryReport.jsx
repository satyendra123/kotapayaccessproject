import React, { useState } from "react";
import { Alert, Button, Card, Col, Form, Row, Table } from "react-bootstrap";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const API_PATH = process.env.REACT_APP_API_PATH;
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
const dateTime = (value) => (value ? new Date(value).toLocaleString() : "—");

const TicketEntryReport = () => {
  const [ticketNumber, setTicketNumber] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchReport = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setReport(null);
    try {
      const response = await axios.post(
        `${API_PATH}/api/ticket-entry-report`,
        { ticket_number: ticketNumber.trim() },
        { headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` } }
      );
      setReport(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to load this ticket report.");
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!report) return;
    const { ticket, services, combos, entries } = report;
    const doc = new jsPDF("l", "mm", "a4");
    const width = doc.internal.pageSize.getWidth();
    doc.setFontSize(15);
    doc.text("Ticket Entry Report", width / 2, 13, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Ticket: ${ticket.ticket_number}   Customer: ${ticket.customer_name}   Generated: ${dateTime(ticket.ticket_generated_at)}`, width / 2, 20, { align: "center" });
    autoTable(doc, {
      startY: 26,
      theme: "grid",
      head: [["Members", "Entries Used", "Remaining", "Paid Status", "Service Total", "Combo Total", "Discount", "Grand Total"]],
      body: [[ticket.members, ticket.used_entries, ticket.remaining_entries, ticket.paid_status, money(ticket.service_total), money(ticket.combo_total), money(ticket.discount), money(ticket.grand_total)]],
      styles: { fontSize: 9, halign: "center" },
      headStyles: { fillColor: [81, 69, 205] },
    });
    const servicesText = [...services.map((item) => `${item.name} (${money(item.price)})`), ...combos.map((item) => `${item.name} (${money(item.price)})`)].join(", ") || "—";
    const entriesY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(10);
    doc.text(`Services / Combos: ${servicesText}`, 14, entriesY);
    autoTable(doc, {
      startY: entriesY + 5,
      head: [["#", "Action", "Area", "Gate", "Machine", "Scanned At"]],
      body: entries.map((entry, index) => [index + 1, entry.action, entry.area, entry.gate_name || "—", entry.machine_name || "—", dateTime(entry.scanned_at)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [81, 69, 205] },
    });
    doc.save(`ticket-entry-${ticket.ticket_number}.pdf`);
  };

  const exportToExcel = () => {
    if (!report) return;
    const { ticket, services, combos, entries } = report;
    const summary = [
      ["Ticket Entry Report"],
      ["Ticket Number", ticket.ticket_number], ["Customer", ticket.customer_name], ["Mobile", ticket.mobile_no || "—"],
      ["Members", ticket.members], ["Entries Used", ticket.used_entries], ["Remaining Entries", ticket.remaining_entries],
      ["Paid Status", ticket.paid_status], ["Service Total", ticket.service_total], ["Combo Total", ticket.combo_total], ["Discount", ticket.discount], ["Grand Total", ticket.grand_total],
      [], ["Services / Combos", "Price"],
      ...services.map((item) => [item.name, item.price]), ...combos.map((item) => [item.name, item.price]),
    ];
    const entryRows = [["Action", "Area", "Gate", "Machine", "Scanned At"], ...entries.map((entry) => [entry.action, entry.area, entry.gate_name || "—", entry.machine_name || "—", dateTime(entry.scanned_at)])];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summary), "Ticket Summary");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(entryRows), "Gate Entries");
    const data = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([data], { type: "application/octet-stream" }), `ticket-entry-${ticket.ticket_number}.xlsx`);
  };

  return (
    <Card className="mb-3 p-3" style={{ backgroundColor: "#5145CD", color: "#fff" }}>
      <h5 className="fw-bold mb-3">Ticket Entry Report</h5>
      <Form onSubmit={fetchReport}>
        <Row className="g-3 align-items-end">
          <Col md={5}>
            <Form.Group>
              <Form.Label>Ticket Number</Form.Label>
              <Form.Control value={ticketNumber} onChange={(event) => setTicketNumber(event.target.value)} placeholder="Enter or scan ticket number" required />
            </Form.Group>
          </Col>
          <Col md={2} className="d-grid"><Button type="submit" variant="warning" disabled={loading}>{loading ? "Loading..." : "Search Report"}</Button></Col>
        </Row>
      </Form>
      {error && <Alert variant="danger" className="mt-3 mb-0">{error}</Alert>}
      {report && (() => {
        const { ticket, services, combos, entries } = report;
        return (
          <Card className="mt-4 p-3 text-dark">
            <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
              <div><h5 className="mb-1">Ticket {ticket.ticket_number}</h5><div>{ticket.customer_name} · {ticket.mobile_no || "No mobile"} · {ticket.paid_status}</div></div>
              <div className="d-flex gap-2"><Button variant="danger" onClick={exportToPDF}>Download PDF</Button><Button variant="success" onClick={exportToExcel}>Download Excel</Button></div>
            </div>
            <Row className="g-3 mb-3">
              {[["Members", ticket.members], ["Entries Used", ticket.used_entries], ["Remaining Entries", ticket.remaining_entries], ["Grand Total", money(ticket.grand_total)]].map(([label, value]) => <Col md={3} key={label}><div className="border rounded p-2 text-center"><small className="text-muted d-block">{label}</small><strong>{value}</strong></div></Col>)}
            </Row>
            <Row className="mb-3"><Col md={6}><strong>Services:</strong> {services.map((item) => `${item.name} (${money(item.price)})`).join(", ") || "—"}</Col><Col md={6}><strong>Combos:</strong> {combos.map((item) => `${item.name} (${money(item.price)})`).join(", ") || "—"}</Col></Row>
            <Table bordered hover responsive className="mb-0">
              <thead><tr><th>#</th><th>Action</th><th>Area</th><th>Gate</th><th>Machine</th><th>Scanned At</th></tr></thead>
              <tbody>{entries.length ? entries.map((entry, index) => <tr key={entry.id}><td>{index + 1}</td><td>{entry.action}</td><td>{entry.area}</td><td>{entry.gate_name || "—"}</td><td>{entry.machine_name || "—"}</td><td>{dateTime(entry.scanned_at)}</td></tr>) : <tr><td colSpan="6" className="text-center">No entry scan recorded yet.</td></tr>}</tbody>
            </Table>
          </Card>
        );
      })()}
    </Card>
  );
};

export default TicketEntryReport;
