import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";
import Pagination from "./Pagination";
import { useAuth } from "../hooks/useAuth";
import { checkPermission } from "../utils/permissionHelper";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

function StatCard({ title, value, sub }) {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 shadow-sm">
      <div className="text-sm text-slate-400">{title}</div>
      <div className="text-2xl font-bold text-slate-100 mt-1">{value}</div>
      {sub ? <div className="text-xs text-slate-500 mt-1">{sub}</div> : null}
    </div>
  );
}

function normalizeLabel(v) {
  if (!v) return "غير محدد";
  const normalized = String(v).trim();
  const lower = normalized.toLowerCase();

  // Handle male variations
  if (normalized === "ذكر" || lower === "male" || lower === "m") {
    return "ذكر";
  }

  // Handle female variations (with and without hamza)
  if (
    normalized === "أنثى" ||
    normalized === "انثى" ||
    normalized === "أنثي" ||
    normalized === "انثي" ||
    lower === "female" ||
    lower === "f"
  ) {
    return "أنثى";
  }

  return normalized;
}

function topN(data, n = 10, valueKey = "count") {
  if (!Array.isArray(data)) return [];
  return [...data]
    .sort((a, b) => (b?.[valueKey] || 0) - (a?.[valueKey] || 0))
    .slice(0, n);
}

function topNWithOther(data, n = 12, valueKey = "count", otherLabel = "أخرى") {
  if (!Array.isArray(data)) return [];
  const sorted = [...data].sort(
    (a, b) => (b?.[valueKey] || 0) - (a?.[valueKey] || 0)
  );
  if (sorted.length <= n) return sorted;

  const topItems = sorted.slice(0, n);
  const otherSum = sorted
    .slice(n)
    .reduce((sum, item) => sum + (Number(item?.[valueKey]) || 0), 0);

  if (otherSum <= 0) return topItems;
  return [...topItems, { name: otherLabel, [valueKey]: otherSum }];
}

function buildPieLabel(formatName = (name) => name) {
  return ({ name, percent }) => {
    if (!name || percent < 0.05) return "";
    return `${formatName(name)}: ${(percent * 100).toFixed(0)}%`;
  };
}

function Reports() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState("fullName");
  const [sortDir, setSortDir] = useState("asc");
  const [filters, setFilters] = useState({
    search: "",
    governorate: "",
    gender: "",
    nationality: "",
    currentJobTitle: "",
    university: "",
    workLocation: "",
    level1: "",
    level2: "",
    level3: "",
    level4: "",
    level5: "",
    level6: "",
    nationalId: "",
    jobCategory: "",
    status: "",
    phone: "",
    employmentType: "",
    selfNumber: "",
    maritalStatus: "",
    educationLevel: "",
    ageMin: "",
    ageMax: "",
    hiringDateFrom: "",
    hiringDateTo: "",
  });

  const [archivedReports, setArchivedReports] = useState([]);
  const [showArchive, setShowArchive] = useState(false);
  const [reportName, setReportName] = useState("");
  const [reportDescription, setReportDescription] = useState("");

  const genderSummary = useMemo(() => {
    const totals = { male: 0, female: 0, other: 0 };
    (statistics?.genderData || []).forEach(({ name, value }) => {
      const raw = String(name || "").trim();
      const lower = raw.toLowerCase();
      const numericValue = Number(value) || 0;

      // Normalize gender values - handle both "أنثى" and "انثى" (with/without hamza)
      if (raw === "ذكر" || lower === "male" || lower === "m") {
        totals.male += numericValue;
      } else if (
        raw === "أنثى" ||
        raw === "انثى" ||
        raw === "أنثي" ||
        raw === "انثي" ||
        lower === "female" ||
        lower === "f"
      ) {
        totals.female += numericValue;
      } else {
        totals.other += numericValue;
      }
    });
    return totals;
  }, [statistics?.genderData]);

  const departmentChartData = useMemo(
    () => topNWithOther(statistics?.departmentData || [], 12, "count"),
    [statistics?.departmentData]
  );

  const jobCategoryChartData = useMemo(
    () => topNWithOther(statistics?.jobCategoryData || [], 12, "count"),
    [statistics?.jobCategoryData]
  );

  const educationChartData = useMemo(
    () => topNWithOther(statistics?.educationData || [], 12, "count"),
    [statistics?.educationData]
  );

  const genderChartData = useMemo(
    () => topNWithOther(statistics?.genderData || [], 6, "value"),
    [statistics?.genderData]
  );

  const employmentTypeChartData = useMemo(
    () => topNWithOther(statistics?.employmentTypeData || [], 6, "value"),
    [statistics?.employmentTypeData]
  );

  const maritalStatusChartData = useMemo(
    () => topNWithOther(statistics?.maritalStatusData || [], 6, "value"),
    [statistics?.maritalStatusData]
  );

  const departmentCount = useMemo(
    () => Object.keys(statistics?.byDepartment || {}).length,
    [statistics?.byDepartment]
  );

  const topDepartmentName = useMemo(() => {
    const source = statistics?.departmentData || [];
    if (!source.length) return "غير متوفر";
    const sorted = [...source].sort(
      (a, b) => (b?.count || 0) - (a?.count || 0)
    );
    return sorted[0]?.name || "غير متوفر";
  }, [statistics?.departmentData]);

  const topJobCategoryName = useMemo(() => {
    const source = statistics?.jobCategoryData || [];
    if (!source.length) return "غير متوفر";
    const sorted = [...source].sort(
      (a, b) => (b?.count || 0) - (a?.count || 0)
    );
    return sorted[0]?.name || "غير متوفر";
  }, [statistics?.jobCategoryData]);

  const topEmploymentTypeName = useMemo(() => {
    const source = statistics?.employmentTypeData || [];
    if (!source.length) return "غير متوفر";
    const sorted = [...source].sort(
      (a, b) => (b?.value || 0) - (a?.value || 0)
    );
    return sorted[0]?.name || "غير متوفر";
  }, [statistics?.employmentTypeData]);

  const apiUrl =
    import.meta.env.VITE_API_URL || "/api";

  useEffect(() => {
    fetchData();
    fetchArchivedReports();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, limit, sortBy, sortDir]);

  // Apply filters when they change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showFilters) {
        // Only auto-apply if filters panel is visible
        return;
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [filters, showFilters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      queryParams.set("page", String(page));
      queryParams.set("limit", String(limit));
      queryParams.set("sortBy", String(sortBy));
      queryParams.set("sortDir", String(sortDir));

      const response = await fetch(`${apiUrl}/reports/data?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setData(result.data);
        setStatistics(result.statistics);
        const pg = result.pagination;
        if (pg) {
          setTotalPages(pg.totalPages || 1);
          setTotal(pg.total || 0);
        } else {
          setTotalPages(1);
          setTotal(result?.data?.length || 0);
        }
      } else {
        toast.error("فشل في جلب البيانات");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("خطأ في الاتصال");
    }
    setLoading(false);
  };

  const fetchArchivedReports = async () => {
    try {
      const response = await fetch(`${apiUrl}/reports/archive`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setArchivedReports(result.data);
      } else {
        toast.error("فشل في جلب التقارير المحفوظة");
      }
    } catch (error) {
      console.error("Error fetching archived reports:", error);
      toast.error("خطأ في الاتصال");
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setPage(1);
    fetchData();
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      governorate: "",
      gender: "",
      nationality: "",
      currentJobTitle: "",
      university: "",
      workLocation: "",
      level1: "",
      level2: "",
      level3: "",
      level4: "",
      level5: "",
      level6: "",
      nationalId: "",
      jobCategory: "",
      status: "",
      phone: "",
      employmentType: "",
      selfNumber: "",
      maritalStatus: "",
      educationLevel: "",
      ageMin: "",
      ageMax: "",
      hiringDateFrom: "",
      hiringDateTo: "",
    });
    setPage(1);
    fetchData();
  };

  const saveReport = async () => {
    if (!checkPermission("reports.create", user)) {
      toast.error("ليس لديك صلاحية لحفظ التقارير");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/reports/archive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: reportName,
          description: reportDescription,
          filters,
        }),
      });

      if (response.ok) {
        toast.success("تم حفظ التقرير بنجاح");
        setReportName("");
        setReportDescription("");
        fetchArchivedReports();
      } else {
        toast.error("فشل في حفظ التقرير");
      }
    } catch (error) {
      console.error("Error saving report:", error);
      toast.error("خطأ في الاتصال");
    }
  };

  const loadReport = (report) => {
    setFilters(report.filters);
    setReportName(report.name);
    setReportDescription(report.description);
    fetchData();
  };

  const exportToWord = async () => {
    if (!checkPermission("reports.export", user)) {
      toast.error("ليس لديك صلاحية لتصدير التقارير");
      return;
    }

    try {
      toast.loading("جاري تصدير التقرير...");
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      queryParams.set("page", String(page));
      queryParams.set("limit", String(limit));

      const response = await fetch(
        `${apiUrl}/reports/export/word?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const dateStr = new Date().toISOString().split("T")[0];
        a.download = `report_${dateStr}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.dismiss();
        toast.success("تم تصدير التقرير بنجاح");
      } else {
        toast.dismiss();
        toast.error("فشل في تصدير التقرير");
      }
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.dismiss();
      toast.error("خطأ في الاتصال");
    }
  };

  const exportToPDF = async () => {
    if (!checkPermission("reports.export", user)) {
      toast.error("ليس لديك صلاحية لتصدير التقارير");
      return;
    }

    try {
      toast.loading("جاري تصدير التقرير إلى PDF...");

      const pdf = new jsPDF("p", "mm", "a4");

      // Add title
      pdf.setFontSize(18);
      pdf.text("تقرير إحصائي للموظفين", 105, 15, { align: "center" });

      // Add date
      pdf.setFontSize(12);
      const dateStr = new Date().toLocaleDateString("ar-EG");
      pdf.text(`تاريخ التقرير: ${dateStr}`, 105, 25, { align: "center" });

      let yPos = 35;

      // Add statistics summary
      pdf.setFontSize(14);
      pdf.text("ملخص الإحصائيات", 20, yPos);
      yPos += 10;

      pdf.setFontSize(11);
      const statsData = [
        ["المؤشر", "القيمة"],
        ["إجمالي الموظفين", String(total)],
        ["متوسط العمر", Number(statistics?.averageAge || 0).toFixed(1)],
        ["عدد الذكور", String(genderSummary.male)],
        ["عدد الإناث", String(genderSummary.female)],
        ["عدد الأقسام", String(departmentCount)],
      ];

      autoTable(pdf, {
        startY: yPos,
        head: [statsData[0]],
        body: statsData.slice(1),
        theme: "striped",
        headStyles: { fillColor: [30, 41, 59], textColor: 255 },
        styles: { font: "Arial", fontSize: 10, halign: "right" },
        margin: { left: 20, right: 20 },
      });

      yPos = pdf.lastAutoTable.finalY + 15;

      // Check if we need a new page
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }

      // Add department distribution
      if (departmentChartData.length > 0) {
        pdf.setFontSize(14);
        pdf.text("توزيع الأقسام", 20, yPos);
        yPos += 10;

        const deptData = departmentChartData.slice(0, 10).map((item) => [
          item.name || "غير محدد",
          String(item.count || 0),
        ]);

        autoTable(pdf, {
          startY: yPos,
          head: [["القسم", "العدد"]],
          body: deptData,
          theme: "striped",
          headStyles: { fillColor: [30, 41, 59], textColor: 255 },
          styles: { font: "Arial", fontSize: 9, halign: "right" },
          margin: { left: 20, right: 20 },
        });

        yPos = pdf.lastAutoTable.finalY + 15;

        if (yPos > 250) {
          pdf.addPage();
          yPos = 20;
        }
      }

      // Add gender distribution
      if (genderChartData.length > 0) {
        pdf.setFontSize(14);
        pdf.text("توزيع الجنس", 20, yPos);
        yPos += 10;

        const genderData = genderChartData.map((item) => [
          normalizeLabel(item.name || "غير محدد"),
          String(item.value || 0),
        ]);

        autoTable(pdf, {
          startY: yPos,
          head: [["الجنس", "العدد"]],
          body: genderData,
          theme: "striped",
          headStyles: { fillColor: [30, 41, 59], textColor: 255 },
          styles: { font: "Arial", fontSize: 10, halign: "right" },
          margin: { left: 20, right: 20 },
        });

        yPos = pdf.lastAutoTable.finalY + 15;

        if (yPos > 250) {
          pdf.addPage();
          yPos = 20;
        }
      }

      // Add employment type distribution
      if (statistics?.employmentTypeData?.length > 0) {
        pdf.setFontSize(14);
        pdf.text("توزيع نوع التوظيف", 20, yPos);
        yPos += 10;

        const empData = statistics.employmentTypeData.map((item) => [
          item.name || "غير محدد",
          String(item.value || 0),
        ]);

        autoTable(pdf, {
          startY: yPos,
          head: [["نوع التوظيف", "العدد"]],
          body: empData,
          theme: "striped",
          headStyles: { fillColor: [30, 41, 59], textColor: 255 },
          styles: { font: "Arial", fontSize: 10, halign: "right" },
          margin: { left: 20, right: 20 },
        });
      }

      // Save PDF
      const dateStr2 = new Date().toISOString().split("T")[0];
      pdf.save(`report_${dateStr2}.pdf`);

      toast.dismiss();
      toast.success("تم تصدير التقرير إلى PDF بنجاح");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.dismiss();
      toast.error(`فشل في تصدير PDF: ${error.message || "خطأ غير معروف"}`);
    }
  };

  return (
    <div
      className="p-2 sm:p-4 md:p-6 bg-slate-900 min-h-screen text-slate-100"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">التقارير</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              استعراض بيانات الموظفين مع إحصائيات ورسوم بيانية.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 text-sm sm:text-base"
            >
              {showFilters ? "إخفاء الفلاتر" : "عرض الفلاتر"}
            </button>
            <button
              onClick={exportToPDF}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base"
            >
              تصدير PDF
            </button>
            <button
              onClick={exportToWord}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base"
            >
              تصدير Word
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="عدد النتائج"
            value={total}
            sub={`الصفحة ${page} من ${totalPages}`}
          />
          <StatCard
            title="متوسط العمر"
            value={Number(statistics?.averageAge || 0).toFixed(1)}
            sub="بالسنوات"
          />
          <StatCard title="ذكور" value={genderSummary.male} />
          <StatCard
            title="إناث"
            value={genderSummary.female}
            sub={
              genderSummary.other
                ? `فئات أخرى: ${genderSummary.other}`
                : undefined
            }
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-700">
            <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
              <h2 className="text-lg font-semibold text-slate-200">الفلاتر</h2>
              <div className="flex gap-2">
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white"
                >
                  تطبيق
                </button>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white"
                >
                  إعادة ضبط
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="البحث"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="p-2 border border-slate-600 bg-slate-700 text-slate-100 rounded placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="المحافظة"
                value={filters.governorate}
                onChange={(e) =>
                  handleFilterChange("governorate", e.target.value)
                }
                className="p-2 border border-slate-600 bg-slate-700 text-slate-100 rounded placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={filters.gender}
                onChange={(e) => handleFilterChange("gender", e.target.value)}
                className="p-2 border border-slate-600 bg-slate-700 text-slate-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">الجنس</option>
                <option value="ذكر">ذكر</option>
                <option value="أنثى">أنثى</option>
              </select>
              <input
                type="text"
                placeholder="الجنسية"
                value={filters.nationality}
                onChange={(e) =>
                  handleFilterChange("nationality", e.target.value)
                }
                className="p-2 border border-slate-600 bg-slate-700 text-slate-100 rounded placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="المسمى الوظيفي"
                value={filters.currentJobTitle}
                onChange={(e) =>
                  handleFilterChange("currentJobTitle", e.target.value)
                }
                className="p-2 border border-slate-600 bg-slate-700 text-slate-100 rounded placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="الجامعة"
                value={filters.university}
                onChange={(e) =>
                  handleFilterChange("university", e.target.value)
                }
                className="p-2 border border-slate-600 bg-slate-700 text-slate-100 rounded placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="مكان العمل"
                value={filters.workLocation}
                onChange={(e) =>
                  handleFilterChange("workLocation", e.target.value)
                }
                className="p-2 border border-slate-600 bg-slate-700 text-slate-100 rounded placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="المستوى 1"
                value={filters.level1}
                onChange={(e) => handleFilterChange("level1", e.target.value)}
                className="p-2 border border-slate-600 bg-slate-700 text-slate-100 rounded placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="المستوى 2"
                value={filters.level2}
                onChange={(e) => handleFilterChange("level2", e.target.value)}
                className="p-2 border border-slate-600 bg-slate-700 text-slate-100 rounded placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="المستوى 3"
                value={filters.level3}
                onChange={(e) => handleFilterChange("level3", e.target.value)}
                className="p-2 border border-slate-600 bg-slate-700 text-slate-100 rounded placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="المستوى 4"
                value={filters.level4}
                onChange={(e) => handleFilterChange("level4", e.target.value)}
                className="p-2 border border-slate-600 bg-slate-700 text-slate-100 rounded placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="المستوى 5"
                value={filters.level5}
                onChange={(e) => handleFilterChange("level5", e.target.value)}
                className="p-2 border border-slate-600 bg-slate-700 text-slate-100 rounded placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="المستوى 6"
                value={filters.level6}
                onChange={(e) => handleFilterChange("level6", e.target.value)}
                className="p-2 border border-slate-600 bg-slate-700 text-slate-100 rounded placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="الرقم الوطني"
                value={filters.nationalId}
                onChange={(e) =>
                  handleFilterChange("nationalId", e.target.value)
                }
                className="p-2 border border-slate-600 bg-slate-700 text-slate-100 rounded placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="فئة الوظيفة"
                value={filters.jobCategory}
                onChange={(e) =>
                  handleFilterChange("jobCategory", e.target.value)
                }
                className="p-2 border border-slate-600 bg-slate-700 text-slate-100 rounded placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="p-2 border border-slate-600 bg-slate-700 text-slate-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">الحالة</option>
                <option value="قائم على رأس عمله">قائم على رأس عمله</option>
                <option value="مجاز">مجاز</option>
                <option value="مكفوف اليد">مكفوف اليد</option>
                <option value="مستقيل">مستقيل</option>
                <option value="متقاعد">متقاعد</option>
              </select>
              <input
                type="text"
                placeholder="الهاتف"
                value={filters.phone}
                onChange={(e) => handleFilterChange("phone", e.target.value)}
                className="p-2 border border-slate-600 bg-slate-700 text-slate-100 rounded placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={filters.employmentType}
                onChange={(e) =>
                  handleFilterChange("employmentType", e.target.value)
                }
                className="p-2 border border-slate-600 bg-slate-700 text-slate-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">نوع التوظيف</option>
                <option value="مثبت">مثبت</option>
                <option value="متعاقد">متعاقد</option>
              </select>
              <input
                type="text"
                placeholder="الرقم الذاتي"
                value={filters.selfNumber}
                onChange={(e) =>
                  handleFilterChange("selfNumber", e.target.value)
                }
                className="p-2 border border-slate-600 bg-slate-700 text-slate-100 rounded placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={filters.maritalStatus}
                onChange={(e) =>
                  handleFilterChange("maritalStatus", e.target.value)
                }
                className="p-2 border border-slate-600 bg-slate-700 text-slate-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">الحالة الاجتماعية</option>
                <option value="عازب">عازب</option>
                <option value="متزوج">متزوج</option>
                <option value="مطلق">مطلق</option>
                <option value="أرمل">أرمل</option>
              </select>
              <input
                type="text"
                placeholder="المستوى التعليمي"
                value={filters.educationLevel}
                onChange={(e) =>
                  handleFilterChange("educationLevel", e.target.value)
                }
                className="p-2 border border-slate-600 bg-slate-700 text-slate-100 rounded placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="العمر الأدنى"
                value={filters.ageMin}
                onChange={(e) => handleFilterChange("ageMin", e.target.value)}
                className="p-2 border border-slate-600 bg-slate-700 text-slate-100 rounded placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="العمر الأقصى"
                value={filters.ageMax}
                onChange={(e) => handleFilterChange("ageMax", e.target.value)}
                className="p-2 border border-slate-600 bg-slate-700 text-slate-100 rounded placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                placeholder="تاريخ التوظيف من"
                value={filters.hiringDateFrom}
                onChange={(e) =>
                  handleFilterChange("hiringDateFrom", e.target.value)
                }
                className="p-2 border border-slate-600 bg-slate-700 text-slate-100 rounded placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                placeholder="تاريخ التوظيف إلى"
                value={filters.hiringDateTo}
                onChange={(e) =>
                  handleFilterChange("hiringDateTo", e.target.value)
                }
                className="p-2 border border-slate-600 bg-slate-700 text-slate-100 rounded placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={applyFilters}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                تطبيق الفلاتر
              </button>
              <button
                onClick={resetFilters}
                className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-500"
              >
                إعادة تعيين
              </button>
            </div>
          </div>
        )}

        <div className="sr-only">Statistics</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800 p-4 rounded-lg shadow border border-slate-700">
            <h3 className="text-lg font-semibold text-slate-200">
              إجمالي المطابقة
            </h3>
            <p className="text-2xl font-bold text-blue-400">
              {statistics?.total || 0}
            </p>
            <p className="text-sm text-slate-500 mt-2">
              عدد الأقسام الفريدة: {departmentCount}
            </p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg shadow border border-slate-700">
            <h3 className="text-lg font-semibold text-slate-200">
              أكثر قسم ظهوراً
            </h3>
            <p className="text-2xl font-bold text-slate-300">
              {topDepartmentName}
            </p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg shadow border border-slate-700">
            <h3 className="text-lg font-semibold text-slate-200">
              أبرز فئة وظيفية
            </h3>
            <p className="text-2xl font-bold text-purple-400">
              {topJobCategoryName}
            </p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg shadow border border-slate-700">
            <h3 className="text-lg font-semibold text-slate-200">
              أكثر نوع توظيف
            </h3>
            <p className="text-2xl font-bold text-orange-400">
              {topEmploymentTypeName}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* Gender Distribution */}
          <div className="bg-slate-800 p-3 sm:p-4 rounded-lg shadow border border-slate-700 overflow-hidden">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-slate-200">
              توزيع الجنس
            </h3>
            <div className="w-full" style={{ minHeight: "280px", maxHeight: "350px" }} dir="ltr">
              <ResponsiveContainer width="100%" height="100%" minHeight={280}>
                <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <Pie
                    data={genderChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => {
                      if (percent < 0.05) return "";
                      return `${normalizeLabel(name)}: ${(percent * 100).toFixed(0)}%`;
                    }}
                    outerRadius={window.innerWidth < 640 ? 55 : 75}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {genderChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      borderColor: "#334155",
                      color: "#f1f5f9",
                      fontSize: "12px",
                    }}
                    itemStyle={{ color: "#f1f5f9", fontSize: "12px" }}
                    formatter={(value) => [value, "العدد"]}
                  />
                  <Legend
                    wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }}
                    formatter={(value) => normalizeLabel(value)}
                    iconSize={10}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Age Distribution */}
          <div className="bg-slate-800 p-3 sm:p-4 rounded-lg shadow border border-slate-700 overflow-hidden">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-slate-200">
              توزيع الأعمار
            </h3>
            <div className="w-full" style={{ minHeight: "300px", maxHeight: "400px" }} dir="ltr">
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <BarChart
                  data={statistics.ageData || []}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 20,
                    bottom: window.innerWidth < 640 ? 60 : 80
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis
                    dataKey="age"
                    stroke="#94a3b8"
                    angle={window.innerWidth < 640 ? -60 : -45}
                    textAnchor="end"
                    height={window.innerWidth < 640 ? 70 : 100}
                    interval={0}
                    tick={{ fontSize: window.innerWidth < 640 ? 10 : 12, fontWeight: 600 }}
                  />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      borderColor: "#334155",
                      color: "#f1f5f9",
                      fontSize: "12px",
                    }}
                    itemStyle={{ color: "#f1f5f9", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
                  <Bar dataKey="count" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Employment Type Distribution */}
          <div className="bg-slate-800 p-3 sm:p-4 rounded-lg shadow border border-slate-700 overflow-hidden">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-slate-200">
              توزيع نوع التوظيف
            </h3>
            <div className="w-full" style={{ minHeight: "280px", maxHeight: "350px" }} dir="ltr">
              <ResponsiveContainer width="100%" height="100%" minHeight={280}>
                <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <Pie
                    data={statistics.employmentTypeData || []}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => {
                      if (percent < 0.05) return "";
                      return `${name}: ${(percent * 100).toFixed(0)}%`;
                    }}
                    outerRadius={window.innerWidth < 640 ? 55 : 75}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {(statistics.employmentTypeData || []).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      borderColor: "#334155",
                      color: "#f1f5f9",
                      fontSize: "12px",
                    }}
                    itemStyle={{ color: "#f1f5f9", fontSize: "12px" }}
                    formatter={(value) => [value, "العدد"]}
                  />
                  <Legend
                    wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }}
                    iconSize={10}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Job Category Distribution */}
          <div className="bg-slate-800 p-3 sm:p-4 rounded-lg shadow border border-slate-700 overflow-hidden">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-slate-200">
              توزيع فئات الوظائف
            </h3>
            <div className="w-full" style={{ minHeight: "300px", maxHeight: "450px" }} dir="ltr">
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <BarChart
                  data={jobCategoryChartData}
                  layout="vertical"
                  margin={{
                    top: 10,
                    bottom: 10,
                    left: window.innerWidth < 640 ? 120 : 180,
                    right: 40
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis
                    type="number"
                    stroke="#94a3b8"
                    tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#94a3b8"
                    interval={0}
                    width={window.innerWidth < 640 ? 110 : 170}
                    tick={{
                      fontSize: window.innerWidth < 640 ? 9 : 11,
                      fill: "#94a3b8",
                      textAnchor: "end",
                      dx: -10
                    }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      borderColor: "#334155",
                      color: "#f1f5f9",
                      fontSize: "12px",
                    }}
                    itemStyle={{ color: "#f1f5f9", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
                  <Bar
                    dataKey="count"
                    fill="#ffc658"
                    radius={[0, 4, 4, 0]}
                    barSize={window.innerWidth < 640 ? 15 : 20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Distribution */}
          <div className="bg-slate-800 p-3 sm:p-4 rounded-lg shadow border border-slate-700 lg:col-span-2 overflow-hidden">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-slate-200">
              توزيع الأقسام
            </h3>
            <div className="w-full" style={{ minHeight: "400px", maxHeight: "550px" }} dir="ltr">
              <ResponsiveContainer width="100%" height="100%" minHeight={400}>
                <BarChart
                  data={departmentChartData}
                  layout="vertical"
                  margin={{
                    top: 20,
                    bottom: 20,
                    left: window.innerWidth < 640 ? 150 : 250,
                    right: 40
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis
                    type="number"
                    stroke="#94a3b8"
                    tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={window.innerWidth < 640 ? 140 : 240}
                    stroke="#94a3b8"
                    interval={0}
                    tick={{
                      fontSize: window.innerWidth < 640 ? 9 : 11,
                      fill: "#94a3b8",
                      textAnchor: "end",
                      dx: -10
                    }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      borderColor: "#334155",
                      color: "#f1f5f9",
                      fontSize: "12px",
                    }}
                    itemStyle={{ color: "#f1f5f9", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
                  <Bar
                    dataKey="count"
                    fill="#8884d8"
                    radius={[0, 4, 4, 0]}
                    barSize={window.innerWidth < 640 ? 15 : 20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Education Level Distribution */}
          <div className="bg-slate-800 p-3 sm:p-4 rounded-lg shadow border border-slate-700 lg:col-span-2 overflow-hidden">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-slate-200">
              المستوى التعليمي
            </h3>
            <div className="w-full" style={{ minHeight: "300px", maxHeight: "450px" }} dir="ltr">
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <BarChart
                  data={educationChartData}
                  layout="vertical"
                  margin={{
                    top: 20,
                    bottom: 20,
                    left: window.innerWidth < 640 ? 150 : 250,
                    right: 60
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis
                    type="number"
                    stroke="#94a3b8"
                    tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={window.innerWidth < 640 ? 140 : 240}
                    stroke="#94a3b8"
                    interval={0}
                    tick={{
                      fontSize: window.innerWidth < 640 ? 9 : 11,
                      fill: "#94a3b8",
                      textAnchor: "end",
                      dx: -10
                    }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      borderColor: "#334155",
                      color: "#f1f5f9",
                      fontSize: "12px",
                    }}
                    itemStyle={{ color: "#f1f5f9", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
                  <Bar
                    dataKey="count"
                    fill="#00C49F"
                    radius={[0, 4, 4, 0]}
                    barSize={window.innerWidth < 640 ? 20 : 30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Marital Status Distribution */}
          <div className="bg-slate-800 p-3 sm:p-4 rounded-lg shadow border border-slate-700 overflow-hidden">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-slate-200">
              الحالة الاجتماعية
            </h3>
            <div className="w-full" style={{ minHeight: "280px", maxHeight: "350px" }} dir="ltr">
              <ResponsiveContainer width="100%" height="100%" minHeight={280}>
                <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <Pie
                    data={statistics.maritalStatusData || []}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => {
                      if (percent < 0.05) return "";
                      return `${name}: ${(percent * 100).toFixed(0)}%`;
                    }}
                    outerRadius={window.innerWidth < 640 ? 55 : 75}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {(statistics.maritalStatusData || []).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      borderColor: "#334155",
                      color: "#f1f5f9",
                      fontSize: "12px",
                    }}
                    itemStyle={{ color: "#f1f5f9", fontSize: "12px" }}
                    formatter={(value) => [value, "العدد"]}
                  />
                  <Legend
                    wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }}
                    iconSize={10}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Actions & Archive */}
        <div className="bg-slate-800 p-3 sm:p-4 rounded-lg shadow mb-6 border border-slate-700">
          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-slate-200">
            الإجراءات
          </h3>
          <div className="flex flex-wrap gap-2 sm:gap-4 mb-4">
            <button
              onClick={exportToPDF}
              className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded hover:bg-red-700 text-sm sm:text-base"
            >
              تصدير PDF
            </button>
            <button
              onClick={exportToWord}
              className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded hover:bg-blue-700 text-sm sm:text-base"
            >
              تصدير Word
            </button>
            <button
              onClick={() => setShowArchive(!showArchive)}
              className="bg-purple-600 text-white px-3 sm:px-4 py-2 rounded hover:bg-purple-700 text-sm sm:text-base"
            >
              {showArchive ? "إخفاء الأرشيف" : "عرض الأرشيف"}
            </button>
          </div>

          <div className="mb-4 flex flex-col sm:flex-row flex-wrap gap-2">
            <input
              type="text"
              placeholder="اسم التقرير"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              className="flex-1 min-w-[200px] p-2 border border-slate-600 bg-slate-700 text-slate-100 rounded placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
            <input
              type="text"
              placeholder="وصف التقرير"
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              className="flex-1 min-w-[200px] p-2 border border-slate-600 bg-slate-700 text-slate-100 rounded placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
            <button
              onClick={saveReport}
              className="bg-slate-600 text-white px-3 sm:px-4 py-2 rounded hover:bg-slate-500 text-sm sm:text-base whitespace-nowrap"
            >
              حفظ التقرير
            </button>
          </div>

          {showArchive && (
            <div className="mt-4 space-y-2">
              {archivedReports.map((report, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-2 border border-slate-600 rounded bg-slate-700/30"
                >
                  <div>
                    <p className="font-semibold text-slate-200">
                      {report.name}
                    </p>
                    <p className="text-sm text-slate-400">
                      {report.description}
                    </p>
                  </div>
                  <button
                    onClick={() => loadReport(report)}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    تحميل
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Data Table Removed as per request */}
      </div>
    </div>
  );
}

export default Reports;
