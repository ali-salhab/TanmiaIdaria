import { useState } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/auth/login", { username, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.user.role);
      console.log("response from loging function", res.data);

      navigate("/onboarding");
    } catch (err) {
      const errMsg = err.response?.data?.message || "Login failed";
      setError(errMsg);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOutsideClick = (e) => {
    if (e.target.id === "error-modal") setShowModal(false);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden  bg-gradient-to-br from-blue-900 via-indigo-900 to-gray-900">
      {/* floating glass blur backgroundoverlay */}
      <div
        dir="rtl"
        className="fixed flex-col p-4 r items-start justify-start    right-0 font-extrabold text-yellow-50 z-0 top-0 w-max "
      >
        <p>الجمهورية العربية السورية</p>
        <p>الامانة العامة لمحافطة طرطوس</p>
        <p>مديرية التنمية الادارية</p>
      </div>
      <div className="fixed flex-col p-4  items-start   left-0   z-0 bottom-0 w-max ">
        <p>&copy; copy right </p>
        {/* <p>alisalhab@gmail.com</p> */}
      </div>
      <div className="absolute inset-0 backdrop-blur-none bg-white/5"></div>

      {/* login card */}
      <form
        dir="rtl"
        onSubmit={handleSubmit}
        className="relative z-10 backdrop-blur-xl bg-white/20 border border-white/30 text-white rounded-2xl shadow-2xl p-10 w-full max-w-sm animate-fadeSlide"
      >
        <h2 className="text-3xl font-bold mb-8 text-center tracking-wide">
          مديرية التنمية الإدارية
        </h2>

        <input
          dir="rtl"
          type="text"
          placeholder="اسم المستخدم"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-3 mb-5 rounded-lg bg-white/20 border border-white/40 placeholder-gray-200 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          dir="rtl"
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-6 rounded-lg bg-white/20 border border-white/40 placeholder-gray-200 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

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
              جاري تسجيل الدخول ...
            </>
          ) : (
            "تسجيل الدخول"
          )}
        </button>

        <div className="text-gray-200 mt-6 text-center">
          <span
            onClick={() => navigate("/register")}
            className="text-blue-300 cursor-pointer hover:text-blue-400 transition"
          >
            انشاء حساب
          </span>
        </div>
      </form>

      {/* animated glass modal */}
      {showModal && (
        <div
          id="error-modal"
          onClick={handleOutsideClick}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn"
        >
          <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-xl border border-red-400/50 rounded-2xl shadow-2xl shadow-red-500/20 p-6 w-80 text-center transform transition-all duration-300 animate-scaleUp">
            <h3 className="text-xl font-semibold text-red-200 mb-3 drop-shadow">
              ⚠️ خطأ
            </h3>
            <p className="text-red-100 mb-6">{error}</p>
            <button
              onClick={() => setShowModal(false)}
              className="px-6 py-2 bg-red-500/40 text-white font-semibold rounded-lg hover:bg-red-500/60 transition border border-red-400/50"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* custom animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleUp {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          @keyframes fadeSlide {
            from { opacity: 0; transform: translateX(500px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
          .animate-scaleUp { animation: scaleUp 0.3s ease-out forwards; }
          .animate-fadeSlide { animation: fadeSlide 0.6s ease-out forwards; }
        `}
      </style>
    </div>
  );
}
