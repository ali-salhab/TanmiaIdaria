import React, { useState, useEffect } from "react";
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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

function StatCard({ title, value, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
      {sub ? <div className="text-xs text-gray-500 mt-1">{sub}</div> : null}
    </div>
  );
}

function normalizeLabel(v) {
  if (v === "male") return "ذكر";
  if (v === "female") return "أنثى";
  return v || "غير محدد";
}

function topN(data, n = 10, valueKey = "count") {
  if (!Array.isArray(data)) return [];
  return [...data]
    .sort((a, b) => (b?.[valueKey] || 0) - (a?.[valueKey] || 0))
    .slice(0, n);
}

function Reports() {
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

  const apiUrl =
    import.meta.env.VITE_API_URL ||
    `http://${window.location.hostname}:5000/api`;

  useEffect(() => {
    fetchData();
    fetchArchivedReports();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, limit, sortBy, sortDir]);

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

  const exportToExcel = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(
        `${apiUrl}/reports/export/excel?${queryParams}`,
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
        a.download = "report.xlsx";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("تم تصدير التقرير بنجاح");
      } else {
        toast.error("فشل في تصدير التقرير");
      }
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("خطأ في الاتصال");
    }
  };

  return (
    <div
      className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-indigo-50 min-h-screen"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">التقارير</h1>
            <p className="text-sm text-gray-600 mt-1">
              استعراض بيانات الموظفين مع إحصائيات ورسوم بيانية.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
            >
              {showFilters ? "إخفاء الفلاتر" : "عرض الفلاتر"}
            </button>
            <button
              onClick={exportToExcel}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              تصدير Excel
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
            value={statistics?.averageAge || 0}
            sub="بالسنوات"
          />
          <StatCard title="ذكور" value={statistics?.byGender?.male || 0} />
          <StatCard title="إناث" value={statistics?.byGender?.female || 0} />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
              <h2 className="text-lg font-semibold">الفلاتر</h2>
              <div className="flex gap-2">
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white"
                >
                  تطبيق
                </button>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
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
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="المحافظة"
                value={filters.governorate}
                onChange={(e) =>
                  handleFilterChange("governorate", e.target.value)
                }
                className="p-2 border rounded"
              />
              <select
                value={filters.gender}
                onChange={(e) => handleFilterChange("gender", e.target.value)}
                className="p-2 border rounded"
              >
                <option value="">الجنس</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
              <input
                type="text"
                placeholder="الجنسية"
                value={filters.nationality}
                onChange={(e) =>
                  handleFilterChange("nationality", e.target.value)
                }
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="المسمى الوظيفي"
                value={filters.currentJobTitle}
                onChange={(e) =>
                  handleFilterChange("currentJobTitle", e.target.value)
                }
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="الجامعة"
                value={filters.university}
                onChange={(e) =>
                  handleFilterChange("university", e.target.value)
                }
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="مكان العمل"
                value={filters.workLocation}
                onChange={(e) =>
                  handleFilterChange("workLocation", e.target.value)
                }
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="المستوى 1"
                value={filters.level1}
                onChange={(e) => handleFilterChange("level1", e.target.value)}
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="المستوى 2"
                value={filters.level2}
                onChange={(e) => handleFilterChange("level2", e.target.value)}
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="المستوى 3"
                value={filters.level3}
                onChange={(e) => handleFilterChange("level3", e.target.value)}
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="المستوى 4"
                value={filters.level4}
                onChange={(e) => handleFilterChange("level4", e.target.value)}
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="المستوى 5"
                value={filters.level5}
                onChange={(e) => handleFilterChange("level5", e.target.value)}
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="المستوى 6"
                value={filters.level6}
                onChange={(e) => handleFilterChange("level6", e.target.value)}
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="الرقم الوطني"
                value={filters.nationalId}
                onChange={(e) =>
                  handleFilterChange("nationalId", e.target.value)
                }
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="فئة الوظيفة"
                value={filters.jobCategory}
                onChange={(e) =>
                  handleFilterChange("jobCategory", e.target.value)
                }
                className="p-2 border rounded"
              />
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="p-2 border rounded"
              >
                <option value="">الحالة</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
              <input
                type="text"
                placeholder="الهاتف"
                value={filters.phone}
                onChange={(e) => handleFilterChange("phone", e.target.value)}
                className="p-2 border rounded"
              />
              <select
                value={filters.employmentType}
                onChange={(e) =>
                  handleFilterChange("employmentType", e.target.value)
                }
                className="p-2 border rounded"
              >
                <option value="">نوع التوظيف</option>
                <option value="full-time">دوام كامل</option>
                <option value="part-time">دوام جزئي</option>
                <option value="contract">عقد</option>
              </select>
              <input
                type="text"
                placeholder="الرقم الذاتي"
                value={filters.selfNumber}
                onChange={(e) =>
                  handleFilterChange("selfNumber", e.target.value)
                }
                className="p-2 border rounded"
              />
              <select
                value={filters.maritalStatus}
                onChange={(e) =>
                  handleFilterChange("maritalStatus", e.target.value)
                }
                className="p-2 border rounded"
              >
                <option value="">الحالة الاجتماعية</option>
                <option value="single">أعزب</option>
                <option value="married">متزوج</option>
                <option value="divorced">مطلق</option>
                <option value="widowed">أرمل</option>
              </select>
              <input
                type="text"
                placeholder="المستوى التعليمي"
                value={filters.educationLevel}
                onChange={(e) =>
                  handleFilterChange("educationLevel", e.target.value)
                }
                className="p-2 border rounded"
              />
              <input
                type="number"
                placeholder="العمر الأدنى"
                value={filters.ageMin}
                onChange={(e) => handleFilterChange("ageMin", e.target.value)}
                className="p-2 border rounded"
              />
              <input
                type="number"
                placeholder="العمر الأقصى"
                value={filters.ageMax}
                onChange={(e) => handleFilterChange("ageMax", e.target.value)}
                className="p-2 border rounded"
              />
              <input
                type="date"
                placeholder="تاريخ التوظيف من"
                value={filters.hiringDateFrom}
                onChange={(e) =>
                  handleFilterChange("hiringDateFrom", e.target.value)
                }
                className="p-2 border rounded"
              />
              <input
                type="date"
                placeholder="تاريخ التوظيف إلى"
                value={filters.hiringDateTo}
                onChange={(e) =>
                  handleFilterChange("hiringDateTo", e.target.value)
                }
                className="p-2 border rounded"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={applyFilters}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                تطبيق الفلاتر
              </button>
              <button
                onClick={resetFilters}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                إعادة تعيين
              </button>
            </div>
          </div>
        )}

        <div className="sr-only">Statistics</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold">إجمالي الموظفين</h3>
            <p className="text-2xl font-bold text-blue-600">
              {statistics.totalEmployees || 0}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold">الموظفين النشطين</h3>
            <p className="text-2xl font-bold text-gray-700">
              {statistics.activeEmployees || 0}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold">متوسط العمر</h3>
            <p className="text-2xl font-bold text-purple-600">
              {statistics.averageAge || 0}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold">عدد الأقسام</h3>
            <p className="text-2xl font-bold text-orange-600">
              {statistics.totalDepartments || 0}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Department Distribution */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">توزيع الأقسام</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statistics.departmentData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gender Distribution */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">توزيع الجنس</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statistics.genderData || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(statistics.genderData || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Age Distribution */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">توزيع الأعمار</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statistics.ageData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="age" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Employment Type Distribution */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">توزيع نوع التوظيف</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statistics.employmentTypeData || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(statistics.employmentTypeData || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Job Category Distribution */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">توزيع فئات الوظائف</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statistics.jobCategoryData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Department Distribution */}
          <div className="bg-white p-4 rounded-lg shadow md:col-span-2 lg:col-span-3">
            <h3 className="text-xl font-semibold mb-4">توزيع الأقسام</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statistics.departmentData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Education Level Distribution */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">المستوى التعليمي</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statistics.educationData || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Marital Status Distribution */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">الحالة الاجتماعية</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statistics.maritalStatusData || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(statistics.maritalStatusData || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actions & Archive */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h3 className="text-xl font-semibold mb-4">الإجراءات</h3>
          <div className="flex gap-4 mb-4">
            <button
              onClick={exportToExcel}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              تصدير إلى Excel
            </button>
            <button
              onClick={() => setShowArchive(!showArchive)}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              {showArchive ? "إخفاء الأرشيف" : "عرض الأرشيف"}
            </button>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="اسم التقرير"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              className="p-2 border rounded"
            />
            <input
              type="text"
              placeholder="وصف التقرير"
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              className="p-2 border rounded"
            />
            <button
              onClick={saveReport}
              className="bg-governmentGrey-500 text-white px-4 py-2 rounded hover:bg-governmentGrey-600"
            >
              حفظ التقرير
            </button>
          </div>

          {showArchive && (
            <div className="mt-4 space-y-2">
              {archivedReports.map((report, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-2 border rounded"
                >
                  <div>
                    <p className="font-semibold">{report.name}</p>
                    <p className="text-sm text-gray-600">
                      {report.description}
                    </p>
                  </div>
                  <button
                    onClick={() => loadReport(report)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    تحميل
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="font-semibold text-gray-800">النتائج</h3>
            <div className="text-sm text-gray-600">
              {loading ? "جاري التحميل..." : `عدد النتائج: ${total}`}
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-right">الاسم</th>
                  <th className="p-2 text-right">القسم</th>
                  <th className="p-2 text-right">الجنس</th>
                  <th className="p-2 text-right">الهاتف</th>
                  <th className="p-2 text-right">الوظيفة</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">
                      جاري التحميل...
                    </td>
                  </tr>
                ) : data?.length ? (
                  data.map((emp) => (
                    <tr key={emp._id} className="border-t hover:bg-gray-50">
                      <td className="p-2 font-medium text-gray-900">
                        {emp.fullName || "-"}
                      </td>
                      <td className="p-2">{emp.level4 || "-"}</td>
                      <td className="p-2">{normalizeLabel(emp.gender)}</td>
                      <td className="p-2">{emp.phone || "-"}</td>
                      <td className="p-2">{emp.currentJobTitle || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">
                      لا توجد نتائج
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <Pagination page={page} totalPages={totalPages} setPage={setPage} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
