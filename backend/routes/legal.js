import express from "express";
import {
  createLegalCase,
  getAllLegalCases,
  getLegalCaseById,
  updateLegalCase,
  deleteLegalCase,
  addAttachment,
  addReply,
  addReplyWithFiles,
  getUsersWithLegalPermission,
} from "../controllers/legalController.js";
import { protect } from "../middleware/auth.js";
import checkPermission from "../middleware/checkPermission.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Get all legal cases (requires legal.view_cases permission)
router.get("/", checkPermission("legal.view_cases"), getAllLegalCases);

// Get users who can receive legal cases (requires legal.send_files permission)
router.get(
  "/users",
  checkPermission("legal.send_files"),
  getUsersWithLegalPermission
);

// Create new legal case (requires legal.access permission)
router.post("/", checkPermission("legal.access"), createLegalCase);

// Get specific legal case (requires legal.view_cases permission)
router.get("/:id", checkPermission("legal.view_cases"), getLegalCaseById);

// Update legal case (requires legal.manage_cases permission)
router.put("/:id", checkPermission("legal.manage_cases"), updateLegalCase);

// Delete/archive legal case (requires legal.manage_cases permission)
router.delete("/:id", checkPermission("legal.manage_cases"), deleteLegalCase);

// Add attachment to legal case (requires legal.send_files permission)
router.post(
  "/:id/attachment",
  checkPermission("legal.send_files"),
  upload.single("file"),
  addAttachment
);

// Add text-only reply (requires legal.reply_text permission)
router.post("/:id/reply", checkPermission("legal.reply_text"), addReply);

// Add reply with files (requires legal.reply_files permission)
router.post(
  "/:id/reply-with-files",
  checkPermission("legal.reply_files"),
  upload.array("files", 10), // Allow up to 10 files
  addReplyWithFiles
);

export default router;
