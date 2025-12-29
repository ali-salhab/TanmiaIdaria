import mongoose from "mongoose";
import Permission from "./models/Permission.js";

async function check() {
  try {
    await mongoose.connect("mongodb://localhost:27017/Emp");
    const perm = await Permission.findOne({ key: "chat.access" });
    console.log("Permission found:", perm);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
