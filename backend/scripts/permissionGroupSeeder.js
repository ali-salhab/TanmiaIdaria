import mongoose from "mongoose";
import Permission from "../models/Permission.js";
import PermissionGroup from "../models/PermissionGroup.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Modern Permission Groups Seeder
 * Creates predefined permission groups with appropriate permissions
 */

const permissionGroupsConfig = [
  {
    name: "HR Manager",
    nameAr: "مدير الموارد البشرية",
    description: "صلاحيات كاملة لإدارة الموظفين والإجازات والحوادث",
    permissionKeys: [
      // Employees - Full access
      "employees.view",
      "employees.create",
      "employees.edit",
      "employees.delete",
      "employees.export",
      "employees.import",
      "employees.upload_docs",
      "employees.update_photo",
      "employees.view_personal_card",
      // Incidents - Full access
      "incidents.view",
      "incidents.create",
      "incidents.edit",
      "incidents.delete",
      "incidents.view_rewards",
      "incidents.view_penalties",
      "incidents.generate_cv",
      // Vacations - Full access
      "vacations.view",
      "vacations.create",
      "vacations.edit",
      "vacations.delete",
      "vacations.export",
      "vacations.generate_template",
      // Reports
      "reports.view",
      "reports.create",
      "reports.export",
      "reports.archive",
      // Dashboard
      "dashboard.view",
      "dashboard.view_statistics",
      "dashboard.view_charts",
      // Users - View only
      "users.view",
      // Notifications
      "notifications.view",
      "notifications.send",
      "notifications.mark_read",
    ],
  },
  {
    name: "HR Assistant",
    nameAr: "مساعد الموارد البشرية",
    description: "صلاحيات محدودة لإدارة الموظفين والإجازات",
    permissionKeys: [
      "employees.view",
      "employees.create",
      "employees.edit",
      "employees.upload_docs",
      "employees.update_photo",
      "employees.view_personal_card",
      "vacations.view",
      "vacations.create",
      "vacations.edit",
      "incidents.view",
      "incidents.create",
      "incidents.view_rewards",
      "incidents.view_penalties",
      "dashboard.view",
      "notifications.view",
      "notifications.mark_read",
    ],
  },
  {
    name: "Finance Manager",
    nameAr: "مدير المالية",
    description: "صلاحيات عرض بيانات الموظفين والتقارير المالية",
    permissionKeys: [
      "employees.view",
      "employees.export",
      "reports.view",
      "reports.create",
      "reports.export",
      "reports.archive",
      "dashboard.view",
      "dashboard.view_statistics",
      "dashboard.view_charts",
      "dashboard.export",
      "notifications.view",
      "notifications.mark_read",
    ],
  },
  {
    name: "Legal Department",
    nameAr: "الشؤون القانونية",
    description: "صلاحيات كاملة للشؤون القانونية والقضايا",
    permissionKeys: [
      "legal.view_cases",
      "legal.access",
      "legal.manage_cases",
      "legal.send_files",
      "legal.reply_text",
      "legal.reply_files",
      "legal.view_history",
      "employees.view",
      "file_sharing.upload",
      "file_sharing.view_received",
      "file_sharing.view_sent",
      "file_sharing.download",
      "file_sharing.dywan_access",
      "notifications.view",
      "notifications.send",
      "notifications.mark_read",
      "dashboard.view",
    ],
  },
  {
    name: "Communications Manager",
    nameAr: "مدير الاتصالات والمنشورات",
    description: "إدارة المنشورات والتعاميم والإشعارات",
    permissionKeys: [
      "circulars.view",
      "circulars.create",
      "circulars.edit",
      "circulars.delete",
      "circulars.upload_files",
      "circulars.download",
      "circulars.view_archived",
      "notifications.view",
      "notifications.send",
      "notifications.delete",
      "notifications.mark_read",
      "employees.view",
      "dashboard.view",
      "archive.view",
      "archive.add",
    ],
  },
  {
    name: "IT Support",
    nameAr: "الدعم الفني",
    description: "إدارة المستخدمين والصلاحيات والإعدادات",
    permissionKeys: [
      "users.view",
      "users.create",
      "users.edit",
      "users.delete",
      "users.manage_permissions",
      "users.manage_groups",
      "users.view_activity",
      "users.reset_password",
      "permissions.view",
      "permissions.create",
      "permissions.edit",
      "permissions.delete",
      "permissions.manage_groups",
      "permissions.assign",
      "settings.view",
      "settings.edit_general",
      "settings.edit_homepage",
      "settings.manage_dropdowns",
      "settings.backup",
      "settings.logs",
      "dashboard.view",
      "dashboard.view_statistics",
      "notifications.view",
      "notifications.send",
      "notifications.view_all",
    ],
  },
  {
    name: "Department Manager",
    nameAr: "مدير القسم",
    description: "عرض وإدارة محدودة لموظفي القسم",
    permissionKeys: [
      "employees.view",
      "employees.edit",
      "employees.view_personal_card",
      "vacations.view",
      "vacations.create",
      "vacations.edit",
      "incidents.view",
      "incidents.create",
      "incidents.view_rewards",
      "incidents.view_penalties",
      "circulars.view",
      "circulars.download",
      "reports.view",
      "dashboard.view",
      "dashboard.view_statistics",
      "notifications.view",
      "notifications.send",
      "notifications.mark_read",
      "chat.send",
      "chat.view_history",
    ],
  },
  {
    name: "Office Manager",
    nameAr: "مدير المكتب",
    description: "إدارة الديوان ومشاركة الملفات",
    permissionKeys: [
      "file_sharing.upload",
      "file_sharing.view_received",
      "file_sharing.view_sent",
      "file_sharing.delete",
      "file_sharing.download",
      "file_sharing.dywan_access",
      "circulars.view",
      "circulars.create",
      "circulars.upload_files",
      "circulars.download",
      "employees.view",
      "archive.view",
      "archive.add",
      "archive.restore",
      "notifications.view",
      "notifications.send",
      "notifications.mark_read",
      "dashboard.view",
    ],
  },
  {
    name: "Employee",
    nameAr: "موظف عادي",
    description: "صلاحيات أساسية للموظف العادي",
    permissionKeys: [
      "employees.view",
      "vacations.view",
      "circulars.view",
      "circulars.download",
      "notifications.view",
      "notifications.mark_read",
      "chat.send",
      "chat.view_history",
      "file_sharing.view_received",
      "file_sharing.download",
      "dashboard.view",
    ],
  },
  {
    name: "Viewer",
    nameAr: "مشاهد فقط",
    description: "عرض المستندات الشخصية فقط (الراتب وقائمة الموظفين)",
    permissionKeys: [
      "viewer.view_documents",
      "viewer.view_salary",
      "viewer.view_employee_list",
    ],
  },
  {
    name: "Reports Analyst",
    nameAr: "محلل التقارير",
    description: "إنشاء وتصدير التقارير والإحصائيات",
    permissionKeys: [
      "reports.view",
      "reports.create",
      "reports.export",
      "reports.archive",
      "reports.view_archived",
      "dashboard.view",
      "dashboard.view_statistics",
      "dashboard.view_charts",
      "dashboard.export",
      "employees.view",
      "employees.export",
      "vacations.view",
      "vacations.export",
      "incidents.view",
    ],
  },
  {
    name: "Archive Manager",
    nameAr: "مدير الأرشيف",
    description: "إدارة كاملة للأرشيف والملفات المؤرشفة",
    permissionKeys: [
      "archive.view",
      "archive.add",
      "archive.restore",
      "archive.delete",
      "circulars.view",
      "circulars.view_archived",
      "reports.view",
      "reports.view_archived",
      "file_sharing.view_received",
      "file_sharing.view_sent",
      "file_sharing.download",
      "notifications.view",
      "notifications.mark_read",
    ],
  },
  {
    name: "Chat Moderator",
    nameAr: "مشرف المحادثات",
    description: "إدارة ومراقبة الرسائل والمحادثات",
    permissionKeys: [
      "chat.send",
      "chat.view_history",
      "chat.delete",
      "chat.access_all",
      "notifications.view",
      "notifications.send",
      "notifications.mark_read",
      "employees.view",
    ],
  },
];

const seedPermissionGroups = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/tanmia"
    );
    console.log("✅ Connected to MongoDB");

    // Clear existing groups
    await PermissionGroup.deleteMany({});
    console.log("🗑️  Cleared existing permission groups");

    // Get all permissions
    const allPermissions = await Permission.find({});
    const permissionMap = {};
    allPermissions.forEach((perm) => {
      permissionMap[perm.key] = perm._id;
    });

    console.log(`📋 Found ${allPermissions.length} permissions in database`);

    const createdGroups = [];

    // Create each group
    for (const groupConfig of permissionGroupsConfig) {
      const permissionIds = [];
      const missingPermissions = [];

      // Map permission keys to IDs
      for (const key of groupConfig.permissionKeys) {
        if (permissionMap[key]) {
          permissionIds.push(permissionMap[key]);
        } else {
          missingPermissions.push(key);
        }
      }

      if (missingPermissions.length > 0) {
        console.warn(
          `⚠️  Warning: Group "${groupConfig.name}" has ${missingPermissions.length} missing permissions`
        );
        console.warn(`   Missing: ${missingPermissions.join(", ")}`);
      }

      const group = new PermissionGroup({
        name: groupConfig.name,
        description: `${groupConfig.nameAr} - ${groupConfig.description}`,
        permissions: permissionIds,
        members: [],
      });

      await group.save();
      createdGroups.push({
        name: groupConfig.name,
        nameAr: groupConfig.nameAr,
        permissionCount: permissionIds.length,
      });

      console.log(
        `✅ Created group: ${groupConfig.nameAr} (${groupConfig.name}) with ${permissionIds.length} permissions`
      );
    }

    console.log("\n📊 Permission Groups Summary:");
    console.log("═".repeat(70));

    createdGroups.forEach((group) => {
      console.log(
        `  ${group.nameAr} (${group.name}): ${group.permissionCount} صلاحية`
      );
    });

    console.log("═".repeat(70));
    console.log(
      `\n🎉 Total: ${createdGroups.length} permission groups created successfully!`
    );
    console.log("\n💡 Next steps:");
    console.log(
      "   1. Assign users to these groups using the addUserToGroup endpoint"
    );
    console.log("   2. Or give users direct permissions");
    console.log("   3. Admin users automatically have all permissions\n");

    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error seeding permission groups:", error);
    process.exit(1);
  }
};

seedPermissionGroups();
