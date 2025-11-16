import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import API from "../api/api";

export default function HomepageBuilder() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const availableWidgets = [
    { id: "employees", label: "الموظفين", defaultColor: "from-green-400 to-emerald-500" },
    { id: "vacations", label: "الإجازات", defaultColor: "from-blue-400 to-sky-500" },
    { id: "incidents", label: "الحوادث", defaultColor: "from-red-400 to-rose-500" },
    { id: "documents", label: "الوثائق", defaultColor: "from-purple-400 to-violet-500" },
    { id: "salary", label: "الرواتب", defaultColor: "from-orange-400 to-amber-500" },
    { id: "rewards", label: "المكافآت", defaultColor: "from-pink-400 to-red-500" },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await API.get("/users");
      setUsers(res.data);
    } catch {
      toast.error("❌ فشل في تحميل المستخدمين");
    }
  };

  const fetchSettings = async (userId) => {
    try {
      setLoading(true);
      const res = await API.get(`/homepage/${userId}`);
      setSettings(res.data);
    } catch (err) {
      const defaultSettings = {
        userId,
        widgets: availableWidgets.map((w, idx) => ({
          id: w.id,
          type: w.id,
          label: w.label,
          order: idx,
          enabled: true,
          color: w.defaultColor,
        })),
        layout: "grid",
        columns: 3,
      };
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (userId) => {
    setSelectedUser(userId);
    fetchSettings(userId);
  };

  const toggleWidget = (widgetId) => {
    if (!settings) return;
    setSettings((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) =>
        w.id === widgetId ? { ...w, enabled: !w.enabled } : w
      ),
    }));
  };

  const changeWidgetOrder = (widgetId, direction) => {
    if (!settings) return;
    const currentIndex = settings.widgets.findIndex((w) => w.id === widgetId);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === settings.widgets.length - 1)
    )
      return;

    const newWidgets = [...settings.widgets];
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    [newWidgets[currentIndex], newWidgets[swapIndex]] = [
      newWidgets[swapIndex],
      newWidgets[currentIndex],
    ];

    newWidgets.forEach((w, idx) => (w.order = idx));
    setSettings((prev) => ({ ...prev, widgets: newWidgets }));
  };

  const updateLayout = (newLayout) => {
    if (!settings) return;
    setSettings((prev) => ({ ...prev, layout: newLayout }));
  };

  const updateColumns = (newColumns) => {
    if (!settings) return;
    setSettings((prev) => ({ ...prev, columns: newColumns }));
  };

  const saveSettings = async () => {
    if (!selectedUser || !settings) return;

    try {
      setSaving(true);
      await API.put(`/homepage/${selectedUser}`, {
        widgets: settings.widgets,
        layout: settings.layout,
        columns: settings.columns,
      });
      toast.success("✅ تم حفظ الإعدادات بنجاح!");
    } catch {
      toast.error("❌ فشل في حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100 p-6">
      <h2 className="text-3xl font-semibold text-gray-800 mb-6">
        🎨 أداة تخصيص الصفحة الرئيسية
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Users List */}
        <div className="bg-white rounded-2xl shadow p-6 lg:col-span-1">
          <h3 className="text-lg font-medium mb-4 text-gray-700">المستخدمون</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {users.map((user) => (
              <button
                key={user._id}
                onClick={() => handleUserSelect(user._id)}
                className={`w-full text-right p-3 rounded-lg transition ${
                  selectedUser === user._id
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <div className="font-medium">{user.username}</div>
                <div className="text-xs opacity-75">{user.role}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Settings Panel */}
        <div className="bg-white rounded-2xl shadow p-6 lg:col-span-3">
          {selectedUser && settings ? (
            <>
              <div className="space-y-6">
                {/* Layout Settings */}
                <div>
                  <h4 className="font-medium mb-3 text-gray-700">إعدادات التخطيط</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">نوع التخطيط</label>
                      <select
                        value={settings.layout}
                        onChange={(e) => updateLayout(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                      >
                        <option value="grid">شبكة (Grid)</option>
                        <option value="list">قائمة (List)</option>
                      </select>
                    </div>

                    {settings.layout === "grid" && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">
                          عدد الأعمدة
                        </label>
                        <select
                          value={settings.columns}
                          onChange={(e) => updateColumns(parseInt(e.target.value))}
                          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                        >
                          <option value={1}>1 عمود</option>
                          <option value={2}>عمودين</option>
                          <option value={3}>3 أعمدة</option>
                          <option value={4}>4 أعمدة</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Widgets Management */}
                <div>
                  <h4 className="font-medium mb-3 text-gray-700">إدارة الأداوات</h4>
                  <div className="space-y-2">
                    {settings.widgets.map((widget, idx) => (
                      <div
                        key={widget.id}
                        className={`flex items-center justify-between p-4 rounded-lg border-2 transition ${
                          widget.enabled
                            ? "border-green-300 bg-green-50"
                            : "border-gray-300 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={widget.enabled}
                            onChange={() => toggleWidget(widget.id)}
                            className="w-5 h-5 accent-blue-600"
                          />
                          <span className="font-medium text-gray-700">{widget.label}</span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => changeWidgetOrder(widget.id, "up")}
                            disabled={idx === 0}
                            className="px-2 py-1 text-sm bg-blue-500 text-white rounded disabled:opacity-50"
                          >
                            ⬆️
                          </button>
                          <button
                            onClick={() => changeWidgetOrder(widget.id, "down")}
                            disabled={idx === settings.widgets.length - 1}
                            className="px-2 py-1 text-sm bg-blue-500 text-white rounded disabled:opacity-50"
                          >
                            ⬇️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition disabled:opacity-50"
                >
                  {saving ? "جاري الحفظ..." : "💾 حفظ الإعدادات"}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              اختر مستخدماً لتخصيص صفحته الرئيسية
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
