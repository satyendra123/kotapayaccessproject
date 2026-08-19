import React, { useState } from "react";
import { Row, Col, Form, Button, Card, Table } from "react-bootstrap";
import axios from "axios";

// PDF & Excel
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
const API_PATH = process.env.REACT_APP_API_PATH;
const BlacklistCard = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [cardsOrTickets, setCardsOrTickets] = useState("Select");
  const [responseData, setResponseData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fromDate || !toDate || cardsOrTickets === "Select") {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_PATH}/api/blacklist-card-tickets`,
        {
          from_date: fromDate,
          to_date: toDate,
          cards_or_tickets: cardsOrTickets,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      setResponseData(response.data || []);
    } catch (error) {
      console.error(error);
      alert("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  /* ================= PDF EXPORT ================= */
  const exportToPDF = () => {
    if (responseData.length === 0) return;

    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title, subtitle, date range
    doc.setFontSize(14);
    doc.text("Blacklist Card & Tickets Report", pageWidth / 2, 12, { align: "center" });
    doc.setFontSize(12);
    doc.text("Pay & Access", pageWidth / 2, 18, { align: "center" });
    doc.setFontSize(10);
    doc.text(`From Date: ${fromDate}      To Date: ${toDate}`, pageWidth / 2, 24, { align: "center" });

    const tableColumn = ["ID", "Entry Type", "Value", "Reason", "Created By", "Created At"];

    const tableRows = responseData.map((row) => [
      row.id,
      row.entry_type,
      row.value,
      row.reason,
      row.created_by || "-",
      row.created_at ? new Date(row.created_at).toLocaleString() : "-",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 32,
      styles: { fontSize: 9, halign: "center", valign: "middle" },
      headStyles: { fillColor: [81, 69, 205], halign: "center" },
    });

    doc.save("blacklist-card-tickets.pdf");
  };

  /* ================= EXCEL EXPORT ================= */
  const exportToExcel = () => {
    if (responseData.length === 0) return;

    const worksheetData = [
      ["Blacklist Card & Tickets Report"],
      ["Pay & Access"],
      [`From Date: ${fromDate}      To Date: ${toDate}`],
      [],
      ["ID", "Entry Type", "Value", "Reason", "Created By", "Created At"],
    ];

    responseData.forEach((row) => {
      worksheetData.push([
        row.id,
        row.entry_type,
        row.value,
        row.reason,
        row.created_by || "-",
        row.created_at ? new Date(row.created_at).toLocaleString() : "-",
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
    ];

    worksheet["!cols"] = [
      { wch: 5 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 22 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Blacklist Card & Tickets");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), "blacklist-card-tickets.xlsx");
  };

  return (
    <div>
      <Card className="mb-3 p-3" style={{ backgroundColor: "#5145CD", color: "#fff" }}>
        <h5 className="fw-bold mb-3">Blacklist Card & Tickets</h5>
        <Form onSubmit={handleSubmit}>
          <Row className="g-3 align-items-end">
            <Col md={3}>
              <Form.Group>
                <Form.Label>From Date *</Form.Label>
                <Form.Control type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>To Date *</Form.Label>
                <Form.Control type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Cards / Tickets *</Form.Label>
                <Form.Select value={cardsOrTickets} onChange={(e) => setCardsOrTickets(e.target.value)}>
                  <option>Select</option>
                  <option>Card</option>
                  <option>Ticket</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2} className="d-grid">
              <Button type="submit" variant="warning" disabled={loading}>
                {loading ? "Loading..." : "Submit"}
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      {responseData.length > 0 && (
        <Card className="p-3">
          <div className="d-flex justify-content-end mb-2 gap-2">
            <Button variant="danger" onClick={exportToPDF}>
              Download PDF
            </Button>
            <Button variant="success" onClick={exportToExcel}>
              Download Excel
            </Button>
          </div>

          <Table striped bordered hover>
            <thead>
              <tr>
                <th>ID</th>
                <th>Entry Type</th>
                <th>Value</th>
                <th>Reason</th>
                <th>Created By</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {responseData.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.entry_type}</td>
                  <td>{item.value}</td>
                  <td>{item.reason}</td>
                  <td>{item.created_by || "-"}</td>
                  <td>{new Date(item.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default BlacklistCard;
