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

// Middleware to allow self-access or permission
const allowSelfOrPermission = (permission) => {
  return (req, res, next) => {
    if (
      req.params.id &&
      req.user &&
      req.user._id.toString() === req.params.id
    ) {
      return next();
    }
    return checkPermission(permission)(req, res, next);
  };
};

// New endpoint for searching employees during user creation
router.get("/search/employees", checkPermission("users.view"), searchEmployees);

router.get("/", checkPermission("users.view"), getUsers);
router.get("/:id", allowSelfOrPermission("users.view"), getUser);
router.post("/", checkPermission("users.create"), createUser);
router.put("/:id", checkPermission("users.edit"), updateUser);
router.put(
  "/:id/permissions",
  checkPermission("users.manage_permissions"),
  updateUserPermissions
);
router.put(
  "/:id/profile",
  allowSelfOrPermission("users.edit"),
  updateUserProfile
);
router.post(
  "/:id/avatar",
  allowSelfOrPermission("users.edit"),
  upload.single("avatar"),
  uploadAvatar
);
router.post(
  "/:id/documents",
  allowSelfOrPermission("users.edit"),
  upload.single("document"),
  uploadDocument
);
router.post(
  "/:id/salary-image",
  allowSelfOrPermission("users.edit"),
  upload.single("image"),
  uploadSalaryImage
);
router.post(
  "/:id/employee-list-image",
  allowSelfOrPermission("users.edit"),
  upload.single("image"),
  uploadEmployeeListImage
);
router.delete(
  "/:id/documents/:documentIndex",
  allowSelfOrPermission("users.edit"),
  deleteDocument
);
router.delete("/:id", checkPermission("users.delete"), deleteUser);

export default router;
