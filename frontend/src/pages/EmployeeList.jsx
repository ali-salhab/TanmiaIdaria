import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import API from "../api/api";
import Pagination from "../components/Pagination";
import DropdownWithSettings from "../components/DropdownWithSettings";
import XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
// Correct import for autotable with Vite/ES6
import autoTable from "jspdf-autotable";
import { checkPermission } from "../utils/permissionHelper";

export default function EmployeeList() {
  const context = useOutletContext();
  const userInfo = context?.userInfo;

  const getFilterParams = () => ({
    search,
    level4,
    gender,
    ageMin,
    ageMax,
    phone,
    selfNumber,
    nationalId,
    jobCategory,
    employmentType,
    maritalStatus,
    educationLevel,
    governorate,
    bloodType,
    contractType,
    specialization,
    level1,
    level2,
    level3,
    level5,
    level6,
    workLocation,
    status,
  });

  const getFileName = (extension) => {
    const date = new Date().toISOString().split("T")[0];
    let name = `Employees_${date}`;
    if (level4) name += `_${level4}`;
    if (jobCategory) name += `_${jobCategory}`;
    if (employmentType) name += `_${employmentType}`;
    // Clean filename
    name = name.replace(/[^a-z0-9\u0600-\u06FF_-]/gi, "_");
    return `${name}.${extension}`;
  };

  const exportExcel = async () => {
    try {
      setLoading(true);
      const res = await API.get("/employees", {
        params: { ...getFilterParams(), limit: 10000, page: 1 },
      });
      const allEmployees = res.data.data;

      if (!allEmployees.length) {
        alert("لا يوجد بيانات للتصدير");
        return;
      }

      const dataToExport = allEmployees.map((emp) => ({
        "الرقم الذاتي": emp.selfNumber,
        "الاسم الكامل": emp.fullName,
        "الرقم الوطني": emp.nationalId,
        "رقم الهاتف": emp.phone,
        الجنس: emp.gender,
        "المستوى الإداري الرابع": emp.level4,
        "الفئة الوظيفية": emp.jobCategory,
        "الحالة الوظيفية": emp.employmentType,
        "الوضع العائلي": emp.maritalStatus,
        "المستوى التعليمي": emp.educationLevel,
        المحافظة: emp.governorate,
        "زمرة الدم": emp.bloodType,
        "نوع العقد": emp.contractType,
        الاختصاص: emp.specialization,
        "مكان العمل": emp.workLocation,
        الحالة: emp.status,
        "المستوى الإداري الأول": emp.level1,
        "المستوى الإداري الثاني": emp.level2,
        "المستوى الإداري الثالث": emp.level3,
        "Level 5": emp.level5,
        "Level 6": emp.level6,
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);

      // Set RTL direction
      ws["!views"] = [{ rightToLeft: true }];

      // Apply styles
      const range = XLSX.utils.decode_range(ws["!ref"]);

      // Define styles
      const headerStyle = {
        font: { name: "Arial", bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "2980B9" } }, // Blue background
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };

      const cellStyle = {
        font: { name: "Arial" },
        alignment: { horizontal: "right", vertical: "center" }, // Arabic usually right aligned
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };

      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cell_address]) continue;

          if (R === 0) {
            ws[cell_address].s = headerStyle;
          } else {
            ws[cell_address].s = cellStyle;
          }
        }
      }

      // Auto-width columns (simple approximation)
      const wscols = Object.keys(dataToExport[0]).map(() => ({ wch: 20 })); // Default width 20
      ws["!cols"] = wscols;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Employees");

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });
      saveAs(blob, getFileName("xlsx"));
    } catch (err) {
      console.error("Export failed", err);
      alert("فشل التصدير");
    } finally {
      setLoading(false);
    }
  };

  // Export filtered data to PDF
  const exportPDF = async () => {
    try {
      setLoading(true);
      const res = await API.get("/employees", {
        params: { ...getFilterParams(), limit: 10000, page: 1 },
      });
      const allEmployees = res.data.data;

      if (!allEmployees.length) {
        alert("لا يوجد بيانات للتصدير");
        return;
      }

      const doc = new jsPDF({ orientation: "landscape" });

      // Load resources (Font and Logo)
      const [fontRes, logoRes] = await Promise.all([
        fetch("/fonts/Amiri-Regular.ttf"),
        fetch("/logo.png").catch(() => null), // Optional logo
      ]);

      if (!fontRes.ok) throw new Error("Font not found");

      const fontBlob = await fontRes.blob();
      const fontReader = new FileReader();

      // Handle Logo
      let logoData = null;
      if (logoRes && logoRes.ok) {
        const logoBlob = await logoRes.blob();
        logoData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(logoBlob);
        });
      }

      fontReader.readAsDataURL(fontBlob);
      fontReader.onloadend = function () {
        const base64data = fontReader.result.split(",")[1];
        doc.addFileToVFS("Amiri-Regular.ttf", base64data);
        doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
        doc.setFont("Amiri");

        // Header with Logo
        if (logoData) {
          doc.addImage(logoData, "PNG", 260, 5, 25, 25); // Top Right
        }

        doc.setFontSize(16);
        doc.text("الجمهورية العربية السورية", 148, 15, { align: "center" });
        doc.text("وزارة التنمية الإدارية", 148, 25, { align: "center" });
        doc.setFontSize(14);
        doc.text("قائمة الموظفين", 148, 35, { align: "center" });

        // Reverse columns for RTL in PDF
        const tableColumn = [
          "الرقم الذاتي",
          "الاسم الكامل",
          "الرقم الوطني",
          "الجنس",
          "القسم",
          "رقم الهاتف",
          "الفئة الوظيفية",
          "الحالة الوظيفية",
          "الوضع العائلي",
          "المستوى التعليمي",
          "المحافظة",
          "زمرة الدم",
          "نوع العقد",
          "الاختصاص",
          "مكان العمل",
          "الحالة",
        ].reverse();

        const tableRows = allEmployees.map((emp) =>
          [
            emp.selfNumber,
            emp.fullName,
            emp.nationalId,
            emp.gender,
            emp.level4,
            emp.phone,
            emp.jobCategory,
            emp.employmentType,
            emp.maritalStatus,
            emp.educationLevel,
            emp.governorate,
            emp.bloodType,
            emp.contractType,
            emp.specialization,
            emp.workLocation,
            emp.status,
          ].reverse()
        );

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 45,
          theme: "striped",
          styles: {
            fontSize: 8,
            font: "Amiri",
            halign: "right", // Arabic alignment
          },
          headStyles: {
            fillColor: [41, 128, 185],
            halign: "right",
            font: "Amiri",
          },
        });

        doc.save(getFileName("pdf"));
        setLoading(false);
      };
    } catch (err) {
      console.error("Export failed", err);
      alert("فشل التصدير");
      setLoading(false);
    }
  };

  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [phone, setPhone] = useState("");
  const [selfNumber, setSelfNumber] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [jobCategory, setjobCategory] = useState("");
  const [level4, setLevel4] = useState("");
  const [gender, setGender] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [employmentType, setemploymentType] = useState("");

  // New Filters
  const [maritalStatus, setMaritalStatus] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [contractType, setContractType] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [level1, setLevel1] = useState("");
  const [level2, setLevel2] = useState("");
  const [level3, setLevel3] = useState("");
  const [level5, setLevel5] = useState("");
  const [level6, setLevel6] = useState("");
  const [workLocation, setWorkLocation] = useState("");
  const [status, setStatus] = useState("");

  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await API.get("/employees", {
        params: {
          page,
          limit,
          search,
          level4,
          gender,
          ageMin,
          ageMax,
          phone,
          selfNumber,
          nationalId,
          jobCategory,
          employmentType,
          maritalStatus,
          educationLevel,
          governorate,
          bloodType,
          contractType,
          specialization,
          level1,
          level2,
          level3,
          level5,
          level6,
          workLocation,
          status,
        },
      });
      setEmployees(res.data.data);
      setTotalPages(Math.ceil(res.data.total / res.data.limit));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [
    page,
    limit,
    search,
    level4,
    gender,
    ageMin,
    ageMax,
    phone,
    jobCategory,
    selfNumber,
    nationalId,
    employmentType,
    maritalStatus,
    educationLevel,
    governorate,
    bloodType,
    contractType,
    specialization,
    level1,
    level2,
    level3,
    level5,
    level6,
    workLocation,
    status,
  ]);

  const resetFilters = () => {
    setSearch("");
    setLevel4("");
    setGender("");
    setAgeMin("");
    setAgeMax("");
    setSelfNumber("");
    setNationalId("");
    setjobCategory("");
    setPhone("");
    setemploymentType("");
    setMaritalStatus("");
    setEducationLevel("");
    setGovernorate("");
    setBloodType("");
    setContractType("");
    setSpecialization("");
    setLevel1("");
    setLevel2("");
    setLevel3("");
    setLevel5("");
    setLevel6("");
    setWorkLocation("");
    setStatus("");

    setPage(1);
  };
  const calculateAge = (birthDate) => {
    if (!birthDate) return "-";
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    // Adjust if birthday hasn’t occurred yet this year
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  const dropdownClass =
    "bg-slate-800/70 border border-slate-700 text-slate-100 rounded-xl shadow-sm focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-300";

  return (
    <div
      className="p-6 font-custom relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      dir="rtl"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full`}
            style={{
              width: Math.random() * 6 + 3 + "px",
              height: Math.random() * 6 + 3 + "px",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i % 3 === 0 ? "#d4af37" : "rgba(255,255,255,0.15)",
              opacity: i % 3 === 0 ? 0.4 : 0.2,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
              boxShadow: i % 3 === 0 ? "0 0 10px #d4af37" : "none",
              animation: `floatRandom ${
                5 + Math.random() * 5
              }s ease-in-out infinite`,
            }}
          />
        ))}
        {[...Array(15)].map((_, i) => (
          <div
            key={`circle-${i}`}
            className={`absolute w-1 h-1 rounded-full opacity-30 animate-float`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i % 4 === 0 ? "#d4af37" : "rgba(255,255,255,0.2)",
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 3}s`,
            }}
          />
        ))}
        {[...Array(10)].map((_, i) => (
          <div
            key={`square-${i}`}
            className={`absolute w-1.5 h-1.5 rotate-45 opacity-25 animate-pulseGentle`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i % 2 === 0 ? "#d4af37" : "rgba(255,255,255,0.15)",
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2
          className="text-3xl font-extrabold bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent drop-shadow-lg"
          style={{ textShadow: "0 2px 20px rgba(212, 175, 55, 0.3)" }}
        >
          قائمة الموظفين
        </h2>
        {checkPermission("employees.create", userInfo) && (
          <button
            onClick={() => navigate("/dashboard/employees/add")}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 w-36 text-white px-4 py-2.5 ml-5 font-extrabold rounded-xl shadow-lg hover:shadow-amber-500/25 transition-all duration-300 border border-amber-400/30"
          >
            + موظف جديد
          </button>
        )}
      </div>
      <div className="mb-4 flex justify-between items-center">
        <div className="space-x-2 ml-3">
          {checkPermission("employees.export", userInfo) && (
            <>
              <button
                onClick={exportExcel}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 ml-5 text-white px-5 py-2.5 rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 border border-emerald-400/30"
              >
                تصدير اكسل
              </button>
              <button
                onClick={exportPDF}
                className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white px-5 py-2.5 rounded-xl shadow-lg hover:shadow-rose-500/25 transition-all duration-300 border border-rose-400/30"
              >
                تصدير PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-2xl mb-4 border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <input
            type="text"
            placeholder="ابحث بالاسم"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border border-white/20 p-3 rounded-xl w-full bg-slate-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-300"
          />

          <input
            type="text"
            className="p-3 rounded-xl border border-white/20 w-full bg-slate-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-300"
            placeholder="ابحث برقم الموبايل"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setPage(1);
            }}
          />
          <input
            type="number"
            placeholder="الرقم الوطني"
            value={nationalId}
            onChange={(e) => {
              setNationalId(e.target.value);
              setPage(1);
            }}
            className="border border-white/20 p-3 rounded-xl bg-slate-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-300"
          />
          <input
            type="number"
            placeholder="الرقم الذاتي"
            value={selfNumber}
            onChange={(e) => {
              setSelfNumber(e.target.value);
              setPage(1);
            }}
            className="border border-white/20 p-3 rounded-xl bg-slate-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-300"
          />
        </div>

        <div className="flex justify-center mb-4">
          <button
            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-2 transition-colors duration-300"
          >
            {isFiltersExpanded
              ? "إخفاء الفلاتر المتقدمة"
              : "إظهار الفلاتر المتقدمة"}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transform transition-transform ${
                isFiltersExpanded ? "rotate-180" : ""
              }`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {isFiltersExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 border-t border-white/20 pt-4 animate-fadeIn">
            <DropdownWithSettings
              id="employee_list_employment_type"
              value={employmentType}
              onChange={(e) => {
                setemploymentType(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "مثبت", label: "مثبت" },
                { value: "متعاقد", label: "متعاقد" },
              ]}
              placeholder="الحالة الوظيفية"
              className={dropdownClass}
              isAdmin={userInfo?.role === "admin"}
            />
            <DropdownWithSettings
              id="employee_list_job_category"
              value={jobCategory}
              onChange={(e) => {
                setjobCategory(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "الفئة الاولى", label: "الفئة الاولى" },
                { value: "الفئة الثانية", label: "الفئة الثانية" },
                { value: "الفئة الثالثة", label: "الفئة الثالثة" },
                { value: "الفئة الرابعة", label: "الفئة الرابعة" },
                { value: "الفئة الخامسة", label: "الفئة الخامسة" },
              ]}
              placeholder="الفئات الوظيفية"
              className={dropdownClass}
              isAdmin={userInfo?.role === "admin"}
            />
            <DropdownWithSettings
              id="employee_list_department"
              value={level4}
              onChange={(e) => {
                setLevel4(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "", label: "كل الاقسام" },
                { value: "مديرية المعلوماتية", label: "مديرية المعلوماتية" },
                {
                  value: "مديرية التنمية الإدارية",
                  label: "مديرية التنمية الإدارية",
                },
                {
                  value: "مكتب التنمية المحلية",
                  label: "مكتب التنمية المحلية",
                },
                {
                  value: "مديرية إدارة النفايات الصلبة",
                  label: "مديرية إدارة النفايات الصلبة",
                },
                {
                  value: "مديرية المجالس المحلية",
                  label: "مديرية المجالس المحلية",
                },
              ]}
              placeholder="المستوى الإداري الرابع"
              className={dropdownClass}
              isAdmin={userInfo?.role === "admin"}
            />
            <DropdownWithSettings
              id="employee_list_gender"
              value={gender}
              onChange={(e) => {
                setGender(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "", label: "الكل" },
                { value: "انثى", label: "انثى" },
                { value: "ذكر", label: "ذكر" },
              ]}
              placeholder="الجنس"
              className={dropdownClass}
              isAdmin={userInfo?.role === "admin"}
            />
            <input
              type="number"
              placeholder="العمر الادنى"
              value={ageMin}
              onChange={(e) => {
                setAgeMin(e.target.value);
                setPage(1);
              }}
              className="border border-white/20 p-3 rounded-xl bg-slate-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-300"
            />
            <input
              type="number"
              placeholder="العمر الاقصى"
              value={ageMax}
              onChange={(e) => {
                setAgeMax(e.target.value);
                setPage(1);
              }}
              className="border border-white/20 p-3 rounded-xl bg-slate-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-300"
            />

            {/* New Filters Inputs */}
            <DropdownWithSettings
              id="employee_list_marital_status"
              value={maritalStatus}
              onChange={(e) => {
                setMaritalStatus(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "عازب", label: "عازب" },
                { value: "متزوج", label: "متزوج" },
                { value: "مطلق", label: "مطلق" },
                { value: "ارمل", label: "ارمل" },
              ]}
              placeholder="الوضع العائلي"
              className={dropdownClass}
              isAdmin={userInfo?.role === "admin"}
            />
            <DropdownWithSettings
              id="employee_list_education_level"
              value={educationLevel}
              onChange={(e) => {
                setEducationLevel(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "ابتدائية", label: "ابتدائية" },
                { value: "إعدادية", label: "إعدادية" },
                { value: "ثانوية", label: "ثانوية" },
                { value: "معهد", label: "معهد" },
                { value: "جامعة", label: "جامعة" },
                { value: "ماجستير", label: "ماجستير" },
                { value: "دكتوراه", label: "دكتوراه" },
              ]}
              placeholder="المستوى التعليمي"
              className={dropdownClass}
              isAdmin={userInfo?.role === "admin"}
            />
            <DropdownWithSettings
              id="employee_list_governorate"
              value={governorate}
              onChange={(e) => {
                setGovernorate(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "دمشق", label: "دمشق" },
                { value: "ريف دمشق", label: "ريف دمشق" },
                { value: "حلب", label: "حلب" },
                { value: "حمص", label: "حمص" },
                { value: "حماة", label: "حماة" },
                { value: "اللاذقية", label: "اللاذقية" },
                { value: "طرطوس", label: "طرطوس" },
                { value: "إدلب", label: "إدلب" },
                { value: "درعا", label: "درعا" },
                { value: "السويداء", label: "السويداء" },
                { value: "القنيطرة", label: "القنيطرة" },
                { value: "دير الزور", label: "دير الزور" },
                { value: "الحسكة", label: "الحسكة" },
                { value: "الرقة", label: "الرقة" },
              ]}
              placeholder="المحافظة"
              className={dropdownClass}
              isAdmin={userInfo?.role === "admin"}
            />
            <DropdownWithSettings
              id="employee_list_blood_type"
              value={bloodType}
              onChange={(e) => {
                setBloodType(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "A+", label: "A+" },
                { value: "A-", label: "A-" },
                { value: "B+", label: "B+" },
                { value: "B-", label: "B-" },
                { value: "O+", label: "O+" },
                { value: "O-", label: "O-" },
                { value: "AB+", label: "AB+" },
                { value: "AB-", label: "AB-" },
              ]}
              placeholder="زمرة الدم"
              className={dropdownClass}
              isAdmin={userInfo?.role === "admin"}
            />
            <DropdownWithSettings
              id="employee_list_contract_type"
              value={contractType}
              onChange={(e) => {
                setContractType(e.target.value);
                setPage(1);
              }}
              options={[]}
              placeholder="نوع العقد"
              className={dropdownClass}
              isAdmin={userInfo?.role === "admin"}
            />
            <DropdownWithSettings
              id="employee_list_specialization"
              value={specialization}
              onChange={(e) => {
                setSpecialization(e.target.value);
                setPage(1);
              }}
              options={[]}
              placeholder="الاختصاص"
              className={dropdownClass}
              isAdmin={userInfo?.role === "admin"}
            />
            <DropdownWithSettings
              id="employee_list_work_location"
              value={workLocation}
              onChange={(e) => {
                setWorkLocation(e.target.value);
                setPage(1);
              }}
              options={[]}
              placeholder="مكان العمل"
              className={dropdownClass}
              isAdmin={userInfo?.role === "admin"}
            />
            <DropdownWithSettings
              id="employee_list_status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "active", label: "نشط" },
                { value: "inactive", label: "غير نشط" },
                { value: "on_leave", label: "إجازة" },
                { value: "terminated", label: "منهي خدماته" },
              ]}
              placeholder="حالة الموظف"
              className={dropdownClass}
              isAdmin={userInfo?.role === "admin"}
            />

            {/* Levels */}
            <DropdownWithSettings
              id="employee_list_level1"
              value={level1}
              onChange={(e) => {
                setLevel1(e.target.value);
                setPage(1);
              }}
              options={[]}
              placeholder="المستوى الإداري الأول"
              className={dropdownClass}
              isAdmin={userInfo?.role === "admin"}
            />
            <DropdownWithSettings
              id="employee_list_level2"
              value={level2}
              onChange={(e) => {
                setLevel2(e.target.value);
                setPage(1);
              }}
              options={[]}
              placeholder="المستوى الإداري الثاني"
              className={dropdownClass}
              isAdmin={userInfo?.role === "admin"}
            />
            <DropdownWithSettings
              id="employee_list_level3"
              value={level3}
              onChange={(e) => {
                setLevel3(e.target.value);
                setPage(1);
              }}
              options={[]}
              placeholder="المستوى الإداري الثالث"
              className={dropdownClass}
              isAdmin={userInfo?.role === "admin"}
            />
            <DropdownWithSettings
              id="employee_list_level5"
              value={level5}
              onChange={(e) => {
                setLevel5(e.target.value);
                setPage(1);
              }}
              options={[]}
              placeholder="Level 5"
              className={dropdownClass}
              isAdmin={userInfo?.role === "admin"}
            />
            <DropdownWithSettings
              id="employee_list_level6"
              value={level6}
              onChange={(e) => {
                setLevel6(e.target.value);
                setPage(1);
              }}
              options={[]}
              placeholder="Level 6"
              className={dropdownClass}
              isAdmin={userInfo?.role === "admin"}
            />
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-t border-white/20 pt-4">
          <button
            onClick={resetFilters}
            className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white px-6 py-2.5 rounded-xl transition-all duration-300 border border-white/20 shadow-lg"
          >
            تهيئة الحقول
          </button>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-300">
              عدد الصفوف:
            </label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="border border-white/20 p-3 rounded-xl bg-slate-800/50 text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-300 cursor-pointer"
            >
              <option value={10} className="bg-slate-800 m-4">
                10
              </option>
              <option value={20} className="bg-slate-800">
                20
              </option>
              <option value={50} className="bg-slate-800">
                50
              </option>
              <option value={100} className="bg-slate-800">
                100
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl shadow-2xl border border-white/20">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-sm">
              <th className="border border-white/10 p-3 text-amber-300">#</th>
              <th className="border border-white/10 p-4 text-amber-300">
                الاسم الثلاثي
              </th>
              <th className="border border-white/10 p-3 text-amber-300">
                لرقم الوطني
              </th>
              <th className="border border-white/10 p-3 text-amber-300">
                الجنس
              </th>
              <th className="border border-white/10 p-3 text-amber-300">
                القسم
              </th>
              <th className="border border-white/10 p-3 text-amber-300">
                رقم الموبايل
              </th>
              <th className="border border-white/10 p-3 text-amber-300">
                العمر
              </th>
              <th className="border border-white/10 p-3 text-amber-300">
                الفئة الوظيفية
              </th>

              {checkPermission("employees.edit", userInfo) && (
                <th className="border border-white/10 p-3 text-amber-300">
                  الاجراءات
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={
                    checkPermission("employees.edit", userInfo) ? "9" : "8"
                  }
                  className="text-center p-4 text-gray-300 bg-slate-800/50"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                    جاري التحميل...
                  </div>
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    checkPermission("employees.edit", userInfo) ? "9" : "8"
                  }
                  className="text-center p-4 text-gray-400 bg-slate-800/50"
                >
                  لا يوجد موظفين
                </td>
              </tr>
            ) : (
              employees.map((emp, index) => (
                <tr
                  key={emp._id}
                  className="hover:bg-white/10 text-sm text-gray-200 transition-colors duration-200 bg-slate-800/30"
                >
                  <td className="border border-white/10 p-3 text-center">
                    {(page - 1) * 50 + index + 1}
                  </td>
                  <td className="border border-white/10 p-4 m-2 text-center">
                    <Link
                      to={`/dashboard/employees/${emp._id}`}
                      onClick={(e) => {
                        console.log("====================================");
                        console.log(e);
                        console.log("====================================");
                      }}
                      className="text-amber-300 hover:text-amber-200 hover:underline transition-colors duration-200"
                    >
                      {emp.fullName}
                    </Link>
                  </td>
                  <td className="border border-white/10 p-3 text-center">
                    {emp.nationalId}
                  </td>
                  <td className="border border-white/10 p-3 text-center">
                    {emp.gender}
                  </td>
                  <td className="border border-white/10 p-3 text-center">
                    {emp.level4}
                  </td>
                  <td className="border border-white/10 p-3 text-center">
                    {emp.phone}
                  </td>
                  <td className="border border-white/10 p-3 text-center">
                    {emp.birthDate ? calculateAge(emp.birthDate) : "-"}
                  </td>
                  <td className="border border-white/10 p-3 text-center">
                    {emp.jobCategory}
                  </td>
                  {checkPermission("employees.edit", userInfo) && (
                    <td className="border border-white/10 p-3 text-center">
                      <Link
                        to={`${emp._id}`}
                        className="text-amber-400 hover:text-amber-300 hover:underline transition-colors duration-200"
                      >
                        تعديل
                      </Link>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} setPage={setPage} totalPages={totalPages} />
    </div>
  );
}
