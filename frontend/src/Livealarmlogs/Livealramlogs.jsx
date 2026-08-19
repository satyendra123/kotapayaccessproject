import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../LiveStafflogs/Livestafstyle/Livestaff.css";
import axios from "axios";
const API_PATH = process.env.REACT_APP_API_PATH;
const Livealramlogs = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔐 Token
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    fetchAlarmLogs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAlarmLogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_PATH}/api/alarms/live-logs`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setRows(response.data);
    } catch (error) {
      console.error("Error fetching alarm logs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="livestaff-container container-fluid">
      {/* Header */}
      <div className="livestaff-header d-flex justify-content-between align-items-center mb-3">
        <h4 style={{ width: "280px" }} className="livestaff-title mb-0">
          Live Alarms Logs
        </h4>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="livestaff-table-container">
            
            <table className="livestaff-table table table-bordered table-hover mb-0">
              <thead>
                <tr style={{ textAlign: "center" }}>
                  <th>Sr. No.</th>
                  <th>Alarm Message</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="3" className="text-center">Loading...</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center">
                      No alarm logs found
                    </td>
                  </tr>
                ) : (
                  rows.map((item, index) => (
                    <tr key={item.id} style={{ textAlign: "center" }}>
                      <td>{index + 1}</td>
                      <td>{item.alarmMessage}</td>
                      <td>{item.dateTime}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Livealramlogs;
