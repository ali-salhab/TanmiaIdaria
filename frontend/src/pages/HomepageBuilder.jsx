import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FaEdit, FaEye, FaEyeSlash } from "react-icons/fa";
import { Settings } from "lucide-react";
import API from "../api/api";
import DropdownWithSettings from "../components/DropdownWithSettings";
import PermissionsManager from "./PermissionsManager";
export default function HomepageBuilder() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("homepage");
  const [sortOrder, setSortOrder] = useState("desc");
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "employee",
  });
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    userId: null,
    username: "",
  });
  const [editUserId, setEditUserId] = useState(null);
  const [editedUser, setEditedUser] = useState({});
  const [showPasswords, setShowPasswords] = useState({});
  const [editingPermissions, setEditingPermissions] = useState(null);
  const [tempPermissions, setTempPermissions] = useState({});
  const [permissionGroups, setPermissionGroups] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [selectedGroupPermissions, setSelectedGroupPermissions] = useState([]);
  const [groupMembers, setGroupMembers] = useState({});
  const [expandedGroup, setExpandedGroup] = useState(null);

  const availableWidgets = [
    {
      id: "employees",
      label: "الموظفين",
      defaultColor: "from-green-400 to-emerald-500",
    },
    {
      id: "vacations",
      label: "الإجازات",
      defaultColor: "from-blue-400 to-sky-500",
    },
    {
      id: "incidents",
      label: "الحوادث",
      defaultColor: "from-red-400 to-rose-500",
    },
    {
      id: "documents",
      label: "الوثائق",
      defaultColor: "from-purple-400 to-violet-500",
    },
    {
      id: "salary",
      label: "الرواتب",
      defaultColor: "from-orange-400 to-amber-500",
    },
    {
      id: "rewards",
      label: "المكافآت",
      defaultColor: "from-pink-400 to-red-500",
    },
  ];

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
    fetchPermissionGroups();
    fetchAllPermissions();
  }, []);

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [sortOrder]);

  const fetchCurrentUser = async () => {
    try {
      const res = await API.get("/auth/me");
      setCurrentUser(res.data.user);
      setIsAdmin(res.data.user.role === "admin");
    } catch (err) {
      toast.error("❌ فشل في جلب بيانات المستخدم");
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await API.get("/users");
      let data = res.data;
      data.sort((a, b) =>
        sortOrder === "asc"
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt)
      );
      setUsers(data);
    } catch {
      toast.error("❌ فشل في تحميل المستخدمين");
    }
  };

  const createUser = async () => {
    try {
      await API.post("/users", newUser);
      toast.success("✅ تم إنشاء المستخدم بنجاح!");
      setNewUser({ username: "", password: "", role: "employee" });
      fetchUsers();
    } catch (error) {
      const msg = error.response?.data?.message || "❌ فشل في إنشاء المستخدم!";
      toast.error(msg);
    }
  };

  const confirmDeleteUser = (id, username) =>
    setDeleteModal({ show: true, userId: id, username });

  const cancelDelete = () =>
    setDeleteModal({ show: false, userId: null, username: "" });

  const deleteUser = async () => {
    try {
      await API.delete(`users/${deleteModal.userId}`);
      toast.success("🗑️ تم حذف المستخدم");
      cancelDelete();
      fetchUsers();
    } catch {
      toast.error("❌ فشل في حذف المستخدم");
    }
  };

  const startEdit = (user) => {
    setEditUserId(user._id);
    setEditedUser({ username: user.username, role: user.role });
  };

  const saveEdit = async (id) => {
    try {
      await API.put(`/users/${id}`, editedUser, {
        username: editedUser.username,
        role: editedUser.role,
      });
      toast.success("✅ تم حفظ التعديلات");
      setEditUserId(null);
      fetchUsers();
    } catch {
      toast.error("❌ فشل في تعديل المستخدم");
    }
  };

  const togglePassword = (id) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const startEditPermissions = (user) => {
    setEditingPermissions(user._id);
    setTempPermissions({ ...user.permissions });
  };

  const cancelEditPermissions = () => {
    setEditingPermissions(null);
    setTempPermissions({});
  };

  const savePermissions = async (id) => {
    try {
      await API.put(`/users/${id}/permissions`, {
        permissions: tempPermissions,
      });
      toast.success("✅ تم تحديث الصلاحيات بنجاح!");
      setEditingPermissions(null);
      setTempPermissions({});
      fetchUsers();
    } catch (error) {
      toast.error("❌ فشل في تحديث الصلاحيات");
    }
  };

  const togglePermission = (key) => {
    setTempPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const fetchPermissionGroups = async () => {
    try {
      const res = await API.get("/permissions/groups");
      setPermissionGroups(res.data || []);
    } catch (err) {
      console.error("فشل في جلب مجموعات الصلاحيات:", err);
    }
  };

  const fetchAllPermissions = async () => {
    try {
      const res = await API.get("/permissions");
      setAllPermissions(res.data || []);
    } catch (err) {
      console.error("فشل في جلب الصلاحيات:", err);
    }
  };

  const createPermissionGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error("❌ اسم المجموعة مطلوب");
      return;
    }
    try {
      await API.post("/permissions/groups", { name: newGroupName });
      toast.success("✅ تم إنشاء مجموعة الصلاحيات بنجاح!");
      setNewGroupName("");
      fetchPermissionGroups();
    } catch (err) {
      toast.error(err.response?.data?.message || "❌ فشل في إنشاء المجموعة");
    }
  };

  const updateGroupPermissions = async (groupId, permissionIds) => {
    try {
      await API.put(`/permissions/groups/${groupId}/permissions`, {
        permissions: permissionIds,
      });
      toast.success("✅ تم تحديث صلاحيات المجموعة!");
      fetchPermissionGroups();
    } catch (err) {
      toast.error("❌ فشل في تحديث الصلاحيات");
    }
  };

  const deletePermissionGroup = async (groupId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه المجموعة؟")) return;
    try {
      await API.delete(`/permissions/groups/${groupId}`);
      toast.success("🗑️ تم حذف المجموعة");
      fetchPermissionGroups();
    } catch (err) {
      toast.error("❌ فشل في حذف المجموعة");
    }
  };

  const updateGroupName = async (groupId) => {
    if (!editingGroupName.trim()) {
      toast.error("❌ اسم المجموعة مطلوب");
      return;
    }
    try {
      await API.put(`/permissions/groups/${groupId}`, {
        name: editingGroupName,
      });
      toast.success("✅ تم تحديث اسم المجموعة!");
      setEditingGroupId(null);
      setEditingGroupName("");
      fetchPermissionGroups();
    } catch (err) {
      toast.error("❌ فشل في تحديث اسم المجموعة");
    }
  };

  const fetchSettings = async (userId) => {
    try {
      let res;
      if (isAdmin) {
        res = await API.get(`/homepage/${userId}`);
      } else {
        if (userId !== currentUser?._id) {
          toast.error("❌ لا يمكنك تخصيص صفحة مستخدم آخر");
          setSettings(null);
          return;
        }
        res = await API.get(`/homepage/my-settings`);
      }
      setSettings(res.data);
    } catch {
      const defaultSettings = {
        userId,
        widgets: availableWidgets.map((w, idx) => ({
          id: w.id,
          type: w.id,
          label: w.label,
          order: idx,
          enabled: true,
          color: w.defaultColor,
        })),
        layout: "grid",
        columns: 3,
      };
      setSettings(defaultSettings);
    }
  };

  const handleUserSelect = (userId) => {
    setSelectedUser(userId);
    fetchSettings(userId);
  };

  const toggleWidget = (widgetId) => {
    if (!settings) return;
    setSettings((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) =>
        w.id === widgetId ? { ...w, enabled: !w.enabled } : w
      ),
    }));
  };

  const changeWidgetOrder = (widgetId, direction) => {
    if (!settings) return;
    const currentIndex = settings.widgets.findIndex((w) => w.id === widgetId);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === settings.widgets.length - 1)
    )
      return;

    const newWidgets = [...settings.widgets];
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    [newWidgets[currentIndex], newWidgets[swapIndex]] = [
      newWidgets[swapIndex],
      newWidgets[currentIndex],
    ];

    newWidgets.forEach((w, idx) => (w.order = idx));
    setSettings((prev) => ({ ...prev, widgets: newWidgets }));
  };

  const updateLayout = (newLayout) => {
    if (!settings) return;
    setSettings((prev) => ({ ...prev, layout: newLayout }));
  };

  const updateColumns = (newColumns) => {
    if (!settings) return;
    setSettings((prev) => ({ ...prev, columns: newColumns }));
  };

  const saveSettings = async () => {
    if (!selectedUser || !settings) return;

    try {
      setSaving(true);
      if (isAdmin) {
        await API.put(`/homepage/${selectedUser}`, {
          widgets: settings.widgets,
          layout: settings.layout,
          columns: settings.columns,
        });
      } else {
        if (selectedUser !== currentUser?._id) {
          toast.error("❌ لا يمكنك حفظ إعدادات مستخدم آخر");
          return;
        }
        await API.put(`/homepage/my-settings`, {
          widgets: settings.widgets,
          layout: settings.layout,
          columns: settings.columns,
        });
      }
      toast.success("✅ تم حفظ الإعدادات بنجاح!");
    } catch (err) {
      console.error("Save error:", err.response?.data || err.message);
      toast.error("❌ فشل في حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-3xl font-semibold text-gray-800">
          {activeTab === "homepage"
            ? "🎨 أداة تخصيص الصفحة الرئيسية"
            : "👑 إدارة المستخدمين والصلاحيات"}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("homepage")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "homepage"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            🎨 الصفحة الرئيسية
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab("permissions")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === "permissions"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                🔐 مجموعات الصلاحيات
              </button>
              <button
                onClick={() => setActiveTab("permissions-managment")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === "permissions-managment"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                ادارة الصلاحيات
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === "users"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                👥 المستخدمون
              </button>
            </>
          )}
        </div>
      </div>

      {/* Homepage Builder Tab */}
      {activeTab === "homepage" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Users List - Only for Admins */}
          {isAdmin && (
            <div className="bg-white rounded-2xl shadow p-6 lg:col-span-1">
              <h3 className="text-lg font-medium mb-4 text-gray-700">
                المستخدمون
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => handleUserSelect(user._id)}
                    className={`w-full text-right p-3 rounded-lg transition ${
                      selectedUser === user._id
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    <div className="font-medium">{user.username}</div>
                    <div className="text-xs opacity-75">{user.role}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Settings Panel */}
          <div
            className={`bg-white rounded-2xl shadow p-6 ${
              isAdmin ? "lg:col-span-3" : "lg:col-span-4"
            }`}
          >
            {!isAdmin && currentUser && !selectedUser && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800">
                  تخصيص صفحتك الرئيسية: <strong>{currentUser.username}</strong>
                </p>
                <button
                  onClick={() => handleUserSelect(currentUser._id)}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  ابدأ التخصيص
                </button>
              </div>
            )}
            {selectedUser && settings ? (
              <>
                <div className="space-y-6">
                  {/* Layout Settings */}
                  <div>
                    <h4 className="font-medium mb-3 text-gray-700">
                      إعدادات التخطيط
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">
                          نوع التخطيط
                        </label>
                        <select
                          value={settings.layout}
                          onChange={(e) => updateLayout(e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                        >
                          <option value="grid">شبكة (Grid)</option>
                          <option value="list">قائمة (List)</option>
                        </select>
                      </div>

                      {settings.layout === "grid" && (
                        <div>
                          <label className="block text-sm text-gray-600 mb-2">
                            عدد الأعمدة
                          </label>
                          <select
                            value={settings.columns}
                            onChange={(e) =>
                              updateColumns(parseInt(e.target.value))
                            }
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                          >
                            <option value={1}>1 عمود</option>
                            <option value={2}>عمودين</option>
                            <option value={3}>3 أعمدة</option>
                            <option value={4}>4 أعمدة</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Widgets Management */}
                  <div>
                    <h4 className="font-medium mb-3 text-gray-700">
                      إدارة الأداوات
                    </h4>
                    <div className="space-y-2">
                      {settings.widgets.map((widget, idx) => (
                        <div
                          key={widget.id}
                          className={`flex items-center justify-between p-4 rounded-lg border-2 transition ${
                            widget.enabled
                              ? "border-green-300 bg-green-50"
                              : "border-gray-300 bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <input
                              type="checkbox"
                              checked={widget.enabled}
                              onChange={() => toggleWidget(widget.id)}
                              className="w-5 h-5 accent-blue-600"
                            />
                            <span className="font-medium text-gray-700">
                              {widget.label}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => changeWidgetOrder(widget.id, "up")}
                              disabled={idx === 0}
                              className="px-2 py-1 text-sm bg-blue-500 text-white rounded disabled:opacity-50"
                            >
                              ⬆️
                            </button>
                            <button
                              onClick={() =>
                                changeWidgetOrder(widget.id, "down")
                              }
                              disabled={idx === settings.widgets.length - 1}
                              className="px-2 py-1 text-sm bg-blue-500 text-white rounded disabled:opacity-50"
                            >
                              ⬇️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition disabled:opacity-50"
                  >
                    {saving ? "جاري الحفظ..." : "💾 حفظ الإعدادات"}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                اختر مستخدماً لتخصيص صفحته الرئيسية
              </div>
            )}
          </div>
        </div>
      )}
      {activeTab == "managment-permissions" && <PermissionsManager />}
      {/* Permission Groups Tab */}
      {activeTab === "permissions" && (
        <div dir="rtl" className="min-h-screen bg-gray-100 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Create New Group */}
            <div className="bg-white p-6 rounded-2xl shadow mb-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                ➕ إنشاء مجموعة صلاحيات جديدة
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="اسم المجموعة (مثال: موظفي الموارد البشرية)"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="flex-1 border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={createPermissionGroup}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                >
                  إنشاء
                </button>
              </div>
            </div>

            {/* Permission Groups List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {permissionGroups.length > 0 ? (
                permissionGroups.map((group) => (
                  <div
                    key={group._id}
                    className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600"
                  >
                    <div className="flex items-start justify-between mb-4">
                      {editingGroupId === group._id ? (
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={editingGroupName}
                            onChange={(e) =>
                              setEditingGroupName(e.target.value)
                            }
                            className="flex-1 border border-gray-300 px-3 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                          <button
                            onClick={() => updateGroupName(group._id)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => {
                              setEditingGroupId(null);
                              setEditingGroupName("");
                            }}
                            className="px-3 py-1 bg-gray-400 text-white rounded text-sm hover:bg-gray-500"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-800">
                            {group.name}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {group.permissions?.length || 0} صلاحيات
                          </p>
                        </div>
                      )}
                    </div>

                    {editingGroupId === group._id && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
                        <h5 className="text-sm font-semibold text-gray-700 mb-3">
                          اختر الصلاحيات:
                        </h5>
                        <div className="space-y-2">
                          {allPermissions.map((perm) => (
                            <label
                              key={perm._id}
                              className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white p-2 rounded transition"
                            >
                              <input
                                type="checkbox"
                                checked={selectedGroupPermissions.includes(
                                  perm._id
                                )}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedGroupPermissions([
                                      ...selectedGroupPermissions,
                                      perm._id,
                                    ]);
                                  } else {
                                    setSelectedGroupPermissions(
                                      selectedGroupPermissions.filter(
                                        (id) => id !== perm._id
                                      )
                                    );
                                  }
                                }}
                                className="accent-blue-600 h-4 w-4"
                              />
                              <span className="text-gray-700">
                                {perm.label}
                              </span>
                              <span className="text-xs text-gray-500 ml-auto">
                                {perm.category}
                              </span>
                            </label>
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            updateGroupPermissions(
                              group._id,
                              selectedGroupPermissions
                            );
                            setEditingGroupId(null);
                          }}
                          className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                        >
                          حفظ الصلاحيات
                        </button>
                      </div>
                    )}

                    {!editingGroupId && group.permissions && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-600 mb-2">
                          الصلاحيات:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {group.permissions.slice(0, 3).map((perm) => (
                            <span
                              key={perm._id}
                              className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                            >
                              {perm.label}
                            </span>
                          ))}
                          {group.permissions.length > 3 && (
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                              +{group.permissions.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {!editingGroupId && (
                      <div className="flex gap-2 pt-4 border-t">
                        <button
                          onClick={() => {
                            setEditingGroupId(group._id);
                            setEditingGroupName(group.name);
                            setSelectedGroupPermissions(
                              group.permissions?.map((p) => p._id) || []
                            );
                          }}
                          className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => deletePermissionGroup(group._id)}
                          className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
                        >
                          حذف
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <p className="text-lg mb-2">لا توجد مجموعات صلاحيات حالياً</p>
                  <p className="text-sm">قم بإنشاء مجموعة أولى لتبدأ</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Users Management Tab */}
      {activeTab === "users" && (
        <div dir="rtl" className="min-h-screen bg-gray-100">
          {/* إنشاء مستخدم جديد */}
          <div className="bg-white p-6 rounded-2xl shadow mb-10 max-w-2xl">
            <h3 className="text-lg font-medium mb-4 text-gray-700">
              ➕ إنشاء مستخدم جديد
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="اسم المستخدم"
                value={newUser.username}
                onChange={(e) =>
                  setNewUser({ ...newUser, username: e.target.value })
                }
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
              />
              <input
                type="password"
                placeholder="كلمة المرور"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
              />
              <DropdownWithSettings
                id="homepage_new_user_role"
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value })
                }
                options={[
                  { value: "admin", label: "مدير عام" },
                  { value: "employee", label: "مدير فرعي" },
                  { value: "viewer", label: "مشاهد" },
                  { value: "hr", label: "شؤون الموظفين" },
                  { value: "finance", label: "محاسب" },
                ]}
                placeholder="اختر الدور"
                className="border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-400 outline-none"
              />
            </div>
            <button
              onClick={createUser}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              إنشاء
            </button>
          </div>

          {/* فرز المستخدمين */}
          <div className="flex justify-end items-center mb-4">
            <DropdownWithSettings
              id="homepage_sort_order"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              options={[
                { value: "desc", label: "الأحدث أولاً" },
                { value: "asc", label: "الأقدم أولاً" },
              ]}
              placeholder="ترتيب حسب"
              className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white"
            />
          </div>

          {/* جدول المستخدمين */}
          <div className="bg-white rounded-2xl shadow overflow-x-auto">
            <table className="min-w-[700px] w-full border-collapse">
              <thead className="bg-blue-50 border-b">
                <tr>
                  <th className="py-3 px-4 text-right text-gray-700 font-semibold">
                    اسم المستخدم
                  </th>
                  <th className="py-3 px-4 text-right text-gray-700 font-semibold">
                    الدور
                  </th>
                  <th className="py-3 px-4 text-right text-gray-700 font-semibold">
                    كلمة المرور
                  </th>
                  <th className="py-3 px-4 text-right text-gray-700 font-semibold">
                    الصلاحيات
                  </th>
                  <th className="py-3 px-4 text-right text-gray-700 font-semibold">
                    تاريخ الإنشاء
                  </th>
                  <th className="py-3 px-4 text-center text-gray-700 font-semibold">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u._id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="py-3 px-4 font-medium text-gray-800">
                      {editUserId === u._id ? (
                        <input
                          value={editedUser.username}
                          onChange={(e) =>
                            setEditedUser({
                              ...editedUser,
                              username: e.target.value,
                            })
                          }
                          className="border rounded-lg px-2 py-1 w-full"
                        />
                      ) : (
                        u.username
                      )}
                      <button
                        onClick={() =>
                          editUserId === u._id ? saveEdit(u._id) : startEdit(u)
                        }
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <FaEdit />
                      </button>
                    </td>

                    <td className="py-3 px-4 text-gray-700 capitalize">
                      {editUserId === u._id ? (
                        <select
                          value={editedUser.role}
                          onChange={(e) =>
                            setEditedUser({
                              ...editedUser,
                              role: e.target.value,
                            })
                          }
                          className="border rounded-lg px-2 py-1"
                        >
                          <option value="admin">مدير عام</option>
                          <option value="employee">مدير فرعي</option>
                          <option value="viewer">مشاهد</option>
                          <option value="hr">شؤون الموظفين</option>
                          <option value="finance">محاسب</option>
                        </select>
                      ) : (
                        u.role
                      )}
                    </td>

                    <td className="py-3 px-4 text-gray-700 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <span>
                          {showPasswords[u._id]
                            ? u.password || "••••••"
                            : "••••••"}
                        </span>
                        <button
                          onClick={() => togglePassword(u._id)}
                          className="text-gray-600 hover:text-blue-600"
                        >
                          {showPasswords[u._id] ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {editingPermissions === u._id ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                          {Object.keys(tempPermissions || {}).map((key) => (
                            <label
                              key={key}
                              className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={tempPermissions[key]}
                                onChange={() => togglePermission(key)}
                                className="accent-blue-600 h-4 w-4"
                              />
                              {key.replace(/([A-Z])/g, " $1")}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                          {Object.keys(u.permissions || {}).map((key) => (
                            <label
                              key={key}
                              className="flex items-center gap-2 text-sm text-gray-600"
                            >
                              <input
                                type="checkbox"
                                checked={u.permissions[key]}
                                disabled
                                className="accent-blue-600 h-4 w-4"
                              />
                              {key.replace(/([A-Z])/g, " $1")}
                            </label>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-gray-700">
                      {new Date(u.createdAt).toLocaleDateString("ar-EG")}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {editingPermissions === u._id ? (
                        <div className="flex gap-2 justify-center flex-wrap">
                          <button
                            onClick={() => savePermissions(u._id)}
                            className="text-green-600 hover:text-green-800 font-medium border border-green-200 px-2 py-1 rounded-lg transition text-sm"
                          >
                            حفظ ✓
                          </button>
                          <button
                            onClick={cancelEditPermissions}
                            className="text-gray-600 hover:text-gray-800 font-medium border border-gray-200 px-2 py-1 rounded-lg transition text-sm"
                          >
                            إلغاء ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-center flex-wrap">
                          <button
                            onClick={() => startEditPermissions(u)}
                            className="text-blue-600 hover:text-blue-800 font-medium border border-blue-200 px-2 py-1 rounded-lg transition text-sm"
                          >
                            تعديل الصلاحيات
                          </button>
                          <button
                            onClick={() => confirmDeleteUser(u._id, u.username)}
                            className="text-red-600 hover:text-red-800 font-medium border border-red-200 px-2 py-1 rounded-lg transition text-sm"
                          >
                            حذف ❌
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-6 text-gray-500 italic"
                    >
                      لا يوجد مستخدمون حالياً.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* نافذة تأكيد الحذف */}
          {deleteModal.show && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300 opacity-100"></div>
              <div className="relative bg-white rounded-xl shadow-lg p-6 w-96 text-center transform transition-all duration-300 ease-out scale-100 opacity-100">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">
                  تأكيد الحذف
                </h3>
                <p className="text-gray-600 mb-6">
                  هل أنت متأكد من حذف{" "}
                  <span className="font-semibold text-red-600">
                    {deleteModal.username}
                  </span>
                  ؟
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={deleteUser}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
                  >
                    تأكيد
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
