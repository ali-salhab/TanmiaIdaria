import express from "express";
import {
  uploadAndShareFile,
  getReceivedFiles,
  getSentFiles,
  markAsRead,
  deleteFileShare,
  incrementDownloadCount,
  getUsersWithDywanPermission,
} from "../controllers/fileShareController.js";
import { protect } from "../middleware/auth.js";
import checkPermission from "../middleware/checkPermission.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.use(protect);

router.post(
  "/upload",
  checkPermission("file_sharing.upload"),
  upload.single("file"),
  uploadAndShareFile
);
router.get(
  "/received",
  checkPermission("file_sharing.view_received"),
  getReceivedFiles
);
router.get("/sent", checkPermission("file_sharing.view_sent"), getSentFiles);
router.get(
  "/dywan-users",
  checkPermission("file_sharing.dywan_access"),
  getUsersWithDywanPermission
);
router.put(
  "/:id/read",
  checkPermission("file_sharing.view_received"),
  markAsRead
);
router.delete("/:id", checkPermission("file_sharing.delete"), deleteFileShare);
router.put(
  "/:id/download",
  checkPermission("file_sharing.download"),
  incrementDownloadCount
);

export default router;
