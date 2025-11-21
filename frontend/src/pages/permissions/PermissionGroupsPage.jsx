// src/pages/PermissionGroupsPage.jsx
import React, { useEffect, useState } from "react";
import API from "../../api/api";
import { toast } from "react-hot-toast";

export default function PermissionGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [editingGroupPermissions, setEditingGroupPermissions] = useState([]);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [gRes, pRes] = await Promise.all([
        API.get("/permissions/groups"),
        API.get("/permissions"),
      ]);
      setGroups(gRes.data || []);
      setAllPermissions(pRes.data || []);
    } catch (err) {
      console.error("loadAll error:", err);
      toast.error("فشل في تحميل المجموعات أو الصلاحيات");
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error("الرجاء إدخال اسم المجموعة");
      return;
    }
    try {
      await API.post("/permissions/groups", { name: newGroupName });
      toast.success("✅ تم إنشاء المجموعة");
      setNewGroupName("");
      loadAll();
    } catch (err) {
      console.error("createGroup error:", err);
      toast.error(err.response?.data?.message || "فشل في إنشاء المجموعة");
    }
  };

  const startEdit = (group) => {
    setEditingGroupId(group._id);
    setEditingGroupName(group.name);
    setEditingGroupPermissions(
      (group.permissions || []).map((p) => (p._id ? p._id : p))
    );
  };

  const cancelEdit = () => {
    setEditingGroupId(null);
    setEditingGroupName("");
    setEditingGroupPermissions([]);
  };

  const saveEdit = async () => {
    if (!editingGroupName.trim()) {
      toast.error("اسم المجموعة مطلوب");
      return;
    }
    try {
      await API.put(`/permissions/groups/${editingGroupId}`, {
        name: editingGroupName,
        permissions: editingGroupPermissions,
      });
      toast.success("✅ تم حفظ التعديلات");
      cancelEdit();
      loadAll();
    } catch (err) {
      console.error("saveEdit error:", err);
      toast.error("فشل في حفظ تعديلات المجموعة");
    }
  };

  const deleteGroup = async (groupId) => {
    if (!window.confirm("متأكد من حذف المجموعة؟")) return;
    try {
      await API.delete(`/permissions/groups/${groupId}`);
      toast.success("✅ تم حذف المجموعة");
      loadAll();
    } catch (err) {
      console.error("deleteGroup error:", err);
      toast.error("فشل في حذف المجموعة");
    }
  };

  const removeMember = async (groupId, userId) => {
    try {
      await API.post("/permissions/groups/remove-user", { groupId, userId });
      toast.success("✅ تمت إزالة المستخدم من المجموعة");
      loadAll();
    } catch (err) {
      console.error("removeMember error:", err);
      toast.error("فشل في إزالة المستخدم من المجموعة");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">
        🔐 إدارة مجموعات الصلاحيات
      </h2>

      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="flex gap-2">
          <input
            placeholder="اسم المجموعة"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            className="flex-1 border px-2 py-2 rounded"
          />
          <button
            onClick={createGroup}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            إنشاء
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {groups.map((g) => (
          <div key={g._id} className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{g.name}</div>
                <div className="text-xs text-gray-500">
                  {g.permissions?.length || 0} صلاحيات
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(g)}
                  className="px-2 py-1 bg-blue-600 text-white rounded text-sm"
                >
                  تعديل
                </button>
                <button
                  onClick={() => deleteGroup(g._id)}
                  className="px-2 py-1 bg-red-600 text-white rounded text-sm"
                >
                  حذف
                </button>
              </div>
            </div>

            {/* Members */}
            <div className="mt-3">
              <div className="text-sm font-semibold mb-1">الأعضاء</div>
              <div className="text-xs text-gray-500">
                {g.members && g.members.length > 0 ? (
                  <div className="space-y-2">
                    {g.members.map((m) => (
                      <div
                        key={m._id}
                        className="flex justify-between items-center bg-gray-50 p-2 rounded"
                      >
                        <div>
                          {m.username} {m.role ? `(${m.role})` : ""}
                        </div>
                        <button
                          onClick={() => removeMember(g._id, m._id)}
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                        >
                          إزالة
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400">لا يوجد أعضاء</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Editor modal / area */}
      {editingGroupId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black opacity-40"></div>
          <div className="relative bg-white w-full max-w-2xl p-6 rounded shadow z-10">
            <h3 className="text-lg font-semibold mb-3">تعديل المجموعة</h3>
            <input
              value={editingGroupName}
              onChange={(e) => setEditingGroupName(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-3"
            />
            <div className="max-h-72 overflow-auto border rounded p-2 mb-3">
              {allPermissions.map((p) => {
                const checked = editingGroupPermissions.includes(p._id);
                return (
                  <label key={p._id} className="flex items-center gap-2 p-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditingGroupPermissions((prev) => [
                            ...prev,
                            p._id,
                          ]);
                        } else {
                          setEditingGroupPermissions((prev) =>
                            prev.filter((id) => id !== p._id)
                          );
                        }
                      }}
                    />
                    <div>
                      <div className="font-medium">{p.label}</div>
                      <div className="text-xs text-gray-500">
                        {p.key} • {p.category}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                إلغاء
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
