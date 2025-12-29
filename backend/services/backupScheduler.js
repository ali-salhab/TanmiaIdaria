import cron from "node-cron";
import AppSettings from "../models/AppSettings.js";
import { createBackup, deleteOldBackups } from "./dbBackupService.js";

let currentJob = null;

export async function initBackupScheduler() {
  console.log("🔄 Initializing Backup Scheduler...");

  // Run once on startup to set up the job based on settings
  await updateBackupJob();
}

export async function updateBackupJob() {
  try {
    // Get settings for the first admin user (or a global settings doc if you have one)
    // In this app, AppSettings is per-user, but usually backup is a system-wide thing.
    // We'll take the first one that has backup enabled, or just the first one.
    const settings = await AppSettings.findOne({
      "backupSettings.enabled": true,
    });

    if (currentJob) {
      currentJob.stop();
      currentJob = null;
    }

    if (!settings || !settings.backupSettings.enabled) {
      console.log("⏸️ Scheduled backups are disabled.");
      return;
    }

    const { interval, retention } = settings.backupSettings;

    // Map interval to cron expression
    // daily: 0 0 * * * (midnight)
    // weekly: 0 0 * * 0 (Sunday midnight)
    // monthly: 0 0 1 * * (1st of month midnight)
    let cronExp = "0 0 * * *";
    if (interval === "weekly") cronExp = "0 0 * * 0";
    if (interval === "monthly") cronExp = "0 0 1 * *";

    console.log(`📅 Scheduled backup set: ${interval} (${cronExp})`);

    currentJob = cron.schedule(cronExp, async () => {
      console.log(
        `🚀 Starting scheduled backup (${new Date().toLocaleString()})...`
      );
      try {
        await createBackup();
        await deleteOldBackups(retention);
        console.log("✅ Scheduled backup completed successfully.");
      } catch (err) {
        console.error("❌ Scheduled backup failed:", err.message);
      }
    });
  } catch (err) {
    console.error("❌ Failed to update backup job:", err.message);
  }
}
