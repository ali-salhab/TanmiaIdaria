import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import API from "../api/api";
import { Trash2, Plus, Printer, FileText, X, Edit2 } from "lucide-react";
import toast from "react-hot-toast";
import { checkPermission } from "../utils/permissionHelper";
import { useAuth } from "../hooks/useAuth";

export default function EmployeePenalties() {
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
          <title>طباعة العقوبة</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 20px; text-align: center; }
            .header { margin-bottom: 30px; }
            .content { border: 1px solid #000; padding: 20px; border-radius: 10px; }
            .row { margin: 10px 0; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>وثيقة عقوبة</h1>
          </div>
          <div class="content">
            <div class="row"><strong>نوع العقوبة:</strong> ${penalty.type}</div>
            <div class="row"><strong>السبب:</strong> ${penalty.reason}</div>
            ${
              penalty.decisionNumber
                ? `<div class="row"><strong>رقم القرار:</strong> ${penalty.decisionNumber}</div>`
                : ""
            }
            <div class="row"><strong>التاريخ:</strong> ${new Date(
              penalty.date
            ).toLocaleDateString("ar-SY")}</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

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
              className="bg-white border rounded-lg p-4 flex justify-between items-center shadow-sm"
            >
              <div>
                <p className="font-bold text-lg text-red-600">{penalty.type}</p>
                <p className="text-gray-800">{penalty.reason}</p>
                {penalty.decisionNumber && (
                  <p className="text-sm text-gray-600">
                    رقم القرار: {penalty.decisionNumber}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  {new Date(penalty.date).toLocaleDateString("ar-SY")}
                </p>
                {penalty.file && (
                  <a
                    href={`${import.meta.env.VITE_API_URL}/${penalty.file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm flex items-center gap-1 mt-1 hover:underline"
                  >
                    <FileText size={14} /> عرض الملف المرفق
                  </a>
                )}
              </div>
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
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {editingId ? "تعديل عقوبة" : "إضافة عقوبة جديدة"}
              </h3>
              <button onClick={closeModal}>
                <X className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  نوع العقوبة
                </label>
                <input
                  type="text"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full border rounded p-2"
                  required
                  placeholder="مثال: تنبيه، إنذار..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">السبب</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  className="w-full border rounded p-2"
                  rows="3"
                  required
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
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
                  className="w-full border rounded p-2"
                  placeholder="أدخل رقم القرار"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  التاريخ
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full border rounded p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  المرفقات (سكنر أو ملف)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full border rounded p-2"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
