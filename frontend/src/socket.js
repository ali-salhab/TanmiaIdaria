// src/socket.js
import { io } from "socket.io-client";

// Auto-detect backend URL
const getSocketURL = () => {
  if (import.meta.env.VITE_API_URL) {
    // Remove /api suffix if present
    return import.meta.env.VITE_API_URL.replace("/api", "");
  }

  // Use same hostname as frontend with port 5000
  const hostname = window.location.hostname;
  return `http://${hostname}:5000`;
};

export const socket = io(getSocketURL());
