import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";
import toast from "react-hot-toast";
import { checkPermission } from "../utils/permissionHelper";
const VITE_API_URL = import.meta.env.VITE_API_URL;
// مكونات فرعية
import EmployeeDocuments from "../components/EmployeeDocuments";
import EmployeeIncidents from "../pages/EmployeeIncidents";
import EmployeeVacations from "../pages/EmployeeVacations";
import EmployeeRewards from "../pages/EmployeeRewards";
import EmployeePenalties from "../pages/EmployeePenalties";
import EmployeeCourses from "../pages/EmployeeCourses";
import DropdownWithSettings from "../components/DropdownWithSettings";

export default function EmployeeEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);

  const isNew = id === "add";

  const [employee, setEmployee] = useState({});
  const [loading, setLoading] = useState(true);
  const [photoPreview, setPhotoPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("info"); // تبويب افتراضي: البيانات
  const [user, setUser] = useState(null);

  const tabConfig = useMemo(
    () => [
      { key: "info", label: "البيانات الشخصية", permission: null },
      { key: "documents", label: "الوثائق", permission: "employees.view" },
      { key: "incidents", label: "الوقوعات", permission: "incidents.view" },
      { key: "vacations", label: "الإجازات", permission: "vacations.view" },
      { key: "rewards", label: "المكافآت", permission: "rewards.view" },
      { key: "Penalties", label: "العقوبات", permission: "punishments.view" },
      { key: "courses", label: "الدورات", permission: null },
    ],
    []
  );

  const accessibleTabs = useMemo(() => {
    if (isNew) return [];
    return tabConfig.filter(
      (tab) =>
        !tab.permission || (user && checkPermission(tab.permission, user))
    );
  }, [isNew, tabConfig, user]);

  useEffect(() => {
    if (isNew) return;
    if (!accessibleTabs.length) return;
    const hasActive = accessibleTabs.some((tab) => tab.key === activeTab);
    if (!hasActive) {
      setActiveTab(accessibleTabs[0].key);
    }
  }, [accessibleTabs, activeTab, isNew]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get("/auth/me");
        setUser(res.data.user);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  // 🔹 تحميل بيانات الموظف
  const fetchEmployee = async () => {
    if (isNew) {
      setLoading(false);
      return;
    }
    try {
      const res = await API.get(`/employees/${id}`);
      setEmployee(res.data || {});
    } catch {
      toast.error("فشل تحميل بيانات الموظف");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  // 🔹 تحديث البيانات
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployee({ ...employee, [name]: value });
  };

  const handleSave = async () => {
    try {
      if (isNew) {
        await API.post("/employees", employee);
        toast.success("تم إضافة الموظف بنجاح!");
      } else {
        await API.put(`/employees/${id}`, employee);
        toast.success("تم حفظ البيانات بنجاح!");
      }
      navigate("/dashboard/employees");
    } catch {
      toast.error("فشل في حفظ البيانات");
    }
  };

  const handleDelete = async () => {
    if (!checkPermission("employees.delete", user)) {
      toast.error("ليس لديك صلاحية للقيام بهذا الإجراء");
      return;
    }
    if (!window.confirm("هل أنت متأكد أنك تريد حذف هذا الموظف؟")) return;
    try {
      await API.delete(`/employees/${id}`);
      toast.success("تم حذف الموظف");
      navigate("/dashboard/employees");
    } catch {
      toast.error("فشل في حذف الموظف");
    }
  };

  // 🔹 تحميل صورة شخصية
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append("photo", file);
    try {
      setUploading(true);
      const res = await API.post(`/employees/${id}/photo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setEmployee({ ...employee, photo: res.data.photo });
      toast.success("تم تحديث الصورة الشخصية");
    } catch {
      toast.error("فشل تحميل الصورة");
    } finally {
      setUploading(false);
    }
  };

  if (loading)
    return (
      <p className="p-6 text-center text-slate-300" dir="rtl">
        جاري التحميل...
      </p>
    );

  const fieldLabels = {
    selfNumber: "الرقم الذاتي",
    fullName: "الاسم الكامل",
    firstName: "الاسم الأول",
    fatherName: "اسم الأب",
    motherNameAndLastName: "اسم الأم",
    lastName: "الكنية",
    nationalId: "الرقم الوطني",
    gender: "الجنس",
    nationality: "الجنسية",
    residenceCity: "العنوان",
    city: "المدينة",
    governorate: "المحافظة",
    registrationNumber: "القيد",
    birthDate: "تاريخ الميلاد",
    birthPlace: "مكان الولادة",
    educationLevel: "المؤهل العلمي",
    specialization: "الاختصاص",
    currentJobTitle: "المسمى الوظيفي",
    jobCategory: "الفئة الوظيفية",
    lastSalary: "الراتب",
    hiringDate: "تاريخ التعيين",
    phone: "رقم الهاتف",
    maritalStatus: "الحالة الاجتماعية",
    childrenCount: "عدد الأولاد",
    notes: "ملاحظات",
    workLocation: "مكان العمل",
  };

  const excluded = [
    "_id",
    "__v",
    "createdAt",
    "updatedAt",
    "photo",
    "documents",
  ];

  const dropdownFields = {
    governorate: [
      "دمشق",
      "ريف دمشق",
      "حلب",
      "حمص",
      "حماة",
      "اللاذقية",
      "طرطوس",
      "إدلب",
      "درعا",
      "السويداء",
      "القنيطرة",
      "دير الزور",
      "الحسكة",
      "الرقة",
    ],
    city: [],
    nationality: ["عربي سوري"],
    maritalStatus: ["عازب", "متزوج", "مطلق", "أرمل"],
    educationLevel: [
      "ابتدائية",
      "إعدادية",
      "ثانوية",
      "معهد",
      "جامعة",
      "ماجستير",
      "دكتوراه",
    ],
    specialization: [],
    currentJobTitle: [],
    jobCategory: ["الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة"],
    workLocation: [],
    gender: ["ذكر", "أنثى"],
    contractType: ["دائم", "مؤقت", "عقد موسمي"],
    status: ["قائم على رأس عمله", "مجاز", "مكفوف اليد", "مستقيل", "متقاعد"],
    bloodType: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  };

  return (
    <div
      className="p-6 max-w-7xl mx-auto font-custom text-right bg-slate-900 min-h-screen text-slate-100"
      dir="rtl"
    >
      {/* 🪪 رأس الصفحة */}
      {!isNew && (
        <div className="bg-slate-800/70 shadow-xl border border-slate-700 p-6 flex flex-col md:flex-row gap-6 items-start rounded-2xl backdrop-blur-sm">
          <div className="flex flex-col items-center md:w-1/3">
            <img
              src={
                photoPreview ||
                (employee.photo
                  ? `${VITE_API_URL}${employee.photo}`
                  : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png")
              }
              alt="صورة الموظف"
              className="h-36 w-36 rounded-full border-4 border-amber-500 object-cover shadow-lg"
            />
            <h3 className="text-xl font-bold mt-3 text-amber-400">
              {employee.fullName}
            </h3>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mt-2 bg-amber-600 text-slate-950 px-4 py-1 rounded-lg hover:bg-amber-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {uploading ? "جاري التحميل..." : "تغيير الصورة"}
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {/* معلومات سريعة */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-400">الرقم الذاتي</p>
              <p className="font-semibold text-slate-100">
                {employee.selfNumber || "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">الوظيفة</p>
              <p className="font-semibold text-slate-100">
                {employee.currentJobTitle || "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">المؤهل العلمي</p>
              <p className="font-semibold text-slate-100">
                {employee.educationLevel || "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">الراتب</p>
              <p className="font-semibold text-slate-100">
                {employee.lastSalary || "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ التبويبات */}
      <div className="mt-8">
        {!isNew && (
          <div className="flex flex-wrap gap-3 border-b border-slate-800 pb-2">
            {accessibleTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors ${
                  activeTab === tab.key
                    ? "bg-amber-500 text-slate-900 shadow"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* محتوى التبويبات */}
        <div className="bg-slate-800/70 rounded-b-lg shadow-lg p-6 mt-2 border border-slate-800">
          {activeTab === "info" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(fieldLabels).map((key) => {
                const isDate = key === "birthDate" || key === "hiringDate";
                const isDropdown = Object.keys(dropdownFields).includes(key);

                return (
                  <div key={key} className="flex flex-col">
                    <label className="mb-1 text-sm font-semibold text-slate-300">
                      {fieldLabels[key]}
                    </label>
                    {isDropdown ? (
                      <DropdownWithSettings
                        id={`employee_${key}`}
                        value={employee[key] || ""}
                        onChange={(e) =>
                          handleChange({
                            target: { name: key, value: e.target.value },
                          })
                        }
                        options={dropdownFields[key].map((opt) => ({
                          value: opt,
                          label: opt,
                        }))}
                        isAdmin={user?.role === "admin"}
                        placeholder={`اختر ${fieldLabels[key]}`}
                        className="!bg-slate-900 !text-slate-100 !border-slate-700"
                      />
                    ) : (
                      <input
                        name={key}
                        type={isDate ? "date" : "text"}
                        value={
                          isDate && employee[key]
                            ? new Date(employee[key])
                                .toISOString()
                                .split("T")[0]
                            : employee[key] || ""
                        }
                        onChange={handleChange}
                        className="border border-slate-700 rounded-md p-2 bg-slate-900 text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder-slate-500"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!isNew &&
            activeTab === "documents" &&
            accessibleTabs.some((tab) => tab.key === "documents") && (
              <EmployeeDocuments
                employeeId={id}
                existingDocs={employee.documents || []}
              />
            )}

          {!isNew &&
            activeTab === "incidents" &&
            accessibleTabs.some((tab) => tab.key === "incidents") && (
              <EmployeeIncidents />
            )}
          {!isNew &&
            activeTab === "vacations" &&
            accessibleTabs.some((tab) => tab.key === "vacations") && (
              <EmployeeVacations />
            )}
          {!isNew &&
            activeTab === "Penalties" &&
            accessibleTabs.some((tab) => tab.key === "Penalties") && (
              <EmployeePenalties />
            )}
          {!isNew &&
            activeTab === "rewards" &&
            accessibleTabs.some((tab) => tab.key === "rewards") && (
              <EmployeeRewards />
            )}
          {!isNew &&
            activeTab === "courses" &&
            accessibleTabs.some((tab) => tab.key === "courses") && (
              <EmployeeCourses />
            )}
        </div>
      </div>

      {/* الأزرار السفلية */}
      <div className="flex justify-between mt-8">
        <button
          onClick={handleSave}
          className="px-6 py-2 rounded-lg bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 transition focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          {isNew ? "إضافة الموظف" : "حفظ التعديلات"}
        </button>
        {!isNew && (
          <button
            onClick={handleDelete}
            className="px-6 py-2 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-500 transition focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            حذف الموظف
          </button>
        )}
      </div>
    </div>
  );
}
