import express from "express";
import OperationLog from "../models/ActivityLog.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { io } from "../server.js";

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    const logs = await OperationLog.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    const { username, section, details } = req.body;
    
    const log = new OperationLog({
      username,
      section,
      details,
    });

    const savedLog = await log.save();

    io.emit("new_operation", savedLog);

    res.status(201).json(savedLog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
