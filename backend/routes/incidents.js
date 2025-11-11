import express from "express";
import {
  createIncident,
  deleteIncident,
  updateIncident,
  getIncidentsByEmployee,
} from "../controllers/incidentController.js";

const router = express.Router();
// get all incidents for employee
router.post("/", createIncident);
//
router.get("/:employeeId", getIncidentsByEmployee);
router.delete("/:id/", deleteIncident);
router.put("/:id/", updateIncident);
export default router;
// work on incident to generate word file
