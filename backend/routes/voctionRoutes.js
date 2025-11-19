import express from "express";
import {
  getVacationsByEmployee,
  addVacation,
  updateVacation,
  deleteVacation,
  generateVacationDocument,
  generateSingleVacationTemplate,
} from "../controllers/vacationController.js";

const router = express.Router();

router.get("/employees/:id/vacations", getVacationsByEmployee);
router.post("/employees/:id/vacations", addVacation);
router.put("/vacations/:id", updateVacation);
router.delete("/vacations/:id", deleteVacation);
router.get("/employees/:id/vacations/export/word", generateVacationDocument);
router.get("/vacations/:vacationId/template", generateSingleVacationTemplate);

export default router;
