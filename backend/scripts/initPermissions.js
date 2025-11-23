import mongoose from "mongoose";
import dotenv from "dotenv";
import Permission from "../models/Permission.js";

dotenv.config();

const permissions = [
  // الموظفين
  { key: "employees.view", label: "عرض الموظفين", category: "الموظفين", description: "القدرة على عرض قائمة الموظفين وتفاصيلهم" },
  { key: "employees.edit", label: "تعديل الموظفين", category: "الموظفين", description: "القدرة على تعديل بيانات الموظفين" },
  { key: "employees.delete", label: "حذف الموظفين", category: "الموظفين", description: "القدرة على حذف سجلات الموظفين" },
  { key: "employees.create", label: "إنشاء موظفين", category: "الموظفين", description: "القدرة على إضافة موظفين جدد" },

  // الحوادث
  { key: "incidents.view", label: "عرض الحوادث", category: "الحوادث", description: "القدرة على عرض قائمة الحوادث والتقارير" },
  { key: "incidents.edit", label: "تعديل الحوادث", category: "الحوادث", description: "القدرة على تعديل تفاصيل الحوادث" },
  { key: "incidents.delete", label: "حذف الحوادث", category: "الحوادث", description: "القدرة على حذف سجلات الحوادث" },
  { key: "incidents.create", label: "إنشاء حوادث", category: "الحوادث", description: "القدرة على تسجيل حوادث جديدة" },

  // الإجازات
  { key: "vacations.view", label: "عرض الإجازات", category: "الإجازات", description: "القدرة على عرض طلبات الإجازات" },
  { key: "vacations.edit", label: "تعديل الإجازات", category: "الإجازات", description: "القدرة على تعديل طلبات الإجازات" },
  { key: "vacations.delete", label: "حذف الإجازات", category: "الإجازات", description: "القدرة على حذف طلبات الإجازات" },
  { key: "vacations.create", label: "إنشاء إجازات", category: "الإجازات", description: "القدرة على إنشاء طلبات إجازات جديدة" },
  { key: "vacations.approve", label: "اعتماد الإجازات", category: "الإجازات", description: "القدرة على اعتماد أو رفض طلبات الإجازات" },

  // المستخدمين
  { key: "users.view", label: "عرض المستخدمين", category: "المستخدمين", description: "القدرة على عرض قائمة المستخدمين" },
  { key: "users.edit", label: "تعديل المستخدمين", category: "المستخدمين", description: "القدرة على تعديل بيانات المستخدمين" },
  { key: "users.delete", label: "حذف المستخدمين", category: "المستخدمين", description: "القدرة على حذف حسابات المستخدمين" },
  { key: "users.create", label: "إنشاء مستخدمين", category: "المستخدمين", description: "القدرة على إنشاء حسابات مستخدمين جديدة" },

  // الوثائق
  { key: "documents.view", label: "عرض الوثائق", category: "الوثائق", description: "القدرة على عرض الوثائق والملفات" },
  { key: "documents.edit", label: "تعديل الوثائق", category: "الوثائق", description: "القدرة على تعديل الوثائق" },
  { key: "documents.delete", label: "حذف الوثائق", category: "الوثائق", description: "القدرة على حذف الوثائق والملفات" },
  { key: "documents.upload", label: "رفع الوثائق", category: "الوثائق", description: "القدرة على رفع ملفات ووثائق جديدة" },

  // الرواتب
  { key: "salary.view", label: "عرض الرواتب", category: "الرواتب", description: "القدرة على عرض بيانات الرواتب" },
  { key: "salary.edit", label: "تعديل الرواتب", category: "الرواتب", description: "القدرة على تعديل بيانات الرواتب" },

  // الحوافز
  { key: "rewards.view", label: "عرض الحوافز", category: "الحوافز", description: "القدرة على عرض الحوافز والمكافآت" },
  { key: "rewards.edit", label: "تعديل الحوافز", category: "الحوافز", description: "القدرة على تعديل الحوافز والمكافآت" },
  { key: "rewards.create", label: "إنشاء حوافز", category: "الحوافز", description: "القدرة على إنشاء حوافز ومكافآت جديدة" },

  // الجزاءات
  { key: "punishments.view", label: "عرض الجزاءات", category: "الجزاءات", description: "القدرة على عرض الجزاءات والعقوبات" },
  { key: "punishments.edit", label: "تعديل الجزاءات", category: "الجزاءات", description: "القدرة على تعديل الجزاءات والعقوبات" },
  { key: "punishments.create", label: "إنشاء جزاءات", category: "الجزاءات", description: "القدرة على إنشاء جزاءات وعقوبات جديدة" },

  // التعاميم
  { key: "circulars.view", label: "عرض التعاميم", category: "التعاميم", description: "القدرة على عرض التعاميم الإدارية" },
  { key: "circulars.edit", label: "تعديل التعاميم", category: "التعاميم", description: "القدرة على تعديل التعاميم" },
  { key: "circulars.create", label: "إنشاء تعاميم", category: "التعاميم", description: "القدرة على إنشاء تعاميم جديدة" },
  { key: "circulars.publish", label: "نشر التعاميم", category: "التعاميم", description: "القدرة على نشر التعاميم للمستخدمين" },
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
