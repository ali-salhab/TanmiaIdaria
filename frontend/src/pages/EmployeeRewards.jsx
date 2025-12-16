import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import API from "../api/api";
import { Trash2, Plus, Printer, FileText, X } from "lucide-react";
import toast from "react-hot-toast";
import { checkPermission } from "../utils/permissionHelper";
import { useOutletContext } from "react-router-dom";

export default function EmployeeRewards() {
  const { id } = useParams();
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: "material",
    description: "",
    decisionNumber: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  // Get user info from context if available, or fetch it
  // Assuming EmployeeEdit passes context or we can get it from local storage/api
  // For now, we'll assume we can get permissions from a helper or context
  // But EmployeeEdit doesn't pass context to children.
  // We can use a hook or just check localStorage for role/permissions if stored there
  // Or fetch /auth/me again.

  // Simplified permission check (assuming admin or has permission)
  const canAdd = true; // Replace with actual permission check
  const canDelete = true; // Replace with actual permission check

  useEffect(() => {
    fetchRewards();
  }, [id]);

  const fetchRewards = async () => {
    try {
      const res = await API.get(`/rewards/${id}`);
      setRewards(res.data);
    } catch (error) {
      toast.error("فشل تحميل المكافآت");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("type", formData.type);
    data.append("description", formData.description);
    if (formData.decisionNumber)
      data.append("decisionNumber", formData.decisionNumber);
    data.append("date", formData.date);
    if (file) {
      data.append("file", file);
    }

    try {
      await API.post(`/rewards/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("تم إضافة المكافأة");
      setShowModal(false);
      setFormData({
        type: "material",
        description: "",
        decisionNumber: "",
        date: new Date().toISOString().split("T")[0],
      });
      setFile(null);
      fetchRewards();
    } catch (error) {
      toast.error("فشل إضافة المكافأة");
    }
  };

  const handleDelete = async (rewardId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه المكافأة؟")) return;
    try {
      await API.delete(`/rewards/${rewardId}`);
      toast.success("تم حذف المكافأة");
      setRewards(rewards.filter((r) => r._id !== rewardId));
    } catch (error) {
      toast.error("فشل حذف المكافأة");
    }
  };

  const handlePrint = (reward) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>طباعة المكافأة</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 20px; text-align: center; }
            .header { margin-bottom: 30px; }
            .content { border: 1px solid #000; padding: 20px; border-radius: 10px; }
            .row { margin: 10px 0; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>وثيقة مكافأة</h1>
          </div>
          <div class="content">
            <div class="row"><strong>نوع المكافأة:</strong> ${getRewardLabel(
              reward.type
            )}</div>
            ${
              reward.decisionNumber
                ? `<div class="row"><strong>رقم القرار:</strong> ${reward.decisionNumber}</div>`
                : ""
            }
            <div class="row"><strong>التاريخ:</strong> ${new Date(
              reward.date
            ).toLocaleDateString("ar-SY")}</div>
            <div class="row"><strong>التفاصيل:</strong> ${
              reward.description || "-"
            }</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getRewardLabel = (type) => {
    const types = {
      material: "مادية",
      thank_you_card: "بطاقة شكر",
      financial_thank_you: "مالية + بطاقة شكر",
    };
    return types[type] || type;
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">سجل المكافآت</h2>
        {canAdd && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-700"
          >
            <Plus size={18} /> إضافة مكافأة
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-center">جاري التحميل...</p>
      ) : rewards.length === 0 ? (
        <p className="text-center text-gray-500">لا توجد مكافآت مسجلة.</p>
      ) : (
        <div className="grid gap-4">
          {rewards.map((reward) => (
            <div
              key={reward._id}
              className="bg-white border rounded-lg p-4 flex justify-between items-center shadow-sm"
            >
              <div>
                <p className="font-bold text-lg">
                  {getRewardLabel(reward.type)}
                </p>
                <p className="text-gray-600">{reward.description}</p>
                {reward.decisionNumber && (
                  <p className="text-sm text-gray-600">
                    رقم القرار: {reward.decisionNumber}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  {new Date(reward.date).toLocaleDateString("ar-SY")}
                </p>
                {reward.file && (
                  <a
                    href={`${import.meta.env.VITE_API_URL}/${reward.file}`}
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
                  onClick={() => handlePrint(reward)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                  title="طباعة"
                >
                  <Printer size={18} />
                </button>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(reward._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="حذف"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
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
              <h3 className="text-xl font-bold">إضافة مكافأة جديدة</h3>
              <button onClick={() => setShowModal(false)}>
                <X className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="block text-sm font-medium mb-1">النوع</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full border rounded p-2"
                >
                  <option value="material">مادية</option>
                  <option value="thank_you_card">بطاقة شكر</option>
                  <option value="financial_thank_you">مالية + بطاقة شكر</option>
                </select>
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
                  التفاصيل
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full border rounded p-2"
                  rows="3"
                ></textarea>
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
                  onClick={() => setShowModal(false)}
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
