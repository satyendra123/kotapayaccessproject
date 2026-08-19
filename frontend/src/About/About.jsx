const About = () => (
  <div className="container-fluid">
    <section className="p-4 rounded">
      <span className="page-kicker">About</span>
      <h2 className="mt-1">Chambal River Front E-ticketing</h2>
      <p className="text-muted mb-4">A unified operations platform for visitor ticketing, access control, staff, cards, tariffs, and reporting.</p>
      <div className="info-grid">
        <div><i className="bi bi-ticket-perforated" /><h5>Ticketing</h5><p>Generate, manage, and verify visitor tickets.</p></div>
        <div><i className="bi bi-shield-check" /><h5>Access control</h5><p>Role-based permissions and gate operations.</p></div>
        <div><i className="bi bi-graph-up" /><h5>Reporting</h5><p>Operational activity and revenue visibility.</p></div>
      </div>
    </section>
  </div>
);
export default About;
