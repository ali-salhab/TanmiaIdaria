// /api/employees/\

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import API from "../api/api";
import { FaEdit } from "react-icons/fa";
import toast from "react-hot-toast";
import { FileArchive } from "lucide-react";
export default function EmployeeIncidents() {
  const { id } = useParams(); // Employee ID

  const [incidents, setIncidents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [cvModalOpen, setcvModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null); // For add/edit
  const [currentEmployee, setCurrentEmployee] = useState(null);
  useEffect(() => {
    fetchIncidents();
    fetchCurrentEmployee();
  }, []);
  const fetchCurrentEmployee = async () => {
    try {
      const res = await API.get(`/employees/${id}`);
      console.log("====================================");
      console.log(res.data.fullName);
      console.log("====================================");
      setCurrentEmployee(res.data);
    } catch (error) {
      toast.error("cant get the current employee");
    }
  };
  const fetchIncidents = async () => {
    try {
      const res = await API.get(`/incidents/${id}`);
      setIncidents(res.data);
    } catch (err) {
      console.error(err);
      alert("فشل في جلب الوقوعات.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedIncident({ ...selectedIncident, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedIncident._id) {
        // تعديل الوقوع
        await API.put(`/incidents/${selectedIncident._id}`, selectedIncident);
      } else {
        // إضافة وقوع جديد
        await API.post("/incidents", selectedIncident);
      }
      setModalOpen(false);
      setSelectedIncident({
        work_center: "",
        job_title: "",
        job_type: "",
        salary: "",
        category: "",
        start_date: "",
        change_date: "",
        reason: "",
        document_type: "",
        document_number: "",
        document_date: "",
        registrar_name: "",
        registrar_signature: "",
        employee: id,
      });
      fetchIncidents();
    } catch (err) {
      console.error(err);
      alert("فشل في حفظ الوقوع.");
    }
  };

  const openCvModal = () => {
    setcvModalOpen(true);
  };
  const openAddModal = () => {
    setSelectedIncident({
      work_center: "",
      job_title: "",
      job_type: "",
      salary: "",
      category: "",
      start_date: "",
      change_date: "",
      reason: "",
      document_type: "",
      document_number: "",
      document_date: "",
      registrar_name: "",
      registrar_signature: "",
      employee: id,
    });
    setModalOpen(true);
  };

  const openEditModal = (incident) => {
    setSelectedIncident({ ...incident });
    setModalOpen(true);
  };

  return (
    <div
      className="max-w-6xl mx-auto p-6 bg-gray-100 rounded-lg mt-6"
      dir="rtl"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">الوقوعات للموظف</h2>
        {currentEmployee ? currentEmployee.fullName : "جارٍ التحميل..."}
        <button
          onClick={openAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          إضافة وقوع جديد
        </button>
        <div className="flex">
          <button
            onClick={openCvModal}
            className="bg-emerald-800 flex items-center gap-2 text-white px-4 py-3 rounded hover:bg-emerald-700 hover:animate-slowBounce"
          >
            البطاقة الداتية للموظف <FileArchive />
          </button>
        </div>
      </div>

      {/* جدول الوقوعات */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-blue-50 border-b">
            <tr>
              <th className="py-2 px-4 text-right">مركز العمل</th>
              <th className="py-2 px-4 text-right">المسمى الوظيفي</th>
              <th className="py-2 px-4 text-right">نوع الوظيفة</th>
              <th className="py-2 px-4 text-right">الأجر</th>
              <th className="py-2 px-4 text-right">الفئة</th>
              <th className="py-2 px-4 text-right">تاريخ المباشرة</th>
              <th className="py-2 px-4 text-right">تاريخ التبدل</th>
              <th className="py-2 px-4 text-right">السبب</th>
              <th className="py-2 px-4 text-right">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((inc) => (
              <tr key={inc._id} className="border-b hover:bg-gray-50 text-sm">
                <td className="py-2 px-4">{inc.work_center}</td>
                <td className="py-2 px-4">{inc.job_title}</td>
                <td className="py-2 px-4">{inc.job_type}</td>
                <td className="py-2 px-4">{inc.salary}</td>
                <td className="py-2 px-4">{inc.category}</td>
                <td className="py-2 px-4">{inc.start_date?.split("T")[0]}</td>
                <td className="py-2 px-4">{inc.change_date?.split("T")[0]}</td>
                <td className="py-2 px-4">{inc.reason}</td>
                <td className="py-2 px-4 text-center">
                  <button
                    onClick={() => openEditModal(inc)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FaEdit />
                  </button>
                </td>
              </tr>
            ))}
            {incidents.length === 0 && (
              <tr>
                <td colSpan="9" className="text-center py-4 text-gray-500">
                  لا توجد وقوعات حالياً
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {cvModalOpen && (
        <div className="fixed inset-0 animate-pulse duration-200  flex items-center justify-center bg-opacity-5 bg-black  z-5">
          <div className="bg-white rounded-lg p-6 max-w-md w-full transform transition-all duration-300 scale-95 animate-fadeInUp overflow-y-auto max-h-[90vh]"></div>
          <div className="flex flex-col justify-between mt-4">
            <button
              type="button"
              onClick={() => setcvModalOpen(false)}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              حفظ
            </button>
          </div>
        </div>
      )}
      {/* مودال إضافة/تعديل الوقوع */}
      {modalOpen && selectedIncident && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full transform transition-all duration-300 scale-95 animate-fadeInUp overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold mb-4 text-center">
              {selectedIncident._id ? "تعديل الوقوع" : "إضافة وقوع جديد"}
            </h3>
            <form className="grid grid-cols-1 gap-3" onSubmit={handleSubmit}>
              {[
                { label: "مركز العمل", name: "work_center", type: "text" },
                { label: "المسمى الوظيفي", name: "job_title", type: "text" },
                { label: "نوع الوظيفة", name: "job_type", type: "text" },
                { label: "الأجر", name: "salary", type: "number" },
                { label: "الفئة", name: "category", type: "text" },
                { label: "تاريخ المباشرة", name: "start_date", type: "date" },
                { label: "تاريخ التبدل", name: "change_date", type: "date" },
                { label: "السبب", name: "reason", type: "text" },
                { label: "نوع المستند", name: "document_type", type: "text" },
                { label: "رقم المستند", name: "document_number", type: "text" },
                { label: "تاريخ المستند", name: "document_date", type: "date" },
                { label: "اسم المسجل", name: "registrar_name", type: "text" },
                {
                  label: "توقيع المسجل",
                  name: "registrar_signature",
                  type: "text",
                },
              ].map((field) => (
                <div key={field.name} className="flex flex-col">
                  <label className="mb-1 font-medium">{field.label}</label>
                  <input
                    name={field.name}
                    type={field.type}
                    value={selectedIncident[field.name] || ""}
                    onChange={handleChange}
                    className="border p-2 rounded"
                  />
                </div>
              ))}

              <div className="flex justify-between mt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
