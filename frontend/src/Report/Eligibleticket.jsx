import React, { useState } from "react";
import { Row, Col, Form, Button, Card, Table } from "react-bootstrap";
import axios from "axios";

// PDF & Excel
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
const API_PATH = process.env.REACT_APP_API_PATH;
const Eligibleticket = () => {
  const [formData, setFormData] = useState({
    from_date: "",
    to_date: "",
    sales_type: "",
    ticket_number: "",
  });

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("access_token");

    try {
      const response = await axios.post(
        `${API_PATH}/api/eligible-tickets`,
        {
          from_date: formData.from_date,
          to_date: formData.to_date,
          sales_type: formData.sales_type,
          ticket_number: formData.ticket_number,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setTickets(response.data || []);
    } catch (error) {
      console.error("API Error:", error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= PDF EXPORT ================= */
  const exportToPDF = () => {
    if (tickets.length === 0) return;

    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title, subtitle, date range
    doc.setFontSize(14);
    doc.text("Eligible Tickets Report", pageWidth / 2, 12, { align: "center" });
    doc.setFontSize(12);
    doc.text("Pay & Access", pageWidth / 2, 18, { align: "center" });
    doc.setFontSize(10);
    doc.text(
      `From Date: ${formData.from_date}      To Date: ${formData.to_date}`,
      pageWidth / 2,
      24,
      { align: "center" }
    );

    const tableColumn = [
      "Ticket Number",
      "Customer Name",
      "Aadhar No",
      "Ticket Generated",
      "Eligible Marked",
    ];

    const tableRows = tickets.map((row) => [
      row.ticket_number,
      row.customer_name || "—",
      row.aadhar_no || "—",
      row.ticket_gen_date_time
        ? new Date(row.ticket_gen_date_time).toLocaleString()
        : "—",
      row.eligible_marked_at
        ? new Date(row.eligible_marked_at).toLocaleString()
        : "—",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 32,
      styles: { fontSize: 9, halign: "center", valign: "middle" },
      headStyles: { fillColor: [81, 69, 205], halign: "center" },
    });

    doc.save("eligible-tickets-report.pdf");
  };

  /* ================= EXCEL EXPORT ================= */
  const exportToExcel = () => {
    if (tickets.length === 0) return;

    const worksheetData = [
      ["Eligible Tickets Report"],
      ["Pay & Access"],
      [`From Date: ${formData.from_date}      To Date: ${formData.to_date}`],
      [],
      [
        "Ticket Number",
        "Customer Name",
        "Aadhar No",
        "Ticket Generated",
        "Eligible Marked",
      ],
    ];

    tickets.forEach((row) => {
      worksheetData.push([
        row.ticket_number,
        row.customer_name || "—",
        row.aadhar_no || "—",
        row.ticket_gen_date_time
          ? new Date(row.ticket_gen_date_time).toLocaleString()
          : "—",
        row.eligible_marked_at
          ? new Date(row.eligible_marked_at).toLocaleString()
          : "—",
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
    ];

    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 22 },
      { wch: 22 },
    ];

    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[cellAddress]) continue;
        worksheet[cellAddress].s = {
          alignment: { horizontal: "center", vertical: "center" },
        };
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Eligible Tickets");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      cellStyles: true,
    });

    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      "eligible-tickets-report.xlsx"
    );
  };

  return (
    <>
      {/* ================= FILTER CARD ================= */}
      <Card
        className="mb-3 p-3 mt-3"
        style={{ backgroundColor: "#5145CD", color: "#fff" }}
      >
        <h5 className="fw-bold mb-3">Eligible Tickets</h5>

        <Form onSubmit={handleSubmit}>
          <Row className="g-3 align-items-end">
            <Col md={3}>
              <Form.Group>
                <Form.Label>From Date *</Form.Label>
                <Form.Control
                  type="date"
                  name="from_date"
                  value={formData.from_date}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label>To Date *</Form.Label>
                <Form.Control
                  type="date"
                  name="to_date"
                  value={formData.to_date}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label>Sales Type *</Form.Label>
                <Form.Select
                  name="sales_type"
                  value={formData.sales_type}
                  onChange={handleChange}
                >
                  <option value="">Select Sales Type</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={2}>
              <Form.Group>
                <Form.Label>Ticket Number *</Form.Label>
                <Form.Control
                  type="text"
                  name="ticket_number"
                  value={formData.ticket_number}
                  onChange={handleChange}
                  placeholder="Enter Ticket Number"
                />
              </Form.Group>
            </Col>

            <Col md={1} className="d-grid">
              <Button variant="warning" type="submit" disabled={loading}>
                {loading ? "..." : "Submit"}
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* ================= RESULT TABLE ================= */}
      {tickets.length > 0 && (
        <Card className="p-3">
          <div className="d-flex justify-content-end mb-2 gap-2">
            <Button variant="danger" onClick={exportToPDF}>
              Download PDF
            </Button>
            <Button variant="success" onClick={exportToExcel}>
              Download Excel
            </Button>
          </div>

          <Table bordered hover responsive>
            <thead>
              <tr>
                <th>Ticket Number</th>
                <th>Customer Name</th>
                <th>Aadhar No</th>
                <th>Ticket Generated</th>
                <th>Eligible Marked</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((item, index) => (
                <tr key={index}>
                  <td>{item.ticket_number}</td>
                  <td>{item.customer_name || "—"}</td>
                  <td>{item.aadhar_no || "—"}</td>
                  <td>
                    {item.ticket_gen_date_time
                      ? new Date(item.ticket_gen_date_time).toLocaleString()
                      : "—"}
                  </td>
                  <td>
                    {item.eligible_marked_at
                      ? new Date(item.eligible_marked_at).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </>
  );
};

export default Eligibleticket;
