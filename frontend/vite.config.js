import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Allow access from network (0.0.0.0)
    port: 5173,
    proxy: {
      // Proxy `/api` to backend during development to avoid CORS.
      // Adjust the target port if your backend uses a different port.
      "/api": {
        target: "http://127.0.0.1:5001",
        changeOrigin: true,
        secure: false,
      },
      "/uploads": {
        target: "http://127.0.0.1:5001",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: "http://127.0.0.1:5001",
        ws: true,
      },
    },
  },
});
