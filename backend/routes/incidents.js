import express from "express";
import { protect } from "../middleware/auth.js";
import checkPermission from "../middleware/checkPermission.js";
import {
  createIncident,
  deleteIncident,
  updateIncident,
  getIncidentsByEmployee,
  generateEmployeeCV,
  exportInternalIncidents,
} from "../controllers/incidentController.js";

const router = express.Router();
router.post("/", protect, checkPermission("incidents.create"), createIncident);
router.get(
  "/:id/generate-cv",
  protect,
  checkPermission("incidents.generate_cv"),
  generateEmployeeCV
);
router.get(
  "/:employeeId/export-internal",
  protect,
  checkPermission("incidents.generate_cv"),
  exportInternalIncidents
);
router.delete(
  "/:id/",
  protect,
  checkPermission("incidents.delete"),
  deleteIncident
);
router.put("/:id/", protect, checkPermission("incidents.edit"), updateIncident);
router.get(
  "/:employeeId",
  protect,
  checkPermission("incidents.view"),
  getIncidentsByEmployee
);
export default router;
