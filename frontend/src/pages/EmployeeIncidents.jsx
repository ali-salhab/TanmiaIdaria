import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";
import { FaEdit } from "react-icons/fa";
import toast from "react-hot-toast";
import { FileArchive, Settings, Printer } from "lucide-react";
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
      const payload = {
        ...selectedIncident,
        isInternal: selectedIncident.incidentType === "داخلي",
      };
      if (selectedIncident._id) {
        // تعديل الوقوع
        await API.put(`/incidents/${selectedIncident._id}`, payload);
      } else {
        // إضافة وقوع جديد
        await API.post("/incidents", payload);
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
        directorate: "",
        department: "",
        divisionName: "",
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
      directorate: "",
      department: "",
      divisionName: "",
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

  const handlePrintIncident = (incident) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>وثيقة وقوع وظيفي - ${currentEmployee?.fullName || "موظف"}</title>
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
              border-bottom: 1px dashed #e2e8f0;
              padding-bottom: 10px;
            }
            .row:last-child { border-bottom: none; }
            .row strong {
              color: #334155;
              min-width: 150px;
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
            <h1 class="doc-title">وثيقة وقوع وظيفي ${incident.isInternal ? "(داخلي)" : "(خارجي)"}</h1>
          </div>
 
          <div class="personal-info">
            <div class="info-item">
              <span class="info-label">اسم الموظف:</span>
              <span class="info-value">${currentEmployee?.fullName || "-"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">الرقم الذاتي:</span>
              <span class="info-value">${currentEmployee?.selfNumber || "-"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">الوظيفة الحالية:</span>
              <span class="info-value">${currentEmployee?.currentJobTitle || "-"}</span>
            </div>
          </div>
 
          <div class="content-box">
            <div class="row"><strong>مركز العمل:</strong> <span>${incident.work_center}</span></div>
            <div class="row"><strong>المسمى الوظيفي:</strong> <span>${incident.job_title}</span></div>
            <div class="row"><strong>نوع الوظيفة:</strong> <span>${incident.job_type}</span></div>
            ${incident.isInternal ? `
              <div class="row"><strong>المديرية:</strong> <span>${incident.directorate || "-"}</span></div>
              <div class="row"><strong>الدائرة:</strong> <span>${incident.department || "-"}</span></div>
              <div class="row"><strong>الشعبة:</strong> <span>${incident.divisionName || "-"}</span></div>
            ` : ""}
            <div class="row"><strong>الأجر:</strong> <span>${incident.salary}</span></div>
            <div class="row"><strong>الفئة:</strong> <span>${incident.category}</span></div>
            <div class="row"><strong>تاريخ المباشرة:</strong> <span>${incident.start_date ? new Date(incident.start_date).toLocaleDateString("ar-SY") : "-"}</span></div>
            <div class="row"><strong>تاريخ التبدل:</strong> <span>${incident.change_date ? new Date(incident.change_date).toLocaleDateString("ar-SY") : "-"}</span></div>
            <div class="row"><strong>السبب:</strong> <span>${incident.reason}</span></div>
            <div class="row"><strong>نوع المستند:</strong> <span>${incident.document_type || "-"}</span></div>
            <div class="row"><strong>رقم المستند:</strong> <span>${incident.document_number || "-"}</span></div>
            <div class="row"><strong>تاريخ المستند:</strong> <span>${incident.document_date ? new Date(incident.document_date).toLocaleDateString("ar-SY") : "-"}</span></div>
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

  const handlePrintInternalList = () => {
    const internalIncidents = incidents.filter(inc => inc.isInternal);
    if (internalIncidents.length === 0) {
      toast.error("لا توجد وقوعات داخلية للطباعة");
      return;
    }

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>سجل الوقوعات الداخلية - ${currentEmployee?.fullName || "موظف"}</title>
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
              margin-bottom: 30px; 
              border-bottom: 2px solid #334155;
              padding-bottom: 20px;
            }
            .doc-title { 
              font-size: 24px; 
              font-weight: 700; 
              color: #0f172a;
              margin: 10px 0;
            }
            .personal-info {
              display: flex;
              justify-content: space-around;
              background: #f8fafc;
              padding: 15px;
              border-radius: 10px;
              margin-bottom: 20px;
              border: 1px solid #e2e8f0;
            }
            .info-item {
              font-size: 14px;
            }
            .info-label {
              font-weight: 700;
              color: #64748b;
              margin-left: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 12px;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 8px;
              text-align: right;
            }
            th {
              background-color: #f1f5f9;
              font-weight: 700;
            }
            .footer {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              padding: 0 50px;
            }
            .signature-box {
              text-align: center;
            }
            .sig-title {
              font-weight: 700;
              margin-bottom: 40px;
              font-size: 15px;
            }
            @media print {
              body { padding: 0 !important; }
              table { font-size: 10px; }
              th { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; }
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
            <h1 class="doc-title">سجل الوقوعات الوظيفية الداخلية</h1>
          </div>
 
          <div class="personal-info">
            <div class="info-item">
              <span class="info-label">الموظف:</span>
              <span>${currentEmployee?.fullName || "-"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">الرقم الذاتي:</span>
              <span>${currentEmployee?.selfNumber || "-"}</span>
            </div>
          </div>
 
          <table>
            <thead>
              <tr>
                <th>مركز العمل</th>
                <th>المسمى الوظيفي</th>
                <th>المديرية</th>
                <th>الدائرة</th>
                <th>الشعبة</th>
                <th>الأجر</th>
                <th>الفئة</th>
                <th>المباشرة</th>
                <th>التبدل</th>
                <th>السبب</th>
              </tr>
            </thead>
            <tbody>
              ${internalIncidents.map(inc => `
                <tr>
                  <td>${inc.work_center}</td>
                  <td>${inc.job_title}</td>
                  <td>${inc.directorate || "-"}</td>
                  <td>${inc.department || "-"}</td>
                  <td>${inc.divisionName || "-"}</td>
                  <td>${inc.salary}</td>
                  <td>${inc.category}</td>
                  <td>${inc.start_date ? new Date(inc.start_date).toLocaleDateString("ar-SY") : "-"}</td>
                  <td>${inc.change_date ? new Date(inc.change_date).toLocaleDateString("ar-SY") : "-"}</td>
                  <td>${inc.reason}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
 
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

  const newLocal = `
        @media print {
          body { 
            font-family: 'Arial', sans-serif !important; 
            padding: 20px !important;
            background: white !important;
          }
          
          /* Show targeted containers only */
          body * { visibility: hidden; }
          .max-w-6xl, .max-w-6xl * { visibility: visible; }
          
          .max-w-6xl {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Official Header */
          .official-header {
            display: flex !important;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            width: 100%;
            border-bottom: 2px solid black;
            padding-bottom: 10px;
          }
          .gov-right {
            text-align: right;
            font-size: 12px;
            font-weight: bold;
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

          /* Personal Info for print */
          .print-personal-info {
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            background: #f8fafc !important;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid #ddd !important;
            -webkit-print-color-adjust: exact;
          }
          .info-item { font-size: 14px; }
          .info-label { font-weight: bold; margin-left: 5px; }

          /* Table refined */
          .bg-slate-900\\/60 {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            border: 1.5px solid black !important;
          }
          th, td {
            border: 1px solid black !important;
            color: black !important;
            padding: 8px !important;
            font-size: 11px !important;
          }
          thead { display: table-header-group; background: #eee !important; }
          
          .print\\:hidden, #root > div > aside, #root > div > main > header {
            display: none !important;
          }
        }
      `;
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
          {activeTab !== "internal" && (
            <button
              onClick={openCvModal}
              className="flex items-center gap-2 px-4 py-3 rounded-lg bg-slate-800/70 border border-slate-700 text-slate-100 hover:bg-slate-700/70 hover:animate-slowBounce transition"
            >
              البطاقة الذاتية للموظف <FileArchive />
            </button>
          )}
          {activeTab === "internal" && (
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    const response = await API.get(`/incidents/${id}/export-internal`, {
                      responseType: "blob",
                    });
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement("a");
                    link.href = url;
                    link.setAttribute("download", `الوقوعات_الداخلية_${currentEmployee.fullName}.xlsx`);
                    document.body.appendChild(link);
                    link.click();
                    link.parentNode.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    toast.success("تم تصدير الوقوعات بنجاح");
                  } catch (error) {
                    console.error(error);
                    toast.error("فشل تصدير الوقوعات");
                  }
                }}
                className="px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-500 transition shadow"
              >
                تصدير الوقوعات الداخلية إلى اكسل
              </button>
              <button
                onClick={handlePrintInternalList}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition shadow print:hidden"
              >
                طباعة الوقوعات الداخلية
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-4 print:hidden">
        <button
          className={`py-2 px-4 font-medium transition ${activeTab === "general"
            ? "border-b-2 border-amber-500 text-amber-400"
            : "text-slate-400 hover:text-slate-200"
            }`}
          onClick={() => setActiveTab("general")}
        >
          الوقوعات الخارجية
        </button>
        <button
          className={`py-2 px-4 font-medium transition ${activeTab === "internal"
            ? "border-b-2 border-amber-500 text-amber-400"
            : "text-slate-400 hover:text-slate-200"
            }`}
          onClick={() => setActiveTab("internal")}
        >
          الوقوعات الداخلية
        </button>
      </div>

      <div className="bg-slate-900/60 rounded-xl shadow-xl overflow-x-auto border border-slate-800 print:bg-white print:text-black print:border-black print:rounded-none">
        <div className="hidden print:block">
          <div className="official-header">
            <div className="gov-right">
              الجمهورية العربية السورية<br />
              وزارة الإدارة المحلية والبيئة<br />
              محافظة طرطوس<br />
              الأمانة العامة<br />
              مديرية التنمية الإدارية
            </div>
            <div className="gov-logo">
              <img src="/src/assets/syria_logo.svg" alt="الشعار الرسمي" />
            </div>
            <div style={{ width: "150px" }}></div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-4">وقوعات وظيفية {activeTab === "internal" ? "داخلية" : "خارجية"}</h2>
          </div>

          <div className="print-personal-info">
            <div className="info-item">
              <span className="info-label">اسم الموظف:</span>
              <span>{currentEmployee?.fullName || "-"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">الرقم الذاتي:</span>
              <span>{currentEmployee?.selfNumber || "-"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">الوظيفة الحالية:</span>
              <span>{currentEmployee?.currentJobTitle || "-"}</span>
            </div>
          </div>
        </div>
        <table className="min-w-full border-collapse print:text-xs">
          <thead className="bg-slate-800 border-b border-slate-700 text-slate-200 print:bg-gray-100 print:text-black print:border-black">
            <tr>
              <th className="py-2 px-4 text-right font-semibold border-b border-slate-700 print:border-black">مركز العمل</th>
              <th className="py-2 px-4 text-right font-semibold border-b border-slate-700 print:border-black">المسمى الوظيفي</th>
              <th className="py-2 px-4 text-right font-semibold border-b border-slate-700 print:border-black">نوع الوظيفة</th>
              {activeTab === "internal" && (
                <>
                  <th className="py-2 px-4 text-right font-semibold border-b border-slate-700 print:border-black">المديرية</th>
                  <th className="py-2 px-4 text-right font-semibold border-b border-slate-700 print:border-black">الدائرة</th>
                  <th className="py-2 px-4 text-right font-semibold border-b border-slate-700 print:border-black">الشعبة</th>
                </>
              )}
              <th className="py-2 px-4 text-right font-semibold border-b border-slate-700 print:border-black">الأجر</th>
              <th className="py-2 px-4 text-right font-semibold border-b border-slate-700 print:border-black">الفئة</th>
              <th className="py-2 px-4 text-right font-semibold border-b border-slate-700 print:border-black">تاريخ المباشرة</th>
              <th className="py-2 px-4 text-right font-semibold border-b border-slate-700 print:border-black">تاريخ التبدل</th>
              <th className="py-2 px-4 text-right font-semibold border-b border-slate-700 print:border-black">السبب</th>
              <th className="py-2 px-4 text-right font-semibold border-b border-slate-700 print:border-black print:hidden">الإجراءات</th>
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
                  className="border-b border-slate-800 hover:bg-slate-800/60 text-sm transition print:border-black"
                >
                  <td className="py-2 px-4 text-slate-200 print:text-black">{inc.work_center}</td>
                  <td className="py-2 px-4 text-slate-200 print:text-black">{inc.job_title}</td>
                  <td className="py-2 px-4 text-slate-200 print:text-black">{inc.job_type}</td>
                  {activeTab === "internal" && (
                    <>
                      <td className="py-2 px-4 text-slate-200 print:text-black">{inc.directorate || "-"}</td>
                      <td className="py-2 px-4 text-slate-200 print:text-black">{inc.department || "-"}</td>
                      <td className="py-2 px-4 text-slate-200 print:text-black">{inc.divisionName || "-"}</td>
                    </>
                  )}
                  <td className="py-2 px-4 text-slate-200 print:text-black">{inc.salary}</td>
                  <td className="py-2 px-4 text-slate-200 print:text-black">{inc.category}</td>
                  <td className="py-2 px-4 text-slate-200 print:text-black">
                    {inc.start_date?.split("T")[0]}
                  </td>
                  <td className="py-2 px-4 text-slate-200 print:text-black">
                    {inc.change_date?.split("T")[0]}
                  </td>
                  <td className="py-2 px-4 text-slate-200 print:text-black">{inc.reason}</td>
                  <td className="py-2 px-4 text-center print:hidden">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openEditModal(inc)}
                        className="text-amber-400 hover:text-amber-300 transition"
                        title="تعديل"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handlePrintIncident(inc)}
                        className="text-indigo-400 hover:text-indigo-300 transition"
                        title="طباعة"
                      >
                        <Printer size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {incidents.length === 0 && (
              <tr>
                <td colSpan={activeTab === "internal" ? "12" : "9"} className="text-center py-4 text-slate-400">
                  لا توجد وقوعات حالياً
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Print styles */}
      <style>{newLocal}</style>

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
          <div className="bg-slate-900 rounded-xl p-6 max-w-2xl w-full transform transition-all duration-300 scale-95 animate-fadeInUp overflow-y-auto max-h-[90vh] border border-slate-700 shadow-2xl text-slate-100">
            <h3 className="text-xl font-bold mb-4 text-center text-amber-400">
              {selectedIncident._id ? "تعديل الوقوع" : "إضافة وقوع جديد"}
            </h3>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col md:col-span-2">
                <label className="mb-1 font-medium text-slate-200">نوع الوقوع</label>
                <DropdownWithSettings
                  id="incidentType"
                  value={selectedIncident.incidentType || ""}
                  onChange={(e) =>
                    handleChange({
                      target: { name: "incidentType", value: e.target.value },
                    })
                  }
                  options={["داخلي", "خارجي"].map((opt) => {
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
                { label: "مركز العمل", name: "work_center", type: "text", required: true },
                { label: "المسمى الوظيفي", name: "job_title", type: "text", required: true },
                { label: "نوع الوظيفة", name: "job_type", type: "text", required: true },
                { label: "الأجر", name: "salary", type: "number", min: "0", required: true },
                {
                  label: "الفئة",
                  name: "category",
                  type: "select",
                  options: dropdownSettings.category,
                  required: true
                },
                { label: "تاريخ المباشرة", name: "start_date", type: "date", required: true },
                { label: "تاريخ التبدل", name: "change_date", type: "date", required: true },
                {
                  label: "السبب",
                  name: "reason",
                  type: "select",
                  options: dropdownSettings.reason,
                  required: true
                },
                {
                  label: "نوع المستند",
                  name: "document_type",
                  type: "select",
                  options: dropdownSettings.document_type,
                  required: true
                },
                { label: "رقم المستند", name: "document_number", type: "text", required: true },
                { label: "تاريخ المستند", name: "document_date", type: "date", required: true },
                { label: "اسم المسجل", name: "registrar_name", type: "text", required: false },
                {
                  label: "توقيع المسجل",
                  name: "registrar_signature",
                  type: "text",
                  required: false
                },
              ].map((field) => (
                <div key={field.name} className="flex flex-col">
                  <label className="mb-1 font-medium text-slate-200">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>

                  {field.type === "select" ? (
                    <DropdownWithSettings
                      id={field.name}
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
                      min={field.min}
                      required={field.required}
                      value={selectedIncident[field.name] || ""}
                      onChange={handleChange}
                      className="border border-slate-700 p-2 rounded bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  )}
                </div>
              ))}

              {/* Additional fields for internal incidents */}
              {selectedIncident.incidentType === "داخلي" && (
                <>
                  <div className="flex flex-col">
                    <label className="mb-1 font-medium text-slate-200">المديرية <span className="text-rose-500">*</span></label>
                    <input
                      name="directorate"
                      type="text"
                      required
                      value={selectedIncident.directorate || ""}
                      onChange={handleChange}
                      className="border border-slate-700 p-2 rounded bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-1 font-medium text-slate-200">الدائرة <span className="text-rose-500">*</span></label>
                    <input
                      name="department"
                      type="text"
                      required
                      value={selectedIncident.department || ""}
                      onChange={handleChange}
                      className="border border-slate-700 p-2 rounded bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-1 font-medium text-slate-200">الشعبة <span className="text-rose-500">*</span></label>
                    <input
                      name="divisionName"
                      type="text"
                      required
                      value={selectedIncident.divisionName || ""}
                      onChange={handleChange}
                      className="border border-slate-700 p-2 rounded bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-between mt-4 md:col-span-2">
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
