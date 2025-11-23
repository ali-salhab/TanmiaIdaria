import express from "express";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";
import { io } from "../server.js";

const router = express.Router();

// Get user's own notifications
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

// Get all admin notifications with filtering
router.get("/admin", verifyToken, isAdmin, async (req, res) => {
  try {
    const {
      employeeName,
      department,
      section,
      action,
      startDate,
      endDate,
      search,
      read,
      page = 1,
      limit = 50,
    } = req.query;

    // Build filter query
    const filter = { isAdminNotification: true };

    // Employee name filter
    if (employeeName) {
      filter.employeeName = { $regex: employeeName, $options: "i" };
    }

    // Department filter
    if (department) {
      filter.department = { $regex: department, $options: "i" };
    }

    // Section filter
    if (section) {
      filter.section = section;
    }

    // Action filter
    if (action) {
      filter.action = action;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Read status filter
    if (read !== undefined) {
      filter.read = read === "true";
    }

    // Search filter (searches in title, message, employeeName, actionByUsername)
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
        { employeeName: { $regex: search, $options: "i" } },
        { actionByUsername: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(filter)
      .populate("actionBy", "username profile")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);

    res.json({
      notifications,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark notification as read
router.put("/:id/read", verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Emit socket event
    io.emit("notification_read", { _id: notification._id });

    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark all admin notifications as read
router.put("/admin/read-all", verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { isAdminNotification: true, read: false },
      { read: true }
    );
    res.json({ message: "All notifications marked as read", count: result.modifiedCount });
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
