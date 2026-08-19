import React, { useState } from "react";
import { Row, Col, Form, Button, Card } from "react-bootstrap";
import axios from "axios";

// PDF & Excel
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
const API_PATH = process.env.REACT_APP_API_PATH;
const Lost = () => {
  const [formData, setFormData] = useState({
    from_date: "",
    to_date: "",
    sales_type: "",
    ticket_number: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_PATH}/api/lost-tickets`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setResult(response.data || []);
    } catch (error) {
      console.error("Error fetching lost tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ================= PDF EXPORT ================= */
  const exportToPDF = () => {
    if (result.length === 0) return;

    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title and subtitle
    doc.setFontSize(14);
    doc.text("Lost Tickets Report", pageWidth / 2, 12, { align: "center" });
    doc.setFontSize(12);
    doc.text("Pay & Access", pageWidth / 2, 18, { align: "center" });
    doc.setFontSize(10);
    doc.text(
      `From Date: ${formData.from_date}      To Date: ${formData.to_date}`,
      pageWidth / 2,
      24,
      { align: "center" },
    );

    // Table columns
    const tableColumn = [
      "Ticket Number",
      "Customer Name",
      "Aadhar No",
      "Ticket Generated At",
      "Lost Marked",
    ];

    const tableRows = result.map((row) => [
      row.ticket_number,
      row.customer_name || "—",
      row.aadhar_no || "—",
      row.ticket_gen_date_time
        ? new Date(row.ticket_gen_date_time).toLocaleString()
        : "—",
      row.lost_marked_at ? new Date(row.lost_marked_at).toLocaleString() : "—",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 32,
      styles: { fontSize: 9, halign: "center", valign: "middle" },
      headStyles: { fillColor: [81, 69, 205], halign: "center" },
    });

    doc.save("lost-tickets-report.pdf");
  };

  /* ================= EXCEL EXPORT ================= */
  const exportToExcel = () => {
    if (result.length === 0) return;

    const worksheetData = [
      ["Lost Tickets Report"],
      ["Pay & Access"],
      [`From Date: ${formData.from_date}      To Date: ${formData.to_date}`],
      [],
      [
        "Ticket Number",
        "Customer Name",
        "Aadhar No",
        "Ticket Generated",
        "Lost Marked",
      ],
    ];

    result.forEach((row) => {
      worksheetData.push([
        row.ticket_number,
        row.customer_name || "—",
        row.aadhar_no || "—",
        row.ticket_gen_date_time
          ? new Date(row.ticket_gen_date_time).toLocaleString()
          : "—",
        row.lost_marked_at
          ? new Date(row.lost_marked_at).toLocaleString()
          : "—",
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Merge title, subtitle, date rows
    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }, // Subtitle
      { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } }, // Date range
    ];

    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 22 },
      { wch: 22 },
    ];

    // Center all cells
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Lost Tickets");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      cellStyles: true,
    });

    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      "lost-tickets-report.xlsx",
    );
  };

  return (
    <div>
      <Card
        className="p-4 mb-3"
        style={{ backgroundColor: "#5145CD", color: "#fff" }}
      >
        <h5 className="fw-bold mb-3">Lost Tickets</h5>

        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>From Date *</Form.Label>
                <Form.Control
                  type="date"
                  name="from_date"
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label>To Date *</Form.Label>
                <Form.Control
                  type="date"
                  name="to_date"
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label>Sales Type *</Form.Label>
                <Form.Select
                  name="sales_type"
                  onChange={handleChange}
                  defaultValue=""
                >
                  <option value="">Select Sales Type</option>
                  <option>Single Ticket</option>
                  <option>Group ticket</option>
                  <option>Cards(Staffs)</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label>Ticket Number *</Form.Label>
                <Form.Control
                  type="text"
                  name="ticket_number"
                  placeholder="Enter Ticket Number"
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="mt-3">
            <Button variant="warning" type="submit" disabled={loading}>
              {loading ? "Loading..." : "Submit"}
            </Button>
          </div>
        </Form>
      </Card>

      {result.length > 0 && (
        <Card className="p-3">
          <div className="d-flex justify-content-end mb-2 gap-2">
            <Button variant="danger" onClick={exportToPDF}>
              Download PDF
            </Button>
            <Button variant="success" onClick={exportToExcel}>
              Download Excel
            </Button>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Ticket Number</th>
                  <th>Customer Name</th>
                  <th>Aadhar No</th>
                  <th>Ticket Generated At</th>
                  <th>Lost Marked At</th>
                </tr>
              </thead>
              <tbody>
                {result.map((row, index) => (
                  <tr key={index}>
                    <td>{row.ticket_number}</td>
                    <td>{row.customer_name || "—"}</td>
                    <td>{row.aadhar_no || "—"}</td>
                    <td>
                      {row.ticket_gen_date_time
                        ? new Date(row.ticket_gen_date_time).toLocaleString()
                        : "—"}
                    </td>
                    <td>
                      {row.lost_marked_at
                        ? new Date(row.lost_marked_at).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Lost;
