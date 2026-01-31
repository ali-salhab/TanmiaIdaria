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
  const [delay, setDelay] = useState(null)
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
    "تأخير",
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

    // 🛑 التحقق من البيانات
    if (!formData.type) {
      toast.error("يرجى اختيار نوع الإجازة");
      return;
    }

    if (!formData.days || parseFloat(formData.days) <= 0) {
      if (
        formData.type !== "إجازة ساعية" &&
        formData.type !== "تأخير" &&
        (!formData.hours || parseFloat(formData.hours) <= 0)
      ) {
        toast.error("يرجى إدخال عدد أيام أو ساعات صحيح");
        return;
      }
    }

    // التحقق من نوع الإجازة والجنس
    if (formData.type === "إجازة أمومة" && employee?.gender === "ذكر") {
      toast.error("عذراً، إجازة الأمومة مخصصة للإناث فقط");
      return;
    }

    // التحقق من الرصيد المتبقي
    const balance = getRemainingDays();
    if (formData.type === "إجازة إدارية") {
      const requestedDays = parseFloat(formData.days);
      const currentDaysInEdit = selectedVacation?.type === "إجازة إدارية" ? parseFloat(selectedVacation.days) : 0;
      if (requestedDays > (balance.admin + currentDaysInEdit)) {
        toast.error(`عذراً، الرصيد الإداري المتبقي (${balance.admin + currentDaysInEdit}) يوم فقط`);
        return;
      }
    }

    if (formData.type === "إجازة صحية") {
      const requestedDays = parseFloat(formData.days);
      const currentDaysInEdit = selectedVacation?.type === "إجازة صحية" ? parseFloat(selectedVacation.days) : 0;
      if (requestedDays > (balance.health + currentDaysInEdit)) {
        toast.error(`عذراً، الرصيد الصحي المتبقي (${balance.health + currentDaysInEdit}) يوم فقط`);
        return;
      }
    }

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
      setDelay(false);
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
  const handleDelay = () => {
    setSelectedVacation(null);
    setFormData({
      type: "تأخير",
      days: 0,
      hours: "",
      childOrder: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
    });
    setDelay(true);
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
    const delayTotal = vacations.filter((v) => v.type === "تأخير").length;
    const delayDays = Math.floor(delayTotal / 3);

    const entitlement = getEntitlement();

    const healthTotal = vacations
      .filter((v) => v.type === "إجازة صحية")
      .reduce((acc, curr) => acc + parseFloat(curr.days || 0), 0);

    const totalAdminUsed = adminTotal + hourlyDays + delayDays;

    return {
      admin: Math.max(0, entitlement - totalAdminUsed),
      health: Math.max(0, 180 - healthTotal),
      adminTaken: adminTotal,
      hourlyTaken: hourlyTotal,
      hourlyDays: hourlyDays,
      delayCount: delayTotal,
      delayDays: delayDays,
      healthTaken: healthTotal,
      entitlement: entitlement,
    };
  };

  const handlePrintIndividual = (v) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>وثيقة إجازة - ${employee?.fullName || 'موظف'}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
            body { 
              font-family: 'Tajawal', sans-serif; 
              padding: 20px 40px; 
              color: #1e293b;
              background: #fff;
              line-height: 1.6;
            }
            .gov-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 30px;
            }
            .gov-right {
              text-align: right;
              font-size: 14px;
              font-weight: 700;
              line-height: 1.8;
            }
            .gov-logo {
              text-align: center;
              flex: 1;
            }
            .gov-logo img {
              height: 100px;
              width: auto;
            }
            .header { 
              text-align: center; 
              margin-bottom: 40px; 
              border-bottom: 2px solid #334155;
              padding-bottom: 20px;
            }
            .doc-title { 
              font-size: 28px; 
              font-weight: 700; 
              color: #0f172a;
              margin: 10px 0;
            }
            .personal-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              background: #f8fafc;
              padding: 20px;
              border-radius: 10px;
              margin-bottom: 30px;
              border: 1px solid #e2e8f0;
            }
            .info-item {
              font-size: 15px;
            }
            .info-label {
              font-weight: 700;
              color: #64748b;
              margin-left: 10px;
            }
            .info-value {
              color: #1e293b;
              font-weight: 500;
            }
            .content-box { 
              border: 1px solid #e2e8f0; 
              padding: 25px; 
              border-radius: 12px; 
              background: #fff;
            }
            .row { 
              margin: 15px 0; 
              font-size: 18px; 
              display: flex;
              gap: 15px;
              align-items: flex-start;
            }
            .row strong {
              color: #334155;
              min-width: 130px;
              display: inline-block;
            }
            .footer {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
              padding: 0 50px;
            }
            .signature-box {
              text-align: center;
            }
            .sig-title {
              font-weight: 700;
              margin-bottom: 60px;
              font-size: 17px;
            }
            @media print {
              body { padding: 0 !important; }
              .personal-info { border: 1px solid #cbd5e1; background: #f8fafc !important; -webkit-print-color-adjust: exact; }
              .header { border-bottom-color: #1e293b; }
            }
          </style>
        </head>
        <body>
          <div class="gov-header">
            <div class="gov-right">
              الجمهورية العربية السورية<br/>
              وزارة الإدارة المحلية والبيئة<br/>
              محافظة طرطوس<br/>
              الأمانة العامة<br/>
              مديرية التنمية الإدارية
            </div>
            <div class="gov-logo">
              <img src="/src/assets/syria_logo.svg" alt="الشعار الرسمي" />
            </div>
            <div style="width: 180px;"></div>
          </div>
          
          <div class="header">
            <h1 class="doc-title">وثيقة إجازة</h1>
          </div>

          <div class="personal-info">
            <div class="info-item">
              <span class="info-label">اسم الموظف:</span>
              <span class="info-value">${employee?.fullName || "-"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">الرقم الذاتي:</span>
              <span class="info-value">${employee?.selfNumber || "-"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">الوظيفة الحالية:</span>
              <span class="info-value">${employee?.currentJobTitle || "-"}</span>
            </div>
          </div>

          <div class="content-box">
            <div class="row"><strong>نوع الإجازة:</strong> <span>${v.type}</span></div>
            <div class="row"><strong>المدة:</strong> <span>${v.hours ? v.hours + ' ساعة' : v.days + ' يوم'}</span></div>
            <div class="row"><strong>تاريخ البداية:</strong> <span>${new Date(v.startDate).toLocaleDateString("ar-SY")}</span></div>
            ${v.endDate ? `<div class="row"><strong>تاريخ النهاية:</strong> <span>${new Date(v.endDate).toLocaleDateString("ar-SY")}</span></div>` : ""}
          </div>

          <div class="footer">
            <div class="signature-box">
              <div class="sig-title">توقيع الموظف المختص</div>
              <div>........................</div>
            </div>
            <div class="signature-box">
              <div class="sig-title">ختم الدائرة</div>
              <div>........................</div>
            </div>
          </div>

          <script>
            window.onload = () => { setTimeout(() => { window.print(); }, 200); };
          </script>
        </body>
      </html>
    `);
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
    const printWindow = window.open("", "_blank");
    const htmlContent = `
      <html dir="rtl">
        <head>
          <title>إجازات الموظف - ${employee?.fullName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
            body { 
              font-family: 'Tajawal', sans-serif; 
              padding: 20px 40px; 
              color: #1e293b;
              background: #fff;
            }
            .gov-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 20px;
              border-bottom: 2px solid black;
              padding-bottom: 10px;
            }
            .gov-right {
              text-align: right;
              font-size: 13px;
              font-weight: 700;
              line-height: 1.6;
            }
            .gov-logo {
              text-align: center;
              flex: 1;
            }
            .gov-logo img {
              height: 80px;
              width: auto;
            }
            .doc-title { text-align: center; margin: 20px 0; font-size: 24px; font-weight: 700; }
            .personal-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              background: #f8fafc;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              border: 1px solid #e2e8f0;
            }
            .info-item { font-size: 14px; }
            .info-label { font-weight: 700; color: #64748b; margin-left: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #000; padding: 10px; text-align: center; font-size: 13px; }
            th { background-color: #f1f5f9; font-weight: bold; }
            @media print { 
              body { padding: 0 !important; }
              .personal-info { -webkit-print-color-adjust: exact; background: #f8fafc !important; }
              th { -webkit-print-color-adjust: exact; background: #f1f5f9 !important; }
            }
          </style>
        </head>
        <body>
          <div class="gov-header">
            <div class="gov-right">
              الجمهورية العربية السورية<br/>
              وزارة الإدارة المحلية والبيئة<br/>
              محافظة طرطوس<br/>
              الأمانة العامة<br/>
              مديرية التنمية الإدارية
            </div>
            <div class="gov-logo">
              <img src="/src/assets/syria_logo.svg" alt="الشعار الرسمي" />
            </div>
            <div style="width: 150px;"></div>
          </div>

          <h1 class="doc-title">سجل إجازات الموظف</h1>

          <div class="personal-info">
            <div class="info-item"><span class="info-label">الموظف:</span><span>${employee?.fullName}</span></div>
            <div class="info-item"><span class="info-label">الرقم الذاتي:</span><span>${employee?.selfNumber}</span></div>
            <div class="info-item"><span class="info-label">المسمى الوظيفي:</span><span>${employee?.currentJobTitle}</span></div>
          </div>

          <table>
            <thead>
              <tr>
                <th>الترتيب</th>
                <th>نوع الإجازة</th>
                <th>المدة/الأيام</th>
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
                  <td>${v.hours ? v.hours + ' ساعة' : v.days + ' يوم'}</td>
                  <td>${new Date(v.startDate).toLocaleDateString("ar-SY")}</td>
                </tr>
              `
        )
        .join("")}
            </tbody>
          </table>
          <script>
            window.onload = () => { setTimeout(() => { window.print(); }, 200); };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="p-6 font-custom text-right" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-100">سجل الإجازات</h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center gap-2 transition"
          >
            <Printer size={18} />
            طباعة بيان وضع
          </button>
          <button
            onClick={handleDelay}
            className="bg-red-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center gap-2 transition"
          >
            <Printer size={18} />
            التاخيرات
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
              {getRemainingDays().hourlyTaken} ساعة) +{" "}
              {getRemainingDays().delayDays} يوم (من{" "}
              {getRemainingDays().delayCount} تأخيرات)
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

      {/* Helper function to render a table for a specific set of vacations */}
      {[
        { title: "الإجازات الإدارية والساعية", types: ["إجازة إدارية", "إجازة ساعية"] },
        { title: "الإجازات الصحية", types: ["إجازة صحية"] },
        { title: "التأخيرات", types: ["تأخير"] },
        { title: "إجازات أخرى", types: ["إجازة أمومة", "إجازة خاصة بلا أجر", "إجازة زواج", "إجازة حج"] }
      ].map((section, idx) => {
        const filteredVacations = vacations.filter(v => section.types.includes(v.type));
        if (filteredVacations.length === 0) return null;

        return (
          <div key={idx} className="mb-8">
            <h3 className="text-xl font-bold mb-4 text-slate-200 border-r-4 border-slate-500 pr-3">
              {section.title}
            </h3>
            <div className="bg-slate-800 rounded-lg shadow overflow-hidden border border-slate-700">
              <table className="min-w-full bg-slate-800 border-collapse">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="p-2 border border-slate-700 text-slate-200">النوع</th>
                    <th className="p-2 border border-slate-700 text-slate-200">المدة / التاريخ</th>
                    <th className="p-2 border border-slate-700 text-slate-200">تاريخ البداية</th>
                    <th className="p-2 border border-slate-700 text-slate-200">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVacations.map((v) => (
                    <tr key={v._id || v.id} className="border-t border-slate-700 hover:bg-slate-700/30 transition-colors">
                      <td className="p-2 border border-slate-700 text-slate-300">
                        {v.type === "تأخير" ? "تأخير حضور" : v.type}
                      </td>
                      <td className="p-2 border border-slate-700 text-slate-300 text-center">
                        {v.type === "إجازة ساعية"
                          ? `${v.hours} ساعة`
                          : v.type === "تأخير"
                            ? "-"
                            : `${v.days} يوم`}
                      </td>
                      <td className="p-2 border border-slate-700 text-slate-300 text-center">
                        {new Date(v.startDate).toLocaleDateString("ar-SY")}
                      </td>
                      <td className="p-2 border border-slate-700">
                        <div className="flex flex-row justify-center gap-2">
                          <button
                            onClick={() => handlePrintIndividual(v)}
                            className="bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700 transition flex items-center gap-1 text-sm"
                            title="طباعة مباشر"
                          >
                            <Printer size={14} />
                            طباعة
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(v._id || v.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition flex items-center gap-1 text-sm"
                            title="تحميل PDF"
                          >
                            <Download size={14} />
                            PDF
                          </button>
                          {checkPermission("vacations.edit", user) && (
                            <button
                              onClick={() => handleEdit(v)}
                              className="bg-slate-600 text-white px-3 py-1 rounded hover:bg-slate-500 transition"
                            >
                              تعديل
                            </button>
                          )}
                          {checkPermission("vacations.delete", user) && (
                            <button
                              onClick={() => handleDelete(v._id || v.id)}
                              className="bg-red-800 text-white px-3 py-1 rounded hover:bg-red-900 transition flex items-center gap-1 text-sm"
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
          </div>
        );
      })}
      {/* Modal for adding delay or general vacation */}
      {(modalOpen || delay) && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setModalOpen(false);
              setDelay(false);
            }
          }}
        >
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md animate-fadeInUp border border-slate-700">
            <h3 className="text-xl font-bold mb-4 text-center text-slate-100">
              {selectedVacation
                ? "تعديل " + (selectedVacation.type === "تأخير" ? "التأخير" : "الإجازة")
                : delay
                  ? "تسجيل تأخير جديد"
                  : "إضافة إجازة جديدة"}
            </h3>

            <form onSubmit={handleSubmit} className="grid gap-3">
              {/* Type Selection - only show if not adding via 'Delay' button specifically */}
              {(!delay || selectedVacation) && (
                <DropdownWithSettings
                  id="vacation_type"
                  value={formData.type || (delay ? "تأخير" : "")}
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
              )}

              {/* Maternity leave → child order */}
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

              {/* Hourly leave or Delay → hours */}
              {(formData.type === "إجازة ساعية" || formData.type === "تأخير") && (
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
                    {formData.type === "إجازة ساعية" && (
                      <p className="text-sm text-slate-500 mt-1">
                        كل 8 ساعات = يوم واحد
                      </p>
                    )}
                    {formData.type === "تأخير" && (
                      <p className="text-sm text-slate-500 mt-1">
                        كل 3 تأخيرات = يوم واحد (يتم حسابها بعدد المرات)
                      </p>
                    )}
                  </div>
                  {formData.type === "إجازة ساعية" && (
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
                  )}
                </>
              )}

              {/* Day count - Hidden for hourly and delay */}
              {formData.type !== "إجازة ساعية" && formData.type !== "تأخير" && (
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

              {/* Start Date */}
              <div>
                <label className="block mb-1 font-medium text-slate-300">
                  التاريخ
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="border border-slate-600 bg-slate-900 text-slate-100 p-2 w-full rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* End Date - Hidden for hourly and delay */}
              {formData.type !== "إجازة ساعية" && formData.type !== "تأخير" && (
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
                  onClick={() => {
                    setModalOpen(false);
                    setDelay(false);
                  }}
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
