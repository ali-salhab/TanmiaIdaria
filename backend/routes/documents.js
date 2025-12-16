import express from "express";
import {
  getDocuments,
  uploadDocument,
  deleteDocument,
  incrementDocumentDownloads,
} from "../controllers/documentController.js";
import { protect } from "../middleware/auth.js";
import checkPermission from "../middleware/checkPermission.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.use(protect);

router.get("/", checkPermission("documents.view"), getDocuments);
router.post(
  "/upload",
  checkPermission("documents.upload"),
  upload.single("file"),
  uploadDocument
);
router.delete("/:id", checkPermission("documents.delete"), deleteDocument);
router.put(
  "/:id/download",
  checkPermission("documents.download"),
  incrementDocumentDownloads
);

export default router;
