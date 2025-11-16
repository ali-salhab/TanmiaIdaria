import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

async function listUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const users = await User.find();
    console.log("Total users:", users.length);
    users.forEach((user) => {
      console.log(`- Username: ${user.username}, Role: ${user.role}, ID: ${user._id}`);
    });

    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

listUsers();
