import { useEffect, useState } from "react";
import API from "../api/api";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function ViewerHome() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");

  // ✅ Fetch employee data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get("/employees", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEmployees(res.data);
      } catch (err) {
        console.error("Failed to load employees", err);
      }
    };
    fetchData();
  }, []);

  // ✅ Extract unique filters
  //   const departments = [
  //     ...new Set(employees.map((e) => e.department).filter(Boolean)),
  //   ];
  //   const positions = [
  //     ...new Set(employees.map((e) => e.position).filter(Boolean)),
  //   ];

  //   // ✅ Apply filters
  //   const filtered = employees.filter((e) => {
  //     const matchesSearch =
  //       e.name?.toLowerCase().includes(search.toLowerCase()) ||
  //       e.position?.toLowerCase().includes(search.toLowerCase());
  //     const matchesDept = department ? e.department === department : true;
  //     const matchesPos = position ? e.position === position : true;
  //     return matchesSearch && matchesDept && matchesPos;
  //   });

  // ✅ Print
  const handlePrint = () => window.print();

  // ✅ Export to Excel
  const handleExportExcel = () => {
    const data = filtered.map((e) => ({
      Name: e.name,
      Position: e.position,
      Department: e.department,
      "Documents Count": e.documents?.length || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
    XLSX.writeFile(workbook, "employees.xlsx");
  };

  // ✅ Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Employee Directory", 14, 14);
    const tableData = filtered.map((e) => [
      e.name,
      e.position,
      e.department,
      e.documents?.length || 0,
    ]);
    doc.autoTable({
      head: [["Name", "Position", "Department", "Documents"]],
      body: tableData,
      startY: 20,
    });
    doc.save("employees.pdf");
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-semibold mb-6 text-center text-gray-800">
        Employee Directory
      </h1>

      {/* ✅ Filters */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name or position..."
          className="border p-2 rounded w-full md:w-1/3"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border p-2 rounded w-full md:w-1/4"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="">All Departments</option>
          {/* {departments.map((d, i) => (
            <option key={i} value={d}>
              {d}
            </option>
          ))} */}
        </select>

        <select
          className="border p-2 rounded w-full md:w-1/4"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
        >
          <option value="">All Positions</option>
          {/* {positions.map((p, i) => (
            <option key={i} value={p}>
              {p}
            </option>
          ))} */}
        </select>

        {/* ✅ Export buttons */}
        <div className="flex gap-2 w-full md:w-auto justify-center md:justify-end">
          <button
            onClick={handleExportExcel}
            className="bg-green-600 text-white px-4 py-2 rounded shadow"
          >
            Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-red-600 text-white px-4 py-2 rounded shadow"
          >
            Export PDF
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow"
          >
            Print
          </button>
        </div>
      </div>

      {/* ✅ Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2 text-left">Name</th>
              <th className="border px-3 py-2 text-left">Position</th>
              <th className="border px-3 py-2 text-left">Department</th>
              <th className="border px-3 py-2 text-left">Documents</th>
            </tr>
          </thead>
          <tbody>
            {/* {filtered.map((emp) => (
              <tr key={emp._id} className="hover:bg-gray-50">
                <td className="border px-3 py-2">{emp.name}</td>
                <td className="border px-3 py-2">{emp.position}</td>
                <td className="border px-3 py-2">{emp.department}</td>
                <td className="border px-3 py-2">
                  {emp.documents?.length ? (
                    emp.documents.map((doc, i) => (
                      <a
                        key={i}
                        href={`http://localhost:5001${doc.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 mr-2"
                      >
                        View
                      </a>
                    ))
                  ) : (
                    <span className="text-gray-400">No Docs</span>
                  )}
                </td>
              </tr>
            ))} */}
            {/* {!filtered.length && (
              <tr>
                <td colSpan="4" className="text-center text-gray-500 py-3">
                  No results found
                </td>
              </tr>
            )} */}
          </tbody>
        </table>
      </div>
    </div>
  );
}
