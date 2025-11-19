import React, { useState, useEffect } from "react";
import { Settings, ChevronUp, ChevronDown, Eye, EyeOff, Plus, Edit2, Trash2, X } from "lucide-react";
import API from "../api/api";

export default function DropdownWithSettings({
  id,
  value,
  onChange,
  options,
  label,
  className = "",
  placeholder = "اختر...",
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [visibleOptions, setVisibleOptions] = useState(options);
  const [optionSettings, setOptionSettings] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOption, setEditingOption] = useState(null);
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [newOptionValue, setNewOptionValue] = useState("");
  const [allOptions, setAllOptions] = useState(options);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const storageKey = `dropdown_settings_${id}`;

  useEffect(() => {
    const fetchDropdownSettings = async () => {
      try {
        const response = await API.get(`/dropdown-options/${id}`);
        const backendSettings = response.data;
        
        if (backendSettings && backendSettings.options) {
          const settings = {};
          const orderedOptions = [];
          
          backendSettings.options.forEach((opt) => {
            settings[opt.value] = opt.visible !== false;
            if (opt.visible !== false) {
              orderedOptions.push(opt);
            }
          });
          
          setOptionSettings(settings);
          setVisibleOptions(orderedOptions);
          setAllOptions(backendSettings.options);
        } else {
          loadLocalSettings();
        }
      } catch {
        loadLocalSettings();
      }
    };

    const loadLocalSettings = () => {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const settings = JSON.parse(saved);
          setOptionSettings(settings);
          setVisibleOptions(
            options.filter((opt) => settings[opt.value] !== false)
          );
        } catch {
          setVisibleOptions(options);
          const initialSettings = {};
          options.forEach((opt) => {
            initialSettings[opt.value] = true;
          });
          setOptionSettings(initialSettings);
        }
      } else {
        setVisibleOptions(options);
        const initialSettings = {};
        options.forEach((opt) => {
          initialSettings[opt.value] = true;
        });
        setOptionSettings(initialSettings);
      }
    };

    fetchDropdownSettings();
  }, [id, options, storageKey]);

  const toggleOption = async (optionValue) => {
    const updated = {
      ...optionSettings,
      [optionValue]: !optionSettings[optionValue],
    };
    setOptionSettings(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setVisibleOptions(
      options.filter((opt) => updated[opt.value] !== false)
    );

    try {
      const updatedOptions = options.map((opt) => ({
        ...opt,
        visible: updated[opt.value] !== false,
      }));
      await API.put(`/dropdown-options/${id}`, { options: updatedOptions });
    } catch (error) {
      console.error("Failed to sync settings to backend:", error);
    }
  };

  const moveOption = async (index, direction) => {
    const newOrder = [...allOptions];
    const swapIndex = direction === "up" ? index - 1 : index + 1;

    if (swapIndex < 0 || swapIndex >= newOrder.length) return;

    [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]];
    setAllOptions(newOrder);

    try {
      const updatedOptions = newOrder.map((opt, idx) => ({
        ...opt,
        order: idx,
      }));
      await API.put(`/dropdown-options/${id}`, { options: updatedOptions });
    } catch (error) {
      console.error("Failed to sync order to backend:", error);
    }
  };

  const resetSettings = async () => {
    const initialSettings = {};
    options.forEach((opt) => {
      initialSettings[opt.value] = true;
    });
    setOptionSettings(initialSettings);
    setVisibleOptions(options);
    localStorage.removeItem(storageKey);
    setShowSettings(false);

    try {
      await API.post(`/dropdown-options/${id}/reset`);
    } catch (error) {
      console.error("Failed to reset settings on backend:", error);
    }
  };

  const addNewOption = async () => {
    if (!newOptionLabel.trim() || !newOptionValue.trim()) {
      setError("الاسم والقيمة مطلوبان");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await API.post(`/dropdown-options/${id}/options`, {
        label: newOptionLabel,
        value: newOptionValue,
      });

      if (response.data && response.data.options) {
        setAllOptions(response.data.options);
        const settings = {};
        const orderedOptions = [];
        response.data.options.forEach((opt) => {
          settings[opt.value] = opt.visible !== false;
          if (opt.visible !== false) {
            orderedOptions.push(opt);
          }
        });
        setOptionSettings(settings);
        setVisibleOptions(orderedOptions);
      }

      setNewOptionLabel("");
      setNewOptionValue("");
      setShowAddModal(false);
    } catch (err) {
      setError(err.response?.data?.message || "فشل إضافة الخيار");
    } finally {
      setLoading(false);
    }
  };

  const editOption = async () => {
    if (!newOptionLabel.trim()) {
      setError("الاسم مطلوب");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await API.put(
        `/dropdown-options/${id}/options/${editingOption.value}`,
        { label: newOptionLabel }
      );

      if (response.data && response.data.options) {
        setAllOptions(response.data.options);
        const settings = {};
        const orderedOptions = [];
        response.data.options.forEach((opt) => {
          settings[opt.value] = opt.visible !== false;
          if (opt.visible !== false) {
            orderedOptions.push(opt);
          }
        });
        setOptionSettings(settings);
        setVisibleOptions(orderedOptions);
      }

      setNewOptionLabel("");
      setEditingOption(null);
      setShowEditModal(false);
    } catch (err) {
      setError(err.response?.data?.message || "فشل تعديل الخيار");
    } finally {
      setLoading(false);
    }
  };

  const deleteOption = async (optionValue) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الخيار؟")) return;

    try {
      const response = await API.delete(
        `/dropdown-options/${id}/options/${optionValue}`
      );

      if (response.data && response.data.options) {
        setAllOptions(response.data.options);
        const settings = {};
        const orderedOptions = [];
        response.data.options.forEach((opt) => {
          settings[opt.value] = opt.visible !== false;
          if (opt.visible !== false) {
            orderedOptions.push(opt);
          }
        });
        setOptionSettings(settings);
        setVisibleOptions(orderedOptions);
      }
    } catch (err) {
      console.error("فشل حذف الخيار:", err);
    }
  };

  return (
    <div className="relative">
      <div className="flex-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <div className="relative group">
          <select
            value={value}
            onChange={onChange}
            className={`w-full border border-gray-300 px-3 py-2 pr-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
          >
            <option value="">{placeholder}</option>
            {visibleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-600 hover:text-blue-600 transition-all duration-200 group-hover:scale-110"
            title="إعدادات القائمة المنسدلة"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-gray-300 rounded-xl shadow-2xl p-4 z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">إعدادات الخيارات</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
            {allOptions.map((opt, idx) => (
              <div
                key={opt.value}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  optionSettings[opt.value]
                    ? "bg-blue-50 border-blue-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <span className="text-sm font-medium text-gray-700 flex-1">
                  {opt.label}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveOption(idx, "up")}
                    disabled={idx === 0}
                    className="p-1 hover:bg-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                    title="تحريك للأعلى"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveOption(idx, "down")}
                    disabled={idx === allOptions.length - 1}
                    className="p-1 hover:bg-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                    title="تحريك للأسفل"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleOption(opt.value)}
                    className="p-1 hover:bg-white rounded transition"
                    title={optionSettings[opt.value] ? "إخفاء" : "إظهار"}
                  >
                    {optionSettings[opt.value] ? (
                      <Eye className="w-4 h-4 text-green-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditingOption(opt);
                      setNewOptionLabel(opt.label);
                      setShowEditModal(true);
                    }}
                    className="p-1 hover:bg-white rounded transition text-blue-600"
                    title="تعديل"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteOption(opt.value)}
                    className="p-1 hover:bg-white rounded transition text-red-600"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setNewOptionLabel("");
                setNewOptionValue("");
                setError("");
                setShowAddModal(true);
              }}
              className="flex-1 px-3 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة خيار
            </button>
            <button
              onClick={resetSettings}
              className="flex-1 px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition font-medium"
            >
              إعادة تعيين
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">إضافة خيار جديد</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setError("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الاسم (الظاهر)
                </label>
                <input
                  type="text"
                  value={newOptionLabel}
                  onChange={(e) => setNewOptionLabel(e.target.value)}
                  placeholder="أدخل اسم الخيار"
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  القيمة (بدون مسافات)
                </label>
                <input
                  type="text"
                  value={newOptionValue}
                  onChange={(e) => setNewOptionValue(e.target.value.replace(/\s+/g, "_"))}
                  placeholder="أدخل قيمة الخيار"
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={addNewOption}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition font-medium"
              >
                {loading ? "جاري الإضافة..." : "إضافة"}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setError("");
                }}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition font-medium"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingOption && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">تعديل الخيار</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingOption(null);
                  setError("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الاسم (الظاهر)
                </label>
                <input
                  type="text"
                  value={newOptionLabel}
                  onChange={(e) => setNewOptionLabel(e.target.value)}
                  placeholder="أدخل اسم الخيار"
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  القيمة (ثابتة)
                </label>
                <input
                  type="text"
                  value={editingOption.value}
                  disabled
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={editOption}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition font-medium"
              >
                {loading ? "جاري التعديل..." : "تعديل"}
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingOption(null);
                  setError("");
                }}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition font-medium"
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
