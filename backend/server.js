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
import homepageRoutes from "./routes/homepage.js";
import notificationRoutes from "./routes/notifications.js";
import appSettingsRoutes from "./routes/appSettings.js";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";
import { generateEmployeeCV } from "./controllers/incidentController.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const app = express();

let onlineUsers = new Map();

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

app.use((req, res, next) => {
  req.onlineUsers = onlineUsers;
  next();
});

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
app.use("/api/homepage", homepageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/app-settings", appSettingsRoutes);
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
  console.log("====================================");
  console.log("log handler in server called");
  console.log("====================================");
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

export { onlineUsers };

io.on("connection", (socket) => {
  console.log("🔌 مستخدم متصل:", socket.id);
  socket.on("registerAdmin", () => {
    adminSocket = socket;
    console.log(
      "✅ Admin connected: and with change admin socket varible",
      socket.id
    );
  });
  socket.on("registerUser", (data) => {
    console.log("🙋 User registered:", data.id);
  });
  socket.on("notifyAdmin", (data) => {
    console.log("====================================");
    console.log(onlineUsers);
    console.log("====================================");
    io.emit("notification", data);
    if (adminSocket) {
      adminSocket.emit("adminNotification", data);
      console.log("📤 Notification sent to admin", data);
    } else {
      console.log("⚠️ No admin connected");
    }
  });
  socket.on("private_message", ({ to, message, from, fromUsername }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("private_message", {
        message,
        from,
        fromUsername: fromUsername || "Unknown",
      });
    }
  });

  socket.on("admin_message", ({ message, from, fromUsername }) => {
    if (adminSocket) {
      adminSocket.emit("private_message", {
        message,
        from,
        fromUsername: fromUsername || "User",
      });
    }
  });
  socket.on("user_connected", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log("✅ User connected:", userId, "Socket ID:", socket.id);
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
  .then(async () => {
    console.log("MongoDB connected");

    const User = (await import("./models/User.js")).default;
    const bcrypt = (await import("bcryptjs")).default;

    const adminExists = await User.findOne({ username: process.env.ADMIN_USERNAME });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      const adminUser = new User({
        username: process.env.ADMIN_USERNAME,
        password: hashedPassword,
        role: "admin",
        permissions: {
          viewEmployees: true,
          viewIncidents: true,
          viewUsers: true,
          viewDocuments: true,
          viewSalary: true,
          viewReports: true,
          editEmployee: true,
          manageLeaves: true,
          manageReawards: true,
          managePunischments: true,
        },
      });
      await adminUser.save();
      console.log("✅ Default admin user created");
    }

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running with Socket.IO on http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error", err);
    process.exit(1);
  });
