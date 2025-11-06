import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../api/api";
import EmployeeDocuments from "../components/EmployeeDocuments";

export default function EmployeeEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchEmployee = async () => {
    try {
      const res = await API.get(`/employees/${id}`);
      setEmployee(res.data || {});
    } catch (err) {
      console.error(err);
      alert("فشل تحميل بيانات الموظف");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployee({ ...employee, [name]: value });
  };

  const handleSave = async () => {
    try {
      await API.put(`/employees/${id}`, employee);
      alert("تم تحديث بيانات الموظف بنجاح!");
      navigate("/dashboard/employees");
    } catch (err) {
      console.error(err);
      alert("فشل في تحديث بيانات الموظف.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("هل أنت متأكد أنك تريد حذف هذا الموظف؟")) return;
    try {
      await API.delete(`/employees/${id}`);
      alert("تم حذف الموظف بنجاح!");
      navigate("/dashboard/employees");
    } catch (err) {
      console.error(err);
      alert("فشل في حذف الموظف.");
    }
  };

  if (loading) return <p className="p-6 text-center">جاري التحميل...</p>;

  const excludedFields = ["_id", "createdAt", "updatedAt", "__v"];

  const fieldTranslations = {
    selfNumber: "الرقم الذاتي",
    firstName: "الاسم الأول",
    fatherName: "اسم الأب",
    lastName: "الكنية",
    fullName: "الاسم الكامل",
    motherName: "اسم الأم",
    motherNameAndLastName: "اسم الأم والكنية",
    national_id: "الرقم الوطني",
    age: "العمر",
    mobile: "رقم الهاتف",
    address: "العنوان",
    job_title: "المسمى الوظيفي",
    governorate: "المحافظة",
    salary: "الراتب",
    department: "القسم",
    nationality: "الجنسية",
    registrationNumber: " القيد",
    city: "المدينة",
    residenceGovernorate: "مكان الإقامة",
    district: "المنطقة",
    healthStatus: "الحالة الصحية",
    contractType: "نوع العقد",
    housingType: "نوع السكن",
    contractDetails: "تفاصيل العقد",
    birthDate: "تاريخ الميلاد",
    level1: "المستوى 1",
    jobCategory: "فئة الوظيفة",
    level2: "المستوى 2",
    level3: "المستوى 3",
    level4: "المستوى 4",
    level5: "المستوى 5",
    level6: "المستوى 6",
    maritalStatus: "الحالة الاجتماعية",
    wivesCount: "عدد الزوجات",
    childrenCount: "عدد الأطفال",
    phone: "رقم الهاتف",
    email: "البريد الإلكتروني",
    maritalStatus: "الحالة الاجتماعية",
    hire_date: "تاريخ التعيين",
    nationalId: "الرقم الوطني",
    gender: "الجنس",
    status: "الحالة",
    notes: "ملاحظات",
    documents: "الوثائق",
    lastSalary: "آخر راتب",
    onStaff: "على رأس العمل",
    workLocation: "مكان العمل",
    managementDegree: "درجة الإدارة",
    graduationYear: "سنة التخرج",
    faculty: "الكلية",
    university: "الجامعة",
    qualification: "المؤهل",
    specialization: "التخصص",
    documentAvailable: "الوثيقة متوفرة",
    bloodType: "فصيلة الدم",
    illnessDetails: "تفاصيل الأمراض",
    spouseWorkplace: "مكان عمل الزوج/الزوجة",
    spouseFullName: "الاسم الكامل للزوج/الزوجة",
    spouseIsEmployee: "هل الزوج/الزوجة موظف؟",
  };

  return (
    <div className="p-6 max-w-3xl mx-auto font-custom text-right" dir="rtl">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
        تعديل بيانات الموظف
      </h2>

      {/* صورة شخصية */}
      <div className="flex flex-col items-center justify-center bg-white shadow-md border border-gray-200 rounded-xl p-4 w-52 mx-auto mb-6 hover:shadow-lg transition-shadow duration-300">
        <img
          className="h-28 w-28 object-cover rounded-full border-4 border-blue-200 shadow-sm"
          src="http://localhost:5001/uploads/1761814215378-619000236.png"
          alt="الصورة الشخصية"
        />
        {/* <p className="text-gray-700 font-medium mt-3">الصورة الشخصية</p> */}
      </div>
      <button
        onClick={() =>
          window.open(
            `${import.meta.env.VITE_API_URL}/employees/${id}/docx`,
            "_blank"
          )
        }
        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
      >
        إنشاء بطاقة ذاتية (Word)
      </button>
      {/* الوثائق */}
      <EmployeeDocuments
        employeeId={id}
        existingDocs={employee.documents || []}
      />

      {/* روابط الصفحات */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center mt-6">
        <Link
          to={`/dashboard/employees/${id}/vacations`}
          className="p-4 bg-white border rounded shadow-sm hover:bg-blue-600 hover:text-white hover:scale-105 transition-all duration-150"
        >
          الإجازات
        </Link>

        <Link
          to={`/dashboard/employees/${id}/incidents`}
          className="p-4 bg-white border rounded shadow-sm hover:bg-blue-600 hover:text-white hover:scale-105 transition-all duration-150"
        >
          الوقوعات
        </Link>

        <Link
          to={`/dashboard/employees/${id}/rewards`}
          className="p-4 bg-white border rounded shadow-sm hover:bg-blue-600 hover:text-white hover:scale-105 transition-all duration-150"
        >
          المكافآت
        </Link>
      </div>

      {/* الحقول */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {Object.entries(employee)
          .filter(([key]) => !excludedFields.includes(key))
          .map(([key, value]) => {
            return (
              <div key={key} className="flex flex-col">
                <label className="mb-1 text-sm font-semibold text-gray-600">
                  {fieldTranslations[key] || key.replace(/_/g, " ")}
                </label>
                <input
                  name={key}
                  value={value || ""}
                  onChange={handleChange}
                  className="border rounded p-2 focus:ring-2 focus:ring-blue-400"
                />
              </div>
            );
          })}
      </div>

      {/* الأزرار */}
      <div className="flex justify-between mt-8">
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          حفظ التعديلات
        </button>
        <button
          onClick={handleDelete}
          className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
        >
          حذف الموظف
        </button>
      </div>
    </div>
  );
}
