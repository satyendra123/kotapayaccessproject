import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const LiveEventLogs = () => {
  const data = [
    {
      id: 1,
      type: "AccessibleStaff",
      name: "CRF1 (Male)",
      mobile: "1234567890",
      card: "0387915101",
      entry: "26 Dec 2024 16:08:48 by (MC22)",
      exit: "01 Jan 1970 05:30:00 by ()",
    },
    {
      id: 2,
      type: "AccessibleStaff",
      name: "CRF1 (Male)",
      mobile: "1234567890",
      card: "0387915101",
      entry: "26 Dec 2024 16:08:45 by (MC22)",
      exit: "01 Jan 1970 05:30:00 by ()",
    },
    {
      id: 3,
      type: "AccessibleStaff",
      name: "CRF1 (Male)",
      mobile: "1234567890",
      card: "0387915101",
      entry: "26 Dec 2024 16:08:40 by (MC22)",
      exit: "01 Jan 1970 05:30:00 by ()",
    },
    {
      id: 4,
      type: "AccessibleStaff",
      name: "CRF1 (Male)",
      mobile: "1234567890",
      card: "0387915101",
      entry: "10 Dec 2024 16:12:38 by (MC13)",
      exit: "01 Jan 1970 05:30:00 by ()",
    },
  ];

  return (
    <div className="container-fluid mt-4">
      <div className="card p-3" style={{ backgroundColor: "#5b5fc7" }}>
        <h4 className="text-warning mb-3">Live Event Logs</h4>
        <div className="table-responsive">
          <table className="table table-borderless mb-0">
            <thead className="bg-white">
              <tr>
                <th>#</th>
                <th>Event Message</th>
                <th>Staff Name (Gender)</th>
                <th>Mobile No.</th>
                <th>Card No.</th>
                <th>Entry DateTime by (Gate)</th>
                <th>Exit DateTime by (Gate)</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {data.map((row) => (
                <tr key={row.id} className="border-bottom border-light">
                  <td>{row.id}</td>
                  <td>{row.type}</td>
                  <td>{row.name}</td>
                  <td>{row.mobile}</td>
                  <td className="fw-bold">{row.card}</td>
                  <td>{row.entry}</td>
                  <td>{row.exit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LiveEventLogs;
