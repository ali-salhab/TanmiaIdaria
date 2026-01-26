import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import API from "../api/api";
import { Trash2, Plus, Printer, FileText, X } from "lucide-react";
import toast from "react-hot-toast";
import { checkPermission } from "../utils/permissionHelper";
import { useAuth } from "../hooks/useAuth";

export default function EmployeeCourses({ employee }) {
  const { id } = useParams();
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    duration: "",
    decisionNumber: "",
    startDate: new Date().toISOString().split("T")[0],
  });
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCourses();
  }, [id]);

  const fetchCourses = async () => {
    try {
      const res = await API.get(`/courses/${id}`);
      setCourses(res.data);
    } catch (error) {
      toast.error("فشل تحميل الدورات");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("duration", formData.duration);
    if (formData.decisionNumber)
      data.append("decisionNumber", formData.decisionNumber);
    data.append("startDate", formData.startDate);
    if (file) {
      data.append("file", file);
    }

    try {
      await API.post(`/courses/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("تم إضافة الدورة");
      setShowModal(false);
      setFormData({
        name: "",
        duration: "",
        decisionNumber: "",
        startDate: new Date().toISOString().split("T")[0],
      });
      setFile(null);
      fetchCourses();
    } catch (error) {
      toast.error("فشل إضافة الدورة");
    }
  };

  const handleDelete = async (courseId) => {
    if (!checkPermission("employees.edit", user)) {
      toast.error("ليس لديك صلاحية للقيام بهذا الإجراء");
      return;
    }
    if (!window.confirm("هل أنت متأكد من حذف هذه الدورة؟")) return;
    try {
      await API.delete(`/courses/${courseId}`);
      toast.success("تم حذف الدورة");
      setCourses(courses.filter((c) => c._id !== courseId));
    } catch (error) {
      toast.error("فشل حذف الدورة");
    }
  };

  const handlePrint = (course) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>وثيقة دورة - ${employee?.fullName || 'موظف'}</title>
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
            <h1 class="doc-title">وثيقة دورة تدريبية</h1>
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
            <div class="row"><strong>اسم الدورة:</strong> <span>${course.name}</span></div>
            <div class="row"><strong>المدة:</strong> <span>${course.duration}</span></div>
            ${course.decisionNumber ? `<div class="row"><strong>رقم القرار:</strong> <span>${course.decisionNumber}</span></div>` : ""}
            <div class="row"><strong>تاريخ البداية:</strong> <span>${new Date(course.startDate).toLocaleDateString("ar-SY")}</span></div>
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

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-100">سجل الدورات التدريبية</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition shadow-lg shadow-purple-900/20"
        >
          <Plus size={18} /> إضافة دورة
        </button>
      </div>

      {loading ? (
        <p className="text-center text-slate-400 py-10">جاري التحميل...</p>
      ) : courses.length === 0 ? (
        <p className="text-center text-slate-500 py-10 border border-dashed border-slate-700 rounded-xl">لا توجد دورات مسجلة.</p>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <div
              key={course._id}
              className="bg-slate-800/70 border border-slate-700/50 rounded-xl p-5 flex justify-between items-center shadow-lg backdrop-blur-sm hover:border-slate-600/50 transition-all duration-300"
            >
              <div>
                <p className="font-bold text-lg text-purple-400 mb-1">
                  {course.name}
                </p>
                <p className="text-slate-300 text-sm mb-2 leading-relaxed">المدة: {course.duration}</p>
                {course.decisionNumber && (
                  <p className="text-[13px] text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500/50" />
                    رقم القرار: <span className="text-slate-300">{course.decisionNumber}</span>
                  </p>
                )}
                <p className="text-[12px] text-slate-500 mt-1 italic">
                  تاريخ البداية:{" "}
                  {new Date(course.startDate).toLocaleDateString("ar-SY")}
                </p>
                {course.file && (
                  <a
                    href={`${import.meta.env.VITE_API_URL}/${course.file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 text-sm font-medium flex items-center gap-2 mt-3 hover:text-blue-300 transition-colors"
                  >
                    <FileText size={14} /> عرض الملف المرفق
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePrint(course)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                  title="طباعة"
                >
                  <Printer size={18} />
                </button>
                <button
                  onClick={() => handleDelete(course._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="حذف"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-100">إضافة دورة جديدة</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">
                  اسم الدورة
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border border-slate-600 bg-slate-700/50 text-slate-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">المدة</label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  className="w-full border border-slate-600 bg-slate-700/50 text-slate-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-slate-400"
                  required
                  placeholder="مثال: 3 أيام، أسبوعين..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">
                  رقم القرار / المستند
                </label>
                <input
                  type="text"
                  value={formData.decisionNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      decisionNumber: e.target.value,
                    })
                  }
                  className="w-full border border-slate-600 bg-slate-700/50 text-slate-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-slate-400"
                  placeholder="أدخل رقم القرار"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">
                  تاريخ البداية
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full border border-slate-600 bg-slate-700/50 text-slate-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">
                  المرفقات (سكنر أو ملف)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full border border-slate-600 bg-slate-700/50 text-slate-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
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
