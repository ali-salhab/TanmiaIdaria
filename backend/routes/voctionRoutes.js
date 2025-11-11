import express from "express";
import {
  getVacationsByEmployee,
  addVacation,
  updateVacation,
  deleteVacation,
} from "../controllers/vacationController.js";

const router = express.Router();

router.get("/employees/:id/vacations", getVacationsByEmployee);
router.post("/employees/:id/vacations", addVacation);
router.put("/vacations/:id", updateVacation);
router.delete("/vacations/:id", deleteVacation);

export default router;
