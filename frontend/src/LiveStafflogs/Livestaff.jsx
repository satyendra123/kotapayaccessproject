import React, { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "../LiveStafflogs/Livestafstyle/Livestaff.css";
const API_PATH = process.env.REACT_APP_API_PATH;
const Livestaff = () => {
  const [staffData, setStaffData] = useState([]);
  const [searchText] = useState("");
  const [staffTypeFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const access_token = localStorage.getItem("access_token"); // 🔐 token

  useEffect(() => {
    fetchStaffLogs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStaffLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `${API_PATH}/api/staff/live-logs/all`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );
      setStaffData(response.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load staff logs");
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Filter logic
  const filteredData = staffData.filter((staff) => {
    const searchMatch =
      staff.staffName?.toLowerCase().includes(searchText.toLowerCase()) ||
      staff.mobileNo?.includes(searchText) ||
      staff.cardNo?.toLowerCase().includes(searchText.toLowerCase());

    const typeMatch =
      staffTypeFilter === "" || staff.staffType === staffTypeFilter;

    return searchMatch && typeMatch;
  });

  return (
    <div className="livestaff-container container-fluid">
      <div className="livestaff-header d-flex justify-content-between align-items-center mb-3">
        <h4 className="livestaff-title mb-0">Live Staff Logs</h4>

        <div className="d-flex" style={{ maxWidth: "360px", gap: "8px" }}>
          {/* Search */}
          {/* <div className="input-group" style={{ flexGrow: 1 }}>
            <span className="input-group-text bg-white border-end-0">
              <img src={Searchicon} alt="search" />
            </span>
            <input
              type="text"
              placeholder="Search..."
              className="form-control border-start-0"
              style={{ textAlign: "end" }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div> */}

          {/* Filter */}
          {/* <select
            className="form-select"
            style={{ width: "140px", fontSize: "13px" }}
            value={staffTypeFilter}
            onChange={(e) => setStaffTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            {[...new Set(staffData.map((s) => s.staffType))].map((type, i) => (
              <option key={i} value={type}>
                {type}
              </option>
            ))}
          </select> */}
        </div>
      </div>

      <div className="livestaff-table-container">
        <table className="livestaff-table table table-bordered table-hover mb-0">
          <thead>
            <tr style={{ textAlign: "center" }}>
              <th className="serial">Serial No.</th>
              <th className="staffType">Staff Type</th>
              <th className="staffName">Staff Name</th>
              <th className="mobileNo">Mobile No.</th>
              <th className="cardNo">Card No.</th>
              <th className="entryDateTime">Entry DateTime by (Gate)</th>
              <th className="exitDateTime">Exit DateTime by (Gate)</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="7" className="text-center">
                  Loading...
                </td>
              </tr>
            )}

            {error && (
              <tr>
                <td colSpan="7" className="text-center text-danger">
                  {error}
                </td>
              </tr>
            )}

            {!loading && filteredData.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center">
                  No data found
                </td>
              </tr>
            )}

            {filteredData.map((staff, index) => (
              <tr style={{ textAlign: "center" }} key={staff.id}>
                <td>{index + 1}</td>
                <td>{staff.staffType}</td>
                <td>{staff.staffName}</td>
                <td>{staff.mobileNo}</td>
                <td>{staff.cardNo}</td>
                <td>{staff.entryDateTime || "-"}</td>
                <td>{staff.exitDateTime || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Livestaff;
