import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const adminExists = await User.findOne({ username: "admin" });
    if (adminExists) {
      console.log("Admin user already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);
    const adminUser = new User({
      username: "admin",
      password: hashedPassword,
      role: "admin",
      permissions: {
        viewEmployees: true,
        viewIncidents: true,
        viewUsers: true,
        viewDocuments: true,
        viewSalary: true,
        viewReports: true,
        editEmployee: true,
        manageLeaves: true,
        manageReawards: true,
        managePunischments: true,
      },
    });
    
    await adminUser.save();
    console.log("✅ Admin user created successfully");
    console.log("Username: admin");
    console.log("Password: admin123");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

createAdmin();
