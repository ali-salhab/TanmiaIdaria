import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";
import Pagination from "../components/Pagination";
import DropdownWithSettings from "../components/DropdownWithSettings";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
// Correct import for autotable with Vite/ES6
import autoTable from "jspdf-autotable";
export default function EmployeeList() {
  const exportExcel = () => {
    if (!employees.length) return;

    const ws = XLSX.utils.json_to_sheet(employees);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "employees.xlsx");
  };

  // Export filtered data to PDF
  const exportPDF = () => {
    if (!employees.length) return;

    const doc = new jsPDF();

    const tableColumn = [
      "ID",
      "Full Name",
      "National ID",
      "Gender",
      "Level4level4",
    ];
    const tableRows = employees.map((emp) => [
      emp.selfNumber,
      emp.fullName,
      emp.nationalId,
      emp.gender,
      emp.level1,
    ]);

    // Call autoTable like this:
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      theme: "striped", // optional
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 10 },
    });

    doc.text("Employee List", 14, 15);
    doc.save("employees.pdf");
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
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [employmentType, setemploymentType] = useState("");

  const fetchEmployees = async () => {
    try {
      console.log("searching .... filter based on ");
      console.log(page, search, level4, gender, ageMin, ageMax);
      setLoading(true);
      const res = await API.get("/employees", {
        params: {
          page,
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
        },
      });
      console.log(employees);
      // Adjust according to your API structure
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
  return (
    <div
      className="p-6 font-custom relative min-h-screen overflow-hidden"
      dir="rtl"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-white rounded-full opacity-20 animate-floatRandom`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          />
        ))}
        {[...Array(15)].map((_, i) => (
          <div
            key={`circle-${i}`}
            className={`absolute w-1 h-1 bg-white rounded-full opacity-30 animate-float`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 3}s`,
            }}
          />
        ))}
        {[...Array(10)].map((_, i) => (
          <div
            key={`square-${i}`}
            className={`absolute w-1.5 h-1.5 bg-white rotate-45 opacity-25 animate-pulseGentle`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
      <div className="mb-6 flex flex-col md:flex-row  md:items-center md:justify-between gap-4">
        <h2 className="text-3xl text-gray-800 font-extrabold">
          قائمة الموظفين
        </h2>
        <button
          onClick={() => navigate("/employees/add")}
          className="bg-gray-700 w-32 text-white px-4 py-2 ml-5 font-extrabold rounded hover:bg-gray-800 transition"
        >
          + موظف جديد
        </button>
      </div>
      <div className="mb-4 flex justify-between items-center">
        <div className="space-x-2 ml-3">
          <button
            onClick={exportExcel}
            className="bg-gray-700 ml-5 text-white px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            تصدير اكسل
          </button>
          <button
            onClick={exportPDF}
            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            تصدير PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded shadow mb-4 grid grid-cols-1 md:grid-cols-5 gap-4">
        <input
          type="text"
          placeholder="ابحث بالاسم"
          value={search}
          onChange={(e) => {
            console.log(e.target.value);
            setSearch(e.target.value);
            setPage(1);
          }}
          className="border p-2 rounded w-full"
        />

        <input
          type="Text"
          className="p-2 rounded border w-full"
          placeholder="ابحث برقم الموبايل"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setPage(1);
          }}
        />
        <input
          type="number"
          placeholder="الرقم الوطني "
          value={nationalId}
          onChange={(e) => {
            setNationalId(e.target.value);
            setPage(1);
          }}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="الرقم الداتي "
          value={ageMin}
          onChange={(e) => {
            setSelfNumber(e.target.value);
            setPage(1);
          }}
          className="border p-2 rounded"
        />
        <DropdownWithSettings
          id="employee_list_department"
          value={level4}
          onChange={(e) => {
            setemploymentType(e.target.value);
            console.log(e.target.value);
            setPage(1);
          }}
          options={[
            { value: " مثبت", label: "مثبت" },
            { value: "متعاقد", label: "متعاقد" },
          ]}
          placeholder="الحالة الوظيفية"
          className="border p-2 rounded"
        />
        <DropdownWithSettings
          // id="employee_list_department"
          value={jobCategory}
          onChange={(e) => {
            setjobCategory(e.target.value);
            console.log(e.target.value);
            setPage(1);
          }}
          options={[
            {
              value: "الفئة الاولى",
              label: "الفئة الاولى",
            },

            {
              value: "الفئة الثانية",
              label: "الفئة الثانية",
            },

            {
              value: "الفئة الثالثة",
              label: "الفئة الثالثة",
            },
            {
              value: "الفئة الرابعة",
              label: "الفئة الرابعة",
            },
            {
              value: "الفئة  الخامسة",
              label: "الفئة  الخامسة",
            },
          ]}
          placeholder=" الفئات الوظيفية"
          className="border p-2 rounded"
        />
        <DropdownWithSettings
          id="employee_list_department"
          value={level4}
          onChange={(e) => {
            setLevel4(e.target.value);
            console.log(e.target.value);
            setPage(1);
          }}
          options={[
            { value: "", label: "كل الاقسام" },
            { value: "مديرية المعلوماتية", label: "مديرية المعلوماتية" },
            {
              value: "مديرية التنمية الإدارية",
              label: "مديرية التنمية الإدارية",
            },
            { value: "مكتب التنمية المحلية", label: "مكتب التنمية المحلية" },
            {
              value: "مديرية إدارة النفايات الصلبة",
              label: "مديرية إدارة النفايات الصلبة",
            },
            {
              value: "مديرية المجالس المحلية",
              label: "مديرية المجالس المحلية",
            },
          ]}
          placeholder="كل الاقسام"
          className="border p-2 rounded"
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
          placeholder="الكل"
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="العمر الادنى"
          value={ageMin}
          onChange={(e) => {
            setAgeMin(e.target.value);
            setPage(1);
          }}
          className="border p-2 rounded"
        />

        <input
          type="number"
          placeholder="العمر الاقصى"
          value={ageMax}
          onChange={(e) => {
            setAgeMax(e.target.value);
            setPage(1);
          }}
          className="border p-2 rounded"
        />
        <button
          onClick={resetFilters}
          className="md:col-span-5 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded w-full"
        >
          تهيئة الحقول
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto ">
        <table className="w-full border-collapse items-center border border-gray-300">
          <thead className="items-center justify-center">
            <tr className="bg-gray-200 text-sm center align-middle items-center justify-center">
              <th className="border p-2">#</th>
              <th className="border p-4">الاسم الثلاثي</th>
              <th className="border p-2">لرقم الوطني</th>
              <th className="border p-2">الجنس</th>
              <th className="border p-2">القسم</th>
              <th className="border p-2">رقم الموبايل</th>
              <th className="border p-2">العمر</th>
              <th className="border p-2">الفئة الوظيفية</th>

              <th className="border p-2">الاجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center p-4">
                  Loading...
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center p-4 text-gray-500">
                  No employees found
                </td>
              </tr>
            ) : (
              employees.map((emp, index) => (
                <tr key={emp._id} className="hover:bg-gray-100 text-sm">
                  <td className="border p-2 text-center ">
                    {(page - 1) * 50 + index + 1}
                  </td>
                  <td className="border p-4 m-2 text-center">
                    <Link
                      to={`employees/${emp._id}`}
                      onClick={(e) => {
                        console.log("====================================");
                        console.log(e);
                        console.log("====================================");
                      }}
                      className="text-gray-700 hover:bg-gray-300 hover:p-2 hover:rounded-md hover:m-2 hover:text-gray-900 transition"
                    >
                      {emp.fullName}
                    </Link>
                  </td>
                  <td className="border p-2 text-center">{emp.nationalId}</td>
                  <td className="border p-2 text-center">{emp.gender}</td>
                  <td className="border p-2 text-center">{emp.level4}</td>
                  <td className="border p-2 text-center ">{emp.phone}</td>
                  <td className="border p-2 text-center">
                    {emp.birthDate ? calculateAge(emp.birthDate) : "-"}
                  </td>
                  <td>{emp.jobCategory}</td>
                  <td className="border p-2 text-center">
                    <Link
                      to={`${emp._id}`}
                      className="text-gray-700 hover:text-gray-900 hover:underline transition"
                    >
                      تعديل
                    </Link>
                  </td>
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
