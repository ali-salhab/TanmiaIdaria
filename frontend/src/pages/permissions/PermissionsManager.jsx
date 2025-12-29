import React, { useEffect, useState, useMemo } from "react";
import API from "../../api/api";
import { toast } from "react-hot-toast";
import { Search, Plus, Minus, Copy } from "lucide-react";

export default function PermissionManager() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [aggregatedPermissionIds, setAggregatedPermissionIds] = useState([]);
  const [directPermissionIds, setDirectPermissionIds] = useState([]);
  const [userGroupIds, setUserGroupIds] = useState([]);

  const [userSearch, setUserSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    try {
      const [uRes, gRes, pRes] = await Promise.all([
        API.get("/users"),
        API.get("/permissions/groups"),
        API.get("/permissions"),
      ]);
      setUsers(uRes.data || []);
      setGroups(gRes.data || []);
      setAllPermissions(pRes.data || []);
    } catch (err) {
      console.error("loadInitial error:", err);
      toast.error("فشل في جلب البيانات الابتدائية");
    }
  };

  const loadUserPermissions = async (userId) => {
    if (!userId) return;
    try {
      const res = await API.get(`/permissions/user/${userId}/permissions`);
      setSelectedUserId(userId);
      setAggregatedPermissionIds(res.data.permissionIds || []);

      const directIds =
        (res.data.user?.directPermissions || []).map((p) =>
          typeof p === "string" ? p : p._id
        ) || [];
      setDirectPermissionIds(directIds);

      const userGroupIdsFromUser =
        (res.data.user?.permissionGroups || []).map((g) =>
          typeof g === "string" ? g : g._id
        ) || [];
      setUserGroupIds(userGroupIdsFromUser);

      const gRes = await API.get("/permissions/groups");
      setGroups(gRes.data || []);
    } catch (err) {
      console.error("loadUserPermissions error:", err);
      toast.error("فشل في تحميل صلاحيات المستخدم");
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [users, userSearch]);

  const filteredPermissions = useMemo(() => {
    return allPermissions.filter((p) => {
      const matchesSearch =
        p.label.toLowerCase().includes(permissionSearch.toLowerCase()) ||
        p.key.toLowerCase().includes(permissionSearch.toLowerCase()) ||
        p.description?.toLowerCase().includes(permissionSearch.toLowerCase());
      const matchesCategory = !categoryFilter || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [allPermissions, permissionSearch, categoryFilter]);

  const categories = useMemo(() => {
    return [...new Set(allPermissions.map((p) => p.category))];
  }, [allPermissions]);

  const toggleDirectPermission = async (permId) => {
    if (!selectedUserId) {
      toast.error("اختر مستخدماً أولاً");
      return;
    }
    const has = directPermissionIds.includes(permId);
    const updatedDirect = has
      ? directPermissionIds.filter((id) => id !== permId)
      : [...directPermissionIds, permId];

    try {
      await API.put(`/permissions/users/${selectedUserId}/permissions`, {
        directPermissions: updatedDirect,
      });
      setDirectPermissionIds(updatedDirect);

      const res = await API.get(
        `/permissions/user/${selectedUserId}/permissions`
      );
      setAggregatedPermissionIds(res.data.permissionIds || []);
      toast.success("✅ تم تحديث الصلاحيات المباشرة");
    } catch (err) {
      console.error("toggleDirectPermission error:", err);
      toast.error("❌ فشل في تحديث الصلاحيات المباشرة");
    }
  };

  const assignAllPermissions = async () => {
    if (!selectedUserId) {
      toast.error("اختر مستخدماً أولاً");
      return;
    }
    if (!window.confirm("هل أنت متأكد من منح هذا المستخدم جميع الصلاحيات؟"))
      return;
    try {
      await API.post(`/permissions/give-all/${selectedUserId}`);
      toast.success("✅ تم منح جميع الصلاحيات بنجاح");
      loadUserPermissions(selectedUserId);
    } catch (err) {
      console.error("assignAllPermissions error:", err);
      toast.error("❌ فشل في منح الصلاحيات");
    }
  };

  const removeAllPermissions = async () => {
    if (!selectedUserId) {
      toast.error("اختر مستخدماً أولاً");
      return;
    }
    if (!window.confirm("هل أنت متأكد من سحب جميع الصلاحيات من هذا المستخدم؟"))
      return;
    try {
      await API.post(`/permissions/remove-all/${selectedUserId}`);
      toast.success("✅ تم سحب جميع الصلاحيات بنجاح");
      loadUserPermissions(selectedUserId);
    } catch (err) {
      console.error("removeAllPermissions error:", err);
      toast.error("❌ فشل في إزالة الصلاحيات");
    }
  };

  const assignCategoryPermissions = async (category) => {
    if (!selectedUserId) {
      toast.error("اختر مستخدماً أولاً");
      return;
    }
    const categoryPermIds = allPermissions
      .filter((p) => p.category === category)
      .map((p) => p._id);
    const updatedDirect = [
      ...new Set([...directPermissionIds, ...categoryPermIds]),
    ];
    try {
      await API.put(`/permissions/users/${selectedUserId}/permissions`, {
        directPermissions: updatedDirect,
      });
      setDirectPermissionIds(updatedDirect);
      const res = await API.get(
        `/permissions/user/${selectedUserId}/permissions`
      );
      setAggregatedPermissionIds(res.data.permissionIds || []);
      toast.success(`✅ تم منح صلاحيات ${category}`);
    } catch (err) {
      console.error("assignCategoryPermissions error:", err);
      toast.error("❌ فشل في منح الصلاحيات");
    }
  };

  const addUserToGroup = async (groupId) => {
    if (!selectedUserId) {
      toast.error("اختر مستخدماً أولاً");
      return;
    }
    try {
      await API.post("/permissions/groups/add-user", {
        groupId,
        userId: selectedUserId,
      });
      toast.success("✅ تمت إضافة المستخدم إلى المجموعة");
      await loadUserPermissions(selectedUserId);
    } catch (err) {
      console.error("addUserToGroup error:", err);
      toast.error("❌ فشل في إضافة المستخدم إلى المجموعة");
    }
  };

  const removeUserFromGroup = async (groupId) => {
    if (!selectedUserId) {
      toast.error("اختر مستخدماً أولاً");
      return;
    }
    try {
      await API.post("/permissions/groups/remove-user", {
        groupId,
        userId: selectedUserId,
      });
      toast.success("✅ تمت إزالة المستخدم من المجموعة");
      await loadUserPermissions(selectedUserId);
    } catch (err) {
      console.error("removeUserFromGroup error:", err);
      toast.error("❌ فشل في إزالة المستخدم من المجموعة");
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-slate-800">
          👥 إدارة الصلاحيات
        </h2>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Users Section */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-700">
              المستخدمون
            </h3>

            <div className="relative mb-4">
              <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث عن مستخدم..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="border border-slate-300 px-4 py-2 pr-10 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedUserId}
              onChange={(e) => loadUserPermissions(e.target.value)}
              className="border border-slate-300 px-3 py-2 rounded-lg w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">اختر مستخدماً...</option>
              {filteredUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  👤 {u.username} ({u.role || "مستخدم"})
                </option>
              ))}
            </select>

            {selectedUserId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-slate-700">
                <div className="font-semibold mb-2">📊 إحصائيات:</div>
                <div>
                  صلاحيات مباشرة:{" "}
                  <span className="font-bold text-blue-600">
                    {directPermissionIds.length}
                  </span>
                </div>
                <div>
                  مجموعات:{" "}
                  <span className="font-bold text-blue-600">
                    {userGroupIds.length}
                  </span>
                </div>
                <div>
                  إجمالي صلاحيات:{" "}
                  <span className="font-bold text-green-600">
                    {aggregatedPermissionIds.length}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Groups & Actions */}
          <div className="lg:col-span-2 space-y-6">
            {selectedUserId && (
              <>
                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 text-slate-700">
                    ⚡ إجراءات سريعة
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={assignAllPermissions}
                      className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                    >
                      <Copy className="w-4 h-4" />
                      منح جميع الصلاحيات
                    </button>
                    <button
                      onClick={removeAllPermissions}
                      className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                    >
                      <Minus className="w-4 h-4" />
                      إزالة الجميع
                    </button>
                    <div className="bg-slate-100 rounded-lg p-2">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            assignCategoryPermissions(e.target.value);
                            e.target.value = "";
                          }
                        }}
                        className="w-full py-2 px-2 rounded border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">منح صلاحيات فئة...</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            🔖 {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Groups */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 text-slate-700">
                    👥 المجموعات
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {groups.map((g) => {
                      const member = userGroupIds.includes(g._id);
                      return (
                        <div
                          key={g._id}
                          className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200"
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-slate-800">
                              {g.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {g.permissions?.length || 0} صلاحية
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              member
                                ? removeUserFromGroup(g._id)
                                : addUserToGroup(g._id)
                            }
                            className={`px-3 py-1 rounded-lg text-white text-sm font-semibold transition flex items-center gap-1 ${
                              member
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-green-600 hover:bg-green-700"
                            }`}
                          >
                            {member ? (
                              <>
                                <Minus className="w-3 h-3" />
                                إزالة
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" />
                                إضافة
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                    {groups.length === 0 && (
                      <div className="text-center text-gray-500 py-4">
                        لا توجد مجموعات
                      </div>
                    )}
                  </div>
                </div>

                {/* Permissions with Search & Filter */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 text-slate-700">
                    🔐 الصلاحيات المباشرة
                  </h3>

                  <div className="mb-4 space-y-3">
                    <div className="relative">
                      <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="ابحث عن صلاحية..."
                        value={permissionSearch}
                        onChange={(e) => setPermissionSearch(e.target.value)}
                        className="border border-slate-300 px-4 py-2 pr-10 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="border border-slate-300 px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">كل الفئات</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredPermissions.length > 0 ? (
                      filteredPermissions.map((p) => {
                        const isAggregated = aggregatedPermissionIds.includes(
                          p._id
                        );
                        const isDirect = directPermissionIds.includes(p._id);
                        return (
                          <label
                            key={p._id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                              isDirect
                                ? "bg-green-50 border-green-300"
                                : "bg-slate-50 border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isDirect}
                              onChange={() => toggleDirectPermission(p._id)}
                              className="accent-green-600 w-4 h-4"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-slate-800">
                                {p.label}
                              </div>
                              <div className="text-xs text-slate-500">
                                {p.key} • {p.category}
                              </div>
                              {p.description && (
                                <div className="text-xs text-slate-600 mt-1">
                                  {p.description}
                                </div>
                              )}
                            </div>
                            <div className="text-xs font-semibold">
                              {isAggregated && (
                                <span className="bg-green-600 text-white px-2 py-1 rounded">
                                  ✓ مفعلة
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })
                    ) : (
                      <div className="text-center text-gray-500 py-6">
                        لا توجد نتائج
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
