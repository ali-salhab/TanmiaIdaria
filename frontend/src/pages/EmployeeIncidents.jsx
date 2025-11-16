// /api/employees/\

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import API from "../api/api";
import { FaEdit } from "react-icons/fa";
import toast from "react-hot-toast";
import { FileArchive, Settings } from "lucide-react";
export default function EmployeeIncidents() {
  const { id } = useParams(); // Employee ID

  const [incidents, setIncidents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [cvModalOpen, setcvModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [dropdownSettings, setDropdownSettings] = useState({
    category: ["أولى", "تانية", "تالتة", "رابعة", "خامسة"],
    reason: ["زيادة أجر", "تجديد عقد", "تثبيت", "ترفيع"],
    document_type: ["مرسوم", "قرار"],
  });
  useEffect(() => {
    fetchIncidents();
    fetchCurrentEmployee();
    fetchDropdownSettings();
  }, []);

  const fetchDropdownSettings = async () => {
    try {
      const res = await API.get("/app-settings/dropdowns");
      if (res.data) {
        setDropdownSettings(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch dropdown settings:", error);
    }
  };

  const saveDropdownSettings = async () => {
    try {
      await API.post("/app-settings/dropdowns", dropdownSettings);
      toast.success("تم حفظ إعدادات القائمات بنجاح");
      setSettingsModalOpen(false);
    } catch (error) {
      console.error("Failed to save dropdown settings:", error);
      toast.error("فشل حفظ الإعدادات");
    }
  };
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
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Saving incident:", selectedIncident);
      if (selectedIncident._id) {
        await API.put(`/incidents/${selectedIncident._id}`, selectedIncident);
        toast.success("تم تعديل الوقوع بنجاح");
      } else {
        await API.post("/incidents", selectedIncident);
        toast.success("تمت إضافة وقوع جديد");
      }

      setModalOpen(false);
      fetchIncidents();
    } catch (err) {
      console.error(err);
      toast.error("فشل في حفظ الوقوع");
    }
  };
  const openEditModal = (incident) => {
    setSelectedIncident({ ...incident });
    setModalOpen(true);
  };

  return (
    <div
      className="max-w-6xl mx-auto p-6 bg-gray-50 rounded-lg mt-6"
      dir="rtl"
    >
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-800">الوقوعات للموظف</h2>
        <span className="text-gray-600 font-medium">
          {currentEmployee ? currentEmployee.fullName : "جارٍ التحميل..."}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-lg flex items-center gap-2 transition"
          >
            <Settings size={20} />
            إعدادات
          </button>
          <button
            onClick={openAddModal}
            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            إضافة وقوع جديد
          </button>
          <button
            onClick={openCvModal}
            className="bg-gray-800 flex items-center gap-2 text-white px-4 py-3 rounded hover:bg-gray-900 hover:animate-slowBounce transition"
          >
            البطاقة الداتية للموظف <FileArchive />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-200 border-b border-gray-300">
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
              <tr key={inc._id} className="border-b border-gray-200 hover:bg-gray-100 text-sm transition">
                <td className="py-2 px-4 text-gray-700">{inc.work_center}</td>
                <td className="py-2 px-4 text-gray-700">{inc.job_title}</td>
                <td className="py-2 px-4 text-gray-700">{inc.job_type}</td>
                <td className="py-2 px-4 text-gray-700">{inc.salary}</td>
                <td className="py-2 px-4 text-gray-700">{inc.category}</td>
                <td className="py-2 px-4 text-gray-700">{inc.start_date?.split("T")[0]}</td>
                <td className="py-2 px-4 text-gray-700">{inc.change_date?.split("T")[0]}</td>
                <td className="py-2 px-4 text-gray-700">{inc.reason}</td>
                <td className="py-2 px-4 text-center">
                  <button
                    onClick={() => openEditModal(inc)}
                    className="text-gray-600 hover:text-gray-800 transition"
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full transform transition-all duration-300 animate-fadeInUp overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold mb-4 text-center text-gray-800">البطاقة الداتية للموظف</h3>
            <div className="flex flex-col justify-between mt-4 gap-2">
              <button
                type="button"
                onClick={() => setcvModalOpen(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 transition"
              >
                تحميل
              </button>
            </div>
          </div>
        </div>
      )}
      {/* مودال إضافة/تعديل الوقوع */}
      {modalOpen && selectedIncident && (
        <div
          onClick={(e) => {
            // Close modal only if user clicks on the background (overlay)
            if (e.target === e.currentTarget) {
              setModalOpen(false);
            }
          }}
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
        >
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
                {
                  label: "الفئة",
                  name: "category",
                  type: "select",
                  options: dropdownSettings.category,
                },
                { label: "تاريخ المباشرة", name: "start_date", type: "date" },
                { label: "تاريخ التبدل", name: "change_date", type: "date" },
                {
                  label: "السبب",
                  name: "reason",
                  type: "select",
                  options: dropdownSettings.reason,
                },
                {
                  label: "نوع المستند",
                  name: "document_type",
                  type: "select",
                  options: dropdownSettings.document_type,
                },
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

                  {field.type === "select" ? (
                    <select
                      name={field.name}
                      value={selectedIncident[field.name] || ""}
                      onChange={handleChange}
                      className="border border-gray-300 p-2 rounded text-gray-700 focus:outline-none focus:border-gray-500"
                    >
                      <option value="">اختر {field.label}</option>
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={field.name}
                      type={field.type}
                      value={selectedIncident[field.name] || ""}
                      onChange={handleChange}
                      className="border border-gray-300 p-2 rounded text-gray-700 focus:outline-none focus:border-gray-500"
                    />
                  )}
                </div>
              ))}

              <div className="flex justify-between mt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 transition"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {settingsModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSettingsModalOpen(false);
            }
          }}
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
        >
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full transform transition-all duration-300 scale-95 animate-fadeInUp overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold mb-4 text-center text-gray-800">إعدادات القائمات المنسدلة</h3>
            <form className="space-y-4">
              {[
                { label: "الفئة", key: "category" },
                { label: "السبب", key: "reason" },
                { label: "نوع المستند", key: "document_type" },
              ].map((field) => (
                <div key={field.key} className="flex flex-col">
                  <label className="mb-2 font-semibold text-gray-800">{field.label}</label>
                  <div className="space-y-2">
                    {(dropdownSettings[field.key] || []).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const newSettings = { ...dropdownSettings };
                            newSettings[field.key][idx] = e.target.value;
                            setDropdownSettings(newSettings);
                          }}
                          className="flex-1 border border-gray-300 p-2 rounded text-gray-700 focus:outline-none focus:border-gray-500"
                          placeholder={`القيمة ${idx + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newSettings = { ...dropdownSettings };
                            newSettings[field.key] = newSettings[field.key].filter((_, i) => i !== idx);
                            setDropdownSettings(newSettings);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition"
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newSettings = { ...dropdownSettings };
                      newSettings[field.key] = [...(newSettings[field.key] || []), ""];
                      setDropdownSettings(newSettings);
                    }}
                    className="mt-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded transition w-full"
                  >
                    + إضافة قيمة جديدة
                  </button>
                </div>
              ))}
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={saveDropdownSettings}
                  className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 transition"
                >
                  حفظ الإعدادات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
