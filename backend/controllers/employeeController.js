import XLSX from "xlsx";
import multer from "multer";
import path from "path";
import fs from "fs";
import Employee from "../models/Employee.js";
import { notifyAdmin } from "../services/notificationService.js";
/**
 * @desc Upload or update employee profile photo
 * @route POST /api/employees/:id/photo
 * @access Private
 */
export const updateEmployeePhoto = async (req, res) => {
  console.log("profile image controller");
  try {
    // find employee
    const employee = await Employee.findById(req.params.id);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    if (!req.file)
      return res.status(400).json({ message: "No image file uploaded" });

    // if employee already has a photo, remove old file
    if (employee.photo) {
      const oldPath = path.join(
        process.cwd(),
        employee.photo.startsWith("/") ? employee.photo.slice(1) : employee.photo
      );
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // store new path in DB
    employee.photo = `/uploads/${req.file.filename}`;
    await employee.save();

    // Notify admin if action is performed by non-admin user
    if (req.user && req.user.role !== "admin") {
      await notifyAdmin({
        actionBy: req.user._id,
        section: "employees",
        action: "update",
        title: "تم تحديث صورة موظف",
        message: `تم تحديث صورة الموظف: ${employee.fullName || "غير محدد"}`,
        employeeName: employee.fullName,
        department: employee.level4 || employee.currentJobTitle || null,
      });
    }

    res.json({
      message: "Profile photo updated successfully",
      photo: employee.photo,
    });
  } catch (error) {
    console.error("Photo upload error:", error);
    res.status(500).json({ message: "Failed to upload photo" });
  }
};
export const uploadEmployeeDocs = async (req, res) => {
  console.log("====================================");
  console.log("upload docs for employee from employee controller");
  console.log("====================================");

  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    console.log(
      "================employee before added documents===================="
    );
    console.log(employee);

    const descriptions = JSON.parse(req.body.descriptions || "[]");

    const newDocs = req.files.map((file, i) => ({
      path: `/uploads/${file.filename}`,
      description: descriptions[i] || "",
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
      uploadedBy: req.user?._id,
    }));

    employee.documents.push(...newDocs);

    await employee.save();

    // Notify admin if action is performed by non-admin user
    if (req.user && req.user.role !== "admin") {
      await notifyAdmin({
        actionBy: req.user._id,
        section: "documents",
        action: "create",
        title: "تم إضافة وثائق لموظف",
        message: `تم إضافة ${newDocs.length} وثيقة للموظف: ${
          employee.fullName || "غير محدد"
        }`,
        employeeName: employee.fullName,
        department: employee.level4 || employee.currentJobTitle || null,
      });
    }

    res.json({
      message: "Documents uploaded successfully",
      documents: employee.documents,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteEmployeeDocument = async (req, res) => {
  try {
    const { id, docIndex } = req.params;
    const employee = await Employee.findById(id);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    const index = Number(docIndex);
    if (
      Number.isNaN(index) ||
      index < 0 ||
      index >= employee.documents.length
    ) {
      return res.status(400).json({ message: "Invalid document index" });
    }

    const [removed] = employee.documents.splice(index, 1);

    // Attempt to remove file from disk if it exists
    if (removed?.path) {
      const filePath = path.join(
        process.cwd(),
        removed.path.startsWith("/") ? removed.path.slice(1) : removed.path
      );
      fs.unlink(filePath, () => {});
    }

    await employee.save();

    res.json({
      message: "Document deleted successfully",
      documents: employee.documents,
    });
  } catch (error) {
    console.error("Delete employee document error:", error);
    res.status(500).json({ message: "Failed to delete document" });
  }
};
export const listEmployees = async (req, res) => {
  console.log("filtered.....", req.query);

  try {
    // build filters from query
    const filters = {};
    const allowed = [
      "governorate",
      "gender",
      "nationality",
      "currentJobTitle",
      "university",
      "workLocation",
      "level1",
      "level2",
      "level3",
      "level4",
      "level5",
      "level6",
      "nationalId",
      "jobCategory",
      "status",
      "phone",
      "employmentType",
      "selfNumber",
      "maritalStatus",
      "educationLevel",
      "specialization",
      "contractType",
      "bloodType",
    ];
    allowed.forEach((k) => {
      if (req.query[k]) filters[k] = req.query[k];
    });

    // Age Filter
    if (req.query.ageMin || req.query.ageMax) {
      const today = new Date();
      filters.birthDate = {};

      if (req.query.ageMin) {
        const maxBirthDate = new Date(
          today.getFullYear() - parseInt(req.query.ageMin),
          today.getMonth(),
          today.getDate()
        );
        filters.birthDate.$lte = maxBirthDate;
      }

      if (req.query.ageMax) {
        const minBirthDate = new Date(
          today.getFullYear() - parseInt(req.query.ageMax) - 1,
          today.getMonth(),
          today.getDate()
        );
        filters.birthDate.$gte = minBirthDate;
      }
    }

    const searchQuery = req.query.q || req.query.search;
    if (searchQuery) {
      filters.$or = [
        { fullName: new RegExp(searchQuery, "i") },
        { nationalId: new RegExp(searchQuery, "i") },
        { phone: new RegExp(searchQuery, "i") },
      ];
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const total = await Employee.countDocuments(filters);
    const data = await Employee.find(filters)

      .skip(skip)
      .limit(limit)
      .sort({ createdAt: 1 });
    console.log(data.length);
    res.json({ total, page, limit, data });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
export const getEmployee = async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) return res.status(404).json({ message: "Not found" });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
export const createEmployee = async (req, res) => {
  try {
    const emp = new Employee(req.body);
    await emp.save();

    // Notify admin if action is performed by non-admin user
    if (req.user && req.user.role !== "admin") {
      await notifyAdmin({
        actionBy: req.user._id,
        section: "employees",
        action: "create",
        title: "تم إنشاء موظف جديد",
        message: `تم إنشاء موظف جديد: ${emp.fullName || "غير محدد"}`,
        employeeName: emp.fullName,
        department: emp.level4 || emp.currentJobTitle || null,
      });
    }

    res.status(201).json(emp);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
export const updateEmployee = async (req, res) => {
  try {
    const emp = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!emp) return res.status(404).json({ message: "Not found" });

    // Notify admin if action is performed by non-admin user
    if (req.user && req.user.role !== "admin") {
      await notifyAdmin({
        actionBy: req.user._id,
        section: "employees",
        action: "update",
        title: "تم تحديث بيانات موظف",
        message: `تم تحديث بيانات الموظف: ${emp.fullName || "غير محدد"}`,
        employeeName: emp.fullName,
        department: emp.level4 || emp.currentJobTitle || null,
      });
    }

    res.json(emp);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
export const deleteEmployee = async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) return res.status(404).json({ message: "Not found" });

    await Employee.findByIdAndDelete(req.params.id);

    // Notify admin if action is performed by non-admin user
    if (req.user && req.user.role !== "admin") {
      await notifyAdmin({
        actionBy: req.user._id,
        section: "employees",
        action: "delete",
        title: "تم حذف موظف",
        message: `تم حذف الموظف: ${emp.fullName || "غير محدد"}`,
        employeeName: emp.fullName,
        department: emp.level4 || emp.currentJobTitle || null,
      });
    }

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
const safeDate = (value) => {
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};
const safeNumber = (v) => {
  const n = Number(v);
  return isNaN(n) ? null : n;
};
const yes = (v) => String(v).trim() === "نعم";
export const importExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    const mapped = raw.map((row) => ({
      selfNumber: dashToNull(
        row["الرقم الذاتي"] ||
          row["selfNumber"] ||
          row["selfnumber"] ||
          row["Self Number"] ||
          row["SelfNumber"] ||
          row["الرقم الوظيفي"]
      ),
      firstName: row["الاسم الأول"] || row["firstName"] || "",
      fatherName: row["اسم الأب"] || row["fatherName"] || "",
      lastName: row["الكنية"] || row["lastName"] || "",
      fullName: row["الاسم الثلاثي"] || row["fullName"] || "",
      motherNameAndLastName: row["اسم الأم والكنية"] || "",
      nationalId: dashToNull(
        row["الرقم الوطني"] ||
          row["nationalId"] ||
          row["national id"] ||
          row["National ID"] ||
          row["NationalId"]
      ),
      nationality: row["الجنسية"] || row["nationality"] || "",
      governorate: row["المحافظة"] || row["governorate"] || "",
      city: row["المنطقة - المدينة"] || row["city"] || "",
      district: row["الناحية"] || row["district"] || "",
      birthPlace: row["محل الولادة"] || row["birthPlace"] || "",
      birthDate: safeDate(row["تاريخ الولادة"] || row["birthDate"]),
      registrationNumber: row["القيد"] || row["registrationNumber"] || "",
      gender: row["الجنس"] || row["gender"] || "",
      phone: row["رقم الهاتف"] || row["phone"] || "",
      maritalStatus: row["الوضع العائلي"] || row["maritalStatus"] || "",
      wivesCount: row["عدد الزوجات"] || null,
      childrenCount: row["عدد الأبناء"] || null,
      level1: row["السوية التنظيمية الأولى"] || "",
      level2: row["السوية التنظيمية الثانية"] || "",
      level3: row["السوية التنظيمية الثالثة"] || "",
      level4: row["السوية التنظيمية الرابعة"] || "",
      level5: row["السوية التنظيمية الخامسة"] || "",
      level6: row["السوية التنظيمية السادسة"] || "",
      currentJobTitle: row["المسمى الوظيفي الحالي"] || row["currentJobTitle"] || "",
      employmentType: row["مثبت-متعاقد"] || row["employmentType"] || "",
      status: row["الحالة"] || row["status"] || "",
      hiringDate: safeDate(row["تاريخ التعيين"] || row["hiringDate"]),
      contractType: row["نمط التعيين أو التعاقد"] || row["contractType"] || "",
      contractDetails:
        row["اذكر نمط التعيين أو التعاقد"] || row["contractDetails"] || "",
      jobCategory: row["الفئة الوظيفية الحالية"] || row["jobCategory"] || "",
      educationLevel:
        row["المؤهل العلمي المعيين على أساسه أو المعدل فئته عليه"] ||
        row["educationLevel"] ||
        "",
      specialization: row["الاختصاص"] || row["specialization"] || "",
      residenceGovernorate:
        row["السكن (المحافظة)"] || row["residenceGovernorate"] || "",
      residenceCity:
        row["السكن (المنطقة - المدينة)"] || row["residenceCity"] || "",
      housingType: row["نوع السكن"] || row["housingType"] || "",
      spouseIsEmployee:
        row["هل ( الزوج /الزوجة ) موظف في القطاع الحكومي؟"] === "نعم" ||
        row["spouseIsEmployee"] === "نعم" ||
        row["spouseIsEmployee"] === true,
      spouseFullName:
        row["الاسم الثلاثي لــ( الزوج/الزوجة ) في حال كان موظف"] ||
        row["spouseFullName"] ||
        "",
      spouseWorkplace:
        row["الجهة التي يعمل بها (الزوج/الزوجة) في حال كان موظف"] ||
        row["spouseWorkplace"] ||
        "",
      healthStatus: row["الحالة الصحية"] || row["healthStatus"] || "",
      illnessDetails:
        row["تفصيل الإصابة أو المرض"] || row["illnessDetails"] || "",
      bloodType: row["زمرة الدم"] || row["bloodType"] || "",
      degreeType: row["نوع الشهادة الحاصل عليها"] || row["degreeType"] || "",
      documentAvailable:
        yes(row["وجود الوثيقة"]) ||
        row["documentAvailable"] === "نعم" ||
        row["documentAvailable"] === true,
      university: row["الجامعة"] || row["university"] || "",
      faculty: row["الكلية-المعهد"] || row["faculty"] || "",
      specialization2: row["الاختصاص2"] || row["specialization2"] || "",
      graduationYear: row["عام الحصول عليها"] || row["graduationYear"] || "",
      managementDegree:
        row["هل لديك شهادة عليا في الإدارة؟"] === "نعم" ||
        row["managementDegree"] === "نعم" ||
        row["managementDegree"] === true,
      notes: row["ملاحظات"] || row["notes"] || "",
      workLocation: row["مكان الدوام"] || row["workLocation"] || "",
      onStaff:
        yes(row["ملاك أو خارج الملاك"]) ||
        row["onStaff"] === "نعم" ||
        row["onStaff"] === true,
      lastSalary: safeNumber(row["آخر راتب مقطوع"] || row["lastSalary"]),
    }));

    // Remove only duplicate selfNumbers (keep nulls)
    const filtered = mapped.filter((emp, index, arr) => 
      !emp.selfNumber || arr.findIndex(e => e.selfNumber === emp.selfNumber) === index
    );

    try {
      await Employee.insertMany(filtered, { ordered: false });
    } catch (err) {
      console.error("InsertMany Error Details:");
      console.error(err.writeErrors);
    }
    console.log("----------------number of inserted emolyees---------");
    const count = await Employee.countDocuments();
    console.log("Total employees in DB:", count);
    // remove uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ message: "Imported", count: count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Import failed", error: err.message });
  }
};
const dashToNull = (v) => {
  if (v === "" || v === "-" || v === undefined || v === null) return undefined;
  if (typeof v === "string") {
    const trimmed = v.trim();
    return trimmed === "" || trimmed === "-" ? undefined : trimmed;
  }
  return v;
};

// Download a ready-to-fill Excel template for employee imports
export const downloadEmployeeTemplate = async (req, res) => {
  try {
    const templatePath = path.join(
      process.cwd(),
      "backend",
      "templatework.xlsx"
    );
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ message: "Template file not found" });
    }
    res.download(templatePath, "employee-import-template.xlsx");
  } catch (err) {
    console.error("Template download error:", err);
    res.status(500).json({ message: "Failed to download template" });
  }
};

export const exportExcel = async (req, res) => {
  console.log("====================================");
  console.log("import excell controller ");
  console.log("====================================");
  try {
    // build same filters as list
    const filters = {};
    const allowed = [
      "governorate",
      "gender",
      "nationality",
      "currentJobTitle",
      "university",
      "workLocation",
    ];
    allowed.forEach((k) => {
      if (req.query[k]) filters[k] = req.query[k];
    });
    if (req.query.q) {
      filters.$or = [
        { fullName: new RegExp(req.query.q, "i") },
        { nationalId: new RegExp(req.query.q, "i") },
      ];
    }
    const data = await Employee.find(filters).lean();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="employees.xlsx"'
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buf);
  } catch (err) {
    res.status(500).json({ message: "Export failed" });
  }
};
