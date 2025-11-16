import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

async function resetAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    await User.deleteOne({ username: "admin" });
    console.log("Old admin user deleted");

    const hashedPassword = await bcrypt.hash("admin123", 10);
    console.log("Password hashed:", hashedPassword);

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

resetAdmin();
