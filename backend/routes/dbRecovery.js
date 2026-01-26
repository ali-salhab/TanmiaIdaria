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

// Test endpoint to verify route is working
router.get("/test", protect, checkPermission("settings.backup"), (req, res) => {
  res.json({ message: "DB Recovery route is working", timestamp: new Date().toISOString() });
});

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
  async (req, res, next) => {
    console.log("====================================");
    console.log("POST /db-recovery/create - Route handler called");
    console.log("Request received at:", new Date().toISOString());
    console.log("====================================");

    try {
      console.log("Starting backup creation...");
      const backup = await createBackup();
      console.log("Backup created successfully:", backup?.name);

      if (res.headersSent) {
        console.error("WARNING: Headers already sent");
        return;
      }

      return res.json({
        message: "Backup created successfully",
        backup,
      });
    } catch (err) {
      console.error("====================================");
      console.error("ERROR in backup creation:");
      console.error("Error:", err);
      console.error("Error message:", err?.message);
      console.error("Error code:", err?.code);
      console.error("Error name:", err?.name);
      console.error("Error stack:", err?.stack);
      console.error("Response headers sent:", res.headersSent);
      console.error("====================================");

      if (res.headersSent) {
        console.error("Cannot send error - headers already sent, passing to next");
        return next(err);
      }

      // Determine error message and code
      let errorMessage = "Failed to create backup.";
      let errorCode = "BACKUP_ERROR";

      if (isSpawnNotFoundError(err)) {
        errorMessage = getToolHelpMessage();
        errorCode = "MONGODB_TOOLS_NOT_FOUND";
      } else if (err?.message?.includes("MONGO_URI")) {
        errorMessage = "MONGO_URI is not set. Please configure it in backend/.env";
        errorCode = "MONGO_URI_NOT_SET";
      } else if (err?.message) {
        errorMessage = String(err.message);
        errorCode = err?.code || "BACKUP_ERROR";
      } else if (err?.toString) {
        errorMessage = String(err.toString());
      }

      console.log("Sending error response:", { status: 500, message: errorMessage, error: errorCode });

      try {
        const response = {
          message: errorMessage,
          error: errorCode
        };

        console.log("Response object:", JSON.stringify(response));
        res.status(500).json(response);
        console.log("Error response sent successfully");
      } catch (jsonError) {
        console.error("CRITICAL: Failed to send JSON response:", jsonError);
        try {
          res.status(500).send(errorMessage);
        } catch (sendError) {
          console.error("CRITICAL: Failed to send plain text response:", sendError);
          next(err);
        }
      }
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

      // Use tar -xf (Cross-platform and faster/more robust than PowerShell Archive)
      const tarArgs = ["-xf", zipPath, "-C", tmpFolder];
      await runCommand("tar.exe", tarArgs);

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
      console.error("❌ Backup restoration failed:", err);
      res.status(500).json({ message: msg, error: err.toString(), stack: err.stack });
    }
  }
);

export default router;
