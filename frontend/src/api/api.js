import axios from "axios";

const API = axios.create({
  // baseURL: "http://12.0.0.173:5000/api",
  baseURL: "http://localhost:5000/api",
});

//
API.interceptors.request.use((config) => {
  console.log("==================interceptors called==================");

  const token = localStorage.getItem("token");
  console.log("===============token========in interpreter =============");
  console.log(token);
  console.log("====================================");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
