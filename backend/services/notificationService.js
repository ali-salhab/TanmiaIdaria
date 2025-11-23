import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { io } from "../server.js";

/**
 * Create a notification for admin when a normal user performs an action
 */
export const notifyAdmin = async ({
  actionBy,
  section,
  action,
  title,
  message,
  employeeName = null,
  department = null,
}) => {
  try {
    // Find all admin users
    const admins = await User.find({ role: "admin" }).select("_id");

    if (admins.length === 0) {
      console.log("No admin users found");
      return;
    }

    // Get action user info
    const actionUser = await User.findById(actionBy).select("username profile");
    const actionByUsername = actionUser?.username || "مستخدم";

    // Create notifications for all admins
    const notifications = await Promise.all(
      admins.map((admin) =>
        Notification.create({
          userId: admin._id,
          actionBy: actionBy,
          actionByUsername: actionByUsername,
          type: "user_action",
          title: title || `إجراء جديد في ${section}`,
          message: message || `${actionByUsername} قام بـ ${action} في ${section}`,
          section: section,
          action: action,
          employeeName: employeeName,
          department: department || actionUser?.profile?.department || null,
          isAdminNotification: true,
          read: false,
        })
      )
    );

    // Emit socket event to notify admins
    notifications.forEach((notification) => {
      io.emit("admin_notification", {
        _id: notification._id,
        title: notification.title,
        message: notification.message,
        section: notification.section,
        action: notification.action,
        employeeName: notification.employeeName,
        department: notification.department,
        actionByUsername: notification.actionByUsername,
        createdAt: notification.createdAt,
        read: notification.read,
      });
    });

    console.log(`✅ Created ${notifications.length} admin notifications for ${section}/${action}`);
    return notifications;
  } catch (error) {
    console.error("Error creating admin notification:", error);
    throw error;
  }
};

/**
 * Create a regular notification for a user
 */
export const notifyUser = async ({
  userId,
  type = "system",
  title,
  message,
  permission = null,
}) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      permission,
      read: false,
    });

    io.emit("notification", {
      _id: notification._id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      createdAt: notification.createdAt,
    });

    return notification;
  } catch (error) {
    console.error("Error creating user notification:", error);
    throw error;
  }
};

