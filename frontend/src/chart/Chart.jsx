"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "bootstrap/dist/css/bootstrap.min.css";
import { canUseFeature, FEATURE_PERMISSIONS } from "../auth/featurePermissions";

const COLORS = ["#2d54c5", "#ff5b4d", "#42afd5", "#ffaf3f", "#7b61d8"];
const API_PATH = process.env.REACT_APP_API_PATH;

export default function Chart() {
  const [barData, setBarData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [loadingBar, setLoadingBar] = useState(true);
  const [loadingPie, setLoadingPie] = useState(true);
  const totalRevenue = barData.reduce(
    (total, item) => total + Number(item.revenue || 0),
    0
  );
  const latestRevenue = Number(barData[barData.length - 1]?.revenue || 0);
  const previousRevenue = Number(barData[barData.length - 2]?.revenue || 0);
  const revenueChange = previousRevenue
    ? ((latestRevenue - previousRevenue) / previousRevenue) * 100
    : 0;
  const canViewMonthlyRevenue = canUseFeature(FEATURE_PERMISSIONS.dashboard.monthlyRevenue);

  /* ================= MONTHLY REVENUE API ================= */
  useEffect(() => {
    const fetchMonthlyRevenue = async () => {
      try {
        const token = localStorage.getItem("access_token");

        const res = await axios.get(
          `${API_PATH}/api/dashboard/revenue/monthly`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setBarData(res.data);
      } catch (error) {
        console.error("Monthly Revenue Error:", error);
      } finally {
        setLoadingBar(false);
      }
    };

    fetchMonthlyRevenue();
  }, []);

  const hasTodayTicketData = pieData.some((item) => Number(item.visitors) > 0);

  /* ================= TODAY TICKETS COLLECTION API ================= */
  useEffect(() => {
    const fetchTodayTickets = async () => {
      try {
        const token = localStorage.getItem("access_token");

        const res = await axios.get(
          `${API_PATH}/api/dashboard/tickets/today-collection`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Transform API response for Recharts
        const formattedData = res.data.map((item) => ({
          browser: item.type,
          visitors: item.count,
        }));

        setPieData(formattedData);
      } catch (error) {
        console.error("Today Tickets Error:", error);
      } finally {
        setLoadingPie(false);
      }
    };

    fetchTodayTickets();
  }, []);

  return (
    <div className="container-fluid py-4">
      <div className="row g-4">

        {/* ================= MONTHLY REVENUE ================= */}
        {canViewMonthlyRevenue && <div className="col-lg-8">
          <div className="card border-0 shadow-sm h-100 overflow-hidden">
            <div className="card-header border-0 bg-white px-4 pt-4 pb-3 d-flex justify-content-between align-items-start">
              <div>
                <h5 className="mb-1 fw-bold" style={{ fontSize: "17px", color: "#1f2937" }}>
                  <i className="bi bi-graph-up-arrow me-2" style={{ color: "#5570f1" }} />Monthly Revenue
                </h5>
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold" style={{ color: "#18243d" }}>₹{totalRevenue.toLocaleString("en-IN")}</span>
                  {barData.length > 1 && (
                    <small className={`fw-semibold ${revenueChange >= 0 ? "text-success" : "text-danger"}`}>
                      <i className={`bi bi-arrow-${revenueChange >= 0 ? "up" : "down"}-right me-1`} />
                      {Math.abs(revenueChange).toFixed(1)}%
                    </small>
                  )}
                </div>
              </div>
              <small className="text-muted">Last 12 Months ▼</small>
            </div>

            <div className="card-body px-2 pb-3" style={{ height: "330px" }}>
              {loadingBar ? (
                <div className="d-flex h-100 align-items-center justify-content-center text-muted">Loading revenue data...</div>
              ) : barData.length === 0 ? (
                <div className="d-flex h-100 flex-column align-items-center justify-content-center text-muted">
                  <i className="bi bi-bar-chart-line" style={{ fontSize: "2.5rem", color: "#aab4d5" }} />
                  <span className="mt-2 fw-semibold">No monthly revenue data available</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 18, right: 22, left: 8, bottom: 4 }} barCategoryGap="30%">
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6d84ff" />
                        <stop offset="100%" stopColor="#4662e8" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#edf0f7" strokeDasharray="4 4" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#7d8799", fontSize: 12 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#98a1b2", fontSize: 11 }} tickFormatter={(value) => `₹${Number(value / 1000).toLocaleString()}k`} width={48} />
                    <Tooltip
                      cursor={{ fill: "rgba(85, 112, 241, 0.08)" }}
                      contentStyle={{ border: "none", borderRadius: 10, boxShadow: "0 8px 24px rgba(31, 41, 55, 0.16)" }}
                      labelStyle={{ color: "#1f2937", fontWeight: 700 }}
                      itemStyle={{ color: "#375147", fontWeight: 600 }}
                      formatter={(val) =>
                        `₹${Number(val).toLocaleString()}`
                      }
                    />

                    <Bar
                      dataKey="capacity"
                      fill="#e8ecf7"
                      barSize={20}
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="url(#revenueGradient)"
                      barSize={20}
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>}

        {/* ================= TODAY’S TICKETS COLLECTION ================= */}
        <div className={canViewMonthlyRevenue ? "col-lg-4" : "col-lg-12"}>
          <div className="card shadow-sm h-100">
            <div className="card-header">
              <h5 className="mb-0" style={{ fontSize: "16px" }}>
                Today’s Tickets Collection
              </h5>
            </div>

            <div className="card-body d-flex flex-column align-items-center justify-content-center">
              {loadingPie ? (
                <div>Loading...</div>
              ) : !hasTodayTicketData ? (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-pie-chart" style={{ fontSize: "2.2rem", opacity: 0.45 }} />
                  <p className="mb-0 mt-2 fw-semibold">No data available</p>
                  <small>Today’s ticket collection will appear here.</small>
                </div>
              ) : (
                <>
                  {/* Custom Legend */}
                  <div className="d-flex justify-content-center mb-3">
                    {pieData.map((entry, index) => (
                      <div
                        key={index}
                        className="d-flex align-items-center mx-2"
                      >
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            backgroundColor: COLORS[index],
                            borderRadius: "50%",
                            marginRight: 6,
                          }}
                        />
                        <small style={{ fontSize: "11px" }}>
                          {entry.browser}
                        </small>
                      </div>
                    ))}
                  </div>

                  {/* Donut Chart */}
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="visitors"
                        nameKey="browser"
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={94}
                        paddingAngle={4}
                        stroke="#ffffff"
                        strokeWidth={4}
                        labelLine={false}
                        label={({ x, y, percent }) => (
                          <text x={x} y={y} fill="#ffffff" textAnchor="middle" dominantBaseline="central" fontSize="18" fontWeight="700">
                            {`${Math.round(percent * 100)}%`}
                          </text>
                        )}
                      >
                        {pieData.map((_, index) => (
                          <Cell
                            key={index}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="d-flex flex-wrap justify-content-center gap-3 mt-1">
                    {pieData.map((entry, index) => (
                      <div key={entry.browser} className="d-flex align-items-center">
                        <span style={{ width: 9, height: 9, borderRadius: "50%", background: COLORS[index % COLORS.length], marginRight: 6 }} />
                        <small className="text-muted">{entry.browser}: <strong className="text-dark">{entry.visitors}</strong></small>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
