import express from "express";
import {
  getAllPermissions,
  createPermission,
  getAllGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  addUserToGroup,
  removeUserFromGroup,
  updateUserPermissions,
  getUserPermissions,
} from "../controllers/permissionController.js";
import { protect } from "../middleware/auth.js";
import checkPermission from "../middleware/checkPermission.js";

const router = express.Router();

// --- Permissions ---
router.get(
  "/",
  protect,
  checkPermission("permissions.view"),
  getAllPermissions
);
router.post(
  "/",
  protect,
  checkPermission("permissions.create"),
  createPermission
);

// --- Groups ---
router.get(
  "/groups",
  protect,
  checkPermission("permissions.view"),
  getAllGroups
);
router.post(
  "/groups",
  protect,
  checkPermission("permissions.manage_groups"),
  createGroup
);

// --- Group users (must come before :id routes) ---
router.post(
  "/groups/add-user",
  protect,
  checkPermission("permissions.manage_groups"),
  addUserToGroup
);
router.post(
  "/groups/remove-user",
  protect,
  checkPermission("permissions.manage_groups"),
  removeUserFromGroup
);

// --- Groups by ID ---
router.put(
  "/groups/:id",
  protect,
  checkPermission("permissions.manage_groups"),
  updateGroup
);
router.delete(
  "/groups/:id",
  protect,
  checkPermission("permissions.delete"),
  deleteGroup
);

// --- Direct user permissions ---
router.put(
  "/users/:userId/permissions",
  protect,
  checkPermission("permissions.assign"),
  updateUserPermissions
);

// Middleware to allow self-access or permission
const allowSelfOrPermission = (permission) => {
  return (req, res, next) => {
    if (
      req.params.userId &&
      req.user &&
      req.user._id.toString() === req.params.userId
    ) {
      return next();
    }
    return checkPermission(permission)(req, res, next);
  };
};

router.get(
  "/user/:userId/permissions",
  protect,
  allowSelfOrPermission("permissions.view"),
  getUserPermissions
);

export default router;
