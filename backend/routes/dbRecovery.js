import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import archiver from "archiver";
import { protect } from "../middleware/auth.js";
import checkPermission from "../middleware/checkPermission.js";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const BACKUPS_DIR = path.join(__dirname, "..", "backups");

function ensureBackupsDir() {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
}

function getMongoUri() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGO_URI is not set. Set it in backend/.env to enable backup/restore."
    );
  }
  return uri;
}

function getDbNameFromUri(uri) {
  // mongodb://host:27017/dbname?...
  // mongodb+srv://host/dbname?...
  try {
    const withoutParams = uri.split("?")[0];
    const parts = withoutParams.split("/");
    const dbName = parts[parts.length - 1];
    return dbName || "database";
  } catch {
    return "database";
  }
}

function safeName(name) {
  return String(name || "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 200);
}

function isWindows() {
  return os.platform() === "win32";
}

function existsFile(p) {
  try {
    return fs.existsSync(p) && fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function findMongoTool(toolBaseName) {
  // 1) Explicit env var path
  //    - MONGODB_TOOLS_PATH=C:\Program Files\MongoDB\Tools\100\bin
  //    - MONGODB_TOOLS_PATH=C:\MongoDB\Tools\bin
  const toolsPath = process.env.MONGODB_TOOLS_PATH;
  const exeName = isWindows() ? `${toolBaseName}.exe` : toolBaseName;

  if (toolsPath) {
    const candidate = path.join(toolsPath, exeName);
    if (existsFile(candidate)) return candidate;
  }

  // 2) Common Windows install locations
  if (isWindows()) {
    const candidates = [
      path.join(
        "C:\\",
        "Program Files",
        "MongoDB",
        "Tools",
        "100",
        "bin",
        exeName
      ),
      path.join("C:\\", "Program Files", "MongoDB", "Tools", "bin", exeName),
      path.join("C:\\", "MongoDB", "Tools", "bin", exeName),
    ];
    for (const c of candidates) {
      if (existsFile(c)) return c;
    }
  }

  // 3) Fall back to PATH resolution (spawn will handle)
  return toolBaseName;
}

function isSpawnNotFoundError(err) {
  return err && (err.code === "ENOENT" || err.errno === -4058);
}

function getToolHelpMessage() {
  return (
    "MongoDB tools not found (mongodump/mongorestore). " +
    "Install MongoDB Database Tools and ensure they are in PATH, " +
    "or set MONGODB_TOOLS_PATH to the tools bin folder (e.g. C:\\Program Files\\MongoDB\\Tools\\100\\bin)."
  );
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      shell: false,
      windowsHide: true,
      ...options,
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (d) => {
      stdout += d.toString();
    });

    child.stderr?.on("data", (d) => {
      stderr += d.toString();
    });

    child.on("error", (err) => {
      reject(err);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        const error = new Error(
          `${command} exited with code ${code}. ${stderr || stdout}`
        );
        error.code = code;
        reject(error);
      }
    });
  });
}

router.get(
  "/tools",
  protect,
  checkPermission("settings.backup"),
  async (req, res) => {
    try {
      const mongodumpCmd = findMongoTool("mongodump");
      const mongorestoreCmd = findMongoTool("mongorestore");
      const hasDump = !isWindows()
        ? true
        : mongodumpCmd !== "mongodump" || process.env.MONGODB_TOOLS_PATH;
      const hasRestore = !isWindows()
        ? true
        : mongorestoreCmd !== "mongorestore" || process.env.MONGODB_TOOLS_PATH;

      res.json({
        mongodump: {
          command: mongodumpCmd,
          hint: hasDump ? "" : getToolHelpMessage(),
        },
        mongorestore: {
          command: mongorestoreCmd,
          hint: hasRestore ? "" : getToolHelpMessage(),
        },
        toolsPathEnv: process.env.MONGODB_TOOLS_PATH || null,
        platform: os.platform(),
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

async function zipDirectory(sourceDir, outZipPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outZipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve());
    output.on("error", (err) => reject(err));
    archive.on("error", (err) => reject(err));

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

function listBackupFiles() {
  ensureBackupsDir();
  const files = fs
    .readdirSync(BACKUPS_DIR)
    .filter((f) => f.toLowerCase().endsWith(".zip"))
    .map((f) => {
      const full = path.join(BACKUPS_DIR, f);
      const stat = fs.statSync(full);
      return {
        name: f,
        size: stat.size,
        createdAt: stat.birthtime || stat.mtime,
        modifiedAt: stat.mtime,
      };
    })
    .sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
  return files;
}

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

// Create backup using mongodump -> zip
router.post(
  "/create",
  protect,
  checkPermission("settings.backup"),
  async (req, res) => {
    try {
      ensureBackupsDir();

      const uri = getMongoUri();
      const dbName = getDbNameFromUri(uri);
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .replace("T", "_")
        .replace("Z", "");

      const folderName = safeName(`${dbName}_${timestamp}`);
      const dumpDir = path.join(BACKUPS_DIR, folderName);
      const zipPath = path.join(BACKUPS_DIR, `${folderName}.zip`);

      // Cleanup if exists
      if (fs.existsSync(dumpDir))
        fs.rmSync(dumpDir, { recursive: true, force: true });
      if (fs.existsSync(zipPath)) fs.rmSync(zipPath, { force: true });

      const mongodumpCmd = findMongoTool("mongodump");
      await runCommand(mongodumpCmd, ["--uri", uri, "--out", dumpDir]);
      await zipDirectory(dumpDir, zipPath);

      // Remove unzipped folder to save space
      fs.rmSync(dumpDir, { recursive: true, force: true });

      const stat = fs.statSync(zipPath);
      res.json({
        message: "Backup created successfully",
        backup: {
          name: path.basename(zipPath),
          size: stat.size,
          createdAt: stat.birthtime || stat.mtime,
        },
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
// Body: { name: "file.zip", drop: true|false }
router.post(
  "/restore",
  protect,
  checkPermission("settings.backup"),
  async (req, res) => {
    try {
      ensureBackupsDir();
      const uri = getMongoUri();
      const name = safeName(req.body?.name);
      const drop = Boolean(req.body?.drop);

      if (!name || !name.toLowerCase().endsWith(".zip")) {
        return res.status(400).json({ message: "Backup name is required" });
      }

      const zipPath = path.join(BACKUPS_DIR, name);
      if (!fs.existsSync(zipPath)) {
        return res.status(404).json({ message: "Backup not found" });
      }

      // Extract to temp folder
      const tmpFolder = path.join(
        BACKUPS_DIR,
        `__restore_${Date.now()}_${Math.random().toString(16).slice(2)}`
      );
      fs.mkdirSync(tmpFolder, { recursive: true });

      // Use PowerShell Expand-Archive for Windows compatibility (no extra deps)
      // Note: spawn uses exact args; use powershell.exe
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
