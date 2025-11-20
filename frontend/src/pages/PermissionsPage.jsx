// src/pages/PermissionsPage.jsx
import React, { useEffect, useState } from "react";
import API from "../api/api";
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

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">📋 إدارة الصلاحيات</h2>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="font-medium mb-2">➕ إضافة صلاحية جديدة</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            placeholder="key (مثال: employees.view)"
            value={newPerm.key}
            onChange={(e) => setNewPerm({ ...newPerm, key: e.target.value })}
            className="border px-2 py-2 rounded"
          />
          <input
            placeholder="label (مثال: عرض الموظفين)"
            value={newPerm.label}
            onChange={(e) => setNewPerm({ ...newPerm, label: e.target.value })}
            className="border px-2 py-2 rounded"
          />
          <input
            placeholder="description (اختياري)"
            value={newPerm.description}
            onChange={(e) =>
              setNewPerm({ ...newPerm, description: e.target.value })
            }
            className="border px-2 py-2 rounded"
          />
          <select
            value={newPerm.category}
            onChange={(e) =>
              setNewPerm({ ...newPerm, category: e.target.value })
            }
            className="border px-2 py-2 rounded"
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
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            إضافة
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-medium mb-2">📌 جميع الصلاحيات</h3>
        {loading ? (
          <div>جاري التحميل...</div>
        ) : (
          <div className="grid gap-2">
            {permissions.map((p) => (
              <div
                key={p._id}
                className="flex items-center justify-between border rounded px-3 py-2"
              >
                <div>
                  <div className="font-medium">{p.label}</div>
                  <div className="text-xs text-gray-500">
                    {p.key} • {p.category}
                  </div>
                </div>
                <div className="text-sm text-gray-500">{p.description}</div>
              </div>
            ))}
            {permissions.length === 0 && (
              <div className="text-gray-500">لا توجد صلاحيات</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
