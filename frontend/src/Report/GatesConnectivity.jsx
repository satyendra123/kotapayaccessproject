import React, { useState } from "react";
import { Row, Col, Form, Button, Card, Table } from "react-bootstrap";
import axios from "axios";

// PDF & Excel
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
const API_PATH = process.env.REACT_APP_API_PATH;
const GatesConnectivity = () => {
  const [formData, setFormData] = useState({
    from_date: "",
    to_date: "",
    gate_name: "",
    status: "",
  });

  const [logs, setLogs] = useState([]);
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
        `${API_PATH}/api/gates-connectivity-logs`,
        {
          from_date: formData.from_date,
          to_date: formData.to_date,
          gate_name: formData.gate_name,
          status: formData.status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setLogs(response.data || []);
    } catch (error) {
      console.error("API Error:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= PDF EXPORT ================= */
  const exportToPDF = () => {
    if (logs.length === 0) return;

    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title, subtitle, date range
    doc.setFontSize(14);
    doc.text("Gates Connectivity Logs Report", pageWidth / 2, 12, { align: "center" });
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
      "ID",
      "Gate Name",
      "Machine Name",
      "Status",
      "Created At",
      "Remark",
    ];

    const tableRows = logs.map((row) => [
      row.id,
      row.gate_name,
      row.machine_name,
      row.status,
      row.created_at ? new Date(row.created_at).toLocaleString() : "—",
      row.remark || "—",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 32,
      styles: { fontSize: 9, halign: "center", valign: "middle" },
      headStyles: { fillColor: [81, 69, 205], halign: "center" },
    });

    doc.save("gates-connectivity-logs.pdf");
  };

  /* ================= EXCEL EXPORT ================= */
  const exportToExcel = () => {
    if (logs.length === 0) return;

    const worksheetData = [
      ["Gates Connectivity Logs Report"],
      ["Pay & Access"],
      [`From Date: ${formData.from_date}      To Date: ${formData.to_date}`],
      [],
      ["ID", "Gate Name", "Machine Name", "Status", "Created At", "Remark"],
    ];

    logs.forEach((row) => {
      worksheetData.push([
        row.id,
        row.gate_name,
        row.machine_name,
        row.status,
        row.created_at ? new Date(row.created_at).toLocaleString() : "—",
        row.remark || "—",
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
      { wch: 12 },
      { wch: 22 },
      { wch: 25 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Gates Connectivity Logs");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      "gates-connectivity-logs.xlsx"
    );
  };

  return (
    <>
      {/* ================= FILTER CARD ================= */}
      <Card className="mb-3 p-3" style={{ backgroundColor: "#5145CD", color: "#fff" }}>
        <h5 className="fw-bold mb-3">Gates Connectivity Logs</h5>

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
                <Form.Label>Gate Name *</Form.Label>
                <Form.Control
                  type="text"
                  name="gate_name"
                  value={formData.gate_name}
                  onChange={handleChange}
                  placeholder="Enter Gate Name"
                />
              </Form.Group>
            </Col>

            <Col md={2}>
              <Form.Group>
                <Form.Label>Status *</Form.Label>
                <Form.Select name="status" value={formData.status} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
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
      {logs.length > 0 && (
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
                <th>ID</th>
                <th>Gate Name</th>
                <th>Machine Name</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Remark</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.gate_name}</td>
                  <td>{item.machine_name}</td>
                  <td
                    className={
                      item.status === "active"
                        ? "text-success fw-bold"
                        : "text-danger fw-bold"
                    }
                  >
                    {item.status}
                  </td>
                  <td>{item.created_at ? new Date(item.created_at).toLocaleString() : "—"}</td>
                  <td>{item.remark || "—"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </>
  );
};

export default GatesConnectivity;
