import { useEffect, useState } from "react";

const ToastCenter = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = ({ detail }) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((current) => [...current, { id, ...detail }]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 4000);
    };
    window.addEventListener("app:toast", handleToast);
    return () => window.removeEventListener("app:toast", handleToast);
  }, []);

  return (
    <div className="app-toast-region" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`app-toast app-toast--${toast.type || "success"}`} role="status">
          <i className={`bi ${toast.type === "error" ? "bi-exclamation-circle" : "bi-check-circle"}`} />
          <span>{toast.message}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
          >
            <i className="bi bi-x" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastCenter;
