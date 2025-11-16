import express from "express";
import {
  getDropdownSettings,
  saveDropdownSettings,
  getAppSettings,
  updateAppSettings,
} from "../controllers/appSettingsController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/dropdowns", authMiddleware, getDropdownSettings);
router.post("/dropdowns", authMiddleware, saveDropdownSettings);
router.get("/", authMiddleware, getAppSettings);
router.put("/", authMiddleware, updateAppSettings);

export default router;
