import express from "express";
import {
  uploadAndShareFile,
  getReceivedFiles,
  getSentFiles,
  markAsRead,
  deleteFileShare,
  incrementDownloadCount,
} from "../controllers/fileShareController.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.use(protect);

router.post("/upload", upload.single("file"), uploadAndShareFile);
router.get("/received", getReceivedFiles);
router.get("/sent", getSentFiles);
router.put("/:id/read", markAsRead);
router.delete("/:id", deleteFileShare);
router.put("/:id/download", incrementDownloadCount);

export default router;
