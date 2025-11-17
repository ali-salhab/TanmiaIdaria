import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";
import Pagination from "../components/Pagination";
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
  const [level4, setLevel4] = useState("");
  const [gender, setGender] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

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
  }, [page, search, level4, gender, ageMin, ageMax]);

  const resetFilters = () => {
    setSearch("");
    setLevel4level4("");
    setGender("");
    setAgeMin("");
    setAgeMax("");
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
    <div className="p-6 font-custom" dir="rtl">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-3xl text-gray-800 font-extrabold">
          قائمة الموظفين
        </h2>
        <button
          onClick={() => navigate("/employees/add")}
          className="bg-gray-700 text-white px-4 py-2 ml-5 font-extrabold rounded hover:bg-gray-800 transition"
        >
          + إضافة موظف جديد
        </button>
      </div>
      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="ابحث ...."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded w-1/3"
        />

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
          placeholder="Search by name or ID..."
          value={search}
          onChange={(e) => {
            console.log(e.target.value);
            setSearch(e.target.value);
            setPage(1);
          }}
          className="border p-2 rounded w-full"
        />
        <select
          value={level4}
          onChange={(e) => {
            setLevel4(e.target.value);
            console.log(e.target.value);
            setPage(1);
          }}
          className="border p-2 rounded"
        >
          <option value="">كل الاقسام</option>
          <option value="مديرية المعلوماتية">مديرية المعلوماتية</option>
          <option value="مديرية التنمية الإدارية">
            مديرية التنمية الإدارية
          </option>
          <option value="مكتب التنمية المحلية">مكتب التنمية المحلية</option>
          <option value="مديرية إدارة النفايات الصلبة">
            مديرية إدارة النفايات الصلبة
          </option>
          <option value="مكتب التنمية المحلية">مكتب التنمية المحلية</option>
          <option value="   مديرية المجالس المحلية">
            مديرية المجالس المحلية
          </option>
        </select>
        <select
          value={gender}
          onChange={(e) => {
            setGender(e.target.value);
            setPage(1);
          }}
          className="border p-2 rounded"
        >
          <option value="">الكل</option>
          <option value="انثى">انثى</option>
          <option value="ذكر">ذكر</option>
        </select>
        <input
          type="number"
          placeholder="Min Age"
          value={ageMin}
          onChange={(e) => {
            setAgeMin(e.target.value);
            setPage(1);
          }}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Max Age"
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
              <th className="border p-2">الاجراءات</th>
              <th className="border p-2">شلث</th>
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
