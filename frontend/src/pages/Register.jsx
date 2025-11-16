import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/api";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      console.log("====================================");
      console.log("register function");
      console.log("====================================");
      const res = await API.post("/api/auth/register", {
        username: form.username.trim(),
        password: form.password.trim(),
        role: form.role.toLowerCase(),
      });

      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      alert("Registration successful!");
      navigate("/login");
    } catch (err) {
      console.log("====================================");
      console.log(err);
      console.log("====================================");
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden font-custom bg-gradient-to-br from-blue-900 via-indigo-900 to-gray-900">
      {/* background blur overlay */}

      <div className="absolute inset-0 backdrop-blur-3xl bg-white/5"></div>
      <div
        dir="rtl"
        className="fixed flex-col p-4 r items-start justify-start backdrop-blur-3xl   right-0 font-extrabold text-yellow-50 z-0 top-0 w-max "
      >
        <p>الجمهورية العربية السورية</p>
        <p>الامانة العامة لمحافطة طرطوس</p>
        <p>مديرية التنيمية الادارية</p>
      </div>
      <div className="fixed flex-col p-4  items-start   left-0   z-0 bottom-0 w-max ">
        <p>&copy; copy right </p>
        {/* <p>alisalhab@gmail.com</p> */}
      </div>
      {/* glassy register form */}
      <div
        dir="rtl"
        className="relative z-10 backdrop-blur-xl bg-white/20 border border-white/30 text-white rounded-2xl shadow-2xl p-10 w-full max-w-sm animate-fadeSlide"
      >
        <h2 className="text-3xl font-bold mb-8 text-center tracking-wide">
          انشاء حساب
        </h2>

        {error && (
          <p className="text-red-200 bg-red-500/20 border border-red-400/50 rounded-lg p-3 text-center mb-4 animate-scaleUp shadow-lg shadow-red-500/20">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm text-gray-200">
              اسم المستخدم
            </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg bg-white/20 border border-white/40 placeholder-gray-200 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm text-gray-200">
              كلمة المرور
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg bg-white/20 border border-white/40 placeholder-gray-200 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm text-gray-200">
              تاكيد كلمة المرور
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg bg-white/20 border border-white/40 placeholder-gray-200 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm text-gray-200">الدور</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-white/20 border border-white/40 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="user" className="text-black">
                مستخدم عادي
              </option>
              <option value="admin" className="text-black">
                مدير
              </option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
              loading
                ? "bg-blue-500/50 cursor-not-allowed opacity-75"
                : "bg-blue-500/70 hover:bg-blue-500 cursor-pointer"
            }`}
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                جاري انشاء حساب ...
              </>
            ) : (
              "انشاء حساب"
            )}
          </button>
        </form>

        <p className="text-gray-200 text-sm text-center mt-6">
          لديك حساب فعلا
          <Link
            to="/login"
            className="text-blue-300 hover:text-blue-400 transition"
          >
            <span className="p-2">تسجيل الدخول</span>
          </Link>
        </p>
      </div>

      {/* custom animations */}
      <style>
        {`
          @keyframes fadeSlide {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes scaleUp {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-fadeSlide {
            animation: fadeSlide 0.6s ease-out forwards;
          }
          .animate-scaleUp {
            animation: scaleUp 0.3s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
}
