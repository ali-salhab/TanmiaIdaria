import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import archiver from "archiver";
import os from "os";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const BACKUPS_DIR = path.join(__dirname, "..", "backups");

export function ensureBackupsDir() {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
}

function getMongoUri() {
  let uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  // Fallback to active mongoose connection if env is missing
  if (!uri && mongoose.connection.readyState === 1) {
    const { host, port, name } = mongoose.connection;
    if (host && name) {
      uri = `mongodb://${host}${port ? `:${port}` : ""}/${name}`;
    }
  }

  if (!uri) {
    throw new Error(
      "MONGO_URI is not set. Set it in backend/.env to enable backup/restore."
    );
  }
  return uri;
}

function getDbNameFromUri(uri) {
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

export function findMongoTool(toolBaseName) {
  const toolsPath = process.env.MONGODB_TOOLS_PATH;
  const exeName = isWindows() ? `${toolBaseName}.exe` : toolBaseName;

  // 1. Check environment variable
  if (toolsPath) {
    const candidate = path.join(toolsPath, exeName);
    if (existsFile(candidate)) return candidate;
  }

  // 2. Check common Windows installation paths
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
      path.join(
        "C:\\",
        "Program Files",
        "MongoDB",
        "Server",
        "8.0",
        "bin",
        exeName
      ),
      path.join(
        "C:\\",
        "Program Files",
        "MongoDB",
        "Server",
        "7.0",
        "bin",
        exeName
      ),
      path.join(
        "C:\\",
        "Program Files",
        "MongoDB",
        "Server",
        "6.0",
        "bin",
        exeName
      ),
      path.join(
        "C:\\",
        "Program Files",
        "MongoDB",
        "Server",
        "5.0",
        "bin",
        exeName
      ),
      path.join(
        "C:\\",
        "Program Files",
        "MongoDB",
        "Server",
        "4.4",
        "bin",
        exeName
      ),
      path.join(
        "C:\\",
        "Program Files",
        "MongoDB",
        "Server",
        "4.2",
        "bin",
        exeName
      ),
      path.join(
        "C:\\",
        "Program Files",
        "MongoDB",
        "Server",
        "4.0",
        "bin",
        exeName
      ),
    ];
    for (const c of candidates) {
      if (existsFile(c)) return c;
    }
  }

  // 3. Fallback to just the tool name (rely on system PATH)
  return exeName;
}

export async function checkToolAvailability(toolBaseName) {
  const cmd = findMongoTool(toolBaseName);
  try {
    await runCommand(cmd, ["--version"]);
    return { available: true, path: cmd };
  } catch (err) {
    return { available: false, path: cmd, error: err.message };
  }
}

export function isSpawnNotFoundError(err) {
  return err && (err.code === "ENOENT" || err.errno === -4058);
}

export function getToolHelpMessage() {
  return (
    "أدوات MongoDB غير موجودة. يرجى تثبيت 'MongoDB Database Tools' من موقع MongoDB الرسمي " +
    "وإضافة مجلد bin إلى PATH، أو قم بتعيين MONGODB_TOOLS_PATH في ملف .env إلى مسار المجلد (مثال: C:\\Program Files\\MongoDB\\Tools\\100\\bin)."
  );
}

export function runCommand(command, args, options = {}) {
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

export function listBackupFiles() {
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

export async function createBackup() {
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

  if (fs.existsSync(dumpDir))
    fs.rmSync(dumpDir, { recursive: true, force: true });
  if (fs.existsSync(zipPath)) fs.rmSync(zipPath, { force: true });

  const mongodumpCmd = findMongoTool("mongodump");
  await runCommand(mongodumpCmd, ["--uri", uri, "--out", dumpDir]);
  await zipDirectory(dumpDir, zipPath);

  fs.rmSync(dumpDir, { recursive: true, force: true });

  const stat = fs.statSync(zipPath);
  return {
    name: path.basename(zipPath),
    size: stat.size,
    createdAt: stat.birthtime || stat.mtime,
  };
}

export async function deleteOldBackups(retentionCount) {
  if (!retentionCount || retentionCount <= 0) return;
  const backups = listBackupFiles();
  if (backups.length > retentionCount) {
    const toDelete = backups.slice(retentionCount);
    for (const b of toDelete) {
      const fullPath = path.join(BACKUPS_DIR, b.name);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
  }
}
