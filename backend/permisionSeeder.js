import mongoose from "mongoose";
import Permission from "./models/Permission.js";

const permissions = [
  // Users
  "users.view",
  "users.create",
  "users.edit",
  "users.delete",
  "users.reset_password",
  "users.assign_permissions",
  "users.assign_groups",

  // Employees
  "employees.view",
  "employees.create",
  "employees.edit",
  "employees.delete",
  "employees.export",
  "employees.upload_document",
  "employees.delete_document",

  // Incidents
  "incidents.view",
  "incidents.create",
  "incidents.edit",
  "incidents.delete",
  "incidents.export",

  // Vacations
  "vacations.view",
  "vacations.create",
  "vacations.edit",
  "vacations.delete",
  "vacations.approve",
  "vacations.reject",

  // Documents & FileShare
  "documents.view",
  "documents.upload",
  "documents.download",
  "documents.delete",

  "fileshare.send",
  "fileshare.view_inbox",
  "fileshare.read",

  // Circulars
  "circulars.view",
  "circulars.create",
  "circulars.edit",
  "circulars.delete",
  "circulars.upload_files",
  "circulars.delete_files",
  "circulars.publish",
  "circulars.unpublish",

  // Dropdown Options
  "dropdowns.view",
  "dropdowns.edit",
  "dropdowns.reset_to_default",

  // Homepage
  "homepage.view",
  "homepage.edit_widgets",
  "homepage.edit_layout",
  "homepage.edit_theme",

  // Salary / Rewards / Punishments
  "salary.view",
  "salary.upload",
  "salary.delete",

  "rewards.view",
  "rewards.create",
  "rewards.delete",

  "punishments.view",
  "punishments.create",
  "punishments.delete",

  // Permissions & Groups
  "permissions.view",
  "permissions.create",
  "permissions.edit",
  "permissions.delete",

  "permission_groups.view",
  "permission_groups.create",
  "permission_groups.edit",
  "permission_groups.delete",
  "permission_groups.assign_members",

  // Settings
  "settings.view",
  "settings.update_theme",
  "settings.update_dropdowns",
  "settings.update_homepage",

  // Notifications
  "notifications.view",
  "notifications.mark_read",
  "notifications.send",

  // Logs
  "logs.view",
  "logs.export",

  // Analytics / Reports
  "analytics.view",
  "analytics.export",
  "reports.view",
  "reports.export",
];

async function seed() {
  await mongoose.connect("mongodb://localhost:27017/Emp");

  for (const key of permissions) {
    const exists = await Permission.findOne({ key });
    if (!exists) {
      await Permission.create({
        key,
        label: key.split(".").join(" - "),
        category: key.split(".")[1] || "view",
      });
      console.log("Inserted:", key);
    }
  }

  console.log("Done seeding permissions!");
  process.exit();
}

seed();
