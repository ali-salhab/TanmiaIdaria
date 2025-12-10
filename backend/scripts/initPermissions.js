import mongoose from "mongoose";
import dotenv from "dotenv";
import Permission from "../models/Permission.js";

dotenv.config();

const permissions = [
  // الموظفين
  {
    key: "employees.view",
    label: "عرض الموظفين",
    category: "الموظفين",
    description: "القدرة على عرض قائمة الموظفين وتفاصيلهم",
  },
  {
    key: "employees.edit",
    label: "تعديل الموظفين",
    category: "الموظفين",
    description: "القدرة على تعديل بيانات الموظفين",
  },
  {
    key: "employees.delete",
    label: "حذف الموظفين",
    category: "الموظفين",
    description: "القدرة على حذف سجلات الموظفين",
  },
  {
    key: "employees.create",
    label: "إنشاء موظفين",
    category: "الموظفين",
    description: "القدرة على إضافة موظفين جدد",
  },

  // الوقوعات
  {
    key: "incidents.view",
    label: "عرض الوقوعات",
    category: "الوقوعات",
    description: "القدرة على عرض قائمة الوقوعات والتقارير",
  },
  {
    key: "incidents.edit",
    label: "تعديل الوقوعات",
    category: "الوقوعات",
    description: "القدرة على تعديل تفاصيل الوقوعات",
  },
  {
    key: "incidents.delete",
    label: "حذف الوقوعات",
    category: "الوقوعات",
    description: "القدرة على حذف سجلات الوقوعات",
  },
  {
    key: "incidents.create",
    label: "إنشاء حوادث",
    category: "الوقوعات",
    description: "القدرة على تسجيل حوادث جديدة",
  },

  // الإجازات
  {
    key: "vacations.view",
    label: "عرض الإجازات",
    category: "الإجازات",
    description: "القدرة على عرض طلبات الإجازات",
  },
  {
    key: "vacations.edit",
    label: "تعديل الإجازات",
    category: "الإجازات",
    description: "القدرة على تعديل طلبات الإجازات",
  },
  {
    key: "vacations.delete",
    label: "حذف الإجازات",
    category: "الإجازات",
    description: "القدرة على حذف طلبات الإجازات",
  },
  {
    key: "vacations.create",
    label: "إنشاء إجازات",
    category: "الإجازات",
    description: "القدرة على إنشاء طلبات إجازات جديدة",
  },
  {
    key: "vacations.approve",
    label: "اعتماد الإجازات",
    category: "الإجازات",
    description: "القدرة على اعتماد أو رفض طلبات الإجازات",
  },

  // المكافآت
  {
    key: "rewards.view",
    label: "عرض المكافآت",
    category: "المكافآت",
    description: "القدرة على عرض المكافآت",
  },
  {
    key: "rewards.create",
    label: "إضافة مكافآت",
    category: "المكافآت",
    description: "القدرة على إضافة مكافآت جديدة",
  },
  {
    key: "rewards.delete",
    label: "حذف المكافآت",
    category: "المكافآت",
    description: "القدرة على حذف المكافآت",
  },

  // العقوبات
  {
    key: "penalties.view",
    label: "عرض العقوبات",
    category: "العقوبات",
    description: "القدرة على عرض العقوبات",
  },
  {
    key: "penalties.create",
    label: "إضافة عقوبات",
    category: "العقوبات",
    description: "القدرة على إضافة عقوبات جديدة",
  },
  {
    key: "penalties.edit",
    label: "تعديل العقوبات",
    category: "العقوبات",
    description: "القدرة على تعديل العقوبات",
  },
  {
    key: "penalties.delete",
    label: "حذف العقوبات",
    category: "العقوبات",
    description: "القدرة على حذف العقوبات",
  },

  // الدورات التدريبية
  {
    key: "courses.view",
    label: "عرض الدورات",
    category: "الدورات",
    description: "القدرة على عرض الدورات التدريبية",
  },
  {
    key: "courses.create",
    label: "إضافة دورات",
    category: "الدورات",
    description: "القدرة على إضافة دورات تدريبية جديدة",
  },
  {
    key: "courses.delete",
    label: "حذف الدورات",
    category: "الدورات",
    description: "القدرة على حذف الدورات التدريبية",
  },

  // المستخدمين
  {
    key: "users.view",
    label: "عرض المستخدمين",
    category: "المستخدمين",
    description: "القدرة على عرض قائمة المستخدمين",
  },
  {
    key: "users.edit",
    label: "تعديل المستخدمين",
    category: "المستخدمين",
    description: "القدرة على تعديل بيانات المستخدمين",
  },
  {
    key: "users.delete",
    label: "حذف المستخدمين",
    category: "المستخدمين",
    description: "القدرة على حذف حسابات المستخدمين",
  },
  {
    key: "users.create",
    label: "إنشاء مستخدمين",
    category: "المستخدمين",
    description: "القدرة على إنشاء حسابات مستخدمين جديدة",
  },

  // الوثائق
  {
    key: "documents.view",
    label: "عرض الوثائق",
    category: "الوثائق",
    description: "القدرة على عرض الوثائق والملفات",
  },
  {
    key: "documents.edit",
    label: "تعديل الوثائق",
    category: "الوثائق",
    description: "القدرة على تعديل الوثائق",
  },
  {
    key: "documents.delete",
    label: "حذف الوثائق",
    category: "الوثائق",
    description: "القدرة على حذف الوثائق والملفات",
  },
  {
    key: "documents.upload",
    label: "رفع الوثائق",
    category: "الوثائق",
    description: "القدرة على رفع ملفات ووثائق جديدة",
  },

  // المكافات
  {
    key: "rewards.view",
    label: "عرض المكافات",
    category: "المكافات",
    description: "القدرة على عرض المكافات والمكافآت",
  },
  {
    key: "rewards.edit",
    label: "تعديل المكافات",
    category: "المكافات",
    description: "القدرة على تعديل المكافات والمكافآت",
  },
  {
    key: "rewards.delete",
    label: "إنشاء حوافز",
    category: "المكافات",
    description: "القدرة على إنشاء حوافز ومكافآت جديدة",
  },
  {
    key: "rewards.create",
    label: "إنشاء حوافز",
    category: "المكافات",
    description: "القدرة على إنشاء حوافز ومكافآت جديدة",
  },

  // العقوبات
  {
    key: "punishments.view",
    label: "عرض العقوبات",
    category: "العقوبات",
    description: "القدرة على عرض العقوبات والعقوبات",
  },
  {
    key: "punishments.edit",
    label: "تعديل العقوبات",
    category: "العقوبات",
    description: "القدرة على تعديل العقوبات والعقوبات",
  },
  {
    key: "punishments.create",
    label: "إنشاء جزاءات",
    category: "العقوبات",
    description: "القدرة على إنشاء جزاءات وعقوبات جديدة",
  },
  {
    key: "punishments.delet",
    label: "إنشاء جزاءات",
    category: "العقوبات",
    description: "القدرة على إنشاء جزاءات وعقوبات جديدة",
  },

  // التعاميم
  {
    key: "circulars.view",
    label: "عرض التعاميم",
    category: "التعاميم",
    description: "القدرة على عرض التعاميم الإدارية",
  },
  {
    key: "circulars.delete",
    label: "عرض التعاميم",
    category: "التعاميم",
    description: "القدرة على عرض التعاميم الإدارية",
  },
  {
    key: "circulars.edit",
    label: "تعديل التعاميم",
    category: "التعاميم",
    description: "القدرة على تعديل التعاميم",
  },
  {
    key: "circulars.create",
    label: "إنشاء تعاميم",
    category: "التعاميم",
    description: "القدرة على إنشاء تعاميم جديدة",
  },
  {
    key: "circulars.publish",
    label: "نشر التعاميم",
    category: "التعاميم",
    description: "القدرة على نشر التعاميم للمستخدمين",
  },

  // الدردشة
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

async function initPermissions() {
  console.log("Starting initPermissions...");
  try {
    await mongoose.connect("mongodb://localhost:27017/Emp", {
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

// how to run this file from terminal ?
//
//    node backend/scripts/initPermissions.js
//

initPermissions();
