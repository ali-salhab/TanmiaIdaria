import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { FaEdit, FaEye, FaEyeSlash } from "react-icons/fa";
import { Settings } from "lucide-react";
import API from "../api/api";
import DropdownWithSettings from "../components/DropdownWithSettings";
import PermissionGroupsPage from "./permissions/PermissionGroupsPage";
import PermissionPage from "./permissions/PermissionsPage";
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
  const [permissionGroups, setPermissionGroups] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [selectedGroupPermissions, setSelectedGroupPermissions] = useState([]);
  const [groupMembers, setGroupMembers] = useState({});
  const [expandedGroup, setExpandedGroup] = useState(null);

  // Employee-based user creation
  const [employees, setEmployees] = useState([]);
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [isSearchingEmployees, setIsSearchingEmployees] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const employeeSearchWrapRef = useRef(null);
  const employeeSearchTimerRef = useRef(null);
  const [editingGroups, setEditingGroups] = useState(null);
  const [tempGroups, setTempGroups] = useState([]);

  const groupIdToName = useMemo(() => {
    const map = new Map();
    for (const g of permissionGroups) {
      if (g?._id) map.set(g._id, g.name || "");
    }
    return map;
  }, [permissionGroups]);

  const getGroupAbbrev = (name) => {
    if (!name) return "";
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "";
    // Arabic-friendly fallback: take first 3 characters if no latin initials make sense
    const letters = parts
      .map((p) => p[0])
      .join("")
      .toUpperCase();
    const short = letters.slice(0, 3);
    return short || String(name).slice(0, 3);
  };

  const formatGroupSummary = (groups) => {
    if (!groups || groups.length === 0)
      return { text: "لا توجد مجموعات", title: "" };
    const names = groups
      .map((g) => {
        if (!g) return "";
        if (typeof g === "string") return groupIdToName.get(g) || "";
        return g.name || groupIdToName.get(g._id) || "";
      })
      .filter(Boolean);
    if (names.length === 0) return { text: "لا توجد مجموعات", title: "" };
    const abbrevs = names.map(getGroupAbbrev).filter(Boolean);
    const uniqueAbbrevs = Array.from(new Set(abbrevs));
    const shown = uniqueAbbrevs.slice(0, 3);
    const rest = uniqueAbbrevs.length - shown.length;
    return {
      text: rest > 0 ? `${shown.join(" · ")} +${rest}` : shown.join(" · "),
      title: names.join("، "),
    };
  };

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
      label: "الوقوعات الوظيفية",
      defaultColor: "from-red-400 to-rose-500",
    },
    {
      id: "documents",
      label: "الوثائق",
      defaultColor: "from-purple-400 to-violet-500",
    },
    {
      id: "salary",
      label: "العقوبات",
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
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowEmployeeDropdown(false);
      }
    };
    const onMouseDown = (e) => {
      const wrap = employeeSearchWrapRef.current;
      if (wrap && !wrap.contains(e.target)) {
        setShowEmployeeDropdown(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
      if (employeeSearchTimerRef.current) {
        clearTimeout(employeeSearchTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [sortOrder, activeTab]);

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
      if (!newUser.employeeId) {
        toast.error("❌ يرجى اختيار موظف");
        return;
      }
      if (!newUser.password) {
        toast.error("❌ يرجى إدخال كلمة المرور");
        return;
      }

      await API.post("/users", {
        ...newUser,
        permissionGroups: selectedGroups,
      });
      toast.success("✅ تم إنشاء المستخدم بنجاح!");
      setNewUser({
        username: "",
        password: "",
        role: "employee",
        employeeId: "",
      });
      setEmployeeQuery("");
      setEmployees([]);
      setShowEmployeeDropdown(false);
      setSelectedGroups([]);
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

  const startEditGroups = (user) => {
    setEditingGroups(user._id);
    setTempGroups(
      user.permissionGroups ? user.permissionGroups.map((g) => g._id) : []
    );
  };

  const cancelEditGroups = () => {
    setEditingGroups(null);
    setTempGroups([]);
  };

  const saveGroups = async (id) => {
    try {
      await API.put(`/users/${id}`, { permissionGroups: tempGroups });
      toast.success("✅ تم تحديث المجموعات بنجاح!");
      setEditingGroups(null);
      setTempGroups([]);
      fetchUsers();
    } catch {
      toast.error("❌ فشل في تحديث المجموعات");
    }
  };

  const toggleGroup = (groupId) => {
    if (tempGroups.includes(groupId)) {
      setTempGroups(tempGroups.filter((id) => id !== groupId));
    } else {
      setTempGroups([...tempGroups, groupId]);
    }
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

  const searchEmployees = async (query) => {
    const trimmed = String(query || "").trim();
    if (trimmed.length < 2) {
      setEmployees([]);
      setShowEmployeeDropdown(false);
      setIsSearchingEmployees(false);
      return;
    }

    try {
      setIsSearchingEmployees(true);
      const res = await API.get(
        `/users/search/employees?q=${encodeURIComponent(trimmed)}`
      );
      setEmployees(Array.isArray(res.data) ? res.data : []);
      setShowEmployeeDropdown(true);
    } catch (err) {
      console.error("Error searching employees:", err);
      setEmployees([]);
      setShowEmployeeDropdown(true);
    } finally {
      setIsSearchingEmployees(false);
    }
  };

  const scheduleEmployeeSearch = (query) => {
    if (employeeSearchTimerRef.current) {
      clearTimeout(employeeSearchTimerRef.current);
    }
    employeeSearchTimerRef.current = setTimeout(() => {
      searchEmployees(query);
    }, 250);
  };

  const handleEmployeeSelect = (employee) => {
    const name =
      employee.fullName || `${employee.firstName} ${employee.lastName}`.trim();
    setNewUser((prev) => ({
      ...prev,
      employeeId: employee._id,
      username: name,
    }));
    setEmployeeQuery(name);
    setShowEmployeeDropdown(false);
    setEmployees([]);
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
    <div dir="rtl" className="min-h-screen bg-slate-900 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-3xl font-semibold text-slate-100">
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
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
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
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                🔐 مجموعات الصلاحيات
              </button>
              <button
                onClick={() => setActiveTab("permission-manager")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === "permission-manager"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                🛡️ إدارة الصلاحيات
              </button>

              <button
                onClick={() => setActiveTab("users")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === "users"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                👥 المستخدمون
              </button>
            </>
          )}
        </div>
      </div>

      {/* Homepage Builder Tab */}
      {activeTab === "permission-manager" && <PermissionPage />}
      {activeTab === "homepage" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Users List - Only for Admins */}
          {isAdmin && (
            <div className="bg-slate-800 rounded-2xl shadow p-6 lg:col-span-1 border border-slate-700">
              <h3 className="text-lg font-medium mb-4 text-slate-100">
                المستخدمون
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => handleUserSelect(user._id)}
                    className={`w-full text-right p-3 rounded-lg transition ${
                      selectedUser === user._id
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
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
            className={`bg-slate-800 rounded-2xl shadow p-6 border border-slate-700 ${
              isAdmin ? "lg:col-span-3" : "lg:col-span-4"
            }`}
          >
            {!isAdmin && currentUser && !selectedUser && (
              <div className="mb-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-blue-400">
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
                    <h4 className="font-medium mb-3 text-slate-100">
                      إعدادات التخطيط
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">
                          نوع التخطيط
                        </label>
                        <select
                          value={settings.layout}
                          onChange={(e) => updateLayout(e.target.value)}
                          className="w-full border border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none bg-slate-700 text-slate-100"
                        >
                          <option value="grid">شبكة (Grid)</option>
                          <option value="list">قائمة (List)</option>
                        </select>
                      </div>

                      {settings.layout === "grid" && (
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">
                            عدد الأعمدة
                          </label>
                          <select
                            value={settings.columns}
                            onChange={(e) =>
                              updateColumns(parseInt(e.target.value))
                            }
                            className="w-full border border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none bg-slate-700 text-slate-100"
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
                    <h4 className="font-medium mb-3 text-slate-100">
                      إدارة الأداوات
                    </h4>
                    <div className="space-y-2">
                      {settings.widgets.map((widget, idx) => (
                        <div
                          key={widget.id}
                          className={`flex items-center justify-between p-4 rounded-lg border transition ${
                            widget.enabled
                              ? "border-green-500/30 bg-green-500/10"
                              : "border-slate-600 bg-slate-700/50"
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <input
                              type="checkbox"
                              checked={widget.enabled}
                              onChange={() => toggleWidget(widget.id)}
                              className="w-5 h-5 accent-blue-600"
                            />
                            <span className="font-medium text-slate-200">
                              {widget.label}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => changeWidgetOrder(widget.id, "up")}
                              disabled={idx === 0}
                              className="px-2 py-1 text-sm bg-blue-600 text-white rounded disabled:opacity-50 hover:bg-blue-700"
                            >
                              ⬆️
                            </button>
                            <button
                              onClick={() =>
                                changeWidgetOrder(widget.id, "down")
                              }
                              disabled={idx === settings.widgets.length - 1}
                              className="px-2 py-1 text-sm bg-blue-600 text-white rounded disabled:opacity-50 hover:bg-blue-700"
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
              <div className="text-center py-12 text-slate-500">
                اختر مستخدماً لتخصيص صفحته الرئيسية
              </div>
            )}
          </div>
        </div>
      )}
      {/* Permission Groups Tab */}
      {activeTab === "permissions" && <PermissionGroupsPage />}

      {/* Users Management Tab (no direct permissions control) */}
      {activeTab === "users" && (
        <div dir="rtl" className="min-h-screen bg-slate-900">
          <div className="bg-slate-800 p-6 rounded-2xl shadow mb-6 max-w-3xl border border-slate-700">
            <h3 className="text-lg font-medium mb-4 text-slate-100">
              ➕ إنشاء مستخدم جديد (من جدول الموظفين)
            </h3>

            <div className="space-y-4">
              <div className="relative" ref={employeeSearchWrapRef}>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  🔍 البحث عن الموظف
                </label>
                <input
                  type="text"
                  placeholder="ابحث عن الموظف بالاسم أو الرقم الوطني..."
                  value={employeeQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEmployeeQuery(value);
                    setShowEmployeeDropdown(true);
                    scheduleEmployeeSearch(value);
                    if (!value.trim()) {
                      setNewUser((prev) => ({
                        ...prev,
                        employeeId: "",
                        username: "",
                      }));
                    }
                  }}
                  onFocus={() => {
                    if (String(employeeQuery || "").trim().length >= 2) {
                      setShowEmployeeDropdown(true);
                    }
                  }}
                  className="border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 outline-none w-full bg-slate-700 text-slate-100 placeholder-slate-400"
                />

                {showEmployeeDropdown &&
                  String(employeeQuery || "").trim().length >= 2 && (
                    <div className="absolute z-10 mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {isSearchingEmployees && (
                        <div className="px-4 py-3 text-sm text-slate-400">
                          جاري البحث...
                        </div>
                      )}

                      {!isSearchingEmployees && employees.length === 0 && (
                        <div className="px-4 py-3 text-sm text-slate-400">
                          لا توجد نتائج.
                        </div>
                      )}

                      {!isSearchingEmployees &&
                        employees.map((employee) => (
                          <div
                            key={employee._id}
                            className="px-4 py-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700 last:border-b-0"
                            onClick={() => handleEmployeeSelect(employee)}
                          >
                            <div className="font-medium text-slate-200">
                              {employee.fullName ||
                                `${employee.firstName} ${employee.lastName}`}
                            </div>
                            <div className="text-sm text-slate-400">
                              {employee.nationalId &&
                                `الرقم الوطني: ${employee.nationalId}`}
                              {employee.phone && ` | الهاتف: ${employee.phone}`}
                              {employee.currentJobTitle &&
                                ` | ${employee.currentJobTitle}`}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
              </div>

              {newUser.employeeId && (
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-green-400 font-medium">
                        ✅ الموظف المحدد:{" "}
                      </span>
                      <span className="text-green-300 font-bold">
                        {newUser.username}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setNewUser((prev) => ({
                          ...prev,
                          employeeId: "",
                          username: "",
                        }));
                        setEmployeeQuery("");
                      }}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      ✕ إلغاء التحديد
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    🔐 كلمة المرور
                  </label>
                  <input
                    type="password"
                    placeholder="أدخل كلمة مرور للمستخدم الجديد..."
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                    className="border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 outline-none w-full bg-slate-700 text-slate-100 placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    👤 الدور
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({ ...newUser, role: e.target.value })
                    }
                    className="border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 outline-none w-full bg-slate-700 text-slate-100"
                  >
                    <option value="admin">مدير عام</option>
                    <option value="employee">مدير فرعي</option>
                    <option value="viewer">مشاهد</option>
                    <option value="hr">شؤون الموظفين</option>
                    <option value="finance">محاسب</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  🛡️ مجموعات الصلاحيات
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto border border-slate-600 p-3 rounded-lg bg-slate-700/50">
                  {permissionGroups.map((group) => (
                    <label
                      key={group._id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-slate-600 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedGroups.includes(group._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGroups([...selectedGroups, group._id]);
                          } else {
                            setSelectedGroups(
                              selectedGroups.filter((id) => id !== group._id)
                            );
                          }
                        }}
                        className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500 bg-slate-800 border-slate-500"
                      />
                      <span className="text-sm text-slate-300">
                        {group.name}
                      </span>
                    </label>
                  ))}
                </div>
                {selectedGroups.length > 0 && (
                  <p className="text-sm text-blue-400 mt-2">
                    تم تحديد {selectedGroups.length} مجموعة
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={createUser}
              disabled={!newUser.employeeId || !newUser.password}
              className={`mt-6 px-6 py-3 rounded-lg transition font-medium ${
                newUser.employeeId && newUser.password
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-slate-700 text-slate-500 cursor-not-allowed"
              }`}
            >
              ✅ إنشاء المستخدم
            </button>
          </div>

          <div className="flex justify-end items-center mb-4">
            <DropdownWithSettings
              id="homepage_users_sort_order"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              options={[
                { value: "desc", label: "الأحدث أولاً" },
                { value: "asc", label: "الأقدم أولاً" },
              ]}
              placeholder="ترتيب حسب"
              className="border border-slate-600 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-slate-800 text-slate-100"
            />
          </div>

          <div className="bg-slate-800 rounded-2xl shadow overflow-x-auto border border-slate-700">
            <table className="min-w-[900px] w-full border-collapse">
              <thead className="bg-slate-700 border-b border-slate-600">
                <tr>
                  <th className="py-3 px-4 text-right text-slate-300 font-semibold">
                    اسم المستخدم
                  </th>
                  <th className="py-3 px-4 text-right text-slate-300 font-semibold">
                    الموظف
                  </th>
                  <th className="py-3 px-4 text-right text-slate-300 font-semibold">
                    الدور
                  </th>
                  <th className="py-3 px-4 text-right text-slate-300 font-semibold">
                    كلمة المرور
                  </th>
                  <th className="py-3 px-4 text-right text-slate-300 font-semibold">
                    المجموعات
                  </th>
                  <th className="py-3 px-4 text-right text-slate-300 font-semibold">
                    تاريخ الإنشاء
                  </th>
                  <th className="py-3 px-4 text-center text-slate-300 font-semibold">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const groupSummary = formatGroupSummary(u.permissionGroups);
                  return (
                    <tr
                      key={u._id}
                      className="border-b border-slate-700 hover:bg-slate-700/50 transition"
                    >
                      <td className="py-3 px-4 font-medium text-slate-200">
                        {editUserId === u._id ? (
                          <input
                            value={editedUser.username}
                            onChange={(e) =>
                              setEditedUser({
                                ...editedUser,
                                username: e.target.value,
                              })
                            }
                            className="border border-slate-600 rounded-lg px-2 py-1 w-full bg-slate-700 text-slate-100"
                          />
                        ) : (
                          u.username
                        )}
                        <button
                          onClick={() =>
                            editUserId === u._id
                              ? saveEdit(u._id)
                              : startEdit(u)
                          }
                          className="ml-2 text-blue-400 hover:text-blue-300"
                        >
                          <FaEdit />
                        </button>
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        {u.employeeId ? (
                          <div>
                            <div>
                              {u.employeeId.fullName ||
                                `${u.employeeId.firstName} ${u.employeeId.lastName}`}
                            </div>
                            {u.employeeId.nationalId && (
                              <div className="text-sm text-slate-500">
                                الرقم الوطني: {u.employeeId.nationalId}
                              </div>
                            )}
                          </div>
                        ) : (
                          "غير مرتبط"
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-300 capitalize">
                        {editUserId === u._id ? (
                          <select
                            value={editedUser.role}
                            onChange={(e) =>
                              setEditedUser({
                                ...editedUser,
                                role: e.target.value,
                              })
                            }
                            className="border border-slate-600 rounded-lg px-2 py-1 bg-slate-700 text-slate-100"
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

                      <td className="py-3 px-4 text-slate-300 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <span>
                            {showPasswords[u._id]
                              ? u.password || "••••••"
                              : "••••••"}
                          </span>
                          <button
                            onClick={() => togglePassword(u._id)}
                            className="text-slate-400 hover:text-blue-400"
                          >
                            {showPasswords[u._id] ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {editingGroups === u._id ? (
                          <div className="space-y-2 max-h-60 overflow-y-auto min-w-[220px] bg-slate-800 border border-slate-600 rounded p-2 shadow-sm">
                            <div className="grid grid-cols-1 gap-1">
                              {permissionGroups.map((group) => (
                                <label
                                  key={group._id}
                                  className="flex items-center space-x-2 space-x-reverse cursor-pointer hover:bg-slate-700 p-1 rounded"
                                >
                                  <input
                                    type="checkbox"
                                    checked={tempGroups.includes(group._id)}
                                    onChange={() => toggleGroup(group._id)}
                                    className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500 bg-slate-700 border-slate-500"
                                  />
                                  <span className="text-sm text-slate-300">
                                    {group.name}
                                  </span>
                                </label>
                              ))}
                            </div>
                            <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-slate-700">
                              <button
                                onClick={() => saveGroups(u._id)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                              >
                                حفظ
                              </button>
                              <button
                                onClick={cancelEditGroups}
                                className="bg-slate-600 text-slate-200 px-3 py-1 rounded text-xs hover:bg-slate-500"
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1 items-center">
                            <span
                              className={`text-xs px-2 py-1 rounded-full border ${
                                groupSummary.text === "لا توجد مجموعات"
                                  ? "bg-slate-700 text-slate-400 border-slate-600"
                                  : "bg-blue-900/30 text-blue-300 border-blue-500/30"
                              }`}
                              title={groupSummary.title}
                            >
                              {groupSummary.text}
                            </span>
                            <button
                              onClick={() => startEditGroups(u)}
                              className="mr-2 text-blue-400 hover:text-blue-300 text-xs border border-blue-500/30 px-2 py-1 rounded hover:bg-blue-900/20"
                            >
                              تعديل
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        {new Date(u.createdAt).toLocaleDateString("ar-EG")}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex gap-2 justify-center flex-wrap">
                          <button
                            onClick={() => confirmDeleteUser(u._id, u.username)}
                            className="text-red-400 hover:text-red-300 font-medium border border-red-500/30 px-2 py-1 rounded-lg transition text-sm hover:bg-red-900/20"
                          >
                            حذف ❌
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center py-6 text-slate-500 italic"
                    >
                      لا يوجد مستخدمون حالياً.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {deleteModal.show && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300 opacity-100"></div>
              <div className="relative bg-slate-800 rounded-xl shadow-lg p-6 w-96 text-center transform transition-all duration-300 ease-out scale-100 opacity-100 border border-slate-700">
                <h3 className="text-lg font-semibold mb-2 text-slate-100">
                  تأكيد الحذف
                </h3>
                <p className="text-slate-300 mb-6">
                  هل أنت متأكد من حذف{" "}
                  <span className="font-semibold text-red-400">
                    {deleteModal.username}
                  </span>
                  ؟
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-slate-100"
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
