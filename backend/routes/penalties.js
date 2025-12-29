import express from "express";
import {
  getPenalties,
  createPenalty,
  updatePenalty,
  deletePenalty,
} from "../controllers/penaltyController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import checkPermission from "../middleware/checkPermission.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get(
  "/:employeeId",
  verifyToken,
  checkPermission("penalties.view"),
  getPenalties
);
router.post(
  "/:employeeId",
  verifyToken,
  checkPermission("penalties.create"),
  upload.single("file"),
  createPenalty
);
router.put(
  "/:id",
  verifyToken,
  checkPermission("penalties.edit"),
  upload.single("file"),
  updatePenalty
);
router.delete(
  "/:id",
  verifyToken,
  checkPermission("penalties.delete"),
  deletePenalty
);

export default router;
