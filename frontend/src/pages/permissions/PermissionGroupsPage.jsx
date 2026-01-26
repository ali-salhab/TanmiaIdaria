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

  const groupedPermissions = useMemo(() => {
    const groups = {};
    allPermissions.forEach((p) => {
      const cat = p.category || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return groups;
  }, [allPermissions]);

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

  const toggleUserDirectPermission = async (permId, label) => {
    console.log("----------------------> selected user ");
    console.log(selectedUser);
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
      toast.success(
        `تم منح المستخدم   {${selectedUser.username} } الصلاحيات المباشرة   ${label}  `
      );
      console.log(selectUser);
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
    <div
      className="p-6 min-h-screen bg-slate-900 text-slate-100 font-custom"
      dir="rtl"
    >
      <h2 className="text-2xl font-semibold mb-4 text-slate-100">
        🔐 إدارة الصلاحيات
      </h2>

      {/* Users list: view & manage groups/permissions */}
      <div className="bg-slate-800 p-4 rounded shadow border border-slate-700">
        <h3 className="font-medium mb-3 text-slate-200">👥 المستخدمون</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full border border-slate-600 bg-slate-700 text-slate-100 px-3 py-2 rounded-lg mb-4 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ابحث باسم المستخدم أو الدور..."
            />
            <div className="border border-slate-600 rounded max-h-72 overflow-auto bg-slate-700/50">
              {filteredUsers.map((u) => (
                <button
                  key={u._id}
                  type="button"
                  onClick={() => selectUser(u)}
                  className={`w-full text-right px-3 py-2 border-b border-slate-600 last:border-b-0 hover:bg-slate-600 transition-colors ${selectedUser?._id === u._id
                      ? "bg-teal-900/30 text-teal-300"
                      : "text-slate-200"
                    }`}
                >
                  <div className="font-medium">{u.username}</div>
                  <div className="text-xs text-slate-400">{u.role}</div>
                </button>
              ))}
              {filteredUsers.length === 0 && (
                <div className="p-3 text-sm text-slate-500">
                  لا يوجد مستخدمون
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {selectedUser ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="font-semibold text-slate-100">
                    المستخدم: {selectedUser.username} ({selectedUser.role})
                  </div>
                  {selectedUser.employeeId?.fullName && (
                    <div className="text-sm text-slate-400">
                      الموظف: {selectedUser.employeeId.fullName}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="border border-slate-600 rounded p-3 bg-slate-700/50">
                    <div className="text-xs text-slate-400">المجموعات</div>
                    <div className="text-xl font-semibold text-slate-200">
                      {selectedUserGroupDetails.length}
                    </div>
                  </div>
                  <div className="border border-slate-600 rounded p-3 bg-slate-700/50">
                    <div className="text-xs text-slate-400">صلاحيات مباشرة</div>
                    <div className="text-xl font-semibold text-slate-200">
                      {selectedUserDirectIds.length}
                    </div>
                  </div>
                  <div className="border border-slate-600 rounded p-3 bg-slate-700/50">
                    <div className="text-xs text-slate-400">
                      الصلاحيات الفعالة
                    </div>
                    <div className="text-xl font-semibold text-slate-200">
                      {effectivePermissions.length}
                    </div>
                  </div>
                </div>

                <div className="border border-slate-600 rounded p-3 bg-slate-700/30">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="font-semibold text-slate-200">
                      المجموعات
                    </div>
                    <select
                      value={groupToAdd}
                      onChange={(e) => setGroupToAdd(e.target.value)}
                      className="border border-slate-600 bg-slate-700 text-slate-100 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded transition-colors"
                    >
                      إضافة للمجموعة
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedUserGroupDetails.length ? (
                      selectedUserGroupDetails.map((g) => (
                        <span
                          key={g._id || g}
                          className="inline-flex items-center gap-2 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm text-slate-200"
                        >
                          <span className="font-medium">{g.name || g}</span>
                          <span className="text-[11px] text-slate-400">
                            {g.permissions?.length || 0} صلاحية
                          </span>
                          <button
                            type="button"
                            onClick={() => removeUserGroup(g._id || g)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            ✕
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">لا مجموعات</span>
                    )}
                  </div>
                </div>

                <div className="border border-slate-600 rounded p-3 bg-slate-700/30">
                  <div className="font-semibold mb-2 text-slate-200">
                    الصلاحيات المباشرة
                  </div>
                  <div className="max-h-64 overflow-auto border border-slate-600 rounded bg-slate-700/50 p-2">
                    {Object.entries(groupedPermissions).map(
                      ([category, perms]) => (
                        <div key={category} className="mb-4">
                          <h4 className="font-bold text-slate-300 mb-2 capitalize border-b border-slate-600 pb-1 flex justify-between items-center">
                            <span>{category}</span>
                            <button
                              type="button"
                              onClick={async () => {
                                const allIds = perms.map((p) => p._id);
                                const allSelected = allIds.every((id) =>
                                  selectedUserDirectIds.includes(id)
                                );

                                let updated;
                                if (allSelected) {
                                  // Remove all from this category
                                  updated = selectedUserDirectIds.filter(id => !allIds.includes(id));
                                } else {
                                  // Add all from this category
                                  updated = [...new Set([...selectedUserDirectIds, ...allIds])];
                                }

                                try {
                                  await API.put(`/permissions/users/${selectedUser._id}/permissions`, {
                                    directPermissions: updated,
                                  });
                                  setSelectedUserDirectIds(updated);
                                  toast.success(`تم تحديث صلاحيات فئة ${category} بنجاح`);
                                } catch (err) {
                                  console.error("Bulk update error:", err);
                                  toast.error("فشل في تحديث الصلاحيات");
                                }
                              }}
                              className="text-xs text-blue-400 hover:text-blue-300"
                            >
                              تحديد الكل
                            </button>
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {perms.map((p) => {
                              const checked = selectedUserDirectIds.includes(
                                p._id
                              );
                              return (
                                <label
                                  key={p._id}
                                  className="flex items-start gap-2 p-2 border border-slate-600/50 rounded hover:bg-slate-600/50 transition-colors cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      console.log("---------------------->");
                                      toggleUserDirectPermission(
                                        p._id,
                                        p.label
                                      );
                                    }}
                                    className="mt-1 rounded border-slate-500 bg-slate-600 text-blue-600 focus:ring-blue-500"
                                  />
                                  <div>
                                    <div className="font-medium text-slate-200 text-sm">
                                      {p.label}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                      {p.key}
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="border border-slate-600 rounded p-3 bg-slate-700/30">
                  <div className="font-semibold mb-2 text-slate-200">
                    الصلاحيات الفعالة
                  </div>
                  <div className="max-h-64 overflow-auto border border-slate-600 rounded divide-y divide-slate-600 bg-slate-700/50">
                    {effectivePermissions.length ? (
                      effectivePermissions.map((p) => (
                        <div key={p._id} className="p-2 flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-slate-200">
                              {p.label}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {p.key}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
                            {p.sources.map((s) => (
                              <span
                                key={`${p._id}-${s}`}
                                className="px-2 py-1 bg-slate-600 rounded-full border border-slate-500"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-slate-500">
                        لا توجد صلاحيات فعالة بعد
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500 text-center py-12 border border-dashed border-slate-600 rounded bg-slate-800/50">
                اختر مستخدماً لعرض صلاحياته
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 p-4 rounded shadow mb-6 border border-slate-700">
        <div className="flex gap-2">
          <input
            placeholder="اسم المجموعة"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            className="flex-1 border border-slate-600 bg-slate-700 text-slate-100 px-2 py-2 rounded placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={createGroup}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
          >
            إنشاء
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {groups.map((g) => (
          <div
            key={g._id}
            className="bg-slate-800 p-4 rounded shadow border border-slate-700 hover:border-slate-600 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-slate-200">{g.name}</div>
                <div className="text-xs text-slate-400">
                  {g.permissions?.length || 0} صلاحيات
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(g)}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                >
                  تعديل
                </button>
                <button
                  onClick={() => deleteGroup(g._id)}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                >
                  حذف
                </button>
              </div>
            </div>

            {/* Members */}
            <div className="mt-3">
              <div className="text-sm font-semibold mb-1 text-slate-300">
                الأعضاء
              </div>
              <div className="text-xs text-slate-400">
                {g.members && g.members.length > 0 ? (
                  <div className="space-y-2">
                    {g.members.map((m) => (
                      <div
                        key={m._id}
                        className="flex justify-between items-center bg-slate-700 p-2 rounded border border-slate-600"
                      >
                        <div className="text-slate-200">
                          {m.username} {m.role ? `(${m.role})` : ""}
                        </div>
                        <button
                          onClick={() => removeMember(g._id, m._id)}
                          className="px-2 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded text-xs border border-red-500/30 transition-colors"
                        >
                          إزالة
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 italic">لا يوجد أعضاء</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Editor modal / area */}
      {editingGroupId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
          <div className="relative bg-slate-800 w-full max-w-2xl p-6 rounded-xl shadow-2xl border border-slate-700 z-10">
            <h3 className="text-lg font-semibold mb-3 text-slate-100">
              تعديل المجموعة
            </h3>
            <input
              value={editingGroupName}
              onChange={(e) => setEditingGroupName(e.target.value)}
              className="w-full border border-slate-600 bg-slate-700 text-slate-100 px-3 py-2 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="max-h-72 overflow-auto border border-slate-600 rounded p-2 mb-3 bg-slate-700/50">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category} className="mb-4">
                  <h4 className="font-bold text-slate-300 mb-2 capitalize border-b border-slate-600 pb-1 flex justify-between items-center">
                    <span>{category}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = perms.map((p) => p._id);
                        const allSelected = allIds.every((id) =>
                          editingGroupPermissions.includes(id)
                        );
                        if (allSelected) {
                          setEditingGroupPermissions((prev) =>
                            prev.filter((id) => !allIds.includes(id))
                          );
                        } else {
                          setEditingGroupPermissions((prev) => [
                            ...new Set([...prev, ...allIds]),
                          ]);
                        }
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      تحديد الكل
                    </button>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {perms.map((p) => {
                      const checked = editingGroupPermissions.includes(p._id);
                      return (
                        <label
                          key={p._id}
                          className="flex items-center gap-2 p-2 hover:bg-slate-600/50 rounded cursor-pointer border border-slate-600/30"
                        >
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
                            className="rounded border-slate-500 bg-slate-600 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-medium text-slate-200 text-sm">
                              {p.label}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {p.key}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
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
