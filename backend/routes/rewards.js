import express from "express";
import {
  getRewards,
  createReward,
  deleteReward,
} from "../controllers/rewardController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import checkPermission from "../middleware/checkPermission.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get(
  "/:employeeId",
  verifyToken,
  checkPermission("rewards.view"),
  getRewards
);
router.post(
  "/:employeeId",
  verifyToken,
  checkPermission("rewards.create"),
  upload.single("file"),
  createReward
);
router.delete(
  "/:id",
  verifyToken,
  checkPermission("rewards.delete"),
  deleteReward
);

export default router;
