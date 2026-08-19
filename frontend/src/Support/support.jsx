const Support = () => (
  <div className="container-fluid">
    <section className="p-4 rounded">
      <span className="page-kicker">Support</span>
      <h2 className="mt-1">Need help?</h2>
      <p className="text-muted mb-4">Before contacting your system administrator, note the page, time, and exact error message.</p>
      <div className="info-grid">
        <div><i className="bi bi-person-badge" /><h5>Account access</h5><p>Ask an administrator to verify your role, qualification, and permissions.</p></div>
        <div><i className="bi bi-wifi" /><h5>Connectivity</h5><p>Check the workstation network and gate connectivity status.</p></div>
        <div><i className="bi bi-bug" /><h5>Report an issue</h5><p>Include the action attempted and the displayed error so it can be resolved quickly.</p></div>
      </div>
    </section>
  </div>
);

export default Support;
