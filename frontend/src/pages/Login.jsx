import { useState } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";
import ErrorModal from "../components/login/ErrorModal";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import logo from "../assets/logo.png";

const syriaLogo = "/syria-logo.png";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // if (!username.trim()) showModal(true);
      // if (!password.trim()) showModal(true);
      const res = await API.post("/auth/login", { username, password });
      console.log("login user data");
      console.log(res.data);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.user.role);
      // Support both `id` and `_id` coming from backend
      localStorage.setItem(
        "userId",
        res.data.user.id || res.data.user._id || ""
      );
      localStorage.setItem("username", res.data.user.username);

      // Store permissions
      const permissions = [];
      if (res.data.user.role === "admin") {
        permissions.push("*");
      } else {
        if (res.data.user.directPermissions) {
          res.data.user.directPermissions.forEach((p) =>
            permissions.push(p.key)
          );
        }
        if (res.data.user.permissionGroups) {
          res.data.user.permissionGroups.forEach((g) => {
            if (g.permissions) {
              g.permissions.forEach((p) => permissions.push(p.key));
            }
          });
        }
      }
      localStorage.setItem("permissions", JSON.stringify(permissions));

      console.log("response from loging function", res.data);

      if (res.data.user.role === "admin") {
        navigate("/dashboard");
      } else {
        navigate("/user/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      const status = err.response?.status || 500;
      const statusText = err.response?.statusText || "Server Error";
      const message =
        err.response?.data?.message || "An unexpected error occurred";

      setError({
        code: status,
        title: statusText,
        message: message,
      });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOutsideClick = (e) => {
    if (e.target.id === "error-modal") setShowModal(false);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300">
      {/* floating glass blur backgroundoverlay */}
      <div
        dir="rtl"
        className="fixed flex-col p-4 items-start justify-start right-0 z-0 top-0 w-max"
      >
        <div className="lg:block sm:hidden sm: md:hidden">
          {" "}
          <p className="text-sm font-semibold tracking-wide text-gray-700 font-['Tajawal']">
            الجمهورية العربية السورية
          </p>
          <p className="text-sm font-semibold tracking-wide text-gray-700 font-['Tajawal']">
            الأمانة العامة لمحافظة طرطوس
          </p>
          <p className="text-sm font-semibold tracking-wide text-gray-700 font-['Tajawal']">
            مديرية التنمية الإدارية
          </p>
        </div>
      </div>

      {/* Syria logo top-left */}
      <div className="fixed left-0 top-0 z-0 p-4 hidden lg:flex items-start">
        <img
          src={syriaLogo}
          alt="Syria Logo"
          className="h-16 w-auto object-contain opacity-90"
        />
      </div>
      <div className="fixed flex-col p-4 items-start left-0 z-0 bottom-0 w-max text-gray-500">
        <p>&copy; copy right </p>
        {/* <p>alisalhab@gmail.com</p> */}
      </div>
      <div className="absolute inset-0 backdrop-blur-none bg-white/30"></div>

      {/* login card */}
      <form
        dir="rtl"
        onSubmit={handleSubmit}
        className="relative z-10 backdrop-blur-2xl bg-white/40 border border-white/60 text-gray-800 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] p-10 w-full max-w-sm animate-fadeSlide font-['Tajawal'] flex flex-col items-center"
      >
        <img
          src={logo}
          alt="Logo"
          className="w-24 h-24 mb-4 object-contain drop-shadow-md grayscale opacity-80 hover:grayscale-0 transition-all duration-500"
        />
        <h2 className="text-3xl font-bold mb-8 text-center tracking-wide text-gray-800 drop-shadow-sm">
          مديرية التنمية الإدارية
        </h2>
        <div className="w-full">
          <label
            className="mb-2 p-3 tracking-wide text-gray-700 font-semibold"
            htmlFor=""
          >
            اسم المستخدم
          </label>
          <input
            dir="rtl"
            type="text"
            placeholder="اسم المستخدم"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 mb-5 mt-2 rounded-lg bg-white/60 border border-gray-200 placeholder-gray-500 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-inner"
          />
          <label className="mb-2 text-gray-700 font-semibold" htmlFor="">
            كلمة المرور
          </label>
          <div className="relative w-full mb-6 mt-2">
            <input
              dir="rtl"
              type={showPassword ? "text" : "password"}
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/60 border border-gray-200 placeholder-gray-500 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-inner"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-800"
            >
              {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
            </button>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${
            loading
              ? "bg-gray-400 cursor-not-allowed opacity-75 text-white"
              : "bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white cursor-pointer transform hover:-translate-y-0.5"
          }`}
        >
          {loading ? (
            <>
              جاري تسجيل الدخول
              <span className="animate-bounce delay-0">.</span>
              <span className="animate-bounce delay-75">.</span>
              <span className="animate-bounce delay-100">.</span>
            </>
          ) : (
            "تسجيل الدخول"
          )}
        </button>
      </form>

      {/* animated glass modal */}
      {showModal && (
        <ErrorModal
          handleOutsideClick={handleOutsideClick}
          data={{ error }}
          setShowModal={setShowModal}
        />
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
