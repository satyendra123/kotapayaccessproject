import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../LiveStafflogs/Livestafstyle/Livestaff.css";
import axios from "axios";
const API_PATH = process.env.REACT_APP_API_PATH;
const Livemachinelogs = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔐 Token (adjust if you store it differently)
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    fetchMachineLogs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMachineLogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_PATH}/api/machines/live-logs`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setRows(response.data);
    } catch (error) {
      console.error("Error fetching machine logs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="livestaff-container container-fluid">
      {/* Header */}
      <div className="livestaff-header d-flex justify-content-between align-items-center mb-3">
        <h4 style={{ width: "200px" }} className="livestaff-title mb-0">
          Live Machine Logs
        </h4>

        <div className="d-flex gap-2">
          <button className="btn btn-primary btn-sm">Open All</button>
          <button className="btn btn-secondary btn-sm">Close All</button>
          <button className="btn btn-success btn-sm">
            Permanently Open all
          </button>
          <button className="btn btn-danger btn-sm">
            Permanently Close all
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="livestaff-table-container">
        <table
          className="livestaff-table table table-bordered table-hover mb-0"
          style={{ tableLayout: "fixed", width: "100%" }}
        >
          <thead>
            <tr>
              <th style={{ width: "20%", textAlign: "center" }}>
                Serial No.
              </th>
              <th style={{ width: "20%", textAlign: "center" }}>
                (Gate) Machine
              </th>
              <th style={{ width: "20%", textAlign: "center" }}>
                Status
              </th>
              <th style={{ width: "20%", textAlign: "center" }}>
                Last Synced
              </th>
              <th style={{ width: "20%", textAlign: "center" }}>
                Open / Close
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">
                  No machine logs found
                </td>
              </tr>
            ) : (
              rows.map((item, index) => (
                <tr key={item.id} style={{ textAlign: "center" }}>
                  <td className="custom-font-size">
                    {index + 1}
                  </td>

                  <td className="custom-font-size">
                    {item.machine} <br />
                    <small>({item.gate})</small>
                  </td>

                  <td className="custom-font-size">
                    {item.status}
                  </td>

                  <td className="custom-font-size">
                    {item.lastSynced || "Not Synced"}
                  </td>

                  <td>
                    {item.actions?.includes("Open") && (
                      <button
                        className="btn btn-sm me-2 custom-font-size"
                        style={{
                          minWidth: "60px",
                          backgroundColor: "#25EB3C",
                          borderRadius: "10px",
                        }}
                      >
                        Open
                      </button>
                    )}

                    {item.actions?.includes("Close") && (
                      <button
                        className="btn btn-sm custom-font-size"
                        style={{
                          minWidth: "60px",
                          backgroundColor: "#EB2525",
                          borderRadius: "10px",
                        }}
                      >
                        Close
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Livemachinelogs;
