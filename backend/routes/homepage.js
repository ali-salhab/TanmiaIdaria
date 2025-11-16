import express from "express";
import {
  getHomepageSettings,
  getMyHomepageSettings,
  createHomepageSettings,
  updateHomepageSettings,
  updateMyHomepageSettings,
  deleteHomepageSettings,
} from "../controllers/homepageController.js";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/my-settings", verifyToken, getMyHomepageSettings);
router.put("/my-settings", verifyToken, updateMyHomepageSettings);

router.use(verifyToken, isAdmin);

router.get("/:userId", getHomepageSettings);
router.post("/", createHomepageSettings);
router.put("/:userId", updateHomepageSettings);
router.delete("/:userId", deleteHomepageSettings);

export default router;
