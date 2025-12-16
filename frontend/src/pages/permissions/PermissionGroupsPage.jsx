// src/pages/PermissionGroupsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import API from "../../api/api";
import { toast } from "react-hot-toast";

export default function PermissionGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);

  // User-centric management
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserDirectIds, setSelectedUserDirectIds] = useState([]);
  const [groupToAdd, setGroupToAdd] = useState("");

  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [editingGroupPermissions, setEditingGroupPermissions] = useState([]);

  useEffect(() => {
    loadAll();
    loadUsers();
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

  const loadUsers = async () => {
    try {
      const res = await API.get("/users");
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("loadUsers error:", err);
      toast.error("فشل في تحميل المستخدمين");
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      u.username?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.employeeId?.fullName?.toLowerCase().includes(q)
    );
  });

  const selectUser = async (user) => {
    await refreshSelectedUser(user._id, user);
  };

  const refreshSelectedUser = async (userId, fallbackUser = null) => {
    setSelectedUser(fallbackUser || selectedUser);
    setSelectedUserDirectIds([]);
    try {
      const [usersRes, permRes] = await Promise.all([
        API.get("/users"),
        API.get(`/permissions/user/${userId}/permissions`),
      ]);

      const userList = Array.isArray(usersRes.data) ? usersRes.data : [];
      setUsers(userList);
      const foundUser = userList.find((u) => u._id === userId);
      if (foundUser) {
        setSelectedUser(foundUser);
      }

      const directIds =
        (permRes.data.user?.directPermissions || []).map((p) =>
          typeof p === "string" ? p : p._id
        ) || [];
      setSelectedUserDirectIds(directIds);
    } catch (err) {
      console.error("refreshSelectedUser error:", err);
      toast.error("فشل في تحميل بيانات المستخدم");
    }
  };

  const toggleUserDirectPermission = async (permId) => {
    if (!selectedUser?._id) {
      toast.error("اختر مستخدماً أولاً");
      return;
    }
    const has = selectedUserDirectIds.includes(permId);
    const updated = has
      ? selectedUserDirectIds.filter((id) => id !== permId)
      : [...selectedUserDirectIds, permId];
    try {
      await API.put(`/permissions/users/${selectedUser._id}/permissions`, {
        directPermissions: updated,
      });
      setSelectedUserDirectIds(updated);
      toast.success("✅ تم تحديث الصلاحيات المباشرة");
    } catch (err) {
      console.error("toggleUserDirectPermission error:", err);
      toast.error("فشل في تحديث الصلاحيات المباشرة");
    }
  };

  const addUserToGroup = async () => {
    if (!selectedUser?._id) {
      toast.error("اختر مستخدماً أولاً");
      return;
    }
    if (!groupToAdd) {
      toast.error("اختر مجموعة");
      return;
    }
    try {
      await API.post("/permissions/groups/add-user", {
        groupId: groupToAdd,
        userId: selectedUser._id,
      });
      toast.success("✅ تمت إضافة المستخدم للمجموعة");
      setGroupToAdd("");
      await refreshSelectedUser(selectedUser._id);
    } catch (err) {
      console.error("addUserToGroup error:", err);
      toast.error("فشل في إضافة المستخدم للمجموعة");
    }
  };

  const removeUserGroup = async (groupId) => {
    if (!selectedUser?._id) return;
    try {
      await API.post("/permissions/groups/remove-user", {
        groupId,
        userId: selectedUser._id,
      });
      toast.success("✅ تمت إزالة المستخدم من المجموعة");
      await refreshSelectedUser(selectedUser._id);
    } catch (err) {
      console.error("removeUserGroup error:", err);
      toast.error("فشل في إزالة المستخدم من المجموعة");
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

  const selectedUserGroupDetails = useMemo(() => {
    if (!selectedUser) return [];
    return (selectedUser.permissionGroups || [])
      .map((g) => groups.find((gr) => gr._id === (g._id || g)) || g)
      .filter(Boolean);
  }, [selectedUser, groups]);

  const effectivePermissions = useMemo(() => {
    const acc = new Map();

    const addPerm = (perm, sourceLabel) => {
      if (!perm?._id) return;
      const existing = acc.get(perm._id);
      if (existing) {
        if (!existing.sources.includes(sourceLabel)) {
          existing.sources.push(sourceLabel);
        }
        return;
      }
      acc.set(perm._id, {
        ...perm,
        sources: [sourceLabel],
      });
    };

    selectedUserDirectIds.forEach((pid) => {
      const perm = allPermissions.find((p) => p._id === pid);
      addPerm(perm, "مباشر");
    });

    selectedUserGroupDetails.forEach((group) => {
      (group.permissions || []).forEach((pid) => {
        const perm = allPermissions.find((p) => p._id === (pid._id || pid));
        addPerm(perm, `مجموعة: ${group.name || group}`);
      });
    });

    return Array.from(acc.values());
  }, [selectedUserDirectIds, selectedUserGroupDetails, allPermissions]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">
        🔐 إدارة مجموعات الصلاحيات
      </h2>

      {/* Users list: view & manage groups/permissions */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-medium mb-3">👥 المستخدمون</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-2"
              placeholder="ابحث باسم المستخدم أو الدور..."
            />
            <div className="border rounded max-h-72 overflow-auto">
              {filteredUsers.map((u) => (
                <button
                  key={u._id}
                  type="button"
                  onClick={() => selectUser(u)}
                  className={`w-full text-right px-3 py-2 border-b last:border-b-0 hover:bg-gray-50 ${
                    selectedUser?._id === u._id ? "bg-teal-50" : ""
                  }`}
                >
                  <div className="font-medium">{u.username}</div>
                  <div className="text-xs text-gray-500">{u.role}</div>
                </button>
              ))}
              {filteredUsers.length === 0 && (
                <div className="p-3 text-sm text-gray-500">
                  لا يوجد مستخدمون
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {selectedUser ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="font-semibold text-gray-800">
                    المستخدم: {selectedUser.username} ({selectedUser.role})
                  </div>
                  {selectedUser.employeeId?.fullName && (
                    <div className="text-sm text-gray-600">
                      الموظف: {selectedUser.employeeId.fullName}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="border rounded p-3 bg-gray-50">
                    <div className="text-xs text-gray-500">المجموعات</div>
                    <div className="text-xl font-semibold">
                      {selectedUserGroupDetails.length}
                    </div>
                  </div>
                  <div className="border rounded p-3 bg-gray-50">
                    <div className="text-xs text-gray-500">صلاحيات مباشرة</div>
                    <div className="text-xl font-semibold">
                      {selectedUserDirectIds.length}
                    </div>
                  </div>
                  <div className="border rounded p-3 bg-gray-50">
                    <div className="text-xs text-gray-500">
                      الصلاحيات الفعالة
                    </div>
                    <div className="text-xl font-semibold">
                      {effectivePermissions.length}
                    </div>
                  </div>
                </div>

                <div className="border rounded p-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="font-semibold">المجموعات</div>
                    <select
                      value={groupToAdd}
                      onChange={(e) => setGroupToAdd(e.target.value)}
                      className="border px-2 py-1 rounded"
                    >
                      <option value="">اختر مجموعة...</option>
                      {groups.map((g) => (
                        <option key={g._id} value={g._id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addUserToGroup}
                      className="px-3 py-1 bg-teal-600 text-white rounded"
                    >
                      إضافة للمجموعة
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedUserGroupDetails.length ? (
                      selectedUserGroupDetails.map((g) => (
                        <span
                          key={g._id || g}
                          className="inline-flex items-center gap-2 bg-gray-100 border rounded px-2 py-1 text-sm"
                        >
                          <span className="font-medium">{g.name || g}</span>
                          <span className="text-[11px] text-gray-500">
                            {g.permissions?.length || 0} صلاحية
                          </span>
                          <button
                            type="button"
                            onClick={() => removeUserGroup(g._id || g)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ✕
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">لا مجموعات</span>
                    )}
                  </div>
                </div>

                <div className="border rounded p-3">
                  <div className="font-semibold mb-2">الصلاحيات المباشرة</div>
                  <div className="max-h-64 overflow-auto border rounded">
                    {allPermissions.map((p) => {
                      const checked = selectedUserDirectIds.includes(p._id);
                      return (
                        <label
                          key={p._id}
                          className="flex items-start gap-2 p-2 border-b last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleUserDirectPermission(p._id)}
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
                </div>

                <div className="border rounded p-3">
                  <div className="font-semibold mb-2">الصلاحيات الفعالة</div>
                  <div className="max-h-64 overflow-auto border rounded divide-y">
                    {effectivePermissions.length ? (
                      effectivePermissions.map((p) => (
                        <div key={p._id} className="p-2 flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{p.label}</div>
                            <div className="text-[11px] text-gray-500">
                              {p.key}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 text-[11px] text-gray-600">
                            {p.sources.map((s) => (
                              <span
                                key={`${p._id}-${s}`}
                                className="px-2 py-1 bg-gray-100 rounded-full border"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-gray-500">
                        لا توجد صلاحيات فعالة بعد
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                اختر مستخدماً لعرض صلاحياته
              </div>
            )}
          </div>
        </div>
      </div>

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
