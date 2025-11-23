import express from "express";
import {
  getChatHistory,
  saveMessage,
  markAsRead,
  getUnreadCount,
} from "../controllers/messageController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/history/:otherUserId", protect, getChatHistory);
router.post("/", protect, saveMessage);
router.put("/read/:otherUserId", protect, markAsRead);
router.get("/unread", protect, getUnreadCount);

export default router;

