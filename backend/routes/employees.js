import express from "express";
import multer from "multer";
import path from "path";
import Incident from "../models/Incident.js";
import Employee from "../models/Employee.js";
import { generatePersonalCard } from "../utils/generatePersonalCard.js";

import { protect, authorize } from "../middleware/auth.js";
import * as empCtrl from "../controllers/employeeController.js";
import { uploadEmployeeDocs } from "../controllers/employeeController.js";

const router = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});
const upload = multer({ storage });
router.post("/:id/upload", upload.array("files"), uploadEmployeeDocs);

router.get("/", protect, empCtrl.listEmployees);
router.get("/export", protect, empCtrl.exportExcel);
router.get("/:id", protect, empCtrl.getEmployee);
router.post("/", protect, authorize("admin"), empCtrl.createEmployee);
router.put(
  "/:id",
  protect,
  authorize(["admin", "user"]),
  empCtrl.updateEmployee
);
router.delete("/:id", protect, authorize("admin"), empCtrl.deleteEmployee);
router.post(
  "/import",
  protect,
  authorize("admin"),
  upload.single("file"),
  empCtrl.importExcel
);

/* Notes & Next Steps */
// - Map column names in importExcel to match the exact headers in your Excel file.
// - For initial setup you may want to create the first admin user by calling /api/auth/register
// or temporarily disabling protect/authorize on that route.
// - Consider adding rate-limiting, request size limits, and stricter validation.
// - Add indexes on frequently filtered fields (e.g., nationalId, fullName, governorate).
// - If the Excel contains dates in dd/mm/yyyy or Excel's serial format, you may need
// additional parsing logic.

// End of boilerplate

router.get("/:id/personal-card", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    const incidents = await Incident.find({ employee: req.params.id });

    if (!employee) return res.status(404).json({ message: "الموظف غير موجود" });

    const filePath = await generatePersonalCard(employee, incidents);

    res.download(filePath, `البطاقة_${employee.full_name}.docx`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ أثناء إنشاء البطاقة الذاتية" });
  }
});

export default router;
