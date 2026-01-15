import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import API from "../api/api";
import { Plus, Trash2, RefreshCw, X } from "lucide-react";
import { toast } from "react-hot-toast";

const ARABIC_LABELS = {
  employee_gender: "الجنس",
  employee_nationality: "الجنسية",
  employee_city: "المدينة",
  employee_specialization: "الاختصاص",
  employee_educationLevel: "المستوى التعليمي",
  employee_currentJobTitle: "المسمى الوظيفي الحالي",
  employee_maritalStatus: "الحالة الاجتماعية",
  employee_workLocation: "مكان العمل",
  employee_jobCategory: "الفئة الوظيفية",
  employee_governorate: "المحافظة",
  employee_employmentType: "نوع التوظيف",
  employee_contractType: "نوع العقد",
  employee_status: "الحالة الوظيفية",
  employee_housingType: "نوع السكن",
  employee_healthStatus: "الحالة الصحية",
  employee_bloodType: "زمرة الدم",
  employee_degreeType: "نوع الشهادة",
  document_type: "نوع المستند",
  circular_type: "نوع التعميم",
  penalty_type: "نوع العقوبة",
  reward_type: "نوع المكافأة",
  vacation_type: "نوع الإجازة",
};

export default function DropdownManager() {
  const [dropdowns, setDropdowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDropdown, setEditingDropdown] = useState(null);
  const [newOption, setNewOption] = useState({ label: "", value: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  // ✅ Lock body scroll and scroll to top when modal opens
  useEffect(() => {
    if (showEditModal) {
      document.body.style.overflow = "hidden";
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = "auto";
    }
    return () => (document.body.style.overflow = "auto");
  }, [showEditModal]);

  const fetchDropdowns = async () => {
    try {
      setLoading(true);
      const res = await API.get("/dropdown-options");
      setDropdowns(res.data);
    } catch {
      toast.error("فشل في تحميل القائمات المنسدلة");
    } finally {
      setLoading(false);
    }
  };

  const handleAddOption = async () => {
    if (!newOption.label || !newOption.value) return;

    try {
      setSaving(true);
      const res = await API.post(
        `/dropdown-options/${editingDropdown.dropdownId}/options`,
        newOption
      );
      setEditingDropdown(res.data);
      setNewOption({ label: "", value: "" });
      fetchDropdowns();
    } catch {
      toast.error("فشل في إضافة الخيار");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOption = async (value) => {
    if (!window.confirm("هل أنت متأكد؟")) return;

    try {
      setSaving(true);
      const res = await API.delete(
        `/dropdown-options/${editingDropdown.dropdownId}/options/${value}`
      );
      setEditingDropdown(res.data);
      fetchDropdowns();
    } catch {
      toast.error("فشل في حذف الخيار");
    } finally {
      setSaving(false);
    }
  };

  const getArabicLabel = (d) =>
    ARABIC_LABELS[d.dropdownId] || d.label || d.dropdownId;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-100 mb-8">
          ⚙️ إدارة القوائم المنسدلة
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dropdowns.map((dropdown) => (
            <div
              key={dropdown._id}
              className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col"
            >
              <h3 className="text-lg text-slate-100 font-semibold">
                {getArabicLabel(dropdown)}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                {dropdown.dropdownId}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {dropdown.options?.map((opt, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded"
                  >
                    {opt.label}
                  </span>
                ))}
              </div>

              <button
                onClick={() => {
                  setEditingDropdown(dropdown);
                  setShowEditModal(true);
                }}
                className="mt-auto bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
              >
                إضافة / تعديل
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ================= MODAL ================= */}
      {showEditModal && editingDropdown && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowEditModal(false)}
        >
          <div 
            className="bg-slate-800 w-full max-w-2xl rounded-xl border border-slate-700 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-700">
              <div>
                <h2 className="text-xl text-slate-100 font-bold">
                  {getArabicLabel(editingDropdown)}
                </h2>
                <p className="text-xs text-slate-400">
                  {editingDropdown.dropdownId}
                </p>
              </div>
              <button onClick={() => setShowEditModal(false)}>
                <X className="text-slate-400 hover:text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-3 overflow-y-auto">
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100"
                  placeholder="الاسم"
                  value={newOption.label}
                  onChange={(e) =>
                    setNewOption({ ...newOption, label: e.target.value })
                  }
                />
                <input
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100"
                  placeholder="value"
                  value={newOption.value}
                  onChange={(e) =>
                    setNewOption({
                      ...newOption,
                      value: e.target.value.replace(/\s+/g, "_"),
                    })
                  }
                />
                <button
                  onClick={handleAddOption}
                  disabled={saving}
                  className="bg-emerald-600 px-4 rounded text-white"
                >
                  إضافة
                </button>
              </div>

              {editingDropdown.options?.map((opt, i) => (
                <div
                  key={i}
                  className="flex justify-between bg-slate-700/40 p-3 rounded"
                >
                  <span className="text-slate-100">{opt.label}</span>
                  <button onClick={() => handleDeleteOption(opt.value)}>
                    <Trash2 className="text-red-400 w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700 text-right">
              <button
                onClick={() => setShowEditModal(false)}
                className="bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded text-slate-200"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
