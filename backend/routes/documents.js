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

router.get("/", checkPermission("dywan.view"), getDocuments);
router.post(
  "/upload",
  checkPermission("dywan.create"),
  upload.single("file"),
  uploadDocument
);
router.delete("/:id", checkPermission("dywan.delete"), deleteDocument);
router.put(
  "/:id/download",
  checkPermission("dywan.export"),
  incrementDocumentDownloads
);

export default router;
