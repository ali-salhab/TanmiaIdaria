import { useEffect, useState } from "react";
import API from "../api/api.js"; // ← عدل المسار حسب مشروعك
import { toast } from "react-hot-toast";

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);

  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [selectedGroupPermissions, setSelectedGroupPermissions] = useState([]);

  const [assignData, setAssignData] = useState({
    userId: "",
    groupId: "",
  });

  // ────────────────────────────────────────────────
  // FETCH ALL DATA
  // ────────────────────────────────────────────────
  const loadData = async () => {
    try {
      const [p, g, u] = await Promise.all([
        API.get("/permissions"), // GET ALL PERMISSIONS
        API.get("/groups"), // GET ALL GROUPS
        API.get("/users"), // GET ALL USERS
      ]);

      setPermissions(p.data.permissions || []);
      setGroups(g.data.groups || []);
      setUsers(u.data.users || []);
    } catch (err) {
      toast.error("Failed to load permissions data");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ────────────────────────────────────────────────
  // CREATE NEW GROUP
  // ────────────────────────────────────────────────
  const createGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error("Group name required");
      return;
    }

    try {
      await API.post("/groups", {
        name: newGroupName,
        description: newGroupDescription,
        permissions: selectedGroupPermissions,
      });

      toast.success("Group created!");
      setNewGroupName("");
      setNewGroupDescription("");
      setSelectedGroupPermissions([]);
      loadData();
    } catch (err) {
      toast.error("Failed to create group");
    }
  };

  // ────────────────────────────────────────────────
  // DELETE GROUP
  // ────────────────────────────────────────────────
  const deleteGroup = async (groupId) => {
    if (!window.confirm("Are you sure?")) return;

    try {
      await API.delete(`/groups/${groupId}`);
      toast.success("Group deleted");
      loadData();
    } catch (err) {
      toast.error("Failed to delete group");
    }
  };

  // ────────────────────────────────────────────────
  // ASSIGN USER TO GROUP
  // ────────────────────────────────────────────────
  const assignUserToGroup = async () => {
    if (!assignData.userId || !assignData.groupId) {
      toast.error("Select user + group");
      return;
    }

    try {
      await API.post("/groups/add-user", assignData);
      toast.success("User assigned to group");
      loadData();
    } catch (err) {
      toast.error("Failed to assign");
    }
  };

  // ────────────────────────────────────────────────
  // REMOVE USER FROM GROUP
  // ────────────────────────────────────────────────
  const removeUser = async (userId, groupId) => {
    try {
      await API.post("/groups/remove-user", { userId, groupId });
      toast.success("User removed");
      loadData();
    } catch (err) {
      toast.error("Failed to remove user");
    }
  };

  // ────────────────────────────────────────────────
  // RENDER UI
  // ────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-bold">🔐 إدارة الصلاحيات</h1>

      {/* ─────────────────────────────── */}
      {/* Create Permission Group */}
      {/* ─────────────────────────────── */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h2 className="text-xl font-semibold">➕ إنشاء مجموعة صلاحيات</h2>

        <input
          type="text"
          placeholder="اسم المجموعة"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />

        <textarea
          placeholder="وصف المجموعة (اختياري)"
          value={newGroupDescription}
          onChange={(e) => setNewGroupDescription(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />

        {/* Select permissions */}
        <div className="max-h-60 overflow-y-auto border rounded-lg p-3">
          <h3 className="font-medium mb-2">اختر الصلاحيات:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {permissions.map((perm) => (
              <label key={perm._id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedGroupPermissions.includes(perm._id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedGroupPermissions([
                        ...selectedGroupPermissions,
                        perm._id,
                      ]);
                    } else {
                      setSelectedGroupPermissions(
                        selectedGroupPermissions.filter((id) => id !== perm._id)
                      );
                    }
                  }}
                />
                {perm.label}
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={createGroup}
          className="bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          إنشاء المجموعة
        </button>
      </div>

      {/* ─────────────────────────────── */}
      {/* Assign User to Group */}
      {/* ─────────────────────────────── */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h2 className="text-xl font-semibold">👥 ربط مستخدم بمجموعة</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            className="border rounded-lg px-3 py-2"
            value={assignData.userId}
            onChange={(e) =>
              setAssignData({ ...assignData, userId: e.target.value })
            }
          >
            <option value="">اختر مستخدم</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.username}
              </option>
            ))}
          </select>

          <select
            className="border rounded-lg px-3 py-2"
            value={assignData.groupId}
            onChange={(e) =>
              setAssignData({ ...assignData, groupId: e.target.value })
            }
          >
            <option value="">اختر مجموعة</option>
            {groups.map((g) => (
              <option key={g._id} value={g._id}>
                {g.name}
              </option>
            ))}
          </select>

          <button
            onClick={assignUserToGroup}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            ربط
          </button>
        </div>
      </div>

      {/* ─────────────────────────────── */}
      {/* Groups List */}
      {/* ─────────────────────────────── */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">📦 المجموعات</h2>

        <div className="space-y-4">
          {groups.map((group) => (
            <div
              key={group._id}
              className="border rounded-lg p-4 space-y-3 bg-gray-50"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">{group.name}</h3>
                <button
                  onClick={() => deleteGroup(group._id)}
                  className="text-red-600"
                >
                  حذف
                </button>
              </div>

              {group.description && (
                <p className="text-sm text-gray-600">{group.description}</p>
              )}

              {/* Permissions */}
              <div>
                <h4 className="font-medium mb-2">الصلاحيات:</h4>
                <div className="flex flex-wrap gap-2">
                  {group.permissions.length === 0 && (
                    <p className="text-sm text-gray-500">لا يوجد</p>
                  )}
                  {group.permissions.map((perm) => (
                    <span
                      key={perm._id}
                      className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs"
                    >
                      {perm.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Users */}
              <div>
                <h4 className="font-medium mb-2">الأعضاء:</h4>
                <div className="flex flex-wrap gap-2">
                  {group.members.length === 0 && (
                    <p className="text-sm text-gray-500">لا يوجد</p>
                  )}
                  {group.members.map((user) => (
                    <span
                      key={user._id}
                      className="flex items-center gap-2 bg-green-100 text-green-700 px-2 py-1 rounded text-xs"
                    >
                      {user.username}

                      <button
                        onClick={() => removeUser(user._id, group._id)}
                        className="text-red-500 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
