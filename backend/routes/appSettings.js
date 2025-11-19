import express from "express";
import {
  getDropdownSettings,
  saveDropdownSettings,
  getAppSettings,
  updateAppSettings,
} from "../controllers/appSettingsController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/dropdowns", protect, getDropdownSettings);
router.post("/dropdowns", protect, saveDropdownSettings);
router.get("/", protect, getAppSettings);
router.put("/", protect, updateAppSettings);

export default router;
