import axios from "axios";

const API = axios.create({
  // Default backend is 5001 (see `backend/.env` and `backend/server.js`)
  // When running on LAN (e.g. http://12.0.0.170:5173), prefer same-host backend.
  baseURL:
    import.meta.env.VITE_API_URL ||
    `http://${window.location.hostname}:5001/api`,
  withCredentials: true,
});

// Add a request interceptor to include the auth token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add a response interceptor to handle token expiration
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Let the app decide how/when to navigate.
      // This prevents unexpected redirects from background API calls.
      window.dispatchEvent(
        new CustomEvent("auth:logout", { detail: { reason: "401" } })
      );
    }
    return Promise.reject(error);
  }
);

export default API;
