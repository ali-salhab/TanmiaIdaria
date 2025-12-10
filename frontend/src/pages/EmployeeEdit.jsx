import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";
import toast from "react-hot-toast";
const VITE_API_URL = import.meta.env.VITE_API_URL;
// مكونات فرعية
import EmployeeDocuments from "../components/EmployeeDocuments";
import EmployeeIncidents from "../pages/EmployeeIncidents";
import EmployeeVacations from "../pages/EmployeeVacations";
import EmployeeRewards from "../pages/EmployeeRewards";
import EmployeePenalties from "../pages/EmployeePenalties";
import EmployeeCourses from "../pages/EmployeeCourses";
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

  if (loading) return <p className="p-6 text-center">جاري التحميل...</p>;

  const fieldLabels = {
    selfNumber: "الرقم الذاتي",
    fullName: "الاسم الكامل",
    firstName: "الاسم الأول",
    fatherName: "اسم الأب",
    motherName: "اسم الأم",
    lastName: "الكنية",
    nationalId: "الرقم الوطني",
    gender: "الجنس",
    nationality: "الجنسية",
    address: "العنوان",
    city: "المدينة",
    governorate: "المحافظة",
    registrationNumber: "القيد",
    birthDate: "تاريخ الميلاد",
    birthPlace: "مكان الولادة",
    qualification: "المؤهل العلمي",
    specialization: "الاختصاص",
    job_title: "المسمى الوظيفي",
    jobCategory: "الفئة الوظيفية",
    salary: "الراتب",
    hire_date: "تاريخ التعيين",
    phone: "رقم الهاتف",
    email: "البريد الإلكتروني",
    maritalStatus: "الحالة الاجتماعية",
    childrenCount: "عدد الأولاد",
    notes: "ملاحظات",
    workLocation: "مكان العمل",
    department: "القسم",
  };

  const excluded = [
    "_id",
    "__v",
    "createdAt",
    "updatedAt",
    "photo",
    "documents",
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto font-custom text-right" dir="rtl">
      {/* 🪪 رأس الصفحة */}
      {!isNew && (
        <div className="bg-white shadow-md rounded-2xl border p-6 flex flex-col md:flex-row gap-6 items-start">
          <div className="flex flex-col items-center md:w-1/3">
            <img
              src={
                photoPreview ||
                employee.photo ||
                VITE_API_URL + "/uploads/default-avatar.png"
              }
              alt="صورة الموظف"
              className="h-36 w-36 rounded-full border-4 border-blue-400 object-cover shadow-md"
            />
            <h3 className="text-xl font-bold mt-3">{employee.fullName}</h3>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mt-2 bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
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
              <p className="text-sm text-gray-500">الرقم الذاتي</p>
              <p className="font-semibold">{employee.selfNumber || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">الوظيفة</p>
              <p className="font-semibold">{employee.job_title || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">المؤهل العلمي</p>
              <p className="font-semibold">{employee.qualification || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">الراتب</p>
              <p className="font-semibold">{employee.salary || "—"}</p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ التبويبات */}
      <div className="mt-8">
        {!isNew && (
          <div className="flex flex-wrap gap-3 border-b border-gray-200 pb-2">
            {[
              { key: "info", label: "البيانات الشخصية" },
              { key: "documents", label: "الوثائق" },
              { key: "incidents", label: "الوقوعات" },
              { key: "vacations", label: "الإجازات" },
              { key: "rewards", label: "المكافآت" },
              { key: "Penalties", label: "العقوبات" },
              { key: "courses", label: "الدورات" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-t-lg text-sm font-semibold ${
                  activeTab === tab.key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* محتوى التبويبات */}
        <div className="bg-white rounded-b-lg shadow-md p-6 mt-2">
          {activeTab === "info" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(fieldLabels).map((key) => (
                <div key={key} className="flex flex-col">
                  <label className="mb-1 text-sm font-semibold text-gray-600">
                    {fieldLabels[key]}
                  </label>
                  <input
                    name={key}
                    value={employee[key] || ""}
                    onChange={handleChange}
                    className="border rounded p-2 focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              ))}
            </div>
          )}

          {!isNew && activeTab === "documents" && (
            <EmployeeDocuments
              employeeId={id}
              existingDocs={employee.documents || []}
            />
          )}

          {!isNew && activeTab === "incidents" && <EmployeeIncidents />}
          {!isNew && activeTab === "vacations" && <EmployeeVacations />}
          {!isNew && activeTab === "Penalties" && <EmployeePenalties />}
          {!isNew && activeTab === "rewards" && <EmployeeRewards />}
          {!isNew && activeTab === "courses" && <EmployeeCourses />}
        </div>
      </div>

      {/* الأزرار السفلية */}
      <div className="flex justify-between mt-8">
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          {isNew ? "إضافة الموظف" : "حفظ التعديلات"}
        </button>
        {!isNew && (
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
          >
            حذف الموظف
          </button>
        )}
      </div>
    </div>
  );
}
