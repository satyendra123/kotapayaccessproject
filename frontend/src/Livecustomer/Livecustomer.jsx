import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../LiveStafflogs/Livestafstyle/Livestaff.css";
import axios from "axios";
const API_PATH = process.env.REACT_APP_API_PATH;
const Livecustomer = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search] = useState("");

  // 🔐 Token
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    fetchLiveCustomers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLiveCustomers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_PATH}/api/customers/live-tickets`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setRows(response.data);
    } catch (error) {
      console.error("Error fetching live customer tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Search filter
  const filteredRows = rows.filter(
    (item) =>
      item.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      item.mobileNo?.includes(search) ||
      item.ticketFor?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="livestaff-container container-fluid">
      {/* Header */}
      <div className="livestaff-header d-flex justify-content-between align-items-center mb-3">
        <h4 style={{ width: "280px" }} className="livestaff-title mb-0">
          Live Customer’s Tickets Logs
        </h4>

        <div className="d-flex" style={{ maxWidth: "360px", gap: "8px" }}>
          {/* Search */}
          {/* <div className="input-group" style={{ flexGrow: 1 }}>
            <span className="input-group-text bg-white border-end-0">
              <img src={Searchicon} alt="" />
            </span>
            <input
              type="text"
              placeholder="Search..."
              className="form-control border-start-0"
              style={{ textAlign: "end" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div> */}

          {/* Filter dropdown (UI only – kept same as your code) */}
          {/* <select
            className="form-select"
            style={{ width: "140px", fontSize: "13px" }}
          >
            <option value="">All Types</option>
            <option value="VIP">VIP</option>
            <option value="Member">Member</option>
            <option value="Student">Student</option>
          </select> */}
        </div>
      </div>

      {/* Table */}
      <div className="livestaff-table-container">
        <table className="livestaff-table table table-bordered table-hover mb-0">
          <thead>
            <tr style={{ textAlign: "center" }}>
              <th style={{ width: "14.28%" }}>Ticket For</th>
              <th style={{ width: "14.28%" }}>Customer</th>
              <th style={{ width: "14.28%" }}>Mobile No.</th>
              <th style={{ width: "14.28%" }}>Members</th>
              <th>Entry Date & Time</th>
              <th>Entry Gate / Machine</th>
              <th>Used / Remaining</th>
              <th>Shift</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center">
                  Loading...
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center">
                  No live customer tickets found
                </td>
              </tr>
            ) : (
              filteredRows.map((item) => (
                <tr key={item.id} style={{ textAlign: "center" }}>
                  <td>{item.ticketFor}</td>
                  <td>{item.customerName}</td>
                  <td>{item.mobileNo}</td>
                  <td>{item.members}</td>
                  <td>{item.entryDateTime || "Not Entered"}</td>
                  <td>{item.entryGateName ? `${item.entryGateName}${item.entryMachineName ? ` / ${item.entryMachineName}` : ""}` : "—"}</td>
                  <td>{`${item.usedEntries} / ${item.remainingEntries}`}</td>
                  <td>{item.ticketGeneratedBy}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Livecustomer;
