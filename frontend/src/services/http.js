import axios from "axios";

let configured = false;
let refreshPromise = null;

const clearSessionAndRedirect = () => {
  ["access_token", "refresh_token", "user_name", "roles"].forEach((key) => localStorage.removeItem(key));
  if (window.location.pathname !== "/login") window.location.assign("/login");
};

const refreshAccessToken = () => {
  if (refreshPromise) return refreshPromise;
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return Promise.reject(new Error("No refresh token"));

  refreshPromise = axios.post(`${process.env.REACT_APP_API_PATH}/api/refresh`, {
    refresh_token: refreshToken,
  }, { __skipRefresh: true }).then((response) => {
    localStorage.setItem("access_token", response.data.access_token);
    if (response.data.refresh_token) localStorage.setItem("refresh_token", response.data.refresh_token);
    return response.data.access_token;
  }).finally(() => { refreshPromise = null; });
  return refreshPromise;
};

export const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") =>
  error?.response?.data?.detail ||
  error?.response?.data?.message ||
  error?.message ||
  fallback;

export const configureHttp = () => {
  if (configured) return;
  configured = true;

  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers.Accept = config.headers.Accept || "application/json";
    return config;
  });

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config || {};
      const isAuthRequest = /\/(login|refresh)$/.test(String(originalRequest.url || ""));
      if (error.response?.status === 401 && !originalRequest._retried && !originalRequest.__skipRefresh && !isAuthRequest) {
        originalRequest._retried = true;
        try {
          const token = await refreshAccessToken();
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        } catch {
          clearSessionAndRedirect();
        }
      }
      error.userMessage = getErrorMessage(error);
      return Promise.reject(error);
    }
  );
};

export const notify = (message, type = "success") => {
  window.dispatchEvent(new CustomEvent("app:toast", { detail: { message, type } }));
};

export const installLegacyFeedbackBridge = () => {
  if (window.__legacyFeedbackBridgeInstalled) return;
  window.__legacyFeedbackBridgeInstalled = true;
  window.alert = (value) => {
    const message = String(value || "Notice");
    const isError = /error|fail|invalid|unable|expired|not found|please|select|fill|required|already/i.test(message);
    notify(message, isError ? "error" : "success");
  };
};
