import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

async function listUsers() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/tanmia"
    );
    console.log("Connected to MongoDB");

    const users = await User.find({}, "username role");
    console.log("Users found:");
    users.forEach((u) => console.log(`- ${u.username} (${u.role})`));

    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

listUsers();
