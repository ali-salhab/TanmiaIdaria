import express from "express";
import dotenv from "dotenv";
import operationRoutes from "./routes/operations.js";

import mongoose from "mongoose";
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
import { log } from "console";

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
// here we solve image upload problem it take 3 hours 🙄
app.use(
  cors({
    // origin: "http://12.0.0.129:5173", // frontend port
    origin: "http://localhost:5173", // frontend port

    credentials: true,
  })
);
app.get("/test", (req, res) => {
  return res.send(
    "test--------->connecting to server done successfully 👌👌👌👌👌👌👌😏😏"
  );
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);

app.use("/api/incidents", incidentRoutes);
app.use("/api/users", users);
app.use("/api/operations", operationRoutes);

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
    origin: "*", // غيّرها حسب الدومين لاحقًا
    methods: ["GET", "POST"],
  },
});
let adminSocket = null;

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
  socket.on("disconnect", () => {
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
    server.listen(PORT, () => {
      console.log(`🚀 Server running with Socket.IO on http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error", err);
    process.exit(1);
  });
