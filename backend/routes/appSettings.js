import express from "express";
import {
  getDropdownSettings,
  saveDropdownSettings,
  getAppSettings,
  updateAppSettings,
} from "../controllers/appSettingsController.js";
import { protect } from "../middleware/auth.js";
import checkPermission from "../middleware/checkPermission.js";

const router = express.Router();

router.get(
  "/dropdowns",
  protect,
  checkPermission("settings.view"),
  getDropdownSettings
);
router.post(
  "/dropdowns",
  protect,
  checkPermission("settings.manage_dropdowns"),
  saveDropdownSettings
);
router.get("/", protect, checkPermission("settings.view"), getAppSettings);
router.put(
  "/",
  protect,
  checkPermission("settings.edit_general"),
  updateAppSettings
);

export default router;
