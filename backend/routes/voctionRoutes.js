import express from "express";
import { protect } from "../middleware/auth.js";
import checkPermission from "../middleware/checkPermission.js";
import {
  getVacationsByEmployee,
  addVacation,
  updateVacation,
  deleteVacation,
  generateVacationDocument,
  generateSingleVacationTemplate,
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
  "/employees/:id/vacations/export/word",
  protect,
  checkPermission("vacations.export"),
  generateVacationDocument
);
router.get(
  "/vacations/:vacationId/template",
  protect,
  checkPermission("vacations.generate_template"),
  generateSingleVacationTemplate
);

export default router;
