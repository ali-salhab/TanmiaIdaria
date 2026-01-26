import dotenv from "dotenv";
import { createBackup } from "./services/dbBackupService.js";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

console.log("Checking Environment...");
console.log("MONGO_URI:", process.env.MONGO_URI);
console.log("MONGODB_TOOLS_PATH:", process.env.MONGODB_TOOLS_PATH);

async function run() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        console.log("Calling createBackup...");
        const result = await createBackup();
        console.log("Backup Success:", result);
    } catch (err) {
        console.error("Backup Failed!");
        console.error("Error Message:", err.message);
        console.error("Error Stack:", err.stack);
        if (err.code) console.error("Error Code:", err.code);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
