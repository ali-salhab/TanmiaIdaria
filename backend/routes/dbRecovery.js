import express from "express";
import path from "path";
import fs from "fs";
import { protect } from "../middleware/auth.js";
import checkPermission from "../middleware/checkPermission.js";
import os from "os";
import {
  createBackup,
  listBackupFiles,
  BACKUPS_DIR,
  ensureBackupsDir,
  findMongoTool,
  getToolHelpMessage,
  isSpawnNotFoundError,
  runCommand,
  checkToolAvailability,
} from "../services/dbBackupService.js";

const router = express.Router();

function safeName(name) {
  return String(name || "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 200);
}

function isWindows() {
  return os.platform() === "win32";
}

router.get(
  "/tools",
  protect,
  checkPermission("settings.backup"),
  async (req, res) => {
    try {
      const dumpStatus = await checkToolAvailability("mongodump");
      const restoreStatus = await checkToolAvailability("mongorestore");

      res.json({
        mongodump: {
          command: dumpStatus.path,
          available: dumpStatus.available,
          hint: dumpStatus.available ? "" : getToolHelpMessage(),
        },
        mongorestore: {
          command: restoreStatus.path,
          available: restoreStatus.available,
          hint: restoreStatus.available ? "" : getToolHelpMessage(),
        },
        toolsPathEnv: process.env.MONGODB_TOOLS_PATH || null,
        platform: os.platform(),
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// List backups
router.get(
  "/",
  protect,
  checkPermission("settings.backup"),
  async (req, res) => {
    try {
      const backups = listBackupFiles();
      res.json({ backups });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// Create backup
router.post(
  "/create",
  protect,
  checkPermission("settings.backup"),
  async (req, res) => {
    try {
      const backup = await createBackup();
      res.json({
        message: "Backup created successfully",
        backup,
      });
    } catch (err) {
      if (isSpawnNotFoundError(err)) {
        return res.status(500).json({
          message: getToolHelpMessage(),
          error: "MONGODB_TOOLS_NOT_FOUND",
        });
      }
      const msg = err?.message || "Failed to create backup.";
      res.status(500).json({ message: msg });
    }
  }
);

// Download a backup zip
router.get(
  "/download/:name",
  protect,
  checkPermission("settings.backup"),
  async (req, res) => {
    try {
      ensureBackupsDir();
      const name = safeName(req.params.name);
      if (!name.toLowerCase().endsWith(".zip")) {
        return res.status(400).json({ message: "Invalid backup file" });
      }
      const fullPath = path.join(BACKUPS_DIR, name);
      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ message: "Backup not found" });
      }
      res.download(fullPath, name);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// Restore from a backup zip
router.post(
  "/restore",
  protect,
  checkPermission("settings.backup"),
  async (req, res) => {
    try {
      ensureBackupsDir();
      const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
      const name = safeName(req.body?.name);
      const drop = Boolean(req.body?.drop);

      if (!name || !name.toLowerCase().endsWith(".zip")) {
        return res.status(400).json({ message: "Backup name is required" });
      }

      const zipPath = path.join(BACKUPS_DIR, name);
      if (!fs.existsSync(zipPath)) {
        return res.status(404).json({ message: "Backup not found" });
      }

      const tmpFolder = path.join(
        BACKUPS_DIR,
        `__restore_${Date.now()}_${Math.random().toString(16).slice(2)}`
      );
      fs.mkdirSync(tmpFolder, { recursive: true });

      const psArgs = [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        `Expand-Archive -Path "${zipPath}" -DestinationPath "${tmpFolder}" -Force`,
      ];
      await runCommand("powershell.exe", psArgs);

      const args = ["--uri", uri, "--dir", tmpFolder];
      if (drop) args.push("--drop");

      const mongorestoreCmd = findMongoTool("mongorestore");
      await runCommand(mongorestoreCmd, args);

      fs.rmSync(tmpFolder, { recursive: true, force: true });
      res.json({ message: "Restore completed successfully" });
    } catch (err) {
      if (isSpawnNotFoundError(err)) {
        return res.status(500).json({
          message: getToolHelpMessage(),
          error: "MONGODB_TOOLS_NOT_FOUND",
        });
      }
      const msg = err?.message || "Failed to restore.";
      res.status(500).json({ message: msg });
    }
  }
);

export default router;
