import mongoose from "mongoose";
import dotenv from "dotenv";
import Permission from "../models/Permission.js";

dotenv.config();

const permissions = [
  { key: "viewEmployees", label: "عرض الموظفين", category: "view" },
  {
    key: "createEmployee",
    label: "إضافة موظف",
    category: "create",
  },
  {
    key: "editEmployee",
    label: "تعديل بيانات الموظف",
    category: "edit",
  },
  {
    key: "deleteEmployee",
    label: "حذف موظف",
    category: "delete",
  },
  {
    key: "viewIncidents",
    label: "عرض الحوادث",
    category: "view",
  },
  {
    key: "createIncident",
    label: "إضافة حادثة",
    category: "create",
  },
  {
    key: "deleteIncident",
    label: "حذف حادثة",
    category: "delete",
  },
  {
    key: "viewDocuments",
    label: "عرض الوثائق",
    category: "view",
  },
  {
    key: "viewSalary",
    label: "عرض الرواتب",
    category: "view",
  },
  {
    key: "viewReports",
    label: "عرض التقارير",
    category: "view",
  },
  {
    key: "viewAnalytics",
    label: "عرض التحليلات",
    category: "view",
  },
  {
    key: "manageLeaves",
    label: "إدارة الإجازات",
    category: "manage",
  },
  {
    key: "createVacation",
    label: "طلب إجازة",
    category: "create",
  },
  {
    key: "approveVacation",
    label: "الموافقة على الإجازات",
    category: "manage",
  },
  {
    key: "manageRewards",
    label: "إدارة المكافآت",
    category: "manage",
  },
  {
    key: "managePunishments",
    label: "إدارة الجزاءات",
    category: "manage",
  },
  {
    key: "manageDywan",
    label: "إدارة الديوان",
    category: "manage",
  },
  {
    key: "viewUsers",
    label: "عرض المستخدمين",
    category: "view",
  },
  {
    key: "createUser",
    label: "إضافة مستخدم",
    category: "create",
  },
  {
    key: "deleteUser",
    label: "حذف مستخدم",
    category: "delete",
  },
  {
    key: "managePermissions",
    label: "إدارة الصلاحيات",
    category: "admin",
  },
];

async function initPermissions() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("🔄 Initializing permissions...");

    for (const perm of permissions) {
      const exists = await Permission.findOne({ key: perm.key });
      if (!exists) {
        await Permission.create(perm);
        console.log(`✅ Created permission: ${perm.key}`);
      } else {
        console.log(`ℹ️  Permission already exists: ${perm.key}`);
      }
    }

    console.log("✅ All permissions initialized successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error initializing permissions:", error);
    process.exit(1);
  }
}

initPermissions();
