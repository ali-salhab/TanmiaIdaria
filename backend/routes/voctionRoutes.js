import express from "express";
import { protect } from "../middleware/auth.js";
import checkPermission from "../middleware/checkPermission.js";
import {
  getVacationsByEmployee,
  addVacation,
  updateVacation,
  deleteVacation,
  generateSingleVacationTemplate,
  logPrintAction,
} from "../controllers/vacationController.js";

const router = express.Router();

router.get(
  "/employees/:id/vacations",
  protect,
  checkPermission("vacations.view"),
  getVacationsByEmployee
);
router.post(
  "/employees/:id/vacations",
  protect,
  checkPermission("vacations.create"),
  addVacation
);
router.put(
  "/vacations/:id",
  protect,
  checkPermission("vacations.edit"),
  updateVacation
);
router.delete(
  "/vacations/:id",
  protect,
  checkPermission("vacations.delete"),
  deleteVacation
);
router.get(
  "/vacations/:vacationId/template",
  protect,
  checkPermission("vacations.generate_template"),
  generateSingleVacationTemplate
);

router.post("/:id/print-log", protect, logPrintAction);

export default router;
