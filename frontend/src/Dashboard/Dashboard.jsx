import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import "./Dashboard.css";

import card1icon from "../CardIcon/icon.svg";
import card2icon from "../CardIcon/icon-secondary.svg";
import Chart from "../chart/Chart";
import Livestaff from "../LiveStafflogs/Livestaff";
import Livemachinelog from "../Livemachibelog/Livemachinelog";
import Livecustomer from "../Livecustomer/Livecustomer";
import Livealramlogs from "../Livealarmlogs/Livealramlogs";
import { canUseFeature } from "../auth/featurePermissions";
const API_PATH = process.env.REACT_APP_API_PATH;
const DashboardCards = () => {
  const cardStyle = {
    height: "145px",
    minWidth: "200px",
  };
  const dashboardCardPermissions = [
    "dashboard.ticket_members.view",
    "dashboard.inside_count.view",
    "dashboard.outside_count.view",
    "dashboard.overstay.view",
    "dashboard.today_revenue.view",
    "dashboard.lost_tickets.view",
    "dashboard.eligible_tickets.view",
    "dashboard.group_tickets.view",
  ];

  const [cards, setCards] = useState([
    { icon: card1icon, label: "Today’s ticket\n generated-Members", value: 4 },
    { icon: card2icon, label: "Today\n (Online)(Offline) Inside", value: 19 },
    { icon: card2icon, label: "Today (Online) (Offline) Outside", value: 20 },
    { icon: card2icon, label: "Over Stay", value: 27 },
    { icon: card2icon, label: "Today Revenue", value: 0 },
    { icon: card2icon, label: "Total Lost Tickets", value: 0 },
    { icon: card2icon, label: "Total Eligible Tickets", value: 0 },
    { icon: card2icon, label: "Total Group Tickets", value: 0 },
  ]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    console.log("Access Token:", token);

    if (!token) {
      console.warn("No access_token found");
      return;
    }

    /* -------- Card 1 : Members Tickets Today -------- */
    axios
      .get(`${API_PATH}/api/dashboard/tickets/members/today`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setCards((prev) => {
          const updated = [...prev];
          updated[0].value = res.data?.value ?? prev[0].value;
          return updated;
        });
      })
      .catch((err) => console.error("Members API Error:", err.response || err));

    /* -------- Card 2 : Persons Inside Today -------- */
    axios
      .get(`${API_PATH}/api/dashboard/persons/inside/today`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setCards((prev) => {
          const updated = [...prev];
          updated[1].value = res.data?.total ?? prev[1].value;
          return updated;
        });
      })
      .catch((err) => console.error("Inside API Error:", err.response || err));

    /* -------- Card 3 : Persons Outside Today -------- */
    axios
      .get(`${API_PATH}/api/dashboard/persons/outside/today`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setCards((prev) => {
          const updated = [...prev];
          updated[2].value = res.data?.total ?? prev[2].value;
          return updated;
        });
      })
      .catch((err) => console.error("Outside API Error:", err.response || err));

    /* -------- Card 4 : Over Stay -------- */
    axios
      .get(`${API_PATH}/api/dashboard/overstay`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setCards((prev) => {
          const updated = [...prev];
          updated[3].value = res.data?.count ?? prev[3].value;
          return updated;
        });
      })
      .catch((err) => console.error("Overstay API Error:", err.response || err));

    /* -------- Card 5 : Today Revenue -------- */
    axios
      .get(`${API_PATH}/api/dashboard/revenue/today`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setCards((prev) => {
          const updated = [...prev];
          updated[4].value = `${res.data?.amount ?? 0} ${res.data?.currency ?? ""}`;
          return updated;
        });
      })
      .catch((err) => console.error("Revenue API Error:", err.response || err));

    /* -------- Card 6 : Total Lost Tickets -------- */
    axios
      .get(`${API_PATH}/api/dashboard/tickets/lost`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const count =
          res.data?.count ??
          res.data?.total ??
          res.data?.data?.count ??
          0;

        setCards((prev) => {
          const updated = [...prev];
          updated[5].value = count;
          return updated;
        });
      })
      .catch((err) =>
        console.error("Lost Tickets API Error:", err.response || err)
      );

    /* -------- Card 7 : Total Eligible Tickets -------- */
    axios
      .get(`${API_PATH}/api/dashboard/tickets/eligible`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const count =
          res.data?.count ??
          res.data?.total ??
          res.data?.data?.count ??
          0;

        setCards((prev) => {
          const updated = [...prev];
          updated[6].value = count;
          return updated;
        });
      })
      .catch((err) =>
        console.error("Eligible Tickets API Error:", err.response || err)
      );

    /* -------- Card 8 : Total Group Tickets -------- */
    axios
      .get(`${API_PATH}/api/dashboard/tickets/group`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log("Group Tickets:", res.data);

        const groupCount =
          res.data?.count ??
          res.data?.total ??
          res.data?.data?.count ??
          0;

        setCards((prev) => {
          const updated = [...prev];
          updated[7].value = groupCount;
          return updated;
        });
      })
      .catch((err) =>
        console.error("Group Tickets API Error:", err.response || err)
      );
  }, []);

  return (
    <div className="container-fluid mt-4">
      <div className="dashboard-section-title">
        <div><span>E-TICKETING OPERATIONS</span><h4>Live Ticketing Overview</h4></div>
        <p>Monitor real-time ticket sales, visitors, and collections.</p>
      </div>
      <div className="row g-3">
        {cards.map((card, index) => canUseFeature([dashboardCardPermissions[index]]) && (
          <div key={index} className="col-sm-6 col-md-4 col-lg-3">
            <div className={`card shadow-sm dashboard-metric dashboard-metric--${index % 4}`} style={cardStyle}>
              <div
                className="card-body position-relative"
                style={{ padding: "12px" }}
              >
                <img
                  src={card.icon}
                  alt=""
                  style={{ width: "30px", height: "30px" }}
                />

                <p
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    fontSize: "13px",
                    textAlign: "right",
                    margin: 0,
                    whiteSpace: "pre-line",
                    fontFamily: "Poppins, sans-serif",
                  }}
                >
                  {card.label}
                </p>

                <p
                  style={{
                    position: "absolute",
                    bottom: "12px",
                    left: "20px",
                    margin: 0,
                    fontWeight: 500,
                    fontFamily: "Inter, sans-serif",
                    fontSize: "20px",
                  }}
                >
                  {card.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div>
        {(canUseFeature(["view_monthly_revenue"]) || canUseFeature(["dashboard.ticket_collection.view"])) && <Chart />}
        {canUseFeature(["dashboard.live_staff.view"]) && <Livestaff />}
        {canUseFeature(["dashboard.live_machines.view"]) && <Livemachinelog />}
        {canUseFeature(["dashboard.live_customers.view"]) && <Livecustomer />}
        {canUseFeature(["dashboard.live_alarms.view"]) && <Livealramlogs />}
      </div>
    </div>
  );
};
export default DashboardCards;
