import Employee from "../models/Employee.js";
import Report from "../models/Report.js";
import XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

/**
 * @desc Get filtered employee data with statistics
 * @route GET /api/reports/data
 * @access Private (Admin only)
 */
export const getReportData = async (req, res) => {
  try {
    // Build filters from query
    const filters = {};
    const allowedFilters = [
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
    ];

    allowedFilters.forEach((key) => {
      if (req.query[key]) {
        filters[key] = req.query[key];
      }
    });

    // Search query
    const searchQuery = req.query.search || req.query.q;
    if (searchQuery) {
      filters.$or = [
        { fullName: new RegExp(searchQuery, "i") },
        { nationalId: new RegExp(searchQuery, "i") },
        { phone: new RegExp(searchQuery, "i") },
      ];
    }

    // Age filter
    if (req.query.ageMin || req.query.ageMax) {
      const today = new Date();
      if (req.query.ageMin) {
        const maxBirthDate = new Date(
          today.getFullYear() - parseInt(req.query.ageMin),
          today.getMonth(),
          today.getDate()
        );
        filters.birthDate = { ...filters.birthDate, $lte: maxBirthDate };
      }
      if (req.query.ageMax) {
        const minBirthDate = new Date(
          today.getFullYear() - parseInt(req.query.ageMax) - 1,
          today.getMonth(),
          today.getDate()
        );
        filters.birthDate = { ...filters.birthDate, $gte: minBirthDate };
      }
    }

    // Hiring date filter
    if (req.query.hiringDateFrom || req.query.hiringDateTo) {
      filters.hiringDate = {};
      if (req.query.hiringDateFrom) {
        filters.hiringDate.$gte = new Date(req.query.hiringDateFrom);
      }
      if (req.query.hiringDateTo) {
        filters.hiringDate.$lte = new Date(req.query.hiringDateTo);
      }
    }

    // Fetch filtered employees
    const employees = await Employee.find(filters).lean();

    // Calculate statistics
    const statistics = {
      total: employees.length,
      byGender: {},
      byDepartment: {},
      byEmploymentType: {},
      byJobCategory: {},
      byAge: {
        "20-30": 0,
        "31-40": 0,
        "41-50": 0,
        "51-60": 0,
        "60+": 0,
      },
      byEducation: {},
      byMaritalStatus: {},
      averageAge: 0,
    };

    // Calculate age helper
    const calculateAge = (birthDate) => {
      if (!birthDate) return null;
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birth.getDate())
      ) {
        age--;
      }
      return age;
    };

    let totalAge = 0;
    let ageCount = 0;

    employees.forEach((emp) => {
      // Gender statistics
      if (emp.gender) {
        statistics.byGender[emp.gender] =
          (statistics.byGender[emp.gender] || 0) + 1;
      }

      // Department statistics
      if (emp.level4) {
        statistics.byDepartment[emp.level4] =
          (statistics.byDepartment[emp.level4] || 0) + 1;
      }

      // Employment type statistics
      if (emp.employmentType) {
        statistics.byEmploymentType[emp.employmentType] =
          (statistics.byEmploymentType[emp.employmentType] || 0) + 1;
      }

      // Job category statistics
      if (emp.jobCategory) {
        statistics.byJobCategory[emp.jobCategory] =
          (statistics.byJobCategory[emp.jobCategory] || 0) + 1;
      }

      // Age statistics
      const age = calculateAge(emp.birthDate);
      if (age !== null) {
        totalAge += age;
        ageCount++;

        if (age >= 20 && age <= 30) statistics.byAge["20-30"]++;
        else if (age >= 31 && age <= 40) statistics.byAge["31-40"]++;
        else if (age >= 41 && age <= 50) statistics.byAge["41-50"]++;
        else if (age >= 51 && age <= 60) statistics.byAge["51-60"]++;
        else if (age > 60) statistics.byAge["60+"]++;
      }

      // Education statistics
      if (emp.educationLevel) {
        statistics.byEducation[emp.educationLevel] =
          (statistics.byEducation[emp.educationLevel] || 0) + 1;
      }

      // Marital status statistics
      if (emp.maritalStatus) {
        statistics.byMaritalStatus[emp.maritalStatus] =
          (statistics.byMaritalStatus[emp.maritalStatus] || 0) + 1;
      }
    });

    statistics.averageAge = ageCount > 0 ? (totalAge / ageCount).toFixed(1) : 0;

    // Transform statistics for frontend charts
    const formattedStatistics = {
      ...statistics,
      genderData: Object.entries(statistics.byGender).map(([name, value]) => ({
        name,
        value,
      })),
      departmentData: Object.entries(statistics.byDepartment).map(
        ([name, count]) => ({ name, count })
      ),
      employmentTypeData: Object.entries(statistics.byEmploymentType).map(
        ([name, value]) => ({ name, value })
      ),
      jobCategoryData: Object.entries(statistics.byJobCategory).map(
        ([name, count]) => ({ name, count })
      ),
      ageData: Object.entries(statistics.byAge).map(([age, count]) => ({
        age,
        count,
      })),
      educationData: Object.entries(statistics.byEducation).map(
        ([name, count]) => ({ name, count })
      ),
      maritalStatusData: Object.entries(statistics.byMaritalStatus).map(
        ([name, value]) => ({ name, value })
      ),
    };

    res.json({
      success: true,
      data: employees,
      statistics: formattedStatistics,
      filters: req.query,
    });
  } catch (error) {
    console.error("Error fetching report data:", error);
    res.status(500).json({
      success: false,
      message: "فشل في جلب بيانات التقرير",
      error: error.message,
    });
  }
};

/**
 * @desc Save report configuration to archive
 * @route POST /api/reports/archive
 * @access Private (Admin only)
 */
export const saveReportConfig = async (req, res) => {
  try {
    const { name, description, filters } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "اسم التقرير مطلوب",
      });
    }

    const report = new Report({
      name,
      description,
      filters,
      createdBy: req.user._id,
    });

    await report.save();

    res.status(201).json({
      success: true,
      message: "تم حفظ التقرير بنجاح",
      data: report,
    });
  } catch (error) {
    console.error("Error saving report:", error);
    res.status(500).json({
      success: false,
      message: "فشل في حفظ التقرير",
      error: error.message,
    });
  }
};

/**
 * @desc Get archived reports
 * @route GET /api/reports/archive
 * @access Private (Admin only)
 */
export const getArchivedReports = async (req, res) => {
  try {
    const reports = await Report.find({ createdBy: req.user._id })
      .sort({ lastUsed: -1 })
      .populate("createdBy", "username");

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("Error fetching archived reports:", error);
    res.status(500).json({
      success: false,
      message: "فشل في جلب التقارير المحفوظة",
      error: error.message,
    });
  }
};

/**
 * @desc Delete archived report
 * @route DELETE /api/reports/archive/:id
 * @access Private (Admin only)
 */
export const deleteArchivedReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "التقرير غير موجود",
      });
    }

    // Check if user owns the report
    if (report.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بحذف هذا التقرير",
      });
    }

    await Report.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "تم حذف التقرير بنجاح",
    });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({
      success: false,
      message: "فشل في حذف التقرير",
      error: error.message,
    });
  }
};

/**
 * @desc Update last used timestamp for report
 * @route PUT /api/reports/archive/:id/use
 * @access Private (Admin only)
 */
export const updateReportLastUsed = async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { lastUsed: Date.now() },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "التقرير غير موجود",
      });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({
      success: false,
      message: "فشل في تحديث التقرير",
      error: error.message,
    });
  }
};

/**
 * @desc Export report data to Excel
 * @route GET /api/reports/export/excel
 * @access Private (Admin only)
 */
export const exportReportExcel = async (req, res) => {
  try {
    // Build same filters as getReportData
    const filters = {};
    const allowedFilters = [
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
    ];

    allowedFilters.forEach((key) => {
      if (req.query[key]) {
        filters[key] = req.query[key];
      }
    });

    const searchQuery = req.query.search || req.query.q;
    if (searchQuery) {
      filters.$or = [
        { fullName: new RegExp(searchQuery, "i") },
        { nationalId: new RegExp(searchQuery, "i") },
        { phone: new RegExp(searchQuery, "i") },
      ];
    }

    // Age filter
    if (req.query.ageMin || req.query.ageMax) {
      const today = new Date();
      if (req.query.ageMin) {
        const maxBirthDate = new Date(
          today.getFullYear() - parseInt(req.query.ageMin),
          today.getMonth(),
          today.getDate()
        );
        filters.birthDate = { ...filters.birthDate, $lte: maxBirthDate };
      }
      if (req.query.ageMax) {
        const minBirthDate = new Date(
          today.getFullYear() - parseInt(req.query.ageMax) - 1,
          today.getMonth(),
          today.getDate()
        );
        filters.birthDate = { ...filters.birthDate, $gte: minBirthDate };
      }
    }

    const employees = await Employee.find(filters).lean();

    // Format data for Excel
    const excelData = employees.map((emp) => ({
      "الرقم الذاتي": emp.selfNumber || "",
      "الاسم الثلاثي": emp.fullName || "",
      "اسم الأب": emp.fatherName || "",
      "الرقم الوطني": emp.nationalId || "",
      الجنس: emp.gender || "",
      المحافظة: emp.governorate || "",
      المدينة: emp.city || "",
      "رقم الهاتف": emp.phone || "",
      "الحالة الاجتماعية": emp.maritalStatus || "",
      القسم: emp.level4 || "",
      "المسمى الوظيفي": emp.currentJobTitle || "",
      "نوع التوظيف": emp.employmentType || "",
      "الفئة الوظيفية": emp.jobCategory || "",
      الحالة: emp.status || "",
      "المؤهل العلمي": emp.educationLevel || "",
      الجامعة: emp.university || "",
      الاختصاص: emp.specialization || "",
      "مكان العمل": emp.workLocation || "",
      "تاريخ التعيين": emp.hiringDate
        ? new Date(emp.hiringDate).toLocaleDateString("ar-SA")
        : "",
      "تاريخ الميلاد": emp.birthDate
        ? new Date(emp.birthDate).toLocaleDateString("ar-SA")
        : "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "تقرير الموظفين");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="employee_report_${Date.now()}.xlsx"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting Excel:", error);
    res.status(500).json({
      success: false,
      message: "فشل في تصدير التقرير",
      error: error.message,
    });
  }
};
