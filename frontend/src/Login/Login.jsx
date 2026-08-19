import { useState } from "react";
import axios from "axios";
import { getErrorMessage } from "../services/http";

const API_PATH = process.env.REACT_APP_API_PATH;

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetData, setResetData] = useState({ email: "", code: "", password: "", confirmPassword: "" });
  const [resetRequested, setResetRequested] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetting, setResetting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const formData = new URLSearchParams({ username: username.trim(), password });
      const response = await axios.post(`${API_PATH}/api/login`, formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      if (!response.data?.access_token) throw new Error("The server returned an invalid login response");

      localStorage.setItem("access_token", response.data.access_token);
      if (response.data.refresh_token) localStorage.setItem("refresh_token", response.data.refresh_token);
      localStorage.setItem("user_name", response.data.username || username.trim());
      localStorage.setItem("roles", JSON.stringify(response.data.roles || []));
      onLoginSuccess?.();
    } catch (errorValue) {
      const apiMessage = getErrorMessage(errorValue, "Unable to sign in");
      setError(errorValue.response?.status === 401 ? "Invalid username or password." : apiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setResetError("");
    setResetMessage("");
    if (!resetRequested) {
      setResetting(true);
      try {
        const response = await axios.post(`${API_PATH}/api/forgot-password`, { email: resetData.email.trim() });
        setResetMessage(response.data?.message || "Reset code sent to your registered email.");
        setResetRequested(true);
      } catch (errorValue) { setResetError(getErrorMessage(errorValue, "Unable to send reset code.")); }
      finally { setResetting(false); }
      return;
    }
    if (resetData.password !== resetData.confirmPassword) {
      setResetError("New password and confirm password must match.");
      return;
    }
    setResetting(true);
    try {
      const response = await axios.post(`${API_PATH}/api/reset-password`, {
        email: resetData.email.trim(), code: resetData.code, password: resetData.password,
      });
      setResetMessage(response.data?.message || "Password reset successfully. Please sign in.");
      setResetData({ email: "", code: "", password: "", confirmPassword: "" });
      setResetRequested(false);
    } catch (errorValue) {
      setResetError(getErrorMessage(errorValue, "Unable to reset password."));
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <section className="login-brand-panel">
          <span className="login-eyebrow">E-ticketing operations</span>
          <p>Secure access for ticketing, gates, staff, cards, and reports.</p>
        </section>
        <section className="login-form-panel">
          <div>
            <span className="login-form-kicker"><i className="bi bi-shield-check" /> Secure sign in</span>
            <h2>Welcome back</h2>
            <p className="text-muted">Sign in with your assigned credentials.</p>
          </div>
          {error && <div className="alert alert-danger" role="alert"><i className="bi bi-exclamation-circle me-2" />{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3 login-field">
              <label htmlFor="username">User name</label>
              <i className="bi bi-person" />
              <input id="username" className="form-control" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" placeholder="Enter username" required autoFocus />
            </div>
            <div className="mb-4 login-field">
              <label htmlFor="password">Password</label>
              <i className="bi bi-shield-lock" />
              <input id="password" type={showPassword ? "text" : "password"} className="form-control" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter password" required />
              <button type="button" className="password-visibility" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>
                <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"} />
              </button>
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
              {submitting ? <><span className="spinner-border spinner-border-sm me-2" />Signing in...</> : <><i className="bi bi-box-arrow-in-right me-2" />Login securely</>}
            </button>
          </form>
          <button type="button" className="forgot-password-link" onClick={() => { setShowForgotPassword(true); setResetMessage(""); setResetError(""); setResetRequested(false); }}>
            Forgot password?
          </button>
          <small className="text-muted login-powered"><i className="bi bi-stars" /> Powered by Housys</small>
        </section>
      </div>
      {showForgotPassword && (
        <div className="reset-password-backdrop" role="presentation" onMouseDown={() => setShowForgotPassword(false)}>
          <section className="reset-password-modal" role="dialog" aria-modal="true" aria-labelledby="reset-password-title" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="reset-close" onClick={() => setShowForgotPassword(false)} aria-label="Close"><i className="bi bi-x-lg" /></button>
            <div className="reset-icon"><i className="bi bi-key-fill" /></div>
            <h3 id="reset-password-title">Reset password</h3>
            <p>{resetRequested ? "Enter the code sent to your email and create a new password." : "Enter your registered email to receive a reset code."}</p>
            {resetError && <div className="alert alert-danger py-2">{resetError}</div>}
            {resetMessage && <div className="alert alert-success py-2">{resetMessage}</div>}
            <form onSubmit={handleResetPassword}>
              <input className="form-control mb-2" type="email" value={resetData.email} onChange={(event) => setResetData((value) => ({ ...value, email: event.target.value }))} placeholder="Registered email" required disabled={resetRequested} />
              {resetRequested && <>
              <input className="form-control mb-2" value={resetData.code} onChange={(event) => setResetData((value) => ({ ...value, code: event.target.value }))} placeholder="6-digit reset code" inputMode="numeric" maxLength="6" required />
              <div className="reset-password-field mb-2">
                <input className="form-control" type={showResetPassword ? "text" : "password"} minLength="6" value={resetData.password} onChange={(event) => setResetData((value) => ({ ...value, password: event.target.value }))} placeholder="New password (minimum 6 characters)" required />
                <button type="button" onClick={() => setShowResetPassword((visible) => !visible)} aria-label={showResetPassword ? "Hide password" : "Show password"}><i className={showResetPassword ? "bi bi-eye-slash" : "bi bi-eye"} /></button>
              </div>
              <div className="reset-password-field mb-3">
                <input className="form-control" type={showResetPassword ? "text" : "password"} minLength="6" value={resetData.confirmPassword} onChange={(event) => setResetData((value) => ({ ...value, confirmPassword: event.target.value }))} placeholder="Confirm new password" required />
                <button type="button" onClick={() => setShowResetPassword((visible) => !visible)} aria-label={showResetPassword ? "Hide password" : "Show password"}><i className={showResetPassword ? "bi bi-eye-slash" : "bi bi-eye"} /></button>
              </div>
              </>}
              <button className="btn btn-primary w-100" disabled={resetting}>{resetting ? (resetRequested ? "Resetting..." : "Sending code...") : (resetRequested ? "Reset password" : "Send reset code")}</button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default Login;
