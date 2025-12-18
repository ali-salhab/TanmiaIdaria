import mongoose from "mongoose";
import Permission from "../models/Permission.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, "../.env") });

/**
 * Modern Permission System Seeder
 * Generates all possible permissions for the entire system
 */

const permissionsConfig = [
  // ============ EMPLOYEES MODULE ============
  {
    category: "employees",
    label: "إدارة الموظفين",
    permissions: [
      {
        key: "employees.view",
        label: "عرض الموظفين",
        description: "عرض قائمة وتفاصيل الموظفين",
      },
      {
        key: "employees.create",
        label: "إضافة موظف",
        description: "إضافة موظف جديد",
      },
      {
        key: "employees.edit",
        label: "تعديل موظف",
        description: "تعديل بيانات الموظف",
      },
      {
        key: "employees.delete",
        label: "حذف موظف",
        description: "حذف موظف من النظام",
      },
      {
        key: "employees.export",
        label: "تصدير الموظفين",
        description: "تصدير بيانات الموظفين إلى Excel",
      },
      {
        key: "employees.import",
        label: "استيراد الموظفين",
        description: "استيراد الموظفين من ملف Excel",
      },
      {
        key: "employees.upload_docs",
        label: "رفع مستندات",
        description: "رفع مستندات الموظف",
      },
      {
        key: "employees.update_photo",
        label: "تحديث صورة الموظف",
        description: "تحديث الصورة الشخصية للموظف",
      },
      {
        key: "employees.view_personal_card",
        label: "عرض البطاقة الشخصية",
        description: "عرض وإنشاء البطاقة الشخصية",
      },
    ],
  },

  // ============ INCIDENTS MODULE ============
  {
    category: "incidents",
    label: "إدارة الحوادث",
    permissions: [
      {
        key: "incidents.view",
        label: "عرض الحوادث",
        description: "عرض قائمة الحوادث والمخالفات",
      },
      {
        key: "incidents.create",
        label: "إضافة حادث",
        description: "إضافة حادث أو مخالفة جديدة",
      },
      {
        key: "incidents.edit",
        label: "تعديل حادث",
        description: "تعديل تفاصيل الحادث",
      },
      {
        key: "incidents.delete",
        label: "حذف حادث",
        description: "حذف حادث من النظام",
      },
      {
        key: "incidents.view_rewards",
        label: "عرض المكافآت",
        description: "عرض مكافآت الموظفين",
      },
      {
        key: "incidents.view_penalties",
        label: "عرض العقوبات",
        description: "عرض عقوبات الموظفين",
      },
      {
        key: "incidents.generate_cv",
        label: "إنشاء السيرة الذاتية",
        description: "إنشاء السيرة الذاتية للموظف",
      },
    ],
  },

  // ============ VACATIONS MODULE ============
  {
    category: "vacations",
    label: "إدارة الإجازات",
    permissions: [
      {
        key: "vacations.view",
        label: "عرض الإجازات",
        description: "عرض قائمة الإجازات",
      },
      {
        key: "vacations.create",
        label: "إضافة إجازة",
        description: "إضافة إجازة جديدة",
      },
      {
        key: "vacations.edit",
        label: "تعديل إجازة",
        description: "تعديل تفاصيل الإجازة",
      },
      {
        key: "vacations.delete",
        label: "حذف إجازة",
        description: "حذف إجازة من النظام",
      },
      {
        key: "vacations.export",
        label: "تصدير الإجازات",
        description: "تصدير الإجازات إلى Word",
      },
      {
        key: "vacations.generate_template",
        label: "إنشاء نموذج الإجازة",
        description: "إنشاء نموذج إجازة واحدة",
      },
    ],
  },

  // ============ CIRCULARS MODULE ============
  {
    category: "circulars",
    label: "إدارة المنشورات",
    permissions: [
      {
        key: "circulars.view",
        label: "عرض المنشورات",
        description: "عرض قائمة المنشورات والتعاميم",
      },
      {
        key: "circulars.create",
        label: "إضافة منشور",
        description: "إضافة منشور أو تعميم جديد",
      },
      {
        key: "circulars.edit",
        label: "تعديل منشور",
        description: "تعديل تفاصيل المنشور",
      },
      {
        key: "circulars.delete",
        label: "حذف منشور",
        description: "حذف منشور من النظام",
      },
      {
        key: "circulars.upload_files",
        label: "رفع مرفقات",
        description: "رفع ملفات مرفقة مع المنشور",
      },
      {
        key: "circulars.download",
        label: "تحميل المرفقات",
        description: "تحميل مرفقات المنشورات",
      },
      {
        key: "circulars.view_archived",
        label: "عرض الأرشيف",
        description: "عرض المنشورات المؤرشفة",
      },
    ],
  },

  // ============ LEGAL MODULE ============
  {
    category: "legal",
    label: "الشؤون القانونية",
    permissions: [
      {
        key: "legal.view_cases",
        label: "عرض القضايا",
        description: "عرض القضايا القانونية",
      },
      {
        key: "legal.access",
        label: "الوصول للشؤون القانونية",
        description: "الوصول إلى نظام الشؤون القانونية",
      },
      {
        key: "legal.manage_cases",
        label: "إدارة القضايا",
        description: "إنشاء وتعديل وحذف القضايا",
      },
      {
        key: "legal.send_files",
        label: "إرسال ملفات",
        description: "إرسال ملفات قانونية",
      },
      {
        key: "legal.reply_text",
        label: "الرد النصي",
        description: "إضافة رد نصي على القضية",
      },
      {
        key: "legal.reply_files",
        label: "الرد بملفات",
        description: "إضافة رد مع ملفات مرفقة",
      },
      {
        key: "legal.view_history",
        label: "عرض السجل",
        description: "عرض سجل القضايا والردود",
      },
    ],
  },

  // ============ MESSAGES/CHAT MODULE ============
  {
    category: "chat",
    label: "الرسائل والمحادثات",
    permissions: [
      {
        key: "chat.access",
        label: "الوصول للدردشة",
        description: "القدرة على الوصول لوظيفة الدردشة",
      },
      {
        key: "chat.send",
        label: "إرسال رسالة",
        description: "إرسال رسائل للمستخدمين",
      },
      {
        key: "chat.view_history",
        label: "عرض سجل المحادثات",
        description: "عرض سجل المحادثات السابقة",
      },
      { key: "chat.delete", label: "حذف رسالة", description: "حذف الرسائل" },
      {
        key: "chat.access_all",
        label: "الوصول لجميع المحادثات",
        description: "عرض جميع محادثات المستخدمين",
      },
    ],
  },

  // ============ FILE SHARING MODULE ============
  {
    category: "file_sharing",
    label: "مشاركة الملفات",
    permissions: [
      {
        key: "file_sharing.upload",
        label: "رفع ملف",
        description: "رفع ومشاركة ملفات",
      },
      {
        key: "file_sharing.view_received",
        label: "عرض الملفات المستلمة",
        description: "عرض الملفات المستلمة",
      },
      {
        key: "file_sharing.view_sent",
        label: "عرض الملفات المرسلة",
        description: "عرض الملفات التي تم إرسالها",
      },
      {
        key: "file_sharing.delete",
        label: "حذف ملف",
        description: "حذف ملف مشارك",
      },
      {
        key: "file_sharing.download",
        label: "تحميل ملف",
        description: "تحميل الملفات المشاركة",
      },
      {
        key: "file_sharing.dywan_access",
        label: "الوصول للديوان",
        description: "الوصول إلى نظام الديوان",
      },
    ],
  },

  // ============ REPORTS MODULE ============
  {
    category: "reports",
    label: "التقارير",
    permissions: [
      {
        key: "reports.view",
        label: "عرض التقارير",
        description: "عرض التقارير والإحصائيات",
      },
      {
        key: "reports.create",
        label: "إنشاء تقرير",
        description: "إنشاء تقرير جديد",
      },
      {
        key: "reports.export",
        label: "تصدير تقرير",
        description: "تصدير التقارير إلى ملفات",
      },
      {
        key: "reports.archive",
        label: "أرشفة التقرير",
        description: "حفظ التقرير في الأرشيف",
      },
      {
        key: "reports.delete",
        label: "حذف تقرير",
        description: "حذف تقرير محفوظ",
      },
      {
        key: "reports.view_archived",
        label: "عرض الأرشيف",
        description: "عرض التقارير المؤرشفة",
      },
    ],
  },

  // ============ USERS MODULE ============
  {
    category: "users",
    label: "إدارة المستخدمين",
    permissions: [
      {
        key: "users.view",
        label: "عرض المستخدمين",
        description: "عرض قائمة المستخدمين",
      },
      {
        key: "users.create",
        label: "إضافة مستخدم",
        description: "إضافة مستخدم جديد",
      },
      {
        key: "users.edit",
        label: "تعديل مستخدم",
        description: "تعديل بيانات المستخدم",
      },
      {
        key: "users.delete",
        label: "حذف مستخدم",
        description: "حذف مستخدم من النظام",
      },
      {
        key: "users.manage_permissions",
        label: "إدارة الصلاحيات",
        description: "تعديل صلاحيات المستخدمين",
      },
      {
        key: "users.manage_groups",
        label: "إدارة المجموعات",
        description: "إضافة/إزالة مستخدمين من المجموعات",
      },
      {
        key: "users.view_activity",
        label: "عرض النشاط",
        description: "عرض سجل نشاط المستخدمين",
      },
      {
        key: "users.reset_password",
        label: "إعادة تعيين كلمة المرور",
        description: "إعادة تعيين كلمة مرور المستخدم",
      },
    ],
  },

  // ============ PERMISSIONS MODULE ============
  {
    category: "permissions",
    label: "إدارة الصلاحيات",
    permissions: [
      {
        key: "permissions.view",
        label: "عرض الصلاحيات",
        description: "عرض قائمة الصلاحيات",
      },
      {
        key: "permissions.create",
        label: "إضافة صلاحية",
        description: "إضافة صلاحية جديدة",
      },
      {
        key: "permissions.edit",
        label: "تعديل صلاحية",
        description: "تعديل تفاصيل الصلاحية",
      },
      {
        key: "permissions.delete",
        label: "حذف صلاحية",
        description: "حذف صلاحية من النظام",
      },
      {
        key: "permissions.manage_groups",
        label: "إدارة مجموعات الصلاحيات",
        description: "إنشاء وتعديل مجموعات الصلاحيات",
      },
      {
        key: "permissions.assign",
        label: "تعيين الصلاحيات",
        description: "تعيين صلاحيات للمستخدمين",
      },
    ],
  },

  // ============ SETTINGS MODULE ============
  {
    category: "settings",
    label: "الإعدادات",
    permissions: [
      {
        key: "settings.view",
        label: "عرض الإعدادات",
        description: "عرض إعدادات النظام",
      },
      {
        key: "settings.edit_general",
        label: "تعديل الإعدادات العامة",
        description: "تعديل الإعدادات العامة للنظام",
      },
      {
        key: "settings.edit_homepage",
        label: "تعديل الصفحة الرئيسية",
        description: "تعديل محتوى الصفحة الرئيسية",
      },
      {
        key: "settings.manage_dropdowns",
        label: "إدارة القوائم المنسدلة",
        description: "إدارة خيارات القوائم المنسدلة",
      },
      {
        key: "settings.backup",
        label: "النسخ الاحتياطي",
        description: "إنشاء واستعادة النسخ الاحتياطية",
      },
      {
        key: "settings.logs",
        label: "عرض السجلات",
        description: "عرض سجلات النظام",
      },
    ],
  },

  // ============ NOTIFICATIONS MODULE ============
  {
    category: "notifications",
    label: "الإشعارات",
    permissions: [
      {
        key: "notifications.view",
        label: "عرض الإشعارات",
        description: "عرض الإشعارات الخاصة",
      },
      {
        key: "notifications.send",
        label: "إرسال إشعار",
        description: "إرسال إشعارات للمستخدمين",
      },
      {
        key: "notifications.delete",
        label: "حذف إشعار",
        description: "حذف إشعارات",
      },
      {
        key: "notifications.mark_read",
        label: "تعليم كمقروء",
        description: "تعليم الإشعارات كمقروءة",
      },
      {
        key: "notifications.view_all",
        label: "عرض جميع الإشعارات",
        description: "عرض إشعارات جميع المستخدمين",
      },
    ],
  },

  // ============ VIEWER MODULE (Special Role) ============
  {
    category: "viewer",
    label: "صلاحيات المشاهد",
    permissions: [
      {
        key: "viewer.view_documents",
        label: "عرض المستندات",
        description: "عرض المستندات الشخصية (صورة الراتب وقائمة الموظفين)",
      },
      {
        key: "viewer.view_salary",
        label: "عرض الراتب",
        description: "عرض صورة الراتب",
      },
      {
        key: "viewer.view_employee_list",
        label: "عرض قائمة الموظفين",
        description: "عرض قائمة الموظفين",
      },
    ],
  },

  // ============ DASHBOARD MODULE ============
  {
    category: "dashboard",
    label: "لوحة التحكم",
    permissions: [
      {
        key: "dashboard.view",
        label: "عرض لوحة التحكم",
        description: "الوصول إلى لوحة التحكم الرئيسية",
      },
      {
        key: "dashboard.view_statistics",
        label: "عرض الإحصائيات",
        description: "عرض إحصائيات النظام",
      },
      {
        key: "dashboard.view_charts",
        label: "عرض الرسوم البيانية",
        description: "عرض المخططات والرسوم البيانية",
      },
      {
        key: "dashboard.export",
        label: "تصدير البيانات",
        description: "تصدير بيانات لوحة التحكم",
      },
    ],
  },

  // ============ ARCHIVE MODULE ============
  {
    category: "archive",
    label: "الأرشيف",
    permissions: [
      {
        key: "archive.view",
        label: "عرض الأرشيف",
        description: "الوصول إلى نظام الأرشيف",
      },
      {
        key: "archive.create",
        label: "إضافة للأرشيف",
        description: "إضافة ملفات للأرشيف",
      },
      {
        key: "archive.edit",
        label: "تعديل الأرشيف",
        description: "تعديل ملفات الأرشيف",
      },
      {
        key: "archive.delete",
        label: "حذف من الأرشيف",
        description: "حذف ملفات من الأرشيف",
      },
    ],
  },

  // ============ DYWAN MODULE ============
  {
    category: "dywan",
    label: "الديوان",
    permissions: [
      {
        key: "dywan.view",
        label: "عرض الديوان",
        description: "الوصول إلى صفحة الديوان",
      },
      {
        key: "dywan.create",
        label: "إضافة مستند",
        description: "إضافة مستند جديد في الديوان",
      },
      {
        key: "dywan.edit",
        label: "تعديل مستند",
        description: "تعديل مستند في الديوان",
      },
      {
        key: "dywan.delete",
        label: "حذف مستند",
        description: "حذف مستند من الديوان",
      },
      {
        key: "dywan.export",
        label: "تصدير/تحميل",
        description: "تحميل المستندات من الديوان",
      },
    ],
  },

  // ============ FILE SHARING MODULE ============
  {
    category: "file_sharing",
    label: "مشاركة الملفات",
    permissions: [
      {
        key: "file_sharing.view_received",
        label: "عرض الوارد",
        description: "عرض الملفات الواردة",
      },
      {
        key: "file_sharing.view_sent",
        label: "عرض الصادر",
        description: "عرض الملفات الصادرة",
      },
      {
        key: "file_sharing.upload",
        label: "مشاركة ملف",
        description: "إرسال/مشاركة ملف جديد",
      },
      {
        key: "file_sharing.delete",
        label: "حذف مشاركة",
        description: "حذف ملف مشارك",
      },
      {
        key: "file_sharing.download",
        label: "تحميل ملف",
        description: "تحميل الملفات المشاركة",
      },
      {
        key: "file_sharing.dywan_access",
        label: "وصول الديوان",
        description: "صلاحية الظهور في قائمة مستلمي الديوان",
      },
    ],
  },

  // ============ ARCHIVE MODULE ============
  {
    category: "archive",
    label: "الأرشيف",
    permissions: [
      {
        key: "archive.view",
        label: "عرض الأرشيف",
        description: "عرض الملفات المؤرشفة",
      },
      {
        key: "archive.add",
        label: "إضافة للأرشيف",
        description: "أرشفة ملفات ومستندات",
      },
      {
        key: "archive.restore",
        label: "استعادة من الأرشيف",
        description: "استعادة ملفات من الأرشيف",
      },
      {
        key: "archive.delete",
        label: "حذف من الأرشيف",
        description: "حذف ملفات من الأرشيف نهائياً",
      },
    ],
  },
];

const seedPermissions = async () => {
  try {
    const uri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/Emp";
    console.log("Connecting to:", uri);
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    // Clear existing permissions
    await Permission.deleteMany({});
    console.log("🗑️  Cleared existing permissions");

    const allPermissions = [];

    // Generate all permissions
    for (const module of permissionsConfig) {
      for (const perm of module.permissions) {
        allPermissions.push({
          key: perm.key,
          label: perm.label,
          description: perm.description,
          category: module.category,
        });
      }
    }

    // Insert all permissions
    const result = await Permission.insertMany(allPermissions);
    console.log(`✅ Created ${result.length} permissions`);

    // Print summary by category
    console.log("\n📊 Permissions Summary by Category:");
    console.log("═".repeat(60));

    const summary = {};
    permissionsConfig.forEach((module) => {
      summary[module.label] = module.permissions.length;
    });

    Object.entries(summary).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} صلاحية`);
    });

    console.log("═".repeat(60));
    console.log(
      `\n🎉 Total: ${result.length} permissions created successfully!`
    );

    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error seeding permissions:", error);
    process.exit(1);
  }
};

seedPermissions();
