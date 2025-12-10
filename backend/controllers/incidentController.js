import Incident from "../models/Incident.js";
import fs from "fs";

import path from "path";
import Employee from "../models/Employee.js";
import { fileURLToPath } from "url";

import ExcelJS from "exceljs";

import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
  TextRun,
  AlignmentType,
  BorderStyle,
  VerticalAlign,
} from "docx";
import { notifyAdmin } from "../services/notificationService.js";
export const generateEmployeeCV = async (req, res) => {
  console.log(
    "================ generate Excel file (ExcelJS) ===================="
  );

  try {
    const { id } = req.params;

    // 1️⃣ Fetch employee & related incidents
    const incidents = await Incident.find({ employee: id });
    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).send("Employee not found");

    employee.incidents = incidents;

    // 2️⃣ Get path info
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const templatePath = path.join(__dirname, "..", "templatework.xlsx"); // ⚠️ Make sure your template is .xlsx

    // 3️⃣ Load workbook with ExcelJS
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    const sheet = workbook.worksheets[0]; // first sheet

    // 4️⃣ Fill static employee info
    const safe = (val) => (val ? String(val) : "");
    const formatDate = (date) => {
      if (!date) return "";
      const d = new Date(date);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    };

    sheet.getCell("B7").value = safe(employee.fullName);
    sheet.getCell("D7").value = safe(employee.fatherName);
    sheet.getCell("E7").value = safe(employee.motherNameAndLastName);
    sheet.getCell("G7").value = `${safe(employee.birthPlace)} ${formatDate(
      employee.birthDate
    )}`;
    sheet.getCell("H7").value = safe(employee.registrationNumber);
    sheet.getCell("K7").value = safe(employee.gender);
    sheet.getCell("L7").value = safe(employee.nationality);
    sheet.getCell("H5").value = safe(employee.nationalId);

    // Add Excel Data Fields (Levels) - Adjust cell references as needed based on template
    sheet.getCell("B8").value = safe(employee.level1);
    sheet.getCell("D8").value = safe(employee.level2);
    sheet.getCell("F8").value = safe(employee.level3);
    sheet.getCell("H8").value = safe(employee.level4);
    sheet.getCell("J8").value = safe(employee.level5);
    sheet.getCell("L8").value = safe(employee.level6);

    sheet.getCell("B9").value = safe(employee.selfNumber);
    sheet.getCell("D9").value = safe(employee.currentJobTitle);
    sheet.getCell("F9").value = safe(employee.jobCategory);

    // 5️⃣ Find the row where incidents should start (for example, row 14)
    const startRow = 15;

    // 6️⃣ Insert new rows dynamically (push existing rows down)
    sheet.spliceRows(startRow, 0, ...Array(employee.incidents.length).fill([]));

    // 7️⃣ Fill incidents dynamically
    employee.incidents.forEach((incident, index) => {
      const row = startRow + index;
      const r = sheet.getRow(row);

      r.getCell(1).value = safe(incident.work_center);
      r.getCell(2).value = safe(incident.job_title);
      r.getCell(3).value = safe(incident.job_type);
      r.getCell(4).value = safe(incident.salary);
      r.getCell(5).value = safe(incident.category);
      r.getCell(6).value = formatDate(incident.start_date);
      r.getCell(7).value = formatDate(incident.change_date);
      r.getCell(8).value = safe(incident.reason);
      r.getCell(9).value = safe(incident.document_type);
      r.getCell(10).value = safe(incident.document_number);
      r.getCell(11).value = formatDate(incident.document_date);
      r.getCell(12).value = formatDate(incident.start_date);

      // Optional: copy style from the previous (template) row for consistency
      const templateRow = sheet.getRow(startRow - 1);
      templateRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (cell.style) r.getCell(colNumber).style = { ...cell.style };
      });
    }); // 8️⃣ Adjust column widths if necessary
    sheet.columns.forEach((col) => {
      let maxLength = 0;
      col.eachCell({ includeEmpty: true }, (cell) => {
        const len = cell.value ? cell.value.toString().length : 0;
        if (len > maxLength) maxLength = len;
      });
      col.width = Math.min(maxLength + 2, 40);
    });

    // 9️⃣ Save and send output
    const safeName = employee.fullName.replace(/[<>:"/\\|?*]+/g, "_");
    const outputPath = path.join(__dirname, `البطاقة_الذاتية_${safeName}.xlsx`);

    await workbook.xlsx.writeFile(outputPath);

    res.download(outputPath, (err) => {
      if (err) console.error("Download error:", err);
      fs.unlinkSync(outputPath); // delete after sending
    });
  } catch (error) {
    console.error("❌ Error generating Excel file:", error);
    res.status(500).send("Server error while generating Excel file");
  }
};
export const createIncident = async (req, res) => {
  try {
    const incident = await Incident.create(req.body);

    // Notify admin if action is performed by non-admin user
    if (req.user && req.user.role !== "admin") {
      // Get employee info for better notification context
      const employee = await Employee.findById(incident.employee);
      await notifyAdmin({
        actionBy: req.user._id,
        section: "incidents",
        action: "create",
        title: "تم إنشاء حادث جديد",
        message: `تم إنشاء حادث جديد للموظف: ${
          employee?.fullName || "غير محدد"
        }`,
        employeeName: employee?.fullName,
        department: employee?.level4 || employee?.currentJobTitle || null,
      });
    }

    res.status(201).json(incident);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getIncidentsByEmployee = async (req, res) => {
  try {
    const incidents = await Incident.find({
      employee: req.params.employeeId,
    }).sort({ start_date: 1 });
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const deleteIncident = async (req, res) => {
  try {
    console.log(req.params.id);

    const incident = await Incident.findById(req.params.id);
    console.log(incident);
    if (!incident) {
      console.log("==============if======================");

      return res.status(404).send({ message: "content not found" });
    } else {
      console.log("================else====================");

      // Notify admin if action is performed by non-admin user
      if (req.user && req.user.role !== "admin") {
        // Get employee info for better notification context
        const employee = await Employee.findById(incident.employee);
        await notifyAdmin({
          actionBy: req.user._id,
          section: "incidents",
          action: "delete",
          title: "تم حذف حادث",
          message: `تم حذف الحادث للموظف: ${employee?.fullName || "غير محدد"}`,
          employeeName: employee?.fullName,
          department: employee?.level4 || employee?.currentJobTitle || null,
        });
      }

      const result = await Incident.deleteOne({ _id: req.params.id });
      console.log(result);
      return res.send({ result });
    }

    res.send({ message: "error" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/incidents/:id
export const updateIncident = async (req, res) => {
  try {
    const incident = await Incident.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!incident)
      return res.status(404).json({ message: "Incident not found" });

    // Notify admin if action is performed by non-admin user
    if (req.user && req.user.role !== "admin") {
      // Get employee info for better notification context
      const employee = await Employee.findById(incident.employee);
      await notifyAdmin({
        actionBy: req.user._id,
        section: "incidents",
        action: "update",
        title: "تم تحديث بيانات حادث",
        message: `تم تحديث بيانات الحادث للموظف: ${
          employee?.fullName || "غير محدد"
        }`,
        employeeName: employee?.fullName,
        department: employee?.level4 || employee?.currentJobTitle || null,
      });
    }

    res.json(incident);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
