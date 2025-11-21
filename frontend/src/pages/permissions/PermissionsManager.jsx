// src/pages/PermissionManager.jsx
import React, { useEffect, useState } from "react";
import API from "../../api/api";
import { toast } from "react-hot-toast";

export default function PermissionManager() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [aggregatedPermissionIds, setAggregatedPermissionIds] = useState([]); // aggregated from groups + direct
  const [directPermissionIds, setDirectPermissionIds] = useState([]); // user's directPermissions IDs
  const [userGroupIds, setUserGroupIds] = useState([]);

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

      // aggregated permission ids (group perms + direct perms) come back as permissionIds
      setAggregatedPermissionIds(res.data.permissionIds || []);

      // directPermissions are populated on user.directPermissions
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

      // refresh groups list (so membership buttons reflect)
      const gRes = await API.get("/permissions/groups");
      setGroups(gRes.data || []);
    } catch (err) {
      console.error("loadUserPermissions error:", err);
      toast.error("فشل في تحميل صلاحيات المستخدم");
    }
  };

  // toggle direct permission (add/remove to user's directPermissions)
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
      await API.put(`/user/${selectedUserId}/permissions`, {
        directPermissions: updatedDirect,
      });
      setDirectPermissionIds(updatedDirect);

      // reload aggregated set from server
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
      // refresh
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
    <div className="p-6 bg-white rounded-xl shadow">
      <h2 className="text-lg font-semibold mb-4">👥 إدارة صلاحيات المستخدم</h2>

      <div className="mb-4">
        <label className="block mb-2">اختر مستخدماً:</label>
        <select
          value={selectedUserId}
          onChange={(e) => loadUserPermissions(e.target.value)}
          className="border px-3 py-2 rounded w-full"
        >
          <option value="">اختر مستخدماً...</option>
          {users.map((u) => (
            <option key={u._id} value={u._id}>
              {u.username} {u.role ? `(${u.role})` : ""}
            </option>
          ))}
        </select>
      </div>

      {selectedUserId ? (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Groups */}
            <div className="border p-4 rounded">
              <h3 className="font-semibold mb-2">مجموعات المستخدم</h3>
              <div className="space-y-2">
                {groups.map((g) => {
                  const member = userGroupIds.includes(g._id);
                  return (
                    <div
                      key={g._id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">{g.name}</div>
                        <div className="text-xs text-gray-500">
                          {g.permissions?.length || 0} صلاحية
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {member ? (
                          <button
                            onClick={() => removeUserFromGroup(g._id)}
                            className="px-2 py-1 bg-red-600 text-white rounded text-sm"
                          >
                            إزالة
                          </button>
                        ) : (
                          <button
                            onClick={() => addUserToGroup(g._id)}
                            className="px-2 py-1 bg-green-600 text-white rounded text-sm"
                          >
                            إضافة
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {groups.length === 0 && (
                  <div className="text-gray-500">لا توجد مجموعات</div>
                )}
              </div>
            </div>

            {/* Permissions */}
            <div className="border p-4 rounded">
              <h3 className="font-semibold mb-2">الصلاحيات (مجمعة + مباشرة)</h3>
              <div className="text-xs text-gray-500 mb-3">
                ✓ الصلاحيات المعينة (سواء عبر مجموعة أو مباشرة) ستظهر مفعلة في
                العمود الأيمن. يمكنك هنا إضافة أو إزالة الصلاحيات **المباشرة**
                للمستخدم.
              </div>

              <div className="grid gap-2 max-h-96 overflow-auto">
                {allPermissions.map((p) => {
                  const isAggregated = aggregatedPermissionIds.includes(p._id);
                  const isDirect = directPermissionIds.includes(p._id);
                  return (
                    <label
                      key={p._id}
                      className="flex items-center gap-3 p-2 bg-white rounded border"
                    >
                      <input
                        type="checkbox"
                        checked={isDirect}
                        onChange={() => toggleDirectPermission(p._id)}
                        className="accent-blue-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{p.label}</div>
                        <div className="text-xs text-gray-500">
                          {p.key} • {p.category}
                        </div>
                      </div>
                      <div className="text-sm">
                        {isAggregated ? (
                          <span className="text-green-600">مفعلة</span>
                        ) : (
                          <span className="text-gray-400">غير مفعلة</span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-gray-500">
          اختر مستخدماً لعرض صلاحياته وإدارتها.
        </div>
      )}
    </div>
  );
}
