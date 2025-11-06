import axios from "axios";

const API = axios.create({
  // baseURL: "http://12.0.0.129:5001/api",
  baseURL: "http://localhost:5001/api",
});

//
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
