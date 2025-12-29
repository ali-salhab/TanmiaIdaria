import mongoose from "mongoose";
import Permission from "../models/Permission.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend root
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const chatPermissions = [
  {
    key: "chat.access",
    label: "الوصول للدردشة",
    category: "الدردشة",
    description: "القدرة على الوصول لوظيفة الدردشة",
  },
  {
    key: "chat.send",
    label: "إرسال رسائل",
    category: "الدردشة",
    description: "القدرة على إرسال رسائل في الدردشة",
  },
  {
    key: "chat.view_history",
    label: "عرض سجل الدردشة",
    category: "الدردشة",
    description: "القدرة على عرض سجل الرسائل السابقة",
  },
];

async function seed() {
  try {
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/Emp";
    console.log("Connecting to:", uri);
    await mongoose.connect(uri);

    for (const p of chatPermissions) {
      const exists = await Permission.findOne({ key: p.key });
      if (!exists) {
        await Permission.create(p);
        console.log(`✅ Created permission: ${p.key}`);
      } else {
        console.log(`ℹ️ Permission already exists: ${p.key}`);
      }
    }
    console.log("Done.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

seed();
