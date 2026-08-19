import React, { useEffect, useState } from "react";
import { Row, Col, Form, Button, Card } from "react-bootstrap";
import axios from "axios";

/* ===== EXPORT LIBRARIES ===== */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
const API_PATH = process.env.REACT_APP_API_PATH;
const StaffEntryLogs = () => {
  const [staffList, setStaffList] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [staffName, setStaffName] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ NEW STATE TO STORE API RESPONSE
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchStaff();
  }, []);

  /* ================= FETCH STAFF DROPDOWN ================= */
  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(`${API_PATH}/api/staff/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Remove duplicate names
      const uniqueStaff = Array.from(
        new Map(response.data.map((item) => [item.name, item])).values(),
      );

      setStaffList(uniqueStaff);
    } catch (error) {
      console.error("Error fetching staff list:", error);
    }
  };

  /* ================= SUBMIT ENTRY / EXIT LOG ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fromDate || !toDate || !staffName) {
      alert("Please fill all required fields");
      return;
    }

    const payload = {
      from_date: fromDate,
      to_date: toDate,
      staff_name: staffName,
    };

    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      const response = await axios.post(
        `${API_PATH}/api/staff-entry-exit-logs`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log("Entry / Exit Logs Response:", response.data);

      // ✅ STORE RESPONSE FOR DISPLAY
      setLogs(response.data);
    } catch (error) {
      console.error("Submit Error:", error.response || error);
      alert("Failed to fetch staff entry / exit logs");
    } finally {
      setLoading(false);
    }
  };

  /* ================= EXPORT TO PDF ================= */
  const exportToPDF = () => {
    const doc = new jsPDF("l", "mm", "a4");

    const pageWidth = doc.internal.pageSize.getWidth();

    // Main title
    doc.setFontSize(14);
    doc.text("Staff Entry / Exit Logs", pageWidth / 2, 10, {
      align: "center",
    });

    // Subtitle
    doc.setFontSize(13);
    doc.text("Pay & Access", pageWidth / 2, 16, {
      align: "center",
    });

    const tableColumn = [
      "#",
      "Staff Name",
      "Action",
      "Gate Name",
      "Machine Name",
      "Date & Time",
    ];

    const tableRows = logs.map((log, index) => [
      index + 1,
      log.staff_name,
      log.action.toUpperCase(),
      log.gate_name,
      log.machine_name,
      new Date(log.created_at).toLocaleString("en-IN"),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 22, // pushed down to fit subtitle
      styles: {
        fontSize: 9,
        halign: "center",
        valign: "middle",
      },
      headStyles: {
        fillColor: [81, 69, 205],
        halign: "center",
      },
    });

    doc.save("staff-entry-exit-logs.pdf");
  };

  /* ================= EXPORT TO EXCEL ================= */
  const exportToExcel = () => {
    const worksheetData = logs.map((log, index) => ({
      "#": index + 1,
      "Staff Name": log.staff_name,
      Action: log.action.toUpperCase(),
      "Gate Name": log.gate_name,
      "Machine Name": log.machine_name,
      "Date & Time": new Date(log.created_at).toLocaleString("en-IN"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Staff Logs");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(fileData, "staff-entry-exit-logs.xlsx");
  };

  return (
    <div>
      {/* ================= FILTER FORM CARD ================= */}
      <Card
        className="mb-3"
        style={{ backgroundColor: "#5145CD", color: "#fff" }}
      >
        <Card.Body>
          <h5 className="mb-3 fw-bold">Staff Entry / Exit Log</h5>

          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>From Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
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
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>Staff Name *</Form.Label>
                  <Form.Select
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                  >
                    <option value="">Select Staff Name</option>
                    {staffList.map((staff) => (
                      <option key={staff.id} value={staff.name}>
                        {staff.name}
                      </option>
                    ))}
                  </Form.Select>
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
              <h6 className="fw-bold mb-0">Staff Entry / Exit Results</h6>

              <div className="d-flex gap-2">
                <Button variant="danger" size="sm" onClick={exportToPDF}>
                  Export PDF
                </Button>

                <Button variant="success" size="sm" onClick={exportToExcel}>
                  Export Excel
                </Button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead className="table-dark">
                  <tr>
                    <th>#</th>
                    <th>Staff Name</th>
                    <th>Action</th>
                    <th>Gate Name</th>
                    <th>Machine Name</th>
                    <th>Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr key={log.id}>
                      <td>{index + 1}</td>
                      <td>{log.staff_name}</td>
                      <td
                        className={
                          log.action === "entry"
                            ? "text-success fw-bold"
                            : "text-danger fw-bold"
                        }
                      >
                        {log.action.toUpperCase()}
                      </td>
                      <td>{log.gate_name}</td>
                      <td>{log.machine_name}</td>
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
    </div>
  );
};

export default StaffEntryLogs;
