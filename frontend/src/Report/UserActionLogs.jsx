import React, { useState } from "react";
import { Row, Col, Form, Button, Card } from "react-bootstrap";
import axios from "axios";

// PDF & Excel
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
const API_PATH = process.env.REACT_APP_API_PATH;
const UserActionLogs = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [userType, setUserType] = useState("");
  const [username, setUsername] = useState("");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      from_date: fromDate,
      to_date: toDate,
      user_type: userType.trim(),
      username: username.trim(),
    };

    const token = localStorage.getItem("access_token");

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_PATH}/api/user-action-logs`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      setLogs(response.data);
    } catch (error) {
      console.error("Error fetching user action logs:", error);
      alert("Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  };

  /* ================= PDF EXPORT ================= */
  const exportToPDF = () => {
    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title (CENTER)
    doc.setFontSize(14);
    doc.text("User Action Logs Report", pageWidth / 2, 12, {
      align: "center",
    });

    // Subtitle (CENTER)
    doc.setFontSize(11);
    doc.text("Pay & Access", pageWidth / 2, 18, {
      align: "center",
    });

    // Date range (CENTER)
    doc.setFontSize(10);
    doc.text(
      `From Date: ${fromDate}    To Date: ${toDate}`,
      pageWidth / 2,
      24,
      {
        align: "center",
      },
    );

    const tableColumn = ["Id", "User Type", "Username", "Action", "Date & Time"];

    const tableRows = logs.map((log, index) => [
      index + 1,
      log.user_type,
      log.username,
      log.action,
      new Date(log.created_at).toLocaleString("en-IN"),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 36,
      styles: {
        fontSize: 9,
        halign: "center", // ✅ center cell values
        valign: "middle",
      },
      headStyles: {
        fillColor: [81, 69, 205],
        halign: "center", // ✅ center header text
      },
    });

    doc.save("user-action-logs.pdf");
  };

  /* ================= EXCEL EXPORT (PDF LIKE) ================= */
  const exportToExcel = () => {
    // ================= HEADER & DATA =================
    const worksheetData = [
      ["User Action Logs Report"], // Title
      ["Pay & Access"], // Subtitle
      [`From Date: ${fromDate}      To Date: ${toDate}`], // Date range
      [], // Empty row
      ["Id", "User Type", "Username", "Action", "Date & Time"], // Table headers
    ];

    // Add logs data
    logs.forEach((log, index) => {
      worksheetData.push([
        index + 1,
        log.user_type,
        log.username,
        log.action,
        new Date(log.created_at).toLocaleString("en-IN"),
      ]);
    });

    // ================= CREATE SHEET =================
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Merge title, subtitle, and date row to center across columns
    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }, // Subtitle
      { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } }, // Date range
    ];

    // Column widths
    worksheet["!cols"] = [
      { wch: 5 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 22 },
    ];

    // ================= CENTER ALL CELLS =================
    const range = XLSX.utils.decode_range(worksheet["!ref"]);

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[cellAddress]) continue;

        worksheet[cellAddress].s = {
          alignment: {
            horizontal: "center",
            vertical: "center",
          },
        };
      }
    }

    // ================= CREATE & SAVE WORKBOOK =================
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "User Action Logs");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      cellStyles: true,
    });

    const data = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(data, "user-action-logs.xlsx");
  };

  return (
    <div>
      {/* ================= FILTER FORM ================= */}
      <Card
        className="mb-3"
        style={{ backgroundColor: "#5145CD", color: "#fff" }}
      >
        <Card.Body>
          <h5 className="mb-3 fw-bold">User Action Logs</h5>

          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>From Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>To Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={2}>
                <Form.Group>
                  <Form.Label>User Type *</Form.Label>
                  <Form.Select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                    required
                  >
                    <option value="">Select User Type</option>
                    <option value="Operator">Operator</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Manager">Manager</option>
                    <option value="Site-Incharge">Site-Incharge</option>
                    <option value="Technical Manager">Technical Manager</option>
                    <option value="Admin">Admin</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={2}>
                <Form.Group>
                  <Form.Label>Username *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="mt-3">
              <Button variant="warning" type="submit" disabled={loading}>
                {loading ? "Please wait..." : "Submit"}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* ================= RESULT TABLE ================= */}
      {logs.length > 0 && (
        <Card className="mt-3">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">User Action Log Results</h6>

              <div className="d-flex gap-2">
                <Button variant="danger" onClick={exportToPDF}>
                  Download PDF
                </Button>
                <Button variant="success" onClick={exportToExcel}>
                  Download Excel
                </Button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead className="table-dark">
                  <tr>
                    <th>#</th>
                    <th>User Type</th>
                    <th>Username</th>
                    <th>Action</th>
                    <th>Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr key={log.id || index}>
                      <td>{index + 1}</td>
                      <td>{log.user_type}</td>
                      <td>{log.username}</td>
                      <td>{log.action}</td>
                      <td>
                        {new Date(log.created_at).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      )}

      {!loading && logs.length === 0 && (
        <p className="text-center text-muted mt-3">No records found</p>
      )}
    </div>
  );
};

export default UserActionLogs;
