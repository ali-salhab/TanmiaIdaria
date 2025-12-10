import User from "../models/User.js";
import Employee from "../models/Employee.js";
import bcrypt from "bcryptjs";
import { io } from "../server.js";
import OperationLog from "../models/ActivityLog.js";

// ✅ Get all users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .populate("employeeId");
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
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("employeeId");
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
    const {
      username,
      password,
      role,
      employeeId,
      permissionGroups,
      directPermissions,
    } = req.body;

    // Check if employeeId is provided
    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(400).json({ message: "Employee not found" });
    }

    // Check if employee already has a user account
    const existingUser = await User.findOne({ employeeId });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "This employee already has a user account" });
    }

    const exists = await User.findOne({ username });
    if (exists)
      return res.status(400).json({ message: "Username already exists" });

    const user = new User({
      username,
      password,
      role,
      employeeId,
      permissionGroups: permissionGroups || [],
      directPermissions: directPermissions || [],
    });
    console.log(user);

    const createdUser = await user.save();
    console.log("");
    console.log(createdUser._id);

    const log = await OperationLog.create({
      userId: req.user._id,
      username: req.user.username,
      action: "create",
      section: "users",
      details: `قام ${req.user.username} بإنشاء مستخدم جديد: ${username}`,
    });
    io.emit("new_operation", log);

    // Populate employee data in response
    const userWithEmployee = await User.findById(createdUser._id)
      .populate("employeeId")
      .populate("permissionGroups")
      .populate("directPermissions");

    res.status(201).json({ message: "User created", user: userWithEmployee });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Update user info (like role)
export const updateUser = async (req, res) => {
  try {
    const { username, role, permissionGroups } = req.body;
    const updateData = { username, role };

    if (permissionGroups) {
      updateData.permissionGroups = permissionGroups;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    })
      .select("-password")
      .populate("employeeId")
      .populate("permissionGroups");

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

// ✅ Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, department, bio } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        "profile.firstName": firstName,
        "profile.lastName": lastName,
        "profile.email": email,
        "profile.phone": phone,
        "profile.department": department,
        "profile.bio": bio,
      },
      { new: true }
    )
      .select("-password")
      .populate("employeeId");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Upload profile avatar
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { "profile.avatar": `/uploads/${req.file.filename}` },
      { new: true }
    )
      .select("-password")
      .populate("employeeId");
    res.json({ message: "Avatar uploaded successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Upload document
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const { name } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.profile.documents) user.profile.documents = [];
    user.profile.documents.push({
      name: name || req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      uploadedAt: new Date(),
    });

    await user.save();
    // Populate employee data in response
    const userWithEmployee = await User.findById(user._id)
      .select("-password")
      .populate("employeeId");
    res.json({
      message: "Document uploaded successfully",
      user: userWithEmployee,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Upload salary info image
export const uploadSalaryImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        "profile.salaryInfo.image": `/uploads/${req.file.filename}`,
        "profile.salaryInfo.uploadedAt": new Date(),
      },
      { new: true }
    )
      .select("-password")
      .populate("employeeId");
    res.json({ message: "Salary image uploaded successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Upload employee list image
export const uploadEmployeeListImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        "profile.employeeList.image": `/uploads/${req.file.filename}`,
        "profile.employeeList.uploadedAt": new Date(),
      },
      { new: true }
    )
      .select("-password")
      .populate("employeeId");
    res.json({ message: "Employee list image uploaded successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Delete document
export const deleteDocument = async (req, res) => {
  try {
    const { documentIndex } = req.params;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (
      user.profile.documents &&
      documentIndex < user.profile.documents.length
    ) {
      user.profile.documents.splice(documentIndex, 1);
      await user.save();
    }

    // Populate employee data in response
    const userWithEmployee = await User.findById(user._id)
      .select("-password")
      .populate("employeeId");
    res.json({
      message: "Document deleted successfully",
      user: userWithEmployee,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Search employees for user creation
export const searchEmployees = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Search for employees by name or national ID
    const employees = await Employee.find({
      $or: [
        { fullName: new RegExp(q, "i") },
        { nationalId: new RegExp(q, "i") },
        { phone: new RegExp(q, "i") },
      ],
    }).limit(20); // Limit to 20 results

    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
