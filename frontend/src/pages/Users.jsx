import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaEdit, FaEye, FaEyeSlash } from "react-icons/fa";
import API from "../api/api";
import DropdownWithSettings from "../components/DropdownWithSettings";
import { permissionDefinitions, getAllPermissions, getPermissionsByCategory, getAllCategories } from "../utils/permissionDefinitions";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc");
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "employee",
    employeeId: ""
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
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUsers();
  }, []);

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
    if (query.length < 2) {
      setEmployees([]);
      return;
    }
    
    try {
      const res = await API.get(`/users/search/employees?q=${query}`);
      setEmployees(res.data);
      setShowEmployeeDropdown(true);
    } catch (error) {
      console.error("Error searching employees:", error);
      setEmployees([]);
    }
  };

  // Handle employee selection
  const handleEmployeeSelect = (employee) => {
    setNewUser(prev => ({
      ...prev,
      employeeId: employee._id,
      username: employee.fullName || `${employee.firstName} ${employee.lastName}`.trim()
    }));
    setSearchQuery(employee.fullName || `${employee.firstName} ${employee.lastName}`.trim());
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
      
      await API.post("/users", newUser);

      toast.success("✅ تم إنشاء المستخدم بنجاح!");
      setNewUser({ username: "", password: "", role: "employee", employeeId: "" });
      setSearchQuery("");
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
      await API.put(`/users/${id}/permissions`, { permissions: tempPermissions });
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
      <div className="bg-white p-6 rounded-2xl shadow mb-10 max-w-2xl">
        <h3 className="text-lg font-medium mb-4 text-gray-700">
          ➕ إنشاء مستخدم جديد
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          {/* Employee Search Field */}
          <div className="sm:col-span-3 relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              البحث عن الموظف
            </label>
            <input
              type="text"
              placeholder="ابحث عن الموظف بالاسم أو الرقم الوطني"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchEmployees(e.target.value);
              }}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none w-full"
            />
            
            {/* Employee Dropdown */}
            {showEmployeeDropdown && employees.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {employees.map((employee) => (
                  <div
                    key={employee._id}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                    onClick={() => handleEmployeeSelect(employee)}
                  >
                    <div className="font-medium">{employee.fullName || `${employee.firstName} ${employee.lastName}`}</div>
                    <div className="text-sm text-gray-500">
                      {employee.nationalId && `الرقم الوطني: ${employee.nationalId}`}
                      {employee.phone && ` | الهاتف: ${employee.phone}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Password Field */}
          <input
            type="password"
            placeholder="كلمة المرور"
            value={newUser.password}
            onChange={(e) =>
              setNewUser({ ...newUser, password: e.target.value })
            }
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
          />
          
          {/* Role Dropdown */}
          <DropdownWithSettings
            id="users_new_user_role"
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
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
            {users.map((u) => {
              console.log(u);
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
                        <div>{u.employeeId.fullName || `${u.employeeId.firstName} ${u.employeeId.lastName}`}</div>
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

                  {/* الصلاحيات */}
                  <td className="py-3 px-4">
                    {editingPermissions === u._id ? (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {getAllCategories().map((category) => (
                          <div key={category} className="border rounded-lg p-2 bg-gray-50">
                            <h4 className="font-semibold text-sm text-gray-800 mb-2">{category}</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                              {getPermissionsByCategory(category).map((perm) => (
                                <label
                                  key={perm.key}
                                  className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={tempPermissions[perm.key] || false}
                                    onChange={() => togglePermission(perm.key)}
                                    className="accent-blue-600 h-3 w-3"
                                  />
                                  {perm.label}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {getAllCategories().map((category) => {
                          const categoryPerms = getPermissionsByCategory(category).filter(perm =>
                            u.permissions?.[perm.key]
                          );
                          if (categoryPerms.length === 0) return null;

                          return (
                            <div key={category} className="border rounded p-1 bg-blue-50">
                              <span className="font-medium text-xs text-blue-800">{category}:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {categoryPerms.map((perm) => (
                                  <span
                                    key={perm.key}
                                    className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded"
                                  >
                                    {perm.action}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </td>

                  {/* تاريخ الإنشاء */}
                  <td className="py-3 px-4 text-gray-700">
                    {new Date(u.createdAt).toLocaleDateString("ar-EG")}
                  </td>

                  {/* الإجراءات */}
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