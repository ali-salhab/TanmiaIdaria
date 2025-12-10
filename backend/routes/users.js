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
  searchEmployees,
} from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";
import checkPermission from "../middleware/checkPermission.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// All routes are protected
router.use(protect);

// New endpoint for searching employees during user creation
router.get("/search/employees", checkPermission("users.view"), searchEmployees);

router.get("/", checkPermission("users.view"), getUsers);
router.get("/:id", checkPermission("users.view"), getUser);
router.post("/", checkPermission("users.create"), createUser);
router.put("/:id", checkPermission("users.edit"), updateUser);
router.put(
  "/:id/permissions",
  checkPermission("users.manage_permissions"),
  updateUserPermissions
);
router.put("/:id/profile", checkPermission("users.edit"), updateUserProfile);
router.post(
  "/:id/avatar",
  checkPermission("users.edit"),
  upload.single("avatar"),
  uploadAvatar
);
router.post(
  "/:id/documents",
  checkPermission("users.edit"),
  upload.single("document"),
  uploadDocument
);
router.post(
  "/:id/salary-image",
  checkPermission("users.edit"),
  upload.single("image"),
  uploadSalaryImage
);
router.post(
  "/:id/employee-list-image",
  checkPermission("users.edit"),
  upload.single("image"),
  uploadEmployeeListImage
);
router.delete(
  "/:id/documents/:documentIndex",
  checkPermission("users.edit"),
  deleteDocument
);
router.delete("/:id", checkPermission("users.delete"), deleteUser);

export default router;
