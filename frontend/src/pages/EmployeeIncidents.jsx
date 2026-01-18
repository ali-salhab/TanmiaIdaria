import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";
import { FaEdit } from "react-icons/fa";
import toast from "react-hot-toast";
import { FileArchive, Settings } from "lucide-react";
import DropdownWithSettings from "../components/DropdownWithSettings";
import { checkPermission } from "../utils/permissionHelper";

export default function EmployeeIncidents() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [cvModalOpen, setcvModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general"); // general | internal
  const [user, setUser] = useState(null);
  const [dropdownSettings, setDropdownSettings] = useState({
    ali: [1, 2, 2, 2, 2, 2],
    category: ["أولى", "تانية", "تالتة", "رابعة", "خامسة"],
    reason: ["زيادة أجر", "تجديد عقد", "تثبيت", "ترفيع"],
    document_type: ["مرسوم", "قرار"],
    document_typre: ["مرسوم", "قرار"],
    // incidentType: ["aaaaaaaaa", "aaaaaaaaaaaaaaa,"],
    incidentType: ["داخلي", "خارجي"],
  });
  console.log(
    "--------------------------- data for inciedents type options ----------------"
  );
  console.log(dropdownSettings);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get("/auth/me");
        console.log(res.data.user);
        setUser(res.data.user);
        if (!checkPermission("incidents.view", res.data.user)) {
          toast.error("❌ ليس لديك صلاحية لعرض الوقوعات");
          navigate("/home");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        navigate("/home");
      }
    };
    fetchUser();
    fetchIncidents();
    fetchCurrentEmployee();
    fetchDropdownSettings();
  }, [navigate]);

  const fetchDropdownSettings = async () => {
    try {
      const res = await API.get("/app-settings/dropdowns");
      console.log("drop down setting /app-settings/dropdowns");
      console.log(res.data);
      if (res.data) {
        console.log(res.data);
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
    const { name, value, type, checked } = e.target;
    setSelectedIncident({
      ...selectedIncident,
      [name]: type === "checkbox" ? checked : value,
    });
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
    console.log("add new inciedents");
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
      className="max-w-6xl mx-auto p-6 bg-slate-900/95 rounded-2xl mt-6 text-slate-100 border border-slate-800 shadow-2xl"
      dir="rtl"
    >
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-amber-400">الوقوعات للموظف</h2>
        <span className="text-slate-300 font-medium">
          {currentEmployee ? currentEmployee.fullName : "جارٍ التحميل..."}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="p-2 rounded-lg flex items-center gap-2 transition bg-slate-800/70 border border-slate-700 text-slate-100 hover:bg-slate-700/70"
          >
            <Settings size={20} />
            إعدادات
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 transition shadow"
          >
            إضافة وقوع جديد
          </button>
          <button
            onClick={openCvModal}
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-slate-800/70 border border-slate-700 text-slate-100 hover:bg-slate-700/70 hover:animate-slowBounce transition"
          >
            البطاقة الداتية للموظف <FileArchive />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-4">
        <button
          className={`py-2 px-4 font-medium transition ${
            activeTab === "general"
              ? "border-b-2 border-amber-500 text-amber-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
          onClick={() => setActiveTab("general")}
        >
          الوقوعات الخارجية
        </button>
        <button
          className={`py-2 px-4 font-medium transition ${
            activeTab === "internal"
              ? "border-b-2 border-amber-500 text-amber-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
          onClick={() => setActiveTab("internal")}
        >
          الوقوعات الداخلية
        </button>
      </div>

      <div className="bg-slate-900/60 rounded-xl shadow-xl overflow-x-auto border border-slate-800">
        <table className="min-w-full border-collapse">
          <thead className="bg-slate-800 border-b border-slate-700 text-slate-200">
            <tr>
              <th className="py-2 px-4 text-right font-semibold">مركز العمل</th>
              <th className="py-2 px-4 text-right font-semibold">
                المسمى الوظيفي
              </th>
              <th className="py-2 px-4 text-right font-semibold">
                نوع الوظيفة
              </th>
              <th className="py-2 px-4 text-right font-semibold">الأجر</th>
              <th className="py-2 px-4 text-right font-semibold">الفئة</th>
              <th className="py-2 px-4 text-right font-semibold">
                تاريخ المباشرة
              </th>
              <th className="py-2 px-4 text-right font-semibold">
                تاريخ التبدل
              </th>
              <th className="py-2 px-4 text-right font-semibold">السبب</th>
              <th className="py-2 px-4 text-right font-semibold">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {incidents
              .filter((inc) =>
                activeTab === "internal" ? inc.isInternal : !inc.isInternal
              )
              .map((inc) => (
                <tr
                  key={inc._id}
                  className="border-b border-slate-800 hover:bg-slate-800/60 text-sm transition"
                >
                  <td className="py-2 px-4 text-slate-200">
                    {inc.work_center}
                  </td>
                  <td className="py-2 px-4 text-slate-200">{inc.job_title}</td>
                  <td className="py-2 px-4 text-slate-200">{inc.job_type}</td>
                  <td className="py-2 px-4 text-slate-200">{inc.salary}</td>
                  <td className="py-2 px-4 text-slate-200">{inc.category}</td>
                  <td className="py-2 px-4 text-slate-200">
                    {inc.start_date?.split("T")[0]}
                  </td>
                  <td className="py-2 px-4 text-slate-200">
                    {inc.change_date?.split("T")[0]}
                  </td>
                  <td className="py-2 px-4 text-slate-200">{inc.reason}</td>
                  <td className="py-2 px-4 text-center">
                    <button
                      onClick={() => openEditModal(inc)}
                      className="text-amber-400 hover:text-amber-300 transition"
                    >
                      <FaEdit />
                    </button>
                  </td>
                </tr>
              ))}
            {incidents.length === 0 && (
              <tr>
                <td colSpan="9" className="text-center py-4 text-slate-400">
                  لا توجد وقوعات حالياً
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {cvModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-slate-900 rounded-xl p-6 max-w-md w-full transform transition-all duration-300 animate-fadeInUp overflow-y-auto max-h-[90vh] border border-slate-700 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-center text-amber-400">
              البطاقة الداتية للموظف
            </h3>
            <p className="text-slate-300 text-sm mb-4 text-center">
              يتم إنشاء ملف Excel يتضمن بيانات الموظف والوقوعات الخاصة به
            </p>
            <div className="flex flex-col justify-between mt-4 gap-2">
              <button
                type="button"
                onClick={() => setcvModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-700 text-slate-100 hover:bg-slate-600 transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const response = await API.get(
                      `/incidents/${id}/generate-cv`,
                      {
                        responseType: "blob",
                      }
                    );

                    const url = window.URL.createObjectURL(
                      new Blob([response.data])
                    );
                    const link = document.createElement("a");
                    link.href = url;
                    link.setAttribute(
                      "download",
                      ` البطاقة الداتية 
                      ${currentEmployee.firstName} ${currentEmployee.lastName} 
                       .xlsx`
                    );
                    document.body.appendChild(link);
                    link.click();
                    link.parentNode.removeChild(link);
                    window.URL.revokeObjectURL(url);

                    setcvModalOpen(false);
                    toast.success("تم تحميل البطاقة الداتية بنجاح");
                  } catch (error) {
                    console.error(error);
                    toast.error("فشل تحميل البطاقة الداتية");
                  }
                }}
                className="px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 transition"
              >
                تحميل البطاقة الداتية
              </button>
            </div>
          </div>
        </div>
      )}
      {/* مودال إضافة/تعديل الوقوع */}
      {modalOpen && selectedIncident && (
        // <div>ali</div>
        <div
          c
          onClick={(e) => {
            // Close modal only if user clicks on the background (overlay)
            if (e.target === e.currentTarget) {
              setModalOpen(false);
            }
          }}
          className="fixed inset-0 flex items-center justify-center bg-black/60 z-50"
        >
          <div className="bg-slate-900 rounded-xl p-6 max-w-md w-full transform transition-all duration-300 scale-95 animate-fadeInUp overflow-y-auto max-h-[90vh] border border-slate-700 shadow-2xl text-slate-100">
            <h3 className="text-xl font-bold mb-4 text-center text-amber-400">
              {selectedIncident._id ? "تعديل الوقوع" : "إضافة وقوع جديد"}
            </h3>
            <form className="grid grid-cols-1 gap-3" onSubmit={handleSubmit}>
              <div className="flex flex-col">
                <DropdownWithSettings
                  id="incidentType"
                  label="نوع الوقوع"
                  value={selectedIncident.incidentType || ""}
                  onChange={(e) =>
                    handleChange({
                      target: { name: "incidentType", value: e.target.value },
                    })
                  }
                  options={["sdsd", "خارجي"].map((opt) => {
                    console.log("------00000000000000000", dropdownSettings);
                    return {
                      value: opt,
                      label: opt,
                    };
                  })}
                  isAdmin={user?.role === "admin"}
                  placeholder="اختر نوع الوقوع"
                  className="!bg-slate-900 !text-slate-100 !border-slate-700"
                />
              </div>
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
                  <label className="mb-1 font-medium text-slate-200">
                    {field.label}
                  </label>

                  {field.type === "select" ? (
                    <DropdownWithSettings
                      id={field.name}
                      label={field.label}
                      value={selectedIncident[field.name] || ""}
                      onChange={(e) =>
                        handleChange({
                          target: { name: field.name, value: e.target.value },
                        })
                      }
                      options={field.options.map((opt) => ({
                        value: opt,
                        label: opt,
                      }))}
                      isAdmin={user?.role === "admin"}
                      placeholder={`اختر ${field.label}`}
                      className="!bg-slate-900 !text-slate-100 !border-slate-700"
                    />
                  ) : (
                    <input
                      name={field.name}
                      type={field.type}
                      value={selectedIncident[field.name] || ""}
                      onChange={handleChange}
                      className="border border-slate-700 p-2 rounded bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  )}
                </div>
              ))}

              <div className="flex items-center gap-2 mt-2">
                {/* Removed checkbox for isInternal as it is replaced by incidentType dropdown */}
              </div>

              <div className="flex justify-between mt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-700 text-slate-100 hover:bg-slate-600 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 transition"
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
          className="fixed inset-0 flex items-center justify-center bg-black/60 z-50"
        >
          <div className="bg-slate-900 rounded-xl p-6 max-w-2xl w-full transform transition-all duration-300 scale-95 animate-fadeInUp overflow-y-auto max-h-[90vh] border border-slate-700 shadow-2xl text-slate-100">
            <h3 className="text-xl font-bold mb-4 text-center text-amber-400">
              إعدادات القائمات المنسدلة
            </h3>
            <form className="space-y-4">
              {[
                { label: "الفئة", key: "category" },
                { label: "السبب", key: "reason" },
                { label: "نوع المستند", key: "document_type" },
              ].map((field) => (
                <div key={field.key} className="flex flex-col">
                  <label className="mb-2 font-semibold text-slate-200">
                    {field.label}
                  </label>
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
                          className="flex-1 border border-slate-700 p-2 rounded bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder={`القيمة ${idx + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newSettings = { ...dropdownSettings };
                            newSettings[field.key] = newSettings[
                              field.key
                            ].filter((_, i) => i !== idx);
                            setDropdownSettings(newSettings);
                          }}
                          className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-2 rounded transition"
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
                      newSettings[field.key] = [
                        ...(newSettings[field.key] || []),
                        "",
                      ];
                      setDropdownSettings(newSettings);
                    }}
                    className="mt-2 px-3 py-2 rounded bg-slate-700 text-slate-100 hover:bg-slate-600 transition w-full"
                  >
                    + إضافة قيمة جديدة
                  </button>
                </div>
              ))}
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-700 text-slate-100 hover:bg-slate-600 transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={saveDropdownSettings}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 transition"
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
