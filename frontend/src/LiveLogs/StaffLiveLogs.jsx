import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
const LiveStaffAccessLogs = () => {
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
  ];

  return (
    <div className="container-fluid mt-4">
      <div className="card shadow-sm">
        <div className="card-header bg-warning text-dark fw-bold">
          Live Staff's Access Logs
        </div>
        <div className="table-responsive">
          <table className="table table-striped table-hover mb-0">
            <thead className="table-light">
              <tr className="text-dark align-middle">
                <th scope="col">#</th>
                <th scope="col">Staff Type</th>
                <th scope="col">Staff Name (Gender)</th>
                <th scope="col">Mobile no.</th>
                <th scope="col">Card no.</th>
                <th scope="col" className="text-primary">
                  <i className="bi bi-arrow-up me-1"></i>
                  Entry DateTime by (Gate)
                </th>
                <th scope="col" className="text-danger">
                  <i className="bi bi-arrow-down me-1"></i>
                  Exit DateTime by (Gate)
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="align-middle">
                  <th scope="row">{row.id}</th>
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

export default LiveStaffAccessLogs;
