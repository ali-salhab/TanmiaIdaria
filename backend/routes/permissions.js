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

router.get("/permissions", protect, getAllPermissions);
router.post("/permissions", protect, authorize("admin"), createPermission);

router.get("/groups", protect, getAllGroups);
router.post("/groups", protect, authorize("admin"), createGroup);
router.put("/groups/:id", protect, authorize("admin"), updateGroup);
router.delete("/groups/:id", protect, authorize("admin"), deleteGroup);

router.post("/groups/add-user", protect, authorize("admin"), addUserToGroup);
router.post(
  "/groups/remove-user",
  protect,
  authorize("admin"),
  removeUserFromGroup
);

router.put(
  "/user/:userId/permissions",
  protect,
  authorize("admin"),
  updateUserPermissions
);
router.get("/user/:userId/permissions", protect, getUserPermissions);

export default router;
