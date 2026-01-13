import React, { useEffect, useState } from "react";
import API from "../api/api";
import { Plus, Edit2, Trash2, RefreshCw, X, Check } from "lucide-react";
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
    if (!newOption.label.trim() || !newOption.value.trim()) {
      toast.error("يرجى إدخال الاسم والقيمة");
      return;
    }

    try {
      setSaving(true);
      const res = await API.post(
        `/dropdown-options/${editingDropdown.dropdownId}/options`,
        newOption
      );
      setEditingDropdown(res.data);
      setNewOption({ label: "", value: "" });
      toast.success("تم إضافة الخيار بنجاح");
      fetchDropdowns();
    } catch (err) {
      toast.error(err.response?.data?.message || "فشل في إضافة الخيار");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOption = async (optionValue) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الخيار؟")) return;

    try {
      setSaving(true);
      const res = await API.delete(
        `/dropdown-options/${editingDropdown.dropdownId}/options/${optionValue}`
      );
      setEditingDropdown(res.data);
      toast.success("تم حذف الخيار بنجاح");
      fetchDropdowns();
    } catch (err) {
      toast.error(err.response?.data?.message || "فشل في حذف الخيار");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDropdown = async (id) => {
    if (!window.confirm("هل تريد إعادة تعيين الخيارات إلى الافتراضية؟")) return;

    try {
      await API.post(`/dropdown-options/${id}/reset`);
      toast.success("تم إعادة تعيين الخيارات");
      fetchDropdowns();
    } catch {
      toast.error("فشل في إعادة التعيين");
    }
  };

  const getArabicLabel = (dropdown) => {
    return (
      ARABIC_LABELS[dropdown.dropdownId] ||
      dropdown.label ||
      dropdown.dropdownId
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-slate-400 animate-pulse">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-100">
            ⚙️ إدارة القوائم المنسدلة
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dropdowns.map((dropdown) => (
            <div
              key={dropdown._id}
              className="bg-slate-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition border border-slate-700 flex flex-col"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-100">
                  {getArabicLabel(dropdown)}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  {dropdown.dropdownId}
                </p>
              </div>

              <div className="mb-4 flex-1 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                <div className="flex flex-wrap gap-2">
                  {dropdown.options && dropdown.options.length > 0 ? (
                    dropdown.options.map((opt, idx) => (
                      <div
                        key={idx}
                        className={`text-xs px-2 py-1 rounded-md border ${
                          opt.visible
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-slate-700 text-slate-500 border-slate-600 line-through"
                        }`}
                      >
                        {opt.label}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm italic">
                      لا توجد خيارات
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-700 mt-auto">
                <button
                  onClick={() => {
                    setEditingDropdown(dropdown);
                    setShowEditModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  إضافة خيارات
                </button>
                <button
                  onClick={() => handleResetDropdown(dropdown.dropdownId)}
                  className="flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded-lg transition text-sm border border-slate-600"
                  title="إعادة تعيين"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {dropdowns.length === 0 && (
          <div className="text-center py-20 bg-slate-800/50 rounded-3xl border border-dashed border-slate-700">
            <p className="text-slate-500 text-lg">
              لا توجد قوائم منسدلة حالياً
            </p>
          </div>
        )}
      </div>

      {showEditModal && editingDropdown && (
        <div className="fixed  inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-2xl border border-slate-700 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-100">
                  تعديل خيارات: {getArabicLabel(editingDropdown)}
                </h3>
                <p className="text-sm text-slate-400 font-mono">
                  {editingDropdown.dropdownId}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDropdown(null);
                  setNewOption({ label: "", value: "" });
                }}
                className="text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-full transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                إضافة خيار جديد
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={newOption.label}
                  onChange={(e) =>
                    setNewOption({ ...newOption, label: e.target.value })
                  }
                  placeholder="الاسم المعروض (مثال: دمشق)"
                  className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-600"
                />
                <input
                  type="text"
                  value={newOption.value}
                  onChange={(e) =>
                    setNewOption({
                      ...newOption,
                      value: e.target.value.replace(/\s+/g, "_"),
                    })
                  }
                  placeholder="القيمة البرمجية (مثال: damascus)"
                  className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-600"
                />
                <button
                  onClick={handleAddOption}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                  <span>إضافة</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              <h4 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">
                الخيارات الحالية ({editingDropdown.options?.length || 0})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {editingDropdown.options?.map((opt, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-700/30 border border-slate-700 px-4 py-3 rounded-xl group hover:border-slate-500 transition"
                  >
                    <div className="flex flex-col">
                      <span className="text-slate-100 font-medium">
                        {opt.label}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {opt.value}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteOption(opt.value)}
                      disabled={saving}
                      className="text-slate-500 hover:text-red-400 p-2 hover:bg-red-400/10 rounded-lg transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title="حذف الخيار"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              {(!editingDropdown.options ||
                editingDropdown.options.length === 0) && (
                <div className="text-center py-10 text-slate-500 italic">
                  لا توجد خيارات مضافة بعد
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDropdown(null);
                }}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-8 py-2.5 rounded-xl transition font-medium"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
