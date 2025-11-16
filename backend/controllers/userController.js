import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { io } from "../server.js";
import OperationLog from "../models/ActivityLog.js";

// ✅ Get all users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    console.log(users);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get single user
export const getUser = async (req, res) => {
  console.log("====================================");
  console.log("get user by id function");
  console.log("====================================");
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Create new user
export const createUser = async (req, res) => {
  console.log("====================================");
  console.log("Create User controller ");
  console.log("====================================");
  try {
    const { username, password, role, permissions } = req.body;
    const exists = await User.findOne({ username });
    if (exists)
      return res.status(400).json({ message: "Username already exists" });

    const user = new User({ username, password, role, permissions });
    console.log(user);

    const createdUser = await user.save();
    console.log("");
    console.log(createdUser._id);

    const log = await OperationLog.create({
      userId: createdUser._id,
      username: req.body.username,
      action: "update",
      section: "vacations",
      details: `قام ${req.user.name} بتعديل إجازة رقم `,
    });
    io.emit("new_operation", log);

    res.status(201).json({ message: "User created", user });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Update user info (like role)
export const updateUser = async (req, res) => {
  try {
    const { username, role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { username, role },
      { new: true }
    ).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Update permissions
export const updateUserPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const oldPermissions = user.permissions.toObject();
    user.permissions = { ...oldPermissions, ...permissions };
    await user.save();

    const changedPermissions = [];
    Object.keys(permissions).forEach((key) => {
      if (oldPermissions[key] !== permissions[key]) {
        changedPermissions.push({
          name: key,
          oldValue: oldPermissions[key],
          newValue: permissions[key],
        });
      }
    });

    const permissionUpdateEvent = {
      userId: req.params.id,
      username: user.username,
      changes: changedPermissions,
      timestamp: new Date(),
    };

    io.emit("permission_update", permissionUpdateEvent);

    const notificationEvent = {
      type: "permission_change",
      message: `تم تحديث صلاحيات المستخدم ${user.username}`,
      userId: req.params.id,
      changes: changedPermissions,
      time: new Date(),
    };

    io.emit("notification", notificationEvent);

    const userSocketId = req.onlineUsers?.get(req.params.id);
    if (userSocketId) {
      io.to(userSocketId).emit("personal_notification", notificationEvent);
    }

    res.json({ message: "Permissions updated", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Delete user
export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
