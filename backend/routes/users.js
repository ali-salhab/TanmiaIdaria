import express from "express";
import {
  getUsers,
  getUser,
  createUser,
  updateUserPermissions,
  deleteUser,
  updateUser,
  updateUserProfile,
  uploadAvatar,
  uploadDocument,
  uploadSalaryImage,
  uploadEmployeeListImage,
  deleteDocument,
} from "../controllers/userController.js";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// 🟩 Admin-only routes
router.use(verifyToken, isAdmin);

router.get("/", getUsers);
router.get("/:id", getUser);
router.post("/", createUser);
router.put("/:id", updateUser);
router.put("/:id/permissions", updateUserPermissions);
router.put("/:id/profile", updateUserProfile);
router.post("/:id/avatar", upload.single("avatar"), uploadAvatar);
router.post("/:id/documents", upload.single("document"), uploadDocument);
router.post("/:id/salary-image", upload.single("image"), uploadSalaryImage);
router.post("/:id/employee-list-image", upload.single("image"), uploadEmployeeListImage);
router.delete("/:id/documents/:documentIndex", deleteDocument);
router.delete("/:id", deleteUser);

export default router;
