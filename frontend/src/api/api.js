import axios from "axios";

// Dynamically determine the API base URL
const getBaseURL = () => {
  // Check if we're running in development
  if (import.meta.env.DEV) {
    // Use environment variable if set, otherwise detect from window location
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }

    // Auto-detect: use the same host as the frontend but port 5000
    const hostname = window.location.hostname;
    const baseURL = `http://${hostname}:5000/api`;
    console.log("🔧 API Base URL:", baseURL);
    return baseURL;
  }

  // Production: use environment variable or relative path
  return import.meta.env.VITE_API_URL || "/api";
};

const API = axios.create({
  baseURL: getBaseURL(),
});

console.log("✅ API initialized with baseURL:", API.defaults.baseURL);

//
API.interceptors.request.use((config) => {
  console.log("==================interceptors called==================");
  console.log("🚀 Request URL:", config.baseURL + config.url);

  const token = localStorage.getItem("token");
  console.log("===============token========in interpreter =============");
  console.log(token);
  console.log("====================================");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Add response interceptor for better error handling
API.interceptors.response.use(
  (response) => {
    console.log("✅ Response received:", response.config.url);
    return response;
  },
  (error) => {
    console.error("❌ API Error:", {
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });
    return Promise.reject(error);
  }
);

export default API;
