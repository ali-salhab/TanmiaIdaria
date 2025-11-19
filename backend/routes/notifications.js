import express from "express";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";
import { io } from "../server.js";

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id/read", verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json({ message: "Notification deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/permissions/:userId", verifyToken, isAdmin, async (req, res) => {
  try {
    const { permissions, action } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { permissions },
      { new: true }
    ).select("-password");

    const permission = Object.keys(permissions).find(
      (key) => permissions[key]
    );

    const notification = new Notification({
      userId: req.params.userId,
      type: action === "grant" ? "permission_granted" : "permission_denied",
      title:
        action === "grant"
          ? "تم منحك صلاحية جديدة"
          : "تم سحب صلاحية منك",
      message: `تم ${action === "grant" ? "منح" : "سحب"} صلاحية ${permission}`,
      permission,
    });

    await notification.save();

    io.emit("permission_update", {
      userId: req.params.userId,
      permissions: user.permissions,
    });

    io.emit("notification", {
      userId: req.params.userId,
      message: notification.message,
      title: notification.title,
      type: notification.type,
    });

    res.json({ user, notification });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
