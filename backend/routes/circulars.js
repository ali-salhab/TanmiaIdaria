import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { protect } from "../middleware/auth.js";
import * as circularController from "../controllers/circularController.js";

const router = express.Router();

const uploadDir = "uploads/circulars";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    cb(null, `${timestamp}-${random}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("نوع الملف غير مسموح"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.post("/", protect, upload.any(), circularController.createCircular);

router.get("/", protect, circularController.getAllCirculars);

router.get("/stats", protect, circularController.getCircularStats);

router.get("/unviewed-count", protect, circularController.getUnviewedCount);

router.get("/:id", protect, circularController.getCircularById);

router.put("/:id", protect, upload.any(), circularController.updateCircular);

router.delete("/:id", protect, circularController.deleteCircular);

router.post("/:id/view", protect, circularController.markAsViewed);

router.get("/:id/viewers", protect, circularController.getCircularViewers);

export default router;
