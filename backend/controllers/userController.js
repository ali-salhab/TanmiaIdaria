import User from "../models/User.js";
import bcrypt from "bcryptjs";

// ✅ Get all users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
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
  try {
    const { username, password, role, permissions } = req.body;
    const exists = await User.findOne({ username });
    if (exists)
      return res.status(400).json({ message: "Username already exists" });

    const user = new User({ username, password, role, permissions });
    await user.save();
    res.status(201).json({ message: "User created", user });
  } catch (err) {
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

    user.permissions = { ...user.permissions.toObject(), ...permissions };
    await user.save();
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
