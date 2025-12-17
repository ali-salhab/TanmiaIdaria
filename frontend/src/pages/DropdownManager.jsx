import React, { useEffect, useState } from "react";
import API from "../api/api";
import { Plus, Edit2, Trash2, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";

export default function DropdownManager() {
  const [dropdowns, setDropdowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDropdown, setNewDropdown] = useState({
    dropdownId: "",
    label: "",
    options: [],
  });
  const [newOption, setNewOption] = useState({ label: "", value: "" });

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

  const handleCreateDropdown = async () => {
    if (!newDropdown.dropdownId.trim() || !newDropdown.label.trim()) {
      toast.error("الحقول مطلوبة");
      return;
    }

    try {
      await API.post("/dropdown-options", newDropdown);
      toast.success("تم إنشاء القائمة المنسدلة بنجاح");
      setNewDropdown({ dropdownId: "", label: "", options: [] });
      setShowAddModal(false);
      fetchDropdowns();
    } catch {
      toast.error("فشل في إنشاء القائمة");
    }
  };

  const handleDeleteDropdown = async (id) => {
    if (!window.confirm("هل أنت متأكد من الحذف؟")) return;

    try {
      await API.delete(`/dropdown-options/${id}`);
      toast.success("تم حذف القائمة بنجاح");
      fetchDropdowns();
    } catch {
      toast.error("فشل في حذف القائمة");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-slate-400">جاري التحميل...</div>
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
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            قائمة جديدة
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dropdowns.map((dropdown) => (
            <div
              key={dropdown._id}
              className="bg-slate-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition border border-slate-700"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-100">
                  {dropdown.label}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  المعرف: {dropdown.dropdownId}
                </p>
              </div>

              <div className="mb-4 max-h-40 overflow-y-auto custom-scrollbar">
                <p className="text-sm font-medium text-slate-300 mb-2">
                  الخيارات:
                </p>
                <div className="space-y-1">
                  {dropdown.options && dropdown.options.length > 0 ? (
                    dropdown.options.map((opt, idx) => (
                      <div
                        key={idx}
                        className={`text-sm px-2 py-1 rounded ${
                          opt.visible
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-700 text-slate-500 line-through"
                        }`}
                      >
                        {opt.label}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm">لا توجد خيارات</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-700">
                <button
                  onClick={() => handleResetDropdown(dropdown.dropdownId)}
                  className="flex-1 flex items-center justify-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 px-3 py-2 rounded-lg transition text-sm border border-amber-500/20"
                  title="إعادة تعيين"
                >
                  <RefreshCw className="w-4 h-4" />
                  إعادة تعيين
                </button>
                <button
                  onClick={() => handleDeleteDropdown(dropdown.dropdownId)}
                  className="flex-1 flex items-center justify-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-2 rounded-lg transition text-sm border border-red-500/20"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>

        {dropdowns.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">
              لا توجد قوائم منسدلة حالياً
            </p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-slate-700">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">
              إنشاء قائمة منسدلة جديدة
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  معرف القائمة
                </label>
                <input
                  type="text"
                  value={newDropdown.dropdownId}
                  onChange={(e) =>
                    setNewDropdown({
                      ...newDropdown,
                      dropdownId: e.target.value.replace(/\s+/g, "_"),
                    })
                  }
                  placeholder="مثال: department_list"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  اسم القائمة
                </label>
                <input
                  type="text"
                  value={newDropdown.label}
                  onChange={(e) =>
                    setNewDropdown({ ...newDropdown, label: e.target.value })
                  }
                  placeholder="مثال: الأقسام"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  إضافة خيار جديد
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOption.label}
                    onChange={(e) =>
                      setNewOption({ ...newOption, label: e.target.value })
                    }
                    placeholder="الاسم"
                    className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-500"
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
                    placeholder="القيمة"
                    className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-500"
                  />
                  <button
                    onClick={() => {
                      if (newOption.label && newOption.value) {
                        setNewDropdown({
                          ...newDropdown,
                          options: [
                            ...newDropdown.options,
                            {
                              ...newOption,
                              visible: true,
                              order: newDropdown.options.length,
                            },
                          ],
                        });
                        setNewOption({ label: "", value: "" });
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {newDropdown.options.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    الخيارات المضافة:
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                    {newDropdown.options.map((opt, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-slate-700/50 border border-slate-700 px-3 py-2 rounded"
                      >
                        <span className="text-slate-200">{opt.label}</span>
                        <button
                          onClick={() => {
                            setNewDropdown({
                              ...newDropdown,
                              options: newDropdown.options.filter(
                                (_, i) => i !== idx
                              ),
                            });
                          }}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCreateDropdown}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium"
              >
                إنشاء
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewDropdown({ dropdownId: "", label: "", options: [] });
                  setNewOption({ label: "", value: "" });
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg transition font-medium"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
