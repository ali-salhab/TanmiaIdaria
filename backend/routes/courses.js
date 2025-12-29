import express from "express";
import {
  getCourses,
  createCourse,
  deleteCourse,
} from "../controllers/courseController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import checkPermission from "../middleware/checkPermission.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get(
  "/:employeeId",
  verifyToken,
  checkPermission("courses.view"),
  getCourses
);
router.post(
  "/:employeeId",
  verifyToken,
  checkPermission("courses.create"),
  upload.single("file"),
  createCourse
);
router.delete(
  "/:id",
  verifyToken,
  checkPermission("courses.delete"),
  deleteCourse
);

export default router;
