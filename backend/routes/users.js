import express from "express";
import {
  getUsers,
  getUser,
  createUser,
  updateUserPermissions,
  deleteUser,
  updateUser,
} from "../controllers/userController.js";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🟩 Admin-only routes
router.use(verifyToken, isAdmin);

router.get("/", getUsers);
router.get("/:id", getUser);
router.post("/", createUser);
router.put("/:id", updateUser);
router.put("/:id/permissions", updateUserPermissions);
router.delete("/:id", deleteUser);

export default router;
