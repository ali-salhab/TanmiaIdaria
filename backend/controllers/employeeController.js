import XLSX from "xlsx";
import multer from "multer";
import path from "path";
import fs from "fs";
import Employee from "../models/Employee.js";
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
      const oldPath = path.join("uploads", path.basename(employee.photo));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // store new path in DB
    employee.photo = `/uploads/${req.file.filename}`;
    await employee.save();

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
    }));

    employee.documents.push(...newDocs);

    await employee.save();

    res.json({
      message: "Documents uploaded successfully",
      documents: employee.documents,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: error.message });
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
      "level4",
    ];
    allowed.forEach((k) => {
      if (req.query[k]) filters[k] = req.query[k];
    });

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
    res.json(emp);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
export const deleteEmployee = async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
export const importExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    const mapped = raw.map((row) => ({
      selfNumber: row["الرقم الذاتي"] || row["selfNumber"] || "",
      firstName: row["الاسم الأول"] || row["firstName"] || "",
      fatherName: row["اسم الأب"] || row["fatherName"] || "",
      lastName: row["الكنية"] || row["lastName"] || "",
      fullName: row["الاسم الثلاثي"] || row["fullName"] || "",
      motherNameAndLastName: row["اسم الأم والكنية"] || "",
      nationalId: row["الرقم الوطني"] || "",
      nationality: row["الجنسية"] || "",
      governorate: row["المحافظة"] || "",
      city: row["المنطقة - المدينة"] || "",
      district: row["الناحية"] || "",
      birthPlace: row["محل الولادة"] || "",
      birthDate: row["تاريخ الولادة"] ? new Date(row["تاريخ الولادة"]) : null,
      registrationNumber: row["القيد"] || "",
      gender: row["الجنس"] || "",
      phone: row["رقم الهاتف"] || "",
      maritalStatus: row["الوضع العائلي"] || "",
      wivesCount: row["عدد الزوجات"] || null,
      childrenCount: row["عدد الأبناء"] || null,
      level1: row["السوية التنظيمية الأولى"] || "",
      level2: row["السوية التنظيمية الثانية"] || "",
      level3: row["السوية التنظيمية الثالثة"] || "",
      level4: row["السوية التنظيمية الرابعة"] || "",
      level5: row["السوية التنظيمية الخامسة"] || "",
      level6: row["السوية التنظيمية السادسة"] || "",
      currentJobTitle: row["المسمى الوظيفي الحالي"] || "",
      employmentType: row["مثبت-متعاقد"] || "",
      status: row["الحالة"] || "",
      hiringDate: row["تاريخ التعيين"] ? new Date(row["تاريخ التعيين"]) : null,
      contractType: row["نمط التعيين أو التعاقد"] || "",
      contractDetails: row["اذكر نمط التعيين أو التعاقد"] || "",
      jobCategory: row["الفئة الوظيفية الحالية"] || "",
      educationLevel:
        row["المؤهل العلمي المعيين على أساسه أو المعدل فئته عليه"] || "",
      specialization: row["الاختصاص"] || "",
      residenceGovernorate: row["السكن (المحافظة)"] || "",
      residenceCity: row["السكن (المنطقة - المدينة)"] || "",
      housingType: row["نوع السكن"] || "",
      spouseIsEmployee:
        row["هل ( الزوج /الزوجة ) موظف في القطاع الحكومي؟"] === "نعم",
      spouseFullName:
        row["الاسم الثلاثي لــ( الزوج/الزوجة ) في حال كان موظف"] || "",
      spouseWorkplace:
        row["الجهة التي يعمل بها (الزوج/الزوجة) في حال كان موظف"] || "",
      healthStatus: row["الحالة الصحية"] || "",
      illnessDetails: row["تفصيل الإصابة أو المرض"] || "",
      bloodType: row["زمرة الدم"] || "",
      degreeType: row["نوع الشهادة الحاصل عليها"] || "",
      documentAvailable: row["وجود الوثيقة"] === "نعم",
      university: row["الجامعة"] || "",
      faculty: row["الكلية-المعهد"] || "",
      specialization2: row["الاختصاص2"] || "",
      graduationYear: row["عام الحصول عليها"] || "",
      managementDegree: row["هل لديك شهادة عليا في الإدارة؟"] === "نعم",
      notes: row["ملاحظات"] || "",
      workLocation: row["مكان الدوام"] || "",
      onStaff: row["ملاك أو خارج الملاك"] === "ملاك",
      lastSalary: row["آخر راتب مقطوع"] ? Number(row["آخر راتب مقطوع"]) : null,
    }));

    // bulk insert (use insertMany)
    await Employee.insertMany(mapped, { ordered: false });

    // remove uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ message: "Imported", count: mapped.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Import failed", error: err.message });
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
