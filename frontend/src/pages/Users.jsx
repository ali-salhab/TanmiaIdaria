import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const API = "http://localhost:5001/api/users";

export default function Users() {
  const [users, setUsers] = useState([]);
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

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await axios.get(API, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUsers(res.data);
  };

  const createUser = async () => {
    try {
      await axios.post(API, newUser, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("✅ User created successfully!");
      setNewUser({ username: "", password: "", role: "employee" });
      fetchUsers();
    } catch (error) {
      const message =
        error.response?.data?.message || "❌ Failed to create user!";
      toast.error(message);
    }
  };

  const confirmDeleteUser = (id, username) => {
    setDeleteModal({ show: true, userId: id, username });
  };

  const cancelDelete = () => {
    setDeleteModal({ show: false, userId: null, username: "" });
  };

  const deleteUser = async () => {
    try {
      await axios.delete(`${API}/${deleteModal.userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`🗑️ Deleted user "${deleteModal.username}"`);
      setDeleteModal({ show: false, userId: null, username: "" });
      fetchUsers();
    } catch (error) {
      toast.error("❌ Failed to delete user");
    }
  };

  const togglePermission = async (userId, key, value) => {
    console.log("toggle permisson function ");

    try {
      const body = { permissions: { [key]: value } };
      const res = await axios.put(`${API}/${userId}/permissions`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const currentUser = await axios.get(`${API}/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      console.log("====================================");
      console.log(currentUser.data);
      console.log("====================================");
      toast.success(`${currentUser.data.username} تجديد الصلاحيات للمستخدم  `);

      fetchUsers();
    } catch (error) {
      toast.error("❌ Failed to edit user persmissions");
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100 p-8 relative">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        👑 إدارة المستخدمين والصلاحيات
      </h2>

      {/* Create New User Form */}
      <div className="bg-white p-6 rounded-2xl shadow mb-10 max-w-2xl">
        <h3 className="text-lg font-medium mb-4 text-gray-700">
          انشاء مستخدم جديد
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
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            className="border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-400 outline-none"
          >
            <option value="admin">عامل طباعة</option>
            <option value="employee">مدير ثانوي</option>
            <option value="viewer">مشاهد</option>
            <option value="hr">عامل ديوان</option>
            <option value="finance">مالي</option>
          </select>
        </div>
        <button
          onClick={createUser}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          ➕ إضافة مستخدم
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-blue-50 border-b">
            <tr>
              <th className="py-3 px-4 text-left text-gray-700 font-semibold">
                Username
              </th>
              <th className="py-3 px-4 text-left text-gray-700 font-semibold">
                Role
              </th>
              <th className="py-3 px-4 text-left text-gray-700 font-semibold">
                Permissions
              </th>
              <th className="py-3 px-4 text-center text-gray-700 font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b hover:bg-gray-50 transition ">
                <td className="py-3 px-4 font-medium text-gray-800">
                  {u.username}
                </td>
                <td className="py-3 px-4 capitalize text-gray-700">{u.role}</td>
                <td className="py-3 px-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {Object.keys(u.permissions).map((key) => (
                      <label
                        key={key}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <input
                          type="checkbox"
                          checked={u.permissions[key]}
                          onChange={(e) =>
                            togglePermission(u._id, key, e.target.checked)
                          }
                          className="accent-blue-600 h-4 w-4"
                        />
                        {key.replace(/([A-Z])/g, " $1")}
                      </label>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => confirmDeleteUser(u._id, u.username)}
                    className="text-red-600 border-teal-200 border-spacing-3 border-x-4 hover:text-red-800 font-medium bg-white-500 shadow-xl p-3 rounded "
                  >
                    مسح ❌
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan="4"
                  className="text-center py-6 text-gray-500 italic"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-96 text-center">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-red-600">
                {deleteModal.username}
              </span>
              ?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={deleteUser}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
