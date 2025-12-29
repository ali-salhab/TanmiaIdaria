import express from "express";
import { protect } from "../middleware/auth.js";
import checkPermission from "../middleware/checkPermission.js";
import * as reportCtrl from "../controllers/reportController.js";

const router = express.Router();

// All routes are protected
router.use(protect);

// Get report data with statistics
router.get("/data", checkPermission("reports.view"), reportCtrl.getReportData);

// Export report to Word
router.get(
  "/export/word",
  checkPermission("reports.export"),
  reportCtrl.exportReportToWord
);

// Archive management
router.post(
  "/archive",
  checkPermission("reports.archive"),
  reportCtrl.saveReportConfig
);
router.get(
  "/archive",
  checkPermission("reports.view_archived"),
  reportCtrl.getArchivedReports
);
router.delete(
  "/archive/:id",
  checkPermission("reports.delete"),
  reportCtrl.deleteArchivedReport
);
router.put(
  "/archive/:id/use",
  checkPermission("reports.view"),
  reportCtrl.updateReportLastUsed
);

// Export routes
router.get(
  "/export/excel",
  checkPermission("reports.export"),
  reportCtrl.exportReportExcel
);

export default router;
