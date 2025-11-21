import React from "react";

function AddUserModal() {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-2xl mb-2 max-w-2xl">
      <h3 className="text-lg font-medium mb-4 text-gray-700">
        ➕ إنشاء مستخدم جديد
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 bg-red-500 sm:grid-cols-3 gap-3">
        <input
          type="text"
          placeholder="اسم المستخدم"
          value={newUser.username}
          onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
          className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
        />
        <input
          type="password"
          placeholder="كلمة المرور"
          value={newUser.password}
          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
        />
        <DropdownWithSettings
          id="homepage_new_user_role"
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
  );
}

export default AddUserModal;
