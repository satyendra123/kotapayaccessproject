import React, { useEffect, useState } from "react";
import axios from "axios";

const API_PATH = process.env.REACT_APP_API_PATH;
const defaults = [{ min_members: 51, discount_percentage: 25 }, { min_members: 101, discount_percentage: 50 }];
const normalizeRules = (value) => {
  if (typeof value === "string") {
    try { value = JSON.parse(value); } catch { return defaults; }
  }
  return Array.isArray(value) ? value : defaults;
};

const Setting = () => {
  const [rules, setRules] = useState(defaults);
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    axios.get(`${API_PATH}/api/settings/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => setRules(normalizeRules(response.data?.data?.member_discount_rules)))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateRule = (index, key, value) => setRules((current) => current.map((rule, i) =>
    i === index ? { ...rule, [key]: Number(value) } : rule));
  const save = async () => {
    try {
      await axios.put(`${API_PATH}/api/settings/`, { member_discount_rules: rules }, { headers: { Authorization: `Bearer ${token}` } });
      alert("Discount rules saved successfully");
    } catch (error) { alert(error.response?.data?.detail || "Unable to save discount rules"); }
  };

  const displayRules = normalizeRules(rules);
  return <div className="container-fluid"><section className="p-4 rounded">
    <h2>Application Settings</h2><h5 className="mt-4">Member Discount Rules</h5>
    <p className="text-muted">Change these values anytime; Ticket Generation uses the saved rules automatically.</p>
    {displayRules.map((rule, index) => <div className="row g-3 mb-2" key={index}>
      <div className="col-md-4"><label>Minimum members</label><input className="form-control" type="number" min="1" value={rule.min_members} onChange={(e) => updateRule(index, "min_members", e.target.value)} /></div>
      <div className="col-md-4"><label>Discount percentage</label><input className="form-control" type="number" min="0" max="100" value={rule.discount_percentage} onChange={(e) => updateRule(index, "discount_percentage", e.target.value)} /></div>
    </div>)}
    <button className="btn btn-primary mt-3" onClick={save}>Save Discount Rules</button>
  </section></div>;
};
export default Setting;
