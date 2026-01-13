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
      console.log("--------- permisipns");
      console.log(permissions);
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
      // setNewPerm({ key: "", label: "", description: "", category: "view" });
      loadPermissions();
    } catch (err) {
      console.error("createPermission error:", err);
      const msg = err.response?.data?.message || "فشل في إنشاء الصلاحية";
      toast.error(msg);
    }
  };

  // const rebuildPermissions = async () => {
  //   if (
  //     !window.confirm(
  //       "هل أنت متأكد من إعادة بناء جميع الصلاحيات؟ سيتم تحديث المسميات والوصف للغة العربية."
  //     )
  //   )
  //     return;
  //   try {
  //     const res = await API.post("/permissions/rebuild");
  //     toast.success(res.data.message);
  //     loadPermissions();
  //   } catch (err) {
  //     console.error("rebuildPermissions error:", err);
  //     toast.error("❌ فشل في إعادة بناء الصلاحيات");
  //   }
  // };

  return (
    <div
      className="p-6 min-h-screen bg-slate-900 text-slate-100 font-custom"
      dir="rtl"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-slate-100">
          📋 إدارة الصلاحيات
        </h2>
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
