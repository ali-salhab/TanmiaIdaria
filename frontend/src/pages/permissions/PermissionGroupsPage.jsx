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

  // Search states
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [permSearchQuery, setPermSearchQuery] = useState("");
  const [directPermSearchQuery, setDirectPermSearchQuery] = useState("");

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

  const filteredGroups = groups.filter((g) =>
    g.name?.toLowerCase().includes(groupSearchQuery.toLowerCase())
  );

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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 rounded-lg">
            <span className="text-2xl">🔐</span>
          </div>
          إدارة مجموعات الصلاحيات
        </h2>
      </div>

      {/* Users list: view & manage groups/permissions */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-8">
        <div className="xl:col-span-1 bg-slate-800/50 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-slate-700/50 flex flex-col h-[700px]">
          <h3 className="text-lg font-semibold mb-4 text-slate-200 flex items-center gap-2">
            <span>👥</span> المستخدمون
          </h3>
          <div className="relative mb-4">
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full border border-slate-600/50 bg-slate-700/50 text-slate-100 px-4 py-2.5 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="ابحث باسم المستخدم..."
            />
            <span className="absolute left-3 top-3 text-slate-500">🔍</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredUsers.map((u) => (
              <button
                key={u._id}
                type="button"
                onClick={() => selectUser(u)}
                className={`w-full text-right px-4 py-3 rounded-xl border transition-all duration-200 group ${selectedUser?._id === u._id
                  ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20"
                  : "bg-slate-700/30 border-slate-600/30 text-slate-300 hover:bg-slate-700/60 hover:border-slate-500"
                  }`}
              >
                <div className="font-bold truncate">{u.username}</div>
                <div className={`text-xs ${selectedUser?._id === u._id ? "text-blue-100" : "text-slate-500"} group-hover:text-slate-400`}>
                  {u.role}
                </div>
              </button>
            ))}
            {filteredUsers.length === 0 && (
              <div className="text-center py-10 text-slate-500">
                <div className="text-4xl mb-2">👤</div>
                <p>لا يوجد مستخدمون</p>
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-3 space-y-6">
          {selectedUser ? (
            <div className="animate-fadeIn space-y-6">
              {/* User Header Info */}
              <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg shadow-blue-900/40">
                    {selectedUser.username ? selectedUser.username[0].toUpperCase() : "?"}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{selectedUser.username}</h3>
                    <p className="text-slate-400">{selectedUser.role} • {selectedUser.employeeId?.fullName || "مستخدم غير مرتبط بموظف"}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{selectedUserGroupDetails.length}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">المجموعات</div>
                  </div>
                  <div className="w-px h-10 bg-slate-700 mx-2"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{selectedUserDirectIds.length}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">مباشرة</div>
                  </div>
                  <div className="w-px h-10 bg-slate-700 mx-2"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{effectivePermissions.length}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">فعالة</div>
                  </div>
                </div>
              </div>

              {/* Group Management Section */}
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-200 flex items-center gap-2">
                    <span>📦</span> المجموعات المنتسب إليها
                  </h4>
                  <div className="flex gap-2">
                    <select
                      value={groupToAdd}
                      onChange={(e) => setGroupToAdd(e.target.value)}
                      className="bg-slate-700 border border-slate-600 text-slate-100 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">اختر مجموعة لإضافتها...</option>
                      {groups.map((g) => {
                        const isMember = selectedUserGroupDetails.some(ug => (ug._id || ug) === g._id);
                        if (isMember) return null;
                        return <option key={g._id} value={g._id}>{g.name}</option>
                      })}
                    </select>
                    <button
                      type="button"
                      onClick={addUserToGroup}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95 text-sm"
                    >
                      إضافة
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedUserGroupDetails.length ? (
                    selectedUserGroupDetails.map((g) => (
                      <div
                        key={g._id || g}
                        className="group flex items-center gap-3 bg-slate-700/50 border border-slate-600 hover:border-slate-500 rounded-xl px-4 py-2 text-sm text-slate-200 transition-all shadow-sm"
                      >
                        <span className="font-bold">{g.name || g}</span>
                        <span className="text-[10px] bg-slate-600 px-1.5 py-0.5 rounded-lg text-slate-400">
                          {g.permissions?.length || 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeUserGroup(g._id || g)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                          title="إزالة من المجموعة"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 italic p-4 bg-slate-700/20 rounded-xl w-full text-center border border-dashed border-slate-700">لا ينتمي لأي مجموعات</div>
                  )}
                </div>
              </div>

              {/* Direct Permissions Section - Searchable */}
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <h4 className="font-bold text-slate-200 flex items-center gap-2">
                    <span>🎯</span> الصلاحيات المباشرة
                  </h4>
                  <div className="relative w-full sm:w-64">
                    <input
                      value={directPermSearchQuery}
                      onChange={(e) => setDirectPermSearchQuery(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 text-slate-100 px-3 py-1.5 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ابحث عن صلاحية..."
                    />
                  </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.entries(groupedPermissions).map(([category, perms]) => {
                    const filteredCategoryPerms = perms.filter(p =>
                      (p.label?.toLowerCase() || "").includes(directPermSearchQuery.toLowerCase()) ||
                      (p.key?.toLowerCase() || "").includes(directPermSearchQuery.toLowerCase())
                    );

                    if (filteredCategoryPerms.length === 0) return null;

                    return (
                      <div key={category} className="mb-6 last:mb-0">
                        <div className="flex items-center justify-between mb-3 border-b border-slate-700 pb-2">
                          <h5 className="font-bold text-blue-400 text-sm flex items-center gap-2 uppercase tracking-wide">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            {category}
                          </h5>
                          <button
                            type="button"
                            onClick={async () => {
                              const allIds = perms.map((p) => p._id);
                              const allSelected = allIds.every((id) =>
                                selectedUserDirectIds.includes(id)
                              );
                              let updated = allSelected
                                ? selectedUserDirectIds.filter(id => !allIds.includes(id))
                                : [...new Set([...selectedUserDirectIds, ...allIds])];

                              try {
                                await API.put(`/permissions/users/${selectedUser._id}/permissions`, {
                                  directPermissions: updated,
                                });
                                setSelectedUserDirectIds(updated);
                                toast.success(`تم تحديث صلاحيات فئة ${category}`);
                              } catch (err) {
                                toast.error("فشل في تحديث الصلاحيات");
                              }
                            }}
                            className="text-[10px] font-bold text-slate-500 hover:text-blue-400 transition-colors uppercase"
                          >
                            تحديد الكل
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {filteredCategoryPerms.map((p) => {
                            const checked = selectedUserDirectIds.includes(p._id);
                            return (
                              <label
                                key={p._id}
                                className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer group hover:shadow-md ${checked
                                  ? "bg-blue-600/10 border-blue-500/50 shadow-blue-900/5"
                                  : "bg-slate-700/30 border-slate-600/30 hover:border-slate-500 hover:bg-slate-700/50"
                                  }`}
                              >
                                <div className="relative flex items-center pt-0.5">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleUserDirectPermission(p._id, p.label)}
                                    className="w-4 h-4 rounded border-slate-500 bg-slate-600 text-blue-600 focus:ring-offset-slate-800"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-slate-100 text-xs truncate group-hover:text-white">{p.label}</div>
                                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{p.key}</div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {directPermSearchQuery && Object.values(groupedPermissions).every(perms => perms.filter(p => (p.label?.toLowerCase() || "").includes(directPermSearchQuery.toLowerCase()) || (p.key?.toLowerCase() || "").includes(directPermSearchQuery.toLowerCase())).length === 0) && (
                    <div className="text-center py-10 text-slate-600 italic">لا توجد نتائج للصلاحيات بهذا الاسم</div>
                  )}
                </div>
              </div>

              {/* Effective Permissions - Read Only Summary */}
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-lg">
                <h4 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
                  <span>💎</span> الصلاحيات الفعالة (إجمالي)
                </h4>
                <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-2">
                  {effectivePermissions.length ? (
                    effectivePermissions.map((p) => (
                      <div key={p._id} className="p-3 bg-slate-900/50 border border-slate-700/50 rounded-xl flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-bold text-slate-100 text-xs">{p.label}</div>
                          <div className="text-[9px] text-slate-500 font-mono px-1.5 py-0.5 bg-slate-800 rounded">{p.key}</div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {p.sources.map((s) => (
                            <span
                              key={`${p._id}-${s}`}
                              className={`text-[9px] px-2 py-0.5 rounded-lg font-bold border ${s === "مباشر"
                                ? "bg-purple-900/30 text-purple-400 border-purple-800/30"
                                : "bg-blue-900/30 text-blue-400 border-blue-800/30"
                                }`}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-10 text-slate-600">هذا المستخدم لا يمتلك أي صلاحيات فعالة حالياً</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-20 bg-slate-800/20 border border-dashed border-slate-700 rounded-3xl animate-pulse">
              <div className="text-6xl mb-6 opacity-20">👤</div>
              <p className="text-slate-500 text-lg font-bold">اختر مستخدماً من القائمة لإدارة صلاحياته</p>
              <p className="text-slate-600 text-sm mt-2">تستطيع التحكم بمجموعات الصلاحيات أو منح صلاحيات مباشرة للمستخدم المحدد</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700 shadow-2xl mb-12 backdrop-blur-sm">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span>🛡️</span> إدارة مجموعات الصلاحيات
        </h3>

        {/* Create Group Box */}
        <div className="bg-slate-700/30 p-5 rounded-2xl border border-slate-600/50 mb-8">
          <label className="block text-sm font-bold text-slate-300 mb-2">إنشاء مجموعة جديدة</label>
          <div className="flex gap-3">
            <input
              placeholder="اسم المجموعة الجديد (مثلاً: المحاسبين، شؤون الموظفين...)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="flex-1 border border-slate-600/50 bg-slate-800 text-slate-100 px-4 py-3 rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all font-bold"
            />
            <button
              onClick={createGroup}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-900/20 active:scale-95 flex items-center gap-2"
            >
              <span>+</span> إنشاء مجموعة
            </button>
          </div>
        </div>

        {/* Group List with Search */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-slate-200">المجموعات الحالية</h4>
            <div className="relative w-full max-w-xs">
              <input
                value={groupSearchQuery}
                onChange={(e) => setGroupSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 px-4 py-2 rounded-xl text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ابحث عن اسم المجموعة..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((g) => (
              <div
                key={g._id}
                className="bg-slate-700/30 p-5 rounded-2xl border border-slate-600/30 hover:border-slate-500 transition-all group hover:shadow-xl hover:shadow-black/20"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors truncate">{g.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-lg border border-blue-500/20">{g.permissions?.length || 0} صلاحية</span>
                      <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded-lg border border-purple-500/20">{g.members?.length || 0} عضو</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(g)}
                      className="p-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                      title="تعديل"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteGroup(g._id)}
                      className="p-2 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                      title="حذف"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Compact Members View */}
                <div className="mt-4 pt-4 border-t border-slate-600/50">
                  <div className="text-[10px] uppercase font-black text-slate-500 mb-2 tracking-widest">الأعضاء الملحقين</div>
                  {g.members && g.members.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                      {g.members.map((m) => (
                        <div
                          key={m._id}
                          className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-2 py-1 rounded-lg"
                        >
                          <span className="text-[10px] font-bold text-slate-300">{m.username}</span>
                          <button
                            onClick={() => removeMember(g._id, m._id)}
                            className="text-slate-500 hover:text-red-400 text-[8px]"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-600 italic">لا يوجد أعضاء ملحقين</div>
                  )}
                </div>
              </div>
            ))}
            {filteredGroups.length === 0 && (
              <div className="col-span-full py-12 bg-slate-800/30 rounded-3xl border border-dashed border-slate-700 text-center text-slate-500">
                <div className="text-4xl mb-2">📦</div>
                <p>لا توجد مجموعات بهذا الاسم</p>
              </div>
            )}
          </div>
        </div>
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
            <div className="relative mb-4">
              <input
                value={permSearchQuery}
                onChange={(e) => setPermSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 px-4 py-2 rounded-xl text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ابحث عن صلاحية..."
              />
            </div>
            <div className="max-h-96 overflow-auto border border-slate-700 rounded-2xl p-4 mb-3 bg-slate-900/50 custom-scrollbar">
              {Object.entries(groupedPermissions).map(([category, perms]) => {
                const filteredPerms = perms.filter(p =>
                  (p.label?.toLowerCase() || "").includes(permSearchQuery.toLowerCase()) ||
                  (p.key?.toLowerCase() || "").includes(permSearchQuery.toLowerCase())
                );

                if (filteredPerms.length === 0) return null;

                return (
                  <div key={category} className="mb-6 last:mb-0">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-700 pb-2">
                      <h4 className="font-bold text-blue-400 text-sm flex items-center gap-2 uppercase tracking-wide">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        {category}
                      </h4>
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
                        className="text-[10px] font-bold text-slate-500 hover:text-blue-400 transition-colors uppercase"
                      >
                        تحديد الكل
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredPerms.map((p) => {
                        const checked = editingGroupPermissions.includes(p._id);
                        return (
                          <label
                            key={p._id}
                            className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer group hover:shadow-md ${checked
                              ? "bg-blue-600/10 border-blue-500/50"
                              : "bg-slate-800/30 border-slate-700/30 hover:border-slate-500 hover:bg-slate-800/50"
                              }`}
                          >
                            <div className="relative flex items-center pt-0.5">
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
                                className="w-4 h-4 rounded border-slate-500 bg-slate-600 text-blue-600"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-slate-100 text-xs truncate group-hover:text-white">{p.label}</div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">{p.key}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
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
