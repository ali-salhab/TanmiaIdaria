import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DropdownWithSettings from "../components/DropdownWithSettings";
import API from "../api/api";
import toast from "react-hot-toast";
import { Download, Printer, Trash2 } from "lucide-react";
import { checkPermission } from "../utils/permissionHelper";

export default function EmployeeVacations() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vacations, setVacations] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVacation, setSelectedVacation] = useState(null);
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);

  const [formData, setFormData] = useState({
    type: "",
    days: "",
    hours: "",
    endHour: "",
    childOrder: "",
    startDate: "",
    endDate: "",
  });

  const vacationTypes = [
    "إجازة صحية",
    "إجازة أمومة",
    "إجازة ساعية",
    "إجازة إدارية",
    "إجازة خاصة بلا أجر",
    "إجازة زواج",
    "إجازة حج",
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get("/auth/me");
        setUser(res.data.user);
        if (!checkPermission("vacations.view", res.data.user)) {
          toast.error("❌ ليس لديك صلاحية لعرض الإجازات");
          navigate("/home");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        navigate("/home");
      }
    };

    const fetchVacations = async () => {
      try {
        const res = await API.get(`/employees/${id}/vacations`);
        console.log("employee vacations response:");
        console.log(res.data);
        setVacations(res.data);
      } catch (err) {
        toast.error("فشل تحميل الإجازات");
      }
    };

    const fetchEmployee = async () => {
      try {
        const res = await API.get(`/employees/${id}`);
        setEmployee(res.data);
      } catch (err) {
        console.error("Failed to fetch employee:", err);
      }
    };

    fetchUser();
    fetchVacations();
    fetchEmployee();
  }, [id, navigate]);

  const handleAdd = () => {
    setSelectedVacation(null);
    setFormData({
      type: "",
      days: "",
      hours: "",
      childOrder: "",
      startDate: "",
      endDate: "",
    });
    setModalOpen(true);
  };

  const handleEdit = (v) => {
    setSelectedVacation(v);
    setFormData({
      type: v.type,
      days: v.days,
      hours: v.hours || "",
      childOrder: v.childOrder || "",
      startDate: v.startDate ? v.startDate.split("T")[0] : "",
      endDate: v.endDate ? v.endDate.split("T")[0] : "",
    });
    setModalOpen(true);
  };

  // 🧩 حساب الأيام حسب نوع الإجازة
  const calculateDays = (type, childOrder, hours, currentDays) => {
    switch (type) {
      case "إجازة صحية":
        return currentDays > 180 ? 180 : currentDays;
      case "إجازة أمومة":
        if (childOrder === "1") return 120;
        if (childOrder === "2") return 90;
        if (childOrder === "3") return 75;
        return "";
      case "إجازة ساعية": {
        const totalHours = parseFloat(hours || 0);
        return (totalHours / 8).toFixed(2);
      }
      default:
        return currentDays;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newData = { ...formData, [name]: value };

    // 1. إذا تم تغيير تاريخ البداية
    if (name === "startDate") {
      if (newData.days && value) {
        // إذا كان هناك عدد أيام، نحسب تاريخ النهاية
        const start = new Date(value);
        const days = parseFloat(newData.days);
        const end = new Date(start);
        end.setDate(start.getDate() + Math.ceil(days) - 1);
        newData.endDate = end.toISOString().split("T")[0];
      } else if (newData.endDate && value) {
        // إذا كان هناك تاريخ نهاية، نحسب عدد الأيام
        const start = new Date(value);
        const end = new Date(newData.endDate);
        const diffTime = end - start;
        if (diffTime >= 0) {
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          newData.days = diffDays;
        }
      }
    }

    // 2. إذا تم تغيير تاريخ النهاية
    if (name === "endDate") {
      if (newData.startDate && value) {
        const start = new Date(newData.startDate);
        const end = new Date(value);
        const diffTime = end - start;
        if (diffTime >= 0) {
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          newData.days = diffDays;
        } else {
          toast.error("تاريخ النهاية يجب أن يكون بعد تاريخ البداية");
        }
      }
    }

    // 3. إذا تم تغيير عدد الأيام
    if (name === "days") {
      if (newData.startDate && value) {
        const start = new Date(newData.startDate);
        const days = parseFloat(value);
        const end = new Date(start);
        end.setDate(start.getDate() + Math.ceil(days) - 1);
        newData.endDate = end.toISOString().split("T")[0];
      }
    }

    // 4. حسابات خاصة لأنواع الإجازات
    if (name === "type" || name === "childOrder" || name === "hours") {
      const calculated = calculateDays(
        newData.type,
        newData.childOrder,
        newData.hours,
        newData.days
      );
      if (calculated !== newData.days) {
        newData.days = calculated;
        // إعادة حساب تاريخ النهاية إذا تغيرت الأيام
        if (newData.startDate && newData.days) {
          const start = new Date(newData.startDate);
          const days = parseFloat(newData.days);
          const end = new Date(start);
          end.setDate(start.getDate() + Math.ceil(days) - 1);
          newData.endDate = end.toISOString().split("T")[0];
        }
      }
    }

    setFormData(newData);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (selectedVacation) {
        // تحديث
        const res = await API.put(
          `/vacations/${selectedVacation._id}`,
          formData
        );
        setVacations(
          vacations.map((v) => (v._id === selectedVacation._id ? res.data : v))
        );
      } else {
        // إضافة
        const res = await API.post(`/employees/${id}/vacations`, formData);
        setVacations([...vacations, res.data]);
      }

      setModalOpen(false);
      toast.success("تم الحفظ بنجاح");
    } catch (err) {
      toast.error("خطأ أثناء الحفظ");
    }
  };

  const handleDelete = async (vacationId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الإجازة؟")) return;
    try {
      await API.delete(`/vacations/${vacationId}`);
      setVacations(
        vacations.filter((v) => v._id !== vacationId && v.id !== vacationId)
      );
      toast.success("تم الحذف بنجاح");
    } catch (err) {
      console.error(err);
      toast.error("فشل الحذف");
    }
  };

  const handleExportWord = async () => {
    try {
      const response = await API.get(`/employees/${id}/vacations/export/word`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `إجازات_الموظف.docx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("تم تحميل المستند بنجاح");
    } catch (error) {
      console.error(error);
      toast.error("فشل تحميل المستند");
    }
  };

  const handleDownloadTemplate = async (vacationId) => {
    try {
      const response = await API.get(`/vacations/${vacationId}/template`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `استمارة_الإجازة_${vacationId}.docx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("تم تحميل استمارة الإجازة بنجاح");
    } catch (error) {
      console.error(error);
      toast.error("فشل تحميل الاستمارة");
    }
  };

  const handleDownloadPDF = async (vacationId) => {
    try {
      const response = await API.get(`/vacations/${vacationId}/pdf`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `vacation-${vacationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("تم تحميل ملف PDF بنجاح");
    } catch (error) {
      console.error(error);
      toast.error("فشل تحميل ملف PDF");
    }
  };

  const handlePrintPDF = async (vacationId) => {
    try {
      const response = await API.get(`/vacations/${vacationId}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      window.open(url, "_blank");
    } catch (error) {
      console.error(error);
      toast.error("فشل فتح ملف الطباعة");
    }
  };

  const getServiceYears = () => {
    if (!employee?.hiringDate) return 0;
    const hireDate = new Date(employee.hiringDate);
    const today = new Date();
    const diffTime = Math.abs(today - hireDate);
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(diffYears);
  };

  const getEntitlement = () => {
    const years = getServiceYears();
    if (years < 5) return 15;
    if (years < 10) return 21;
    if (years < 20) return 26;
    return 30;
  };

  const getRemainingDays = () => {
    const adminTotal = vacations
      .filter((v) => v.type === "إجازة إدارية")
      .reduce((acc, curr) => acc + parseFloat(curr.days || 0), 0);

    const hourlyTotal = vacations
      .filter((v) => v.type === "إجازة ساعية")
      .reduce((acc, curr) => acc + parseFloat(curr.hours || 0), 0);

    const hourlyDays = Math.floor(hourlyTotal / 8);
    const totalAdminUsed = adminTotal + hourlyDays;
    const entitlement = getEntitlement();

    const healthTotal = vacations
      .filter((v) => v.type === "إجازة صحية")
      .reduce((acc, curr) => acc + parseFloat(curr.days || 0), 0);

    return {
      admin: Math.max(0, entitlement - totalAdminUsed),
      health: Math.max(0, 180 - healthTotal),
      adminTaken: adminTotal,
      hourlyTaken: hourlyTotal,
      hourlyDays: hourlyDays,
      healthTaken: healthTotal,
      entitlement: entitlement,
    };
  };

  const handlePrintRequest = async (vacation) => {
    try {
      await API.post(`/vacations/${vacation._id || vacation.id}/print-log`);
    } catch (error) {
      console.error("Failed to log print action", error);
    }

    const printWindow = window.open("", "_blank");
    const entitlement = getEntitlement();

    const htmlContent = `
      <html dir="rtl">
        <head>
          <title>طلب إجازة</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; direction: rtl; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .header-right, .header-left { text-align: center; font-weight: bold; }
            .logo { text-align: center; flex-grow: 1; }
            .title { text-align: center; font-weight: bold; font-size: 24px; margin: 40px 0; }
            .content { font-size: 18px; line-height: 2; text-align: right; margin-bottom: 60px; }
            .footer { display: flex; justify-content: space-between; margin-top: 60px; font-weight: bold; }
            .date { text-align: center; margin: 20px 0; }
            .signature-section { display: flex; flex-direction: column; gap: 40px; margin-top: 40px; }
            .signature-row { display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-right">
              <p>الجمهورية العربية السورية</p>
              <p>وزارة الإدارة المحلية والبيئة</p>
              <p>محافظة طرطوس</p>
            </div>
            <div class="logo">
              <!-- Eagle Logo Placeholder -->
              <svg width="100" height="100" viewBox="0 0 100 100">
                 <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="20">🦅</text>
              </svg>
            </div>
            <div class="header-left">
              <p>Syrian Arab Republic</p>
              <p>Ministry of Local Administration and Environment</p>
              <p>Tartous Governorate</p>
            </div>
          </div>

          <div class="title">السيد محافظ طرطوس</div>

          <div class="content">
            <p>
              الاسم: ....................${
                employee?.fullName || ""
              }.................... العامل لدى ....................${
      employee?.workLocation || "المحافظة"
    }....................
            </p>
            <p>
              أرجو الموافقة على منحي إجازة إدارية لمدة ..........${
                vacation.days || ""
              }.......... اعتباراً من يوم ..........${new Date(
      vacation.startDate
    ).toLocaleDateString("ar-SY")}..........
            </p>
            <p>
              على أن تحسب من إجازاتي الإدارية السنوية لعام ${new Date().getFullYear()}.
            </p>
          </div>

          <div class="date">
            طرطوس في: ${new Date().toLocaleDateString("ar-SY")}
          </div>

          <div class="signature-section">
            <div class="signature-row">
              <div>مدير التنمية الإدارية .................... الإجازة المطلوبة</div>
            </div>
            <div class="signature-row">
              <div>الرئيس المباشر</div>
            </div>
            <div class="signature-row" style="margin-top: 40px;">
              <div>أمين عام المحافظة</div>
            </div>
            <div class="signature-row">
              <div>أ. ريم مصطفى صالح</div>
            </div>
          </div>

          <script>window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handlePrintCircular = async () => {
    try {
      const response = await API.get(`/employees/${id}/vacations/statement`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      window.open(url, "_blank");
    } catch (error) {
      console.error(error);
      toast.error("فشل إنشاء بيان الإجازات");
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=800,height=600");
    const htmlContent = `
      <html dir="rtl">
        <head>
          <title>إجازات الموظف</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; margin-bottom: 20px; }
            .employee-info { text-align: right; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 10px; text-align: center; }
            th { background-color: #f0f0f0; font-weight: bold; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>إجازات الموظف</h1>
          <div class="employee-info">
            <p><strong>رقم الموظف:</strong> ${id}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>الترتيب</th>
                <th>نوع الإجازة</th>
                <th>عدد الأيام</th>
                <th>تاريخ البداية</th>
              </tr>
            </thead>
            <tbody>
              ${vacations
                .map(
                  (v, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${v.type}</td>
                  <td>${v.days}</td>
                  <td>${v.startDate}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="p-6 font-custom text-right" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-100">سجل الإجازات</h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrintCircular}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center gap-2 transition"
          >
            <Printer size={18} />
            طباعة بيان وضع
          </button>

          <button
            onClick={handleAdd}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
          >
            تسجيل إجازة
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 rounded-lg shadow border-r-4 border-purple-500">
          <div className="p-4">
            <h3 className="text-slate-400 text-sm font-medium">
              معلومات الخدمة
            </h3>
            <p className="text-sm text-slate-200 mt-2">
              <strong>تاريخ التعيين:</strong>{" "}
              {employee?.hiringDate
                ? new Date(employee.hiringDate).toLocaleDateString("ar-SY")
                : "تاريخ التعيين غير متوفر"}
            </p>
            <p className="text-sm text-slate-200">
              <strong>سنوات الخدمة:</strong> {getServiceYears()} سنة
            </p>
            <p className="text-sm text-slate-200">
              <strong>الاستحقاق السنوي:</strong>{" "}
              {getRemainingDays().entitlement} يوم
            </p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg shadow border-r-4 border-blue-500">
          <div className="p-4">
            <h3 className="text-slate-400 text-sm font-medium">
              الرصيد الإداري المتبقي
            </h3>
            <p className="text-2xl font-bold text-slate-100">
              {getRemainingDays().admin} يوم
            </p>
            <p className="text-xs text-slate-500 mt-1">
              تم استخدام {getRemainingDays().adminTaken} يوم إداري +{" "}
              {getRemainingDays().hourlyDays} يوم (من{" "}
              {getRemainingDays().hourlyTaken} ساعة)
            </p>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg shadow border-r-4 border-green-500">
          <div className="p-4">
            <h3 className="text-slate-400 text-sm font-medium">
              الرصيد الصحي المتبقي
            </h3>
            <p className="text-2xl font-bold text-slate-100">
              {getRemainingDays().health} يوم
            </p>
            <p className="text-xs text-slate-500 mt-1">من أصل 180 يوم</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg shadow overflow-hidden border border-slate-700">
        {/* جدول الإجازات */}
        <table className="min-w-full bg-slate-800 border-collapse">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="p-2 border border-slate-700 text-slate-200">
                النوع
              </th>
              <th className="p-2 border border-slate-700 text-slate-200">
                عدد الأيام
              </th>
              <th className="p-2 border border-slate-700 text-slate-200">
                تاريخ البداية
              </th>
              <th className="p-2 border border-slate-700 text-slate-200">
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody>
            {vacations.map((v) => (
              <tr
                key={v.id}
                className="border-t border-slate-700 hover:bg-slate-700/30 transition-colors"
              >
                <td className="p-2 border border-slate-700 text-slate-300">
                  {v.type}
                </td>
                <td className="p-2 border border-slate-700 text-slate-300">
                  {v.type === "إجازة ساعية" ? `${v.hours} ساعة` : v.days}
                </td>
                <td className="p-2 border border-slate-700 text-slate-300">
                  {new Date(v.startDate).toLocaleDateString("ar-SY")}
                </td>
                <td className="p-2 border border-slate-700">
                  <div className="flex flex-row justify-center">
                    {" "}
                    {v.type === "إجازة إدارية" && (
                      <button
                        onClick={() => handlePrintRequest(v)}
                        className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 ml-2 transition flex items-center gap-1 text-sm"
                        title="طباعة طلب إجازة"
                      >
                        <Printer size={14} />
                        طباعة
                      </button>
                    )}
                    <button
                      onClick={() => handlePrintPDF(v._id || v.id)}
                      className="bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700 ml-2 transition flex items-center gap-1 text-sm"
                      title="طباعة مباشرة"
                    >
                      <Printer size={14} />
                      طباعة PDF
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(v._id || v.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 ml-2 transition flex items-center gap-1 text-sm"
                      title="تحميل PDF"
                    >
                      <Download size={14} />
                      PDF
                    </button>
                    {checkPermission("vacations.edit", user) && (
                      <button
                        onClick={() => handleEdit(v)}
                        className="bg-slate-600 text-white px-3 py-1 rounded hover:bg-slate-500 ml-2 transition"
                      >
                        تعديل
                      </button>
                    )}
                    {checkPermission("vacations.delete", user) && (
                      <button
                        onClick={() => handleDelete(v._id || v.id)}
                        className="bg-red-800 text-white px-3 py-1 rounded hover:bg-red-900 ml-2 transition flex items-center gap-1 text-sm"
                        title="حذف"
                      >
                        <Trash2 size={14} />
                        حذف
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* مودال */}
      {modalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md animate-fadeInUp border border-slate-700">
            <h3 className="text-xl font-bold mb-4 text-center text-slate-100">
              {selectedVacation ? "تعديل الإجازة" : "إضافة إجازة جديدة"}
            </h3>

            <form onSubmit={handleSubmit} className="grid gap-3">
              {/* نوع الإجازة */}
              <DropdownWithSettings
                id="vacation_type"
                value={formData.type}
                onChange={(e) =>
                  handleChange({
                    target: { name: "type", value: e.target.value },
                  })
                }
                options={[
                  { value: "", label: "اختر النوع" },
                  ...vacationTypes.map((t) => ({ value: t, label: t })),
                ]}
                label="نوع الإجازة"
                placeholder="اختر النوع"
                className="border border-slate-600 bg-slate-900 text-slate-100 p-2 w-full rounded !bg-slate-900 !text-slate-100"
              />

              {/* إجازة أمومة → رقم الطفل */}
              {formData.type === "إجازة أمومة" && (
                <DropdownWithSettings
                  id="child_order"
                  value={formData.childOrder}
                  onChange={(e) =>
                    handleChange({
                      target: { name: "childOrder", value: e.target.value },
                    })
                  }
                  options={[
                    { value: "", label: "اختر" },
                    { value: "1", label: "الولد الأول (120 يوم)" },
                    { value: "2", label: "الولد الثاني (90 يوم)" },
                    { value: "3", label: "الولد الثالث (75 يوم)" },
                  ]}
                  label="ترتيب الطفل"
                  placeholder="اختر"
                  className="border border-slate-600 bg-slate-900 text-slate-100 p-2 w-full rounded !bg-slate-900 !text-slate-100"
                />
              )}

              {/* إجازة ساعية → عدد الساعات */}
              {formData.type === "إجازة ساعية" && (
                <>
                  <div>
                    <label className="block mb-1 font-medium text-slate-300">
                      عدد الساعات
                    </label>
                    <input
                      type="number"
                      name="hours"
                      value={formData.hours}
                      onChange={handleChange}
                      className="border border-slate-600 bg-slate-900 text-slate-100 p-2 w-full rounded focus:outline-none focus:border-blue-500"
                      placeholder="أدخل عدد الساعات"
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      كل 8 ساعات = يوم واحد
                    </p>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium text-slate-300">
                      ساعة النهاية
                    </label>
                    <input
                      type="time"
                      name="endHour"
                      value={formData.endHour}
                      onChange={handleChange}
                      className="border border-slate-600 bg-slate-900 text-slate-100 p-2 w-full rounded focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              {/* عدد الأيام */}
              {formData.type !== "إجازة ساعية" && (
                <div>
                  <label className="block mb-1 font-medium text-slate-300">
                    عدد الأيام
                  </label>
                  <input
                    type="number"
                    name="days"
                    value={formData.days}
                    onChange={handleChange}
                    className="border border-slate-600 bg-slate-900 text-slate-100 p-2 w-full rounded focus:outline-none focus:border-blue-500"
                    readOnly={formData.type === "إجازة أمومة"}
                  />
                </div>
              )}

              {/* تاريخ البداية */}
              <div>
                <label className="block mb-1 font-medium text-slate-300">
                  تاريخ البداية
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="border border-slate-600 bg-slate-900 text-slate-100 p-2 w-full rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* تاريخ النهاية */}
              {formData.type !== "إجازة ساعية" && (
                <div>
                  <label className="block mb-1 font-medium text-slate-300">
                    تاريخ النهاية
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate || ""}
                    onChange={handleChange}
                    className="border border-slate-600 bg-slate-900 text-slate-100 p-2 w-full rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div className="flex justify-between mt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-500 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
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
