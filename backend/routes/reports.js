import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import * as reportCtrl from "../controllers/reportController.js";

const router = express.Router();

// All routes are protected and admin-only
router.use(protect);
router.use(authorize("admin"));

// Get report data with statistics
router.get("/data", reportCtrl.getReportData);

// Archive management
router.post("/archive", reportCtrl.saveReportConfig);
router.get("/archive", reportCtrl.getArchivedReports);
router.delete("/archive/:id", reportCtrl.deleteArchivedReport);
router.put("/archive/:id/use", reportCtrl.updateReportLastUsed);

// Export routes
router.get("/export/excel", reportCtrl.exportReportExcel);

export default router;
