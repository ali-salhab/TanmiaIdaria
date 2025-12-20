// src/pages/PermissionsPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import API from "../../api/api";
import { toast } from "react-hot-toast";

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newPerm, setNewPerm] = useState({
    key: "",
    label: "",
    description: "",
    category: "view",
  });

  const groupedPermissions = useMemo(() => {
    const groups = {};
    permissions.forEach((p) => {
      const cat = p.category || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return groups;
  }, [permissions]);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const res = await API.get("/permissions");
      setPermissions(res.data || []);
    } catch (err) {
      console.error("loadPermissions error:", err);
      toast.error("فشل في جلب الصلاحيات");
    } finally {
      setLoading(false);
    }
  };

  const createPermission = async () => {
    if (!newPerm.key.trim() || !newPerm.label.trim()) {
      toast.error("الرجاء إدخال المفتاح والتسمية");
      return;
    }
    try {
      await API.post("/permissions", newPerm);
      toast.success("✅ تم إنشاء الصلاحية");
      setNewPerm({ key: "", label: "", description: "", category: "view" });
      loadPermissions();
    } catch (err) {
      console.error("createPermission error:", err);
      const msg = err.response?.data?.message || "فشل في إنشاء الصلاحية";
      toast.error(msg);
    }
  };

  const rebuildPermissions = async () => {
    if (
      !window.confirm(
        "هل أنت متأكد من إعادة بناء جميع الصلاحيات؟ سيتم تحديث المسميات والوصف للغة العربية."
      )
    )
      return;
    try {
      const res = await API.post("/permissions/rebuild");
      toast.success(res.data.message);
      loadPermissions();
    } catch (err) {
      console.error("rebuildPermissions error:", err);
      toast.error("❌ فشل في إعادة بناء الصلاحيات");
    }
  };

  return (
    <div
      className="p-6 min-h-screen bg-slate-900 text-slate-100 font-custom"
      dir="rtl"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-slate-100">
          📋 إدارة الصلاحيات
        </h2>
        <button
          onClick={rebuildPermissions}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-lg shadow-emerald-900/20 flex items-center gap-2"
        >
          🔄 إعادة بناء الصلاحيات (عربي)
        </button>
      </div>

      <div className="bg-slate-800 p-4 rounded shadow mb-6 border border-slate-700">
        <h3 className="font-medium mb-2 text-slate-200">
          ➕ إضافة صلاحية جديدة
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            placeholder="key (مثال: employees.view)"
            value={newPerm.key}
            onChange={(e) => setNewPerm({ ...newPerm, key: e.target.value })}
            className="border border-slate-600 bg-slate-700 text-slate-100 px-2 py-2 rounded placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            placeholder="label (مثال: عرض الموظفين)"
            value={newPerm.label}
            onChange={(e) => setNewPerm({ ...newPerm, label: e.target.value })}
            className="border border-slate-600 bg-slate-700 text-slate-100 px-2 py-2 rounded placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            placeholder="description (اختياري)"
            value={newPerm.description}
            onChange={(e) =>
              setNewPerm({ ...newPerm, description: e.target.value })
            }
            className="border border-slate-600 bg-slate-700 text-slate-100 px-2 py-2 rounded placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={newPerm.category}
            onChange={(e) =>
              setNewPerm({ ...newPerm, category: e.target.value })
            }
            className="border border-slate-600 bg-slate-700 text-slate-100 px-2 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="view">view</option>
            <option value="create">create</option>
            <option value="edit">edit</option>
            <option value="delete">delete</option>
            <option value="manage">manage</option>
            <option value="admin">admin</option>
          </select>
        </div>
        <div className="mt-3">
          <button
            onClick={createPermission}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
          >
            إضافة
          </button>
        </div>
      </div>

      <div className="bg-slate-800 p-4 rounded shadow border border-slate-700">
        <h3 className="font-medium mb-2 text-slate-200">📌 جميع الصلاحيات</h3>
        {loading ? (
          <div className="text-slate-400">جاري التحميل...</div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([category, perms]) => (
              <div key={category}>
                <h4 className="text-lg font-bold text-slate-300 mb-3 capitalize border-b border-slate-600 pb-2">
                  {category}
                </h4>
                <div className="grid gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {perms.map((p) => (
                    <div
                      key={p._id}
                      className="flex flex-col justify-between border border-slate-600 rounded px-3 py-2 bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-slate-200">
                          {p.label}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-1">
                          {p.key}
                        </div>
                      </div>
                      <div className="text-sm text-slate-400 mt-2 border-t border-slate-600/50 pt-2">
                        {p.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {permissions.length === 0 && (
              <div className="text-slate-500">لا توجد صلاحيات</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
