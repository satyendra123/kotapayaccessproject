import React, { useEffect, useState } from "react";
import { Row, Col, Form, Button, Card } from "react-bootstrap";
import axios from "axios";

// PDF & Excel
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
const API_PATH = process.env.REACT_APP_API_PATH;
const SalesRevanue = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    report_type: "",
    from_date: "",
    to_date: "",
    from_time: "",
    to_time: "",
    ticket_type: "",
    ticket_number: "",
    paid_only: false,
  });

  const [result, setResult] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    setLoading(true);
    axios
      .get(`${API_PATH}/api/tariffs/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setServices(response.data || []);
      })
      .catch((error) => {
        console.error("Error fetching services:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");

    try {
      const response = await axios.post(
        `${API_PATH}/api/sales-revenue`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setResult(response.data);
    } catch (error) {
      console.error("Error fetching sales revenue:", error);
    }
  };

  /* ================= PDF EXPORT ================= */
  const exportToPDF = () => {
    if (!result) return;

    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title and subtitle
    doc.setFontSize(14);
    doc.text("Sales & Revenue Report", pageWidth / 2, 12, { align: "center" });
    doc.setFontSize(12);
    doc.text("Pay & Access", pageWidth / 2, 18, { align: "center" });
    doc.setFontSize(10);
    doc.text(
      `From Date: ${formData.from_date}      To Date: ${formData.to_date}`,
      pageWidth / 2,
      24,
      { align: "center" }
    );

    // Table columns
    const tableColumn = [
      "Ticket Number",
      "Date & Time",
      "Ticket Type",
      "Customer Name",
      "Amount",
      "Status",
    ];

    const tableRows = result.rows.map((row) => [
      row.ticket_number,
      new Date(row.ticket_gen_date_time).toLocaleString(),
      row.ticket_type,
      row.customer_name || row.customer || row.customerName || "—",
      `₹${row.grand_total}`,
      row.is_ticket_free_paid,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 32,
      styles: { fontSize: 9, halign: "center", valign: "middle" },
      headStyles: { fillColor: [81, 69, 205], halign: "center" },
    });

    doc.save("sales-revenue-report.pdf");
  };

  /* ================= EXCEL EXPORT ================= */
  const exportToExcel = () => {
    if (!result) return;

    const worksheetData = [
      ["Sales & Revenue Report"],
      ["Pay & Access"],
      [`From Date: ${formData.from_date}      To Date: ${formData.to_date}`],
      [],
      [
        "Ticket Number",
        "Date & Time",
        "Ticket Type",
        "Customer Name",
        "Amount",
        "Status",
      ],
    ];

    result.rows.forEach((row) => {
      worksheetData.push([
        row.ticket_number,
        new Date(row.ticket_gen_date_time).toLocaleString(),
        row.ticket_type,
        row.customer_name || row.customer || row.customerName || "—",
        `₹${row.grand_total}`,
        row.is_ticket_free_paid,
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Merge title, subtitle, and date rows
    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Subtitle
      { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } }, // Date range
    ];

    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 22 },
      { wch: 20 },
      { wch: 25 },
      { wch: 10 },
      { wch: 15 },
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Revenue");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      cellStyles: true,
    });

    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      "sales-revenue-report.xlsx"
    );
  };

  return (
    <div>
      <Card
        className="mb-3 p-4"
        style={{ backgroundColor: "#5145CD", color: "#fff" }}
      >
        <h5 className="fw-bold mb-3">Sales & Revenue</h5>

        <Form onSubmit={handleSubmit}>
          {/* 🔼 Upper Row */}
          <Row className="g-3 mb-2">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Report Type</Form.Label>
                <Form.Select
                  name="report_type"
                  onChange={handleChange}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select Ticket Type
                  </option>
                  <option value="All Reports">All Reports</option>
                  <option value="Only Tickets">Only Tickets</option>
                  <option value="Only With Combos">Only With Combos</option>
                  <option value="Only With Extra Combos">
                    Only With Extra Combos
                  </option>
                </Form.Select>
              </Form.Group>
            </Col>

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
                <Form.Label>From Time *</Form.Label>
                <Form.Control
                  type="time"
                  name="from_time"
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
          </Row>

          {/* 🔽 Lower Row */}
          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>To Time *</Form.Label>
                <Form.Control
                  type="time"
                  name="to_time"
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label>Ticket Type</Form.Label>
                <Form.Select
                  name="ticket_type"
                  onChange={handleChange}
                  defaultValue=""
                >
                  <option value="">All</option>
                  {loading && <option disabled>Loading services...</option>}
                  {!loading &&
                    services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.servicename}
                      </option>
                    ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label>Ticket Number</Form.Label>
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
            <Button variant="warning" type="submit">
              Submit
            </Button>
          </div>
        </Form>
      </Card>

      {/* 📊 Result Section */}
      {result && (
        <Card className="p-3">
          <Row className="mb-3">
            <Col md={6}>
              <h6>Total Count: {result.total_count}</h6>
            </Col>
            <Col md={6}>
              <h6>Total Revenue: ₹{result.total_revenue}</h6>
            </Col>
          </Row>

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
                  <th>Date & Time</th>
                  <th>Ticket Type</th>
                  <th>Customer Name</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, index) => (
                  <tr key={index}>
                    <td>{row.ticket_number}</td>
                    <td>
                      {new Date(row.ticket_gen_date_time).toLocaleString()}
                    </td>
                    <td>{row.ticket_type}</td>
                    <td>
                      {row.customer_name || row.customer || row.customerName || "—"}
                    </td>
                    <td>₹{row.grand_total}</td>
                    <td>{row.is_ticket_free_paid}</td>
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

export default SalesRevanue;
