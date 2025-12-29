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
import dropdownOptionsRoutes from "./routes/dropdownOptions.js";
import permissionsRoutes from "./routes/permissions.js";
import fileShareRoutes from "./routes/fileShare.js";
import documentRoutes from "./routes/documents.js";
import circularRoutes from "./routes/circulars.js";
import messageRoutes from "./routes/messages.js";
import legalRoutes from "./routes/legal.js";
import reportRoutes from "./routes/reports.js";
import searchRoutes from "./routes/search.js";
import rewardRoutes from "./routes/rewards.js";
import penaltyRoutes from "./routes/penalties.js";
import courseRoutes from "./routes/courses.js";
import complaintRoutes from "./routes/complaints.js";
import dbRecoveryRoutes from "./routes/dbRecovery.js";
import { initBackupScheduler } from "./services/backupScheduler.js";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";
import { generateEmployeeCV } from "./controllers/incidentController.js";
import Message from "./models/Message.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const app = express();
// Disable automatic ETag headers so auth/me doesn't return 304 and break clients
app.set("etag", false);

let onlineUsers = new Map();

const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow all origins for Socket.IO (development)
      callback(null, true);
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);
app.use(compression());
app.use(
  cors({
    origin: function (origin, callback) {
      console.log("🔍 CORS Request from origin:", origin);

      // Allow requests with no origin (like mobile apps, Postman, etc.)
      if (!origin) {
        console.log("✅ CORS: Allowing request with no origin");
        return callback(null, true);
      }

      // Allow all origins from local network and localhost
      const allowedPatterns = [
        /^http:\/\/localhost:\d+$/,
        /^http:\/\/127\.0\.0\.1:\d+$/,
        /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
        /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
        /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+:\d+$/,
      ];

      const isAllowed = allowedPatterns.some((pattern) => pattern.test(origin));

      if (isAllowed) {
        console.log("✅ CORS: Allowed origin:", origin);
        callback(null, true);
      } else {
        console.warn(`⚠️ CORS: Unmatched origin (allowing anyway):`, origin);
        callback(null, true); // Allow anyway for development
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.removeHeader("ETag");
  req.io = io;
  req.onlineUsers = onlineUsers;
  next();
});

// الاجازات
app.use("/api", vacationRoutes);

// routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/excel-cv/:id", generateEmployeeCV);
app.use("/api/incidents", incidentRoutes);
app.use("/api/users", users);
app.use("/api/homepage", homepageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/app-settings", appSettingsRoutes);
app.use("/api/dropdown-options", dropdownOptionsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/penalties", penaltyRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/permissions", permissionsRoutes);
app.use("/api/file-share", fileShareRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/circulars", circularRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/legal", legalRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/operations", operationRoutes);
app.use("/api/db-recovery", dbRecoveryRoutes);
app.use("/api/complaints", complaintRoutes);
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
let adminSocket = null;
let adminUserId = null;

export { onlineUsers };

io.on("connection", (socket) => {
  console.log("🔌 مستخدم متصل:", socket.id);
  socket.on("registerAdmin", (data) => {
    adminSocket = socket;
    if (data?.id) {
      adminUserId = data.id;
      onlineUsers.set(data.id, socket.id);
      io.emit("online_users", Array.from(onlineUsers.keys()));
    }
    console.log(
      "✅ Admin connected: and with change admin socket varible",
      socket.id
    );
  });
  socket.on("registerUser", (data) => {
    console.log("🙋 User registered:", data.id);
    if (data?.id) {
      onlineUsers.set(data.id, socket.id);
      io.emit("online_users", Array.from(onlineUsers.keys()));
    }
  });
  socket.on("notifyAdmin", (data) => {
    console.log("====================================");
    console.log(onlineUsers);
    console.log("====================================");
    const payload = {
      ...data,
      userId: adminUserId,
    };

    if (adminUserId) {
      const adminTargetSocket = onlineUsers.get(adminUserId);
      if (adminTargetSocket) {
        io.to(adminTargetSocket).emit("notification", payload);
        io.to(adminTargetSocket).emit("adminNotification", payload);
        console.log("📤 Notification sent to admin", payload);
        return;
      }
    }

    if (adminSocket) {
      adminSocket.emit("notification", payload);
      adminSocket.emit("adminNotification", payload);
      console.log("📤 Notification sent to admin via fallback socket", payload);
    } else {
      console.log("⚠️ No admin connected");
    }
  });
  socket.on("private_message", async ({ to, message, from, fromUsername }) => {
    try {
      // Validate sender/recipient IDs to avoid cast errors
      if (
        !from ||
        !to ||
        !mongoose.Types.ObjectId.isValid(from) ||
        !mongoose.Types.ObjectId.isValid(to)
      ) {
        const warnTarget = from ? onlineUsers.get(from) : socket.id;
        if (warnTarget) {
          io.to(warnTarget).emit("message_error", {
            message: "Invalid sender or recipient.",
          });
        }
        console.warn("Skipping message save due to invalid IDs", { from, to });
        return;
      }

      // Save message to database
      const newMessage = new Message({
        from,
        to,
        message,
        fromUsername: fromUsername || "Unknown",
      });
      await newMessage.save();

      console.log(`💬 Message saved: ${fromUsername} → ${to}`);

      // Emit to target user if online
      const targetSocket = onlineUsers.get(to);
      if (targetSocket) {
        io.to(targetSocket).emit("private_message", {
          message,
          from,
          to,
          fromUsername: fromUsername || "Unknown",
          timestamp: newMessage.createdAt,
          messageId: newMessage._id.toString(), // Add unique message ID
        });
        console.log(`✅ Message sent to recipient: ${to}`);
      }

      // Confirm to sender
      const senderSocket = onlineUsers.get(from);
      if (senderSocket) {
        io.to(senderSocket).emit("message_sent_confirmation", {
          message,
          from,
          to,
          fromUsername: fromUsername || "Unknown",
          timestamp: newMessage.createdAt,
          messageId: newMessage._id.toString(), // Add unique message ID
        });
      }
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("admin_message", async ({ message, from, fromUsername }) => {
    try {
      if (!from || !mongoose.Types.ObjectId.isValid(from)) {
        const warnTarget = from ? onlineUsers.get(from) : socket.id;
        if (warnTarget) {
          io.to(warnTarget).emit("message_error", {
            message: "Invalid sender.",
          });
        }
        console.warn("Skipping admin message due to invalid sender", { from });
        return;
      }

      // Find admin user ID (assuming admin role)
      const User = (await import("./models/User.js")).default;
      const adminUser = await User.findOne({ role: "admin" });

      if (adminUser) {
        // Save message to database
        const newMessage = new Message({
          from,
          to: adminUser._id,
          message,
          fromUsername: fromUsername || "User",
        });
        await newMessage.save();

        console.log(`💬 Message to admin saved: ${fromUsername}`);

        // Emit to all admin sockets
        const adminSocket = onlineUsers.get(adminUser._id.toString());
        if (adminSocket) {
          io.to(adminSocket).emit("private_message", {
            message,
            from,
            to: adminUser._id,
            fromUsername: fromUsername || "User",
            timestamp: newMessage.createdAt,
            messageId: newMessage._id.toString(), // Add unique message ID
          });
          console.log(`✅ Message sent to admin`);
        }

        // Confirm to sender
        const senderSocket = onlineUsers.get(from);
        if (senderSocket) {
          io.to(senderSocket).emit("message_sent_confirmation", {
            message,
            from,
            to: adminUser._id,
            fromUsername: fromUsername || "User",
            timestamp: newMessage.createdAt,
            messageId: newMessage._id.toString(), // Add unique message ID
          });
        }
      } else {
        console.warn("⚠️ No admin user found to receive message");
        const senderSocket = onlineUsers.get(from);
        if (senderSocket) {
          io.to(senderSocket).emit("message_error", {
            message: "لا يوجد مسؤول متاح حالياً لاستلام الرسالة",
          });
        }
      }
    } catch (error) {
      console.error("Error saving admin message:", error);
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
      adminUserId = null;
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

    // Initialize backup scheduler
    initBackupScheduler();

    const User = (await import("./models/User.js")).default;
    const bcrypt = (await import("bcryptjs")).default;

    const adminExists = await User.findOne({
      username: process.env.ADMIN_USERNAME,
    });
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
      console.log(`🚀 Server running with Socket.IO on http://:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error", err);
    process.exit(1);
  });
