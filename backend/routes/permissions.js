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
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// --- Permissions ---
router.get("/", protect, getAllPermissions);
router.post("/", protect, authorize("admin"), createPermission);

// --- Groups ---
router.get("/groups", protect, getAllGroups);
router.post("/groups", protect, authorize("admin"), createGroup);
router.put("/groups/:id", protect, authorize("admin"), updateGroup);
router.delete("/groups/:id", protect, authorize("admin"), deleteGroup);

// --- Group users ---
router.post("/groups/add-user", protect, authorize("admin"), addUserToGroup);
router.post(
  "/groups/remove-user",
  protect,
  authorize("admin"),
  removeUserFromGroup
);
router.put(
  "/permissions/user/:userId/permissions",
  protect,
  authorize("admin"),
  updateUserPermissions
);
// --- Direct user permissions ---

router.get("/user/:userId/permissions", protect, getUserPermissions);

export default router;
