import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // For admin notifications - who performed the action
    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    actionByUsername: String,
    type: {
      type: String,
      enum: [
        "permission_granted",
        "permission_denied",
        "system",
        "employee_created",
        "employee_updated",
        "employee_deleted",
        "incident_created",
        "incident_updated",
        "vacation_created",
        "vacation_updated",
        "document_uploaded",
        "document_deleted",
        "circular_created",
        "circular_updated",
        "user_action",
      ],
      default: "system",
    },
    title: String,
    message: String,
    permission: String,
    // Additional fields for filtering
    section: String, // employees, incidents, vacations, etc.
    action: String, // create, update, delete, etc.
    employeeName: String,
    department: String,
    read: {
      type: Boolean,
      default: false,
    },
    // For admin notifications
    isAdminNotification: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
