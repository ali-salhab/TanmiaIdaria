import express from "express";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
const router = express.Router();

// Register (admin only — you can disable protect for initial setup)
router.post(
  "/register",
  [body("username").notEmpty(), body("password").isLength({ min: 6 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    let { username, password, role } = req.body;
    try {
      let user = await User.findOne({ username });
      if (user) return res.status(400).json({ message: "User exists" });
      // password = await bcrypt.hash(password, 10);
      user = new User({ username, password, role });
      await user.save();
      res.json({ message: "User created" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.TOKEN_EXPIRES_IN || "7d",
    });
    res.json({
      token,
      user: { id: user._id, username: user.username, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
