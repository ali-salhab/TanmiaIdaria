import express from "express";
import {
  getChatHistory,
  saveMessage,
  markAsRead,
  getUnreadCount,
} from "../controllers/messageController.js";
import { protect } from "../middleware/auth.js";
import { checkPermission } from "../middleware/checkPermission.js";

const router = express.Router();

// Chat permissions required for normal users (admins bypass these)
router.get(
  "/history/:otherUserId", 
  protect, 
  checkPermission("chat.view_history"), 
  getChatHistory
);
router.post(
  "/", 
  protect, 
  checkPermission("chat.send"), 
  saveMessage
);
router.put("/read/:otherUserId", protect, markAsRead);
router.get("/unread", protect, getUnreadCount);

export default router;

