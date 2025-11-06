import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // server: {
  //   host: true, // or '0.0.0.0'
  //   port: 5173, // you can change this to any open port
  // },
});
