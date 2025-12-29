import mongoose from "mongoose";
import Permission from "../models/Permission.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

async function listPermissions() {
  try {
    const uri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/Emp";
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    const permissions = await Permission.find({}).sort({ category: 1 });
    console.log(`Total permissions: ${permissions.length}`);

    const categories = {};
    permissions.forEach((p) => {
      if (!categories[p.category]) categories[p.category] = [];
      categories[p.category].push(p.key);
    });

    console.log("\nPermissions by Category:");
    Object.entries(categories).forEach(([cat, keys]) => {
      console.log(`\n[${cat}] (${keys.length})`);
      keys.forEach((k) => console.log(`  - ${k}`));
    });

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

listPermissions();
