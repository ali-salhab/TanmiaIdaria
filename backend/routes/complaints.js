import express from "express";
import { protect } from "../middleware/auth.js";
import checkPermission from "../middleware/checkPermission.js";
import upload from "../middleware/upload.js";
import {
  listComplaints,
  getComplaint,
  createComplaint,
  updateComplaint,
  deleteComplaint,
} from "../controllers/complaintController.js";

const router = express.Router();

router.get("/", protect, checkPermission("complaints.view"), listComplaints);

router.get("/:id", protect, checkPermission("complaints.view"), getComplaint);

router.post(
  "/",
  protect,
  checkPermission("complaints.create"),
  upload.array("attachments"),
  createComplaint
);

router.put(
  "/:id",
  protect,
  checkPermission("complaints.edit"),
  upload.array("attachments"),
  updateComplaint
);

router.delete(
  "/:id",
  protect,
  checkPermission("complaints.delete"),
  deleteComplaint
);

export default router;
