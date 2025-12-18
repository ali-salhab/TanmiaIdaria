import axios from "axios";

const API = axios.create({
  // Prefer explicit VITE_API_URL in production/dev env.
  // When not provided during local dev, use a relative `/api` path so
  // Vite's dev server proxy can forward requests to the backend and
  // avoid CORS/credentials issues.
  baseURL: import.meta.env.VITE_API_URL || `/api`,
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
