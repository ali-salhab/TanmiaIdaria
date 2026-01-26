import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import API from "../api/api";
import { Trash2, Plus, Printer, FileText, X, Edit2 } from "lucide-react";
import toast from "react-hot-toast";
import { checkPermission } from "../utils/permissionHelper";
import { useAuth } from "../hooks/useAuth";

export default function EmployeePenalties({ employee }) {
  const { id } = useParams();
  const { user } = useAuth();
  const [penalties, setPenalties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    type: "",
    reason: "",
    decisionNumber: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchPenalties();
  }, [id]);

  const fetchPenalties = async () => {
    try {
      const res = await API.get(`/penalties/${id}`);
      setPenalties(res.data);
    } catch (error) {
      toast.error("فشل تحميل العقوبات");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("type", formData.type);
    data.append("reason", formData.reason);
    if (formData.decisionNumber)
      data.append("decisionNumber", formData.decisionNumber);
    data.append("date", formData.date);
    if (file) {
      data.append("file", file);
    }

    try {
      if (editingId) {
        await API.put(`/penalties/${editingId}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("تم تعديل العقوبة");
      } else {
        await API.post(`/penalties/${id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("تم إضافة العقوبة");
      }
      closeModal();
      fetchPenalties();
    } catch (error) {
      toast.error("فشل حفظ العقوبة");
    }
  };

  const handleDelete = async (penaltyId) => {
    if (!checkPermission("punishments.delete", user)) {
      toast.error("ليس لديك صلاحية للقيام بهذا الإجراء");
      return;
    }
    if (!window.confirm("هل أنت متأكد من حذف هذه العقوبة؟")) return;
    try {
      await API.delete(`/penalties/${penaltyId}`);
      toast.success("تم حذف العقوبة");
      setPenalties(penalties.filter((p) => p._id !== penaltyId));
    } catch (error) {
      toast.error("فشل حذف العقوبة");
    }
  };

  const openEditModal = (penalty) => {
    setEditingId(penalty._id);
    setFormData({
      type: penalty.type,
      reason: penalty.reason,
      decisionNumber: penalty.decisionNumber || "",
      date: new Date(penalty.date).toISOString().split("T")[0],
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      type: "",
      reason: "",
      decisionNumber: "",
      date: new Date().toISOString().split("T")[0],
    });
    setFile(null);
  };

  const handlePrint = (penalty) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>وثيقة عقوبة - ${employee?.fullName || 'موظف'}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
            body { 
              font-family: 'Tajawal', sans-serif; 
              padding: 40px; 
              color: #1e293b;
              background: #fff;
              line-height: 1.6;
            }
            .gov-header {
              font-size: 14px;
              color: #475569;
              margin-bottom: 30px;
              line-height: 1.8;
            }
            .header { 
              text-align: center; 
              margin-bottom: 50px; 
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
            }
            .doc-title { 
              font-size: 32px; 
              font-weight: 700; 
              color: #0f172a;
              margin: 10px 0;
            }
            .personal-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              background: #f8fafc;
              padding: 25px;
              border-radius: 12px;
              margin-bottom: 40px;
              border: 1px solid #e2e8f0;
            }
            .info-item {
              font-size: 16px;
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
              padding: 30px; 
              border-radius: 15px; 
              background: #fff;
            }
            .row { 
              margin: 20px 0; 
              font-size: 19px; 
              display: flex;
              gap: 15px;
              align-items: flex-start;
            }
            .row strong {
              color: #334155;
              min-width: 140px;
              display: inline-block;
            }
            .footer {
              margin-top: 80px;
              display: flex;
              justify-content: space-between;
              padding: 0 60px;
            }
            .signature-box {
              text-align: center;
            }
            .sig-title {
              font-weight: 700;
              margin-bottom: 50px;
              font-size: 18px;
            }
            @media print {
              body { padding: 0; }
              .personal-info { border: 1px solid #cbd5e1; background: #f8fafc !important; -webkit-print-color-adjust: exact; }
              .header { border-bottom-color: #94a3b8; }
            }
          </style>
        </head>
        <body>
          <div class="gov-header">الجمهورية العربية السورية<br/>الأمانة العامة لمحافظة طرطوس<br/>مديرية الموارد البشرية</div>
          
          <div class="header">
            <h1 class="doc-title">وثيقة عقوبة</h1>
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
            <div class="row"><strong>نوع العقوبة:</strong> <span>${penalty.type}</span></div>
            <div class="row"><strong>السبب:</strong> <span style="white-space: pre-wrap;">${penalty.reason}</span></div>
            ${penalty.decisionNumber ? `<div class="row"><strong>رقم القرار:</strong> <span>${penalty.decisionNumber}</span></div>` : ""}
            <div class="row"><strong>التاريخ:</strong> <span>${new Date(penalty.date).toLocaleDateString("ar-SY")}</span></div>
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
            window.onload = () => { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-100">سجل العقوبات</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition shadow-lg shadow-red-900/20"
        >
          <Plus size={18} /> إضافة عقوبة
        </button>
      </div>

      {loading ? (
        <p className="text-center text-slate-400 py-10">جاري التحميل...</p>
      ) : penalties.length === 0 ? (
        <p className="text-center text-slate-500 py-10 border border-dashed border-slate-700 rounded-xl">لا توجد عقوبات مسجلة.</p>
      ) : (
        <div className="grid gap-4">
          {penalties.map((penalty) => (
            <div
              key={penalty._id}
              className="bg-slate-800/70 border border-slate-700/50 rounded-xl p-5 flex justify-between items-center shadow-lg backdrop-blur-sm hover:border-slate-600/50 transition-all duration-300"
            >
              <div>
                <p className="font-bold text-lg text-rose-500 mb-1">{penalty.type}</p>
                <p className="text-slate-200 text-sm mb-2 leading-relaxed">{penalty.reason}</p>
                {penalty.decisionNumber && (
                  <p className="text-[13px] text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500/50" />
                    رقم القرار: <span className="text-slate-300">{penalty.decisionNumber}</span>
                  </p>
                )}
                <p className="text-[12px] text-slate-500 mt-1 italic">
                  {new Date(penalty.date).toLocaleDateString("ar-SY")}
                </p>
                {penalty.file && (
                  <a
                    href={`${import.meta.env.VITE_API_URL}/${penalty.file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 text-sm font-medium flex items-center gap-2 mt-3 hover:text-blue-300 transition-colors"
                  >
                    <FileText size={14} /> عرض الملف المرفق
                  </a>
                )}
              </div>

              return (
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">سجل العقوبات</h2>
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-red-700"
                  >
                    <Plus size={18} /> إضافة عقوبة
                  </button>
                </div>

                {loading ? (
                  <p className="text-center">جاري التحميل...</p>
                ) : penalties.length === 0 ? (
                  <p className="text-center text-gray-500">لا توجد عقوبات مسجلة.</p>
                ) : (
                  <div className="grid gap-4">
                    {penalties.map((penalty) => (
                      <div
                        key={penalty._id}
                        className="bg-slate-800/70 border border-slate-700/50 rounded-xl p-5 flex justify-between items-center shadow-lg backdrop-blur-sm hover:border-slate-600/50 transition-all duration-300"
                      >
                        <div>
                          <p className="font-bold text-lg text-rose-500 mb-1">{penalty.type}</p>
                          <p className="text-slate-200 text-sm mb-2 leading-relaxed">{penalty.reason}</p>
                          {penalty.decisionNumber && (
                            <p className="text-[13px] text-slate-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500/50" />
                              رقم القرار: <span className="text-slate-300">{penalty.decisionNumber}</span>
                            </p>
                          )}
                          <p className="text-[12px] text-slate-500 mt-1 italic">
                            {new Date(penalty.date).toLocaleDateString("ar-SY")}
                          </p>
                          {penalty.file && (
                            <a
                              href={`${import.meta.env.VITE_API_URL}/${penalty.file}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 text-sm font-medium flex items-center gap-2 mt-3 hover:text-blue-300 transition-colors"
                            >
                              <FileText size={14} /> عرض الملف المرفق
                            </a >
                          )}
                        </div >
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePrint(penalty)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                            title="طباعة"
                          >
                            <Printer size={18} />
                          </button>
                          <button
                            onClick={() => openEditModal(penalty)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="تعديل"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(penalty._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="حذف"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div >
                    ))}
                  </div >
                )}

                {/* Modal */}
                {
                  showModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-bold text-slate-100">
                            {editingId ? "تعديل عقوبة" : "إضافة عقوبة جديدة"}
                          </h3>
                          <button
                            onClick={closeModal}
                            className="text-slate-400 hover:text-slate-100 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-1 text-slate-300">
                              نوع العقوبة
                            </label>
                            <input
                              type="text"
                              value={formData.type}
                              onChange={(e) =>
                                setFormData({ ...formData, type: e.target.value })
                              }
                              className="w-full border border-slate-600 bg-slate-700/50 text-slate-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-slate-400"
                              required
                              placeholder="مثال: تنبيه، إنذار..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 text-slate-300">السبب</label>
                            <textarea
                              value={formData.reason}
                              onChange={(e) =>
                                setFormData({ ...formData, reason: e.target.value })
                              }
                              className="w-full border border-slate-600 bg-slate-700/50 text-slate-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-slate-400"
                              rows="3"
                              required
                            ></textarea>
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
                              className="w-full border border-slate-600 bg-slate-700/50 text-slate-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-slate-400"
                              placeholder="أدخل رقم القرار"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 text-slate-300">
                              التاريخ
                            </label>
                            <input
                              type="date"
                              value={formData.date}
                              onChange={(e) =>
                                setFormData({ ...formData, date: e.target.value })
                              }
                              className="w-full border border-slate-600 bg-slate-700/50 text-slate-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                              className="w-full border border-slate-600 bg-slate-700/50 text-slate-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700"
                            />
                          </div>
                          <div className="flex justify-end gap-2 mt-4">
                            <button
                              type="button"
                              onClick={closeModal}
                              className="px-4 py-2 text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
                            >
                              إلغاء
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            >
                              حفظ
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )
                }
              </div >
              );
}
