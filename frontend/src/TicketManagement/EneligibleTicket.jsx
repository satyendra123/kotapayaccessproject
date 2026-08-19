import React, { useState } from "react";
import axios from "axios";
const API_PATH = process.env.REACT_APP_API_PATH;
const EneligibleTicket = () => {
  const [ticketNo, setTicketNo] = useState("");
  const [aadharNo, setAadharNo] = useState("");
  const [ticketData, setTicketData] = useState(null);

  const handleSubmit = async () => {
    if (!ticketNo && !aadharNo) {
      alert("Please enter Ticket No or Aadhar No");
      return;
    }

    try {
      const payload = {
        ticket_number: ticketNo || null,
        aadhar_no: aadharNo || null,
      };

      const res = await axios.post(
        `${API_PATH}/api/eligible-ticket/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      setTicketData(res.data);
    } catch (error) {
      console.error(error);
      alert("Ticket not found or server error.");
    }
  };

  // 🧠 Format date & time
  const formattedDate = ticketData?.ticket_gen_date_time
    ? new Date(ticketData.ticket_gen_date_time).toLocaleDateString("en-IN")
    : "--";

  const formattedTime = ticketData?.ticket_gen_date_time
    ? new Date(ticketData.ticket_gen_date_time).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--";

  return (
    <div className="container mt-4">
      <h2 className="fw-bold mb-4">Eligible Ticket</h2>

      <div className="row g-4">
        {/* LEFT SIDE */}
        <div className="col-lg-6">
          <div
            className="p-4"
            style={{ border: "1px solid #e5e5e5", borderRadius: "8px" }}
          >
            <label className="fw-semibold">Enter Ticket No</label>
            <input
              type="text"
              value={ticketNo}
              onChange={(e) => setTicketNo(e.target.value)}
              className="form-control mb-3"
              placeholder="Enter Ticket No"
              style={{ backgroundColor: "#f7f8fa" }}
            />

            <h5 className="fw-bold text-center my-3">OR</h5>

            <label className="fw-semibold">Enter Aadhar No</label>
            <input
              type="text"
              value={aadharNo}
              onChange={(e) => setAadharNo(e.target.value)}
              className="form-control mb-4"
              placeholder="Aadhar No"
              style={{ backgroundColor: "#f7f8fa" }}
            />

            <button
              className="btn text-white px-4"
              style={{ backgroundColor: "#5a4cd1" }}
              onClick={handleSubmit}
            >
              Submit
            </button>
          </div>
        </div>

        {/* RIGHT SIDE TICKET */}
        <div className="col-lg-6">
          <div
            className="p-4 text-center"
            style={{ border: "1px solid #e5e5e5", borderRadius: "8px" }}
          >
            {!ticketData ? (
              <p className="text-muted">
                Enter Ticket No / Aadhar to view details
              </p>
            ) : (
              <>
                {/* Logo */}
                <div className="d-flex justify-content-center mb-3">
                  <img
                    src="housys.jpeg"
                    alt="logo"
                    style={{ maxWidth: "150px" }}
                  />
                </div>

                <h4 className="fw-bold">OXYPARK KOTA</h4>

                <div
                  className="text-start mt-4"
                  style={{ lineHeight: "32px" }}
                >
                  <div>
                    <strong>Date</strong> : {formattedDate}
                  </div>
                  <div>
                    <strong>Time</strong> : {formattedTime}
                  </div>
                  <div>
                    <strong>Ticket No</strong> : {ticketData.ticket_number}
                  </div>
                  <div>
                    <strong>Name</strong> : {ticketData.customer_name}
                  </div>
                  <div>
                    <strong>Aadhar No</strong> : {ticketData.aadhar_no}
                  </div>
                </div>

                {/* 🔥 Dynamic QR Code */}
                {ticketData.qr_code && (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${ticketData.qr_code}`}
                    alt="QR Code"
                    style={{ marginTop: "20px" }}
                  />
                )}

                <h5 className="fw-bold mt-3">
                  Please do not fold the QR code
                </h5>

                <p className="mt-0">Terms & Conditions</p>

                <p style={{ color: "#666" }}>
                  A no-responsibility disclaimer helps prevent claims of civil
                  liability by customers.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EneligibleTicket;
