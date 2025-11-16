import express from "express";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { verifyToken } from "../middleware/authMiddleware.js";
const router = express.Router();

// Register (admin only — you can disable protect for initial setup)
router.post(
  "/register",
  [body("username").notEmpty(), body("password").isLength({ min: 6 })],
  async (req, res) => {
    console.log("====================================");
    console.log("register");
    console.log("====================================");
    const errors = validationResult(req);
    console.log("====================================");
    console.log(errors);
    console.log("====================================");
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    let { username, password, role } = req.body;
    try {
      let user = await User.findOne({ username });
      if (user) return res.status(400).json({ message: "User exists" });
      user = new User({ username, password, role });
      await user.save();
      
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.TOKEN_EXPIRES_IN || "7d",
      });
      
      return res.json({
        token,
        user: { id: user._id, username: user.username, role: user.role },
        message: "User created"
      });
    } catch (err) {
      console.log("====================================");
      console.log(err.message);
      console.log("====================================");
      res.status(500).json({ message: "Server error" });
    }
  }
);
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    console.log("GET /me - User:", user);
    console.log("GET /me - Permissions:", user?.permissions);
    return res.status(200).json({ user });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

router.post("/users-info", async (req, res) => {
  try {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ message: "userIds array required" });
    }

    const users = await User.find({ _id: { $in: userIds } }).select(
      "_id username image role"
    );
    return res.json(users);
  } catch (err) {
    console.log("Error fetching users info:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user)
      return res
        .status(400)
        .json({ message: "Invalid credentials user not found" });
    const isMatch = await user.comparePassword(password);
    console.log("Password from DB:", user.password);
    console.log("Entered password:", password);
    console.log("Password match:", isMatch);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials password" });
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
