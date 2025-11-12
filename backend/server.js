import express from "express";
import dotenv from "dotenv";
import operationRoutes from "./routes/operations.js";
import mongoose from "mongoose";
import vacationRoutes from "./routes/voctionRoutes.js";

import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import employeeRoutes from "./routes/employees.js";
import authRoutes from "./routes/auth.js";
import path from "path";
import incidentRoutes from "./routes/incidents.js";
import users from "./routes/users.js";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";
import { generateEmployeeCV } from "./controllers/incidentController.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const app = express();
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);
app.use(compression());
app.use(
  cors({
    origin: ["http://12.0.0.173:5173", "http://localhost:5173"],
    credentials: true,
  })
);

// الاجازات
app.use("/api", vacationRoutes);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/excel-cv/:id", generateEmployeeCV);
app.use("/api/incidents", incidentRoutes);
app.use("/api/users", users);
app.use("/api/operations", operationRoutes);
app.get("/api/test", (req, res) => {
  res.send("connected successfully");
});
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".png")) res.set("Content-Type", "image/png");
      else if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg"))
        res.set("Content-Type", "image/jpeg");
      else if (filePath.endsWith(".gif")) res.set("Content-Type", "image/gif");
    },
  })
);
// error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Server Error" });
});

// ------------------------------>
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: ["http://12.0.0.173:5173", "http://localhost:5173"],

    methods: ["GET", "POST"],
  },
});
let adminSocket = null;

let onlineUsers = new Map();
io.on("connection", (socket) => {
  console.log("🔌 مستخدم متصل:", socket.id);
  socket.on("registerAdmin", () => {
    adminSocket = socket;
    console.log(
      "✅ Admin connected: and with change admin socket varible",
      socket.id
    );
  });
  socket.on("notifyAdmin", (data) => {
    // Send it to the admin if connected
    if (adminSocket) {
      adminSocket.emit("adminNotification", data);
      console.log("📤 Notification sent to admin", data);
    } else {
      console.log("⚠️ No admin connected");
    }
  });
  socket.on("private_message", ({ to, message, from }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("private_message", { message, from });
    }
  });
  socket.on("user_connected", (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit("online_users", Array.from(onlineUsers.keys()));
  });
  socket.on("disconnect", () => {
    for (let [userId, sid] of onlineUsers.entries()) {
      if (sid === socket.id) onlineUsers.delete(userId);
    }
    io.emit("online_users", Array.from(onlineUsers.keys()));
    console.log("🔴 User disconnected:", socket.id);
    console.log("❌ مستخدم قطع الاتصال:", socket.id);
    if (socket === adminSocket) {
      adminSocket = null;
      console.log("⚠️ Admin disconnected");
    }
  });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");

    // ✅ استخدم server وليس app
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running with Socket.IO on http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error", err);
    process.exit(1);
  });
