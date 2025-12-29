import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root (one level up from scripts)
dotenv.config({ path: path.join(__dirname, "../.env") });

async function resetPassword() {
  console.log("Starting password reset script...");
  try {
    // Try both URI names just in case
    const uri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/Emp";
    console.log("Connecting to:", uri);
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    const users = await User.find({}, "username role");
    console.log("Existing users:");
    users.forEach((u) => console.log(`- ${u.username} (${u.role})`));

    // Target users to reset
    const targets = ["admin", "احمد كامل حمدان"];
    const hashedPassword = await bcrypt.hash("asd", 10);

    for (const username of targets) {
      console.log(`\nResetting password for user: ${username} to 'asd'`);
      const result = await User.updateOne(
        { username: username },
        { $set: { password: hashedPassword } }
      );

      if (result.matchedCount > 0) {
        console.log(`✅ Password updated for ${username}`);
      } else {
        console.log(`❌ User ${username} not found`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

resetPassword();
