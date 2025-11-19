import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import { toast } from "react-hot-toast";
import { Plus, Trash2, Edit2, Users, Shield, ArrowLeft } from "lucide-react";

export default function PermissionsManager() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("permissions");
  const [permissions, setPermissions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [newPermission, setNewPermission] = useState({
    key: "",
    label: "",
    description: "",
    category: "view",
  });
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    permissions: [],
  });
  const [editingGroup, setEditingGroup] = useState(null);
  const [selectedGroupForUsers, setSelectedGroupForUsers] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === "permissions") {
        const res = await API.get("/permissions/permissions");
        setPermissions(res.data);
      } else if (activeTab === "groups") {
        const [groupRes, userRes] = await Promise.all([
          API.get("/permissions/groups"),
          API.get("/users"),
        ]);
        setGroups(groupRes.data);
        setUsers(userRes.data);
      }
    } catch (error) {
      toast.error("❌ فشل تحميل البيانات");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePermission = async () => {
    if (!newPermission.key || !newPermission.label) {
      toast.error("❌ يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    try {
      await API.post("/permissions/permissions", newPermission);
      toast.success("✅ تم إنشاء الصلاحية بنجاح");
      setNewPermission({
        key: "",
        label: "",
        description: "",
        category: "view",
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "❌ فشل إنشاء الصلاحية");
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name) {
      toast.error("❌ يرجى إدخال اسم المجموعة");
      return;
    }

    try {
      await API.post("/permissions/groups", newGroup);
      toast.success("✅ تم إنشاء المجموعة بنجاح");
      setNewGroup({ name: "", description: "", permissions: [] });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "❌ فشل إنشاء المجموعة");
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup.name) {
      toast.error("❌ يرجى إدخال اسم المجموعة");
      return;
    }

    try {
      await API.put(`/permissions/groups/${editingGroup._id}`, editingGroup);
      toast.success("✅ تم تحديث المجموعة بنجاح");
      setEditingGroup(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "❌ فشل تحديث المجموعة");
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!confirm("هل أنت متأكد من حذف هذه المجموعة؟")) return;

    try {
      await API.delete(`/permissions/groups/${groupId}`);
      toast.success("✅ تم حذف المجموعة بنجاح");
      fetchData();
    } catch (error) {
      toast.error("❌ فشل حذف المجموعة");
    }
  };

  const handleAddUserToGroup = async (groupId, userId) => {
    try {
      await API.post("/permissions/groups/add-user", { groupId, userId });
      toast.success("✅ تم إضافة المستخدم إلى المجموعة");
      fetchData();
    } catch (error) {
      toast.error("❌ فشل إضافة المستخدم");
    }
  };

  const handleRemoveUserFromGroup = async (groupId, userId) => {
    try {
      await API.post("/permissions/groups/remove-user", { groupId, userId });
      toast.success("✅ تم إزالة المستخدم من المجموعة");
      fetchData();
    } catch (error) {
      toast.error("❌ فشل إزالة المستخدم");
    }
  };

  const togglePermissionForGroup = (permissionId) => {
    if (editingGroup) {
      const currentPermissions = editingGroup.permissions || [];
      const isSelected = currentPermissions.some(
        (p) => p._id === permissionId || p === permissionId
      );

      setEditingGroup({
        ...editingGroup,
        permissions: isSelected
          ? currentPermissions.filter((p) => (p._id || p) !== permissionId)
          : [...currentPermissions, permissionId],
      });
    } else {
      const currentPermissions = newGroup.permissions || [];
      const isSelected = currentPermissions.includes(permissionId);

      setNewGroup({
        ...newGroup,
        permissions: isSelected
          ? currentPermissions.filter((p) => p !== permissionId)
          : [...currentPermissions, permissionId],
      });
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">
            إدارة الصلاحيات والمجموعات
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-3 border-b border-gray-200">
            {[
              { label: "الصلاحيات", value: "permissions", icon: Shield },
              { label: "المجموعات", value: "groups", icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium transition border-b-2 ${
                    activeTab === tab.value
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">جاري التحميل...</p>
          </div>
        ) : activeTab === "permissions" ? (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                إضافة صلاحية جديدة
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="مفتاح الصلاحية (key)"
                  value={newPermission.key}
                  onChange={(e) =>
                    setNewPermission({ ...newPermission, key: e.target.value })
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="اسم الصلاحية"
                  value={newPermission.label}
                  onChange={(e) =>
                    setNewPermission({
                      ...newPermission,
                      label: e.target.value,
                    })
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={newPermission.category}
                  onChange={(e) =>
                    setNewPermission({
                      ...newPermission,
                      category: e.target.value,
                    })
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="view">عرض</option>
                  <option value="create">إنشاء</option>
                  <option value="edit">تعديل</option>
                  <option value="delete">حذف</option>
                  <option value="manage">إدارة</option>
                  <option value="admin">إدارة النظام</option>
                </select>
                <button
                  onClick={handleCreatePermission}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium"
                >
                  إضافة
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-right">المفتاح</th>
                    <th className="px-4 py-3 text-right">الاسم</th>
                    <th className="px-4 py-3 text-right">الفئة</th>
                    <th className="px-4 py-3 text-right">الوصف</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((perm) => (
                    <tr
                      key={perm._id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-mono text-xs">
                        {perm.key}
                      </td>
                      <td className="px-4 py-3">{perm.label}</td>
                      <td className="px-4 py-3">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {perm.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">{perm.description || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                {editingGroup ? "تعديل المجموعة" : "إضافة مجموعة جديدة"}
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="اسم المجموعة"
                    value={editingGroup?.name || newGroup.name}
                    onChange={(e) => {
                      if (editingGroup) {
                        setEditingGroup({
                          ...editingGroup,
                          name: e.target.value,
                        });
                      } else {
                        setNewGroup({ ...newGroup, name: e.target.value });
                      }
                    }}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="وصف المجموعة"
                    value={editingGroup?.description || newGroup.description}
                    onChange={(e) => {
                      if (editingGroup) {
                        setEditingGroup({
                          ...editingGroup,
                          description: e.target.value,
                        });
                      } else {
                        setNewGroup({
                          ...newGroup,
                          description: e.target.value,
                        });
                      }
                    }}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    اختر الصلاحيات
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-3 border border-gray-300 rounded-lg">
                    {permissions.map((perm) => {
                      const currentPerms =
                        editingGroup?.permissions || newGroup.permissions || [];
                      const isSelected = currentPerms.some(
                        (p) => (p._id || p) === perm._id
                      );
                      return (
                        <label
                          key={perm._id}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePermissionForGroup(perm._id)}
                            className="w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {perm.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={
                      editingGroup ? handleUpdateGroup : handleCreateGroup
                    }
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium"
                  >
                    {editingGroup ? "تحديث" : "إنشاء"}
                  </button>
                  {editingGroup && (
                    <button
                      onClick={() => setEditingGroup(null)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg transition font-medium"
                    >
                      إلغاء
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">
                  المجموعات الموجودة
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {groups.map((group) => (
                  <div key={group._id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">
                          {group.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {group.description}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingGroup(group)}
                          className="p-2 hover:bg-gray-100 rounded transition text-blue-600"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group._id)}
                          className="p-2 hover:bg-gray-100 rounded transition text-red-600"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        الصلاحيات ({group.permissions?.length || 0}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {group.permissions?.map((perm) => (
                          <span
                            key={perm._id}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                          >
                            {perm.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        الأعضاء ({group.members?.length || 0}):
                      </p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {group.members?.map((user) => (
                          <div
                            key={user._id}
                            className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded"
                          >
                            <span className="text-sm">{user.username}</span>
                            <button
                              onClick={() =>
                                handleRemoveUserFromGroup(group._id, user._id)
                              }
                              className="text-red-600 hover:text-red-800 font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>

                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddUserToGroup(group._id, e.target.value);
                            e.target.value = "";
                          }
                        }}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">إضافة مستخدم...</option>
                        {users
                          ?.filter(
                            (u) => !group.members?.some((m) => m._id === u._id)
                          )
                          .map((user) => (
                            <option key={user._id} value={user._id}>
                              {user.username}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
