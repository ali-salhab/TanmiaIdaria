import express from "express";
import {
  createIncident,
  deleteIncident,
  updateIncident,
  getIncidentsByEmployee,
  generateEmployeeCV,
} from "../controllers/incidentController.js";

const router = express.Router();
router.post("/", createIncident);
router.get("/:id/generate-cv", generateEmployeeCV);
router.delete("/:id/", deleteIncident);
router.put("/:id/", updateIncident);
router.get("/:employeeId", getIncidentsByEmployee);
export default router;
