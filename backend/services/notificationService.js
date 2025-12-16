import Notification from "../models/Notification.js";
import User from "../models/User.js";

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
  io,
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

    // Enhanced title and message with more context
    const enhancedTitle =
      title ||
      (() => {
        const actionLabels = {
          create: "إنشاء جديد",
          update: "تحديث بيانات",
          edit: "تعديل بيانات",
          delete: "حذف بيانات",
        };

        const sectionLabels = {
          employees: "موظف",
          incidents: "حادث",
          vacations: "إجازة",
          documents: "وثيقة",
          circulars: "تعميم",
          users: "مستخدم",
        };

        const actionLabel = actionLabels[action] || action;
        const sectionLabel = sectionLabels[section] || section;

        return `${actionLabel} ${sectionLabel}`;
      })();

    const enhancedMessage =
      message ||
      (() => {
        const actionLabels = {
          create: "قام بإنشاء",
          update: "قام بتحديث",
          edit: "قام بتعديل",
          delete: "قام بحذف",
        };

        const sectionLabels = {
          employees: "بيانات موظف",
          incidents: "بيانات حادث",
          vacations: "بيانات إجازة",
          documents: "وثيقة",
          circulars: "تعميم",
          users: "حساب مستخدم",
        };

        const actionLabel = actionLabels[action] || `قام بـ ${action}`;
        const sectionLabel = sectionLabels[section] || section;

        let msg = `${actionByUsername} ${actionLabel} ${sectionLabel}`;
        if (employeeName) {
          msg += ` للموظف: ${employeeName}`;
        }

        return msg;
      })();

    // Create notifications for all admins
    const notifications = await Promise.all(
      admins.map((admin) =>
        Notification.create({
          userId: admin._id,
          actionBy: actionBy,
          actionByUsername: actionByUsername,
          type: "user_action",
          title: enhancedTitle,
          message: enhancedMessage,
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
    if (io) {
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
          actionBy: notification.actionBy,
          createdAt: notification.createdAt,
          read: notification.read,
        });
      });
    } else {
      console.warn("Socket.IO instance not provided to notifyAdmin");
    }

    console.log(
      `✅ Created ${notifications.length} admin notifications for ${section}/${action}`
    );
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
  io,
}) => {
  try {
    // Enhanced title and message with emojis and better formatting
    const enhancedTitle =
      title ||
      (() => {
        const typeLabels = {
          system: "🔔 إشعار نظام",
          success: "✅ نجاح العملية",
          warning: "⚠️ تحذير",
          error: "❌ خطأ",
          info: "ℹ️ معلومات",
        };
        return typeLabels[type] || "🔔 إشعار";
      })();

    const enhancedMessage = message || "تم تنفيذ العملية بنجاح";

    const notification = await Notification.create({
      userId,
      type,
      title: enhancedTitle,
      message: enhancedMessage,
      permission,
      read: false,
    });

    if (io) {
      io.emit("notification", {
        _id: notification._id,
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        createdAt: notification.createdAt,
      });
    } else {
      console.warn("Socket.IO instance not provided to notifyUser");
    }

    return notification;
  } catch (error) {
    console.error("Error creating user notification:", error);
    throw error;
  }
};
