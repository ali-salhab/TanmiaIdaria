import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { FaEdit, FaEye, FaEyeSlash } from "react-icons/fa";
import API from "../api/api";
import DropdownWithSettings from "../components/DropdownWithSettings";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc");
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "employee",
    employeeId: "",
  });
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    userId: null,
    username: "",
  });
  const [editUserId, setEditUserId] = useState(null);
  const [editedUser, setEditedUser] = useState({});
  const [showPasswords, setShowPasswords] = useState({});
  const [editingGroups, setEditingGroups] = useState(null);
  const [tempGroups, setTempGroups] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [isSearchingEmployees, setIsSearchingEmployees] = useState(false);
  const [permissionGroups, setPermissionGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);

  const employeeSearchWrapRef = useRef(null);
  const employeeSearchTimerRef = useRef(null);

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

    // Accept populated group objects or group ids
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

  useEffect(() => {
    fetchUsers();
    fetchPermissionGroups();
  }, []);

  const fetchPermissionGroups = async () => {
    try {
      const res = await API.get("/permissions/groups");
      setPermissionGroups(res.data);
    } catch (error) {
      console.error("Error fetching permission groups:", error);
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

  useEffect(() => {
    fetchUsers();
  }, [sortOrder]);

  // Search for employees
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
      const list = Array.isArray(res.data) ? res.data : [];
      setEmployees(list);
      setShowEmployeeDropdown(true);
    } catch (error) {
      console.error("Error searching employees:", error);
      setEmployees([]);

      const status = error?.response?.status;
      if (status === 403) {
        toast.error("❌ لا تملك صلاحية عرض المستخدمين (users.view)");
        setShowEmployeeDropdown(false);
      } else {
        setShowEmployeeDropdown(true);
      }
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

  // Handle employee selection
  const handleEmployeeSelect = (employee) => {
    setNewUser((prev) => ({
      ...prev,
      employeeId: employee._id,
      username:
        employee.fullName ||
        `${employee.firstName} ${employee.lastName}`.trim(),
    }));
    setSearchQuery(
      employee.fullName || `${employee.firstName} ${employee.lastName}`.trim()
    );
    setShowEmployeeDropdown(false);
    setEmployees([]);
  };

  const createUser = async () => {
    try {
      // Validate that employee is selected
      if (!newUser.employeeId) {
        toast.error("❌ يرجى اختيار موظف");
        return;
      }

      // Validate that password is provided
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
      setSearchQuery("");
      setSelectedGroups([]);
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.message || "❌ فشل في إنشاء المستخدم!";
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
    } catch (error) {
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

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100 p-6">
      {/* العنوان وعدد المستخدمين */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-3 sm:mb-0">
          👑 إدارة المستخدمين والصلاحيات
        </h2>
        <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
          عدد المستخدمين: {users.length}
        </span>
      </div>

      {/* إنشاء مستخدم جديد */}
      <div className="bg-white p-6 rounded-2xl shadow mb-10 max-w-3xl">
        <h3 className="text-lg font-medium mb-4 text-gray-700">
          ➕ إنشاء مستخدم جديد
        </h3>

        <div className="space-y-4">
          {/* Employee Search Field */}
          <div className="relative" ref={employeeSearchWrapRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🔍 البحث عن الموظف
            </label>
            <input
              type="text"
              placeholder="ابحث عن الموظف بالاسم أو الرقم الوطني..."
              value={searchQuery}
              onChange={(e) => {
                const value = e.target.value;
                setSearchQuery(value);
                scheduleEmployeeSearch(value);
              }}
              onFocus={() => {
                if (String(searchQuery || "").trim().length >= 2) {
                  setShowEmployeeDropdown(true);
                }
              }}
              className="border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 outline-none w-full"
            />

            {/* Employee Dropdown */}
            {showEmployeeDropdown &&
              String(searchQuery || "").trim().length >= 2 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {isSearchingEmployees && (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      جاري البحث...
                    </div>
                  )}

                  {!isSearchingEmployees && employees.length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      لا توجد نتائج.
                    </div>
                  )}

                  {!isSearchingEmployees &&
                    employees.map((employee) => (
                      <div
                        key={employee._id}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleEmployeeSelect(employee)}
                      >
                        <div className="font-medium text-gray-800">
                          {employee.fullName ||
                            `${employee.firstName} ${employee.lastName}`}
                        </div>
                        <div className="text-sm text-gray-500">
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

          {/* Selected Employee Info */}
          {newUser.employeeId && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-green-700 font-medium">
                    ✅ الموظف المحدد:{" "}
                  </span>
                  <span className="text-green-800 font-bold">
                    {newUser.username}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setNewUser({ ...newUser, employeeId: "", username: "" });
                    setSearchQuery("");
                  }}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  ✕ إلغاء التحديد
                </button>
              </div>
            </div>
          )}

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🔐 كلمة المرور
            </label>
            <input
              type="password"
              placeholder="أدخل كلمة مرور للمستخدم الجديد..."
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
              className="border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 outline-none w-full"
            />
          </div>

          {/* Permission Groups Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🛡️ مجموعات الصلاحيات
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto border p-3 rounded-lg bg-gray-50">
              {permissionGroups.map((group) => (
                <label
                  key={group._id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 p-2 rounded"
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
                    className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{group.name}</span>
                </label>
              ))}
            </div>
            {selectedGroups.length > 0 && (
              <p className="text-sm text-blue-600 mt-2">
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
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          ✅ إنشاء المستخدم
        </button>
      </div>

      {/* فرز المستخدمين */}
      <div className="flex justify-end items-center mb-4">
        <DropdownWithSettings
          id="users_sort_order"
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
                الموظف
              </th>
              <th className="py-3 px-4 text-right text-gray-700 font-semibold">
                الدور
              </th>
              <th className="py-3 px-4 text-right text-gray-700 font-semibold">
                كلمة المرور
              </th>
              <th className="py-3 px-4 text-right text-gray-700 font-semibold">
                المجموعات
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
            {users.map((u) => {
              const groupSummary = formatGroupSummary(u.permissionGroups);
              return (
                <tr
                  key={u._id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  {/* اسم المستخدم */}
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

                  {/* الموظف */}
                  <td className="py-3 px-4 text-gray-700">
                    {u.employeeId ? (
                      <div>
                        <div>
                          {u.employeeId.fullName ||
                            `${u.employeeId.firstName} ${u.employeeId.lastName}`}
                        </div>
                        {u.employeeId.nationalId && (
                          <div className="text-sm text-gray-500">
                            الرقم الوطني: {u.employeeId.nationalId}
                          </div>
                        )}
                      </div>
                    ) : (
                      "غير مرتبط"
                    )}
                  </td>

                  {/* الدور */}
                  <td className="py-3 px-4 text-gray-700 capitalize">
                    {editUserId === u._id ? (
                      <select
                        value={editedUser.role}
                        onChange={(e) =>
                          setEditedUser({ ...editedUser, role: e.target.value })
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

                  {/* كلمة المرور */}
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

                  {/* المجموعات */}
                  <td className="py-3 px-4">
                    {editingGroups === u._id ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto min-w-[200px] bg-white border rounded p-2 shadow-sm">
                        <div className="grid grid-cols-1 gap-1">
                          {permissionGroups.map((group) => (
                            <label
                              key={group._id}
                              className="flex items-center space-x-2 space-x-reverse cursor-pointer hover:bg-blue-50 p-1 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={tempGroups.includes(group._id)}
                                onChange={() => toggleGroup(group._id)}
                                className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">
                                {group.name}
                              </span>
                            </label>
                          ))}
                        </div>
                        <div className="flex justify-end gap-2 mt-2 pt-2 border-t">
                          <button
                            onClick={() => saveGroups(u._id)}
                            className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600"
                          >
                            حفظ
                          </button>
                          <button
                            onClick={cancelEditGroups}
                            className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-400"
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
                              ? "bg-gray-50 text-gray-500 border-gray-200"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          }`}
                          title={groupSummary.title}
                        >
                          {groupSummary.text}
                        </span>
                        <button
                          onClick={() => startEditGroups(u)}
                          className="mr-2 text-blue-600 hover:text-blue-800 text-xs border border-blue-200 px-2 py-1 rounded hover:bg-blue-50"
                        >
                          تعديل
                        </button>
                      </div>
                    )}
                  </td>

                  {/* تاريخ الإنشاء */}
                  <td className="py-3 px-4 text-gray-700">
                    {new Date(u.createdAt).toLocaleDateString("ar-EG")}
                  </td>

                  {/* الإجراءات */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex gap-2 justify-center flex-wrap">
                      <button
                        onClick={() => confirmDeleteUser(u._id, u.username)}
                        className="text-red-600 hover:text-red-800 font-medium border border-red-200 px-2 py-1 rounded-lg transition text-sm"
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
          {/* خلفية مظللة بخفوت تدريجي */}
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300 opacity-100"></div>

          {/* مربع المودال نفسه */}
          <div className="relative bg-white rounded-xl shadow-lg p-6 w-96 text-center transform transition-all duration-300 ease-out scale-100 opacity-100 animate-fadeInUp">
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
  );
}
