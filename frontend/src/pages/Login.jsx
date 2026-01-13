import { useState, useRef, useEffect } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";
import ErrorModal from "../components/login/ErrorModal";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import logo from "../assets/logo.png";
import syriaLogo from "../assets/syria_logo.svg";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const rootRef = useRef(null);
  const flagRef = useRef(null);
  const cardRef = useRef(null);

  const isFormValid = username.trim() !== "" && password !== "";

  const validate = () => {
    let ok = true;
    if (!username.trim()) {
      setUsernameError("حقل اسم المستخدم مطلوب");
      ok = false;
    } else setUsernameError("");
    if (!password) {
      setPasswordError("حقل كلمة المرور مطلوب");
      ok = false;
    } else setPasswordError("");
    return ok;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await API.post("/auth/login", { username, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.user.role);
      localStorage.setItem(
        "userId",
        res.data.user.id || res.data.user._id || ""
      );
      localStorage.setItem("username", res.data.user.username);

      const permissions = [];
      if (res.data.user.role === "admin") permissions.push("*");
      else {
        res.data.user.directPermissions?.forEach(
          (p) => p?.key && permissions.push(p.key)
        );
        res.data.user.permissionGroups?.forEach((g) =>
          g.permissions?.forEach((p) => p?.key && permissions.push(p.key))
        );
      }
      localStorage.setItem("permissions", JSON.stringify(permissions));

      if (res.data.user.role === "admin") navigate("/dashboard");
      else navigate("/user/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      const status = err.response?.status || 500;
      const statusText = err.response?.statusText || "Server Error";
      const message =
        err.response?.data?.message || "An unexpected error occurred";
      setError({ code: status, title: statusText, message });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty("--mx", x);
      el.style.setProperty("--my", y);
      if (flagRef.current)
        flagRef.current.style.transform = `perspective(1000px) rotateY(${
          x * 5
        }deg) rotateX(${y * -3}deg) scale(1.02)`;
      if (cardRef.current)
        cardRef.current.style.transform = `perspective(800px) rotateY(${
          x * 3
        }deg) rotateX(${y * -3}deg) translateZ(6px) scale(1.005)`;
    };

    const handleLeave = () => {
      el.style.setProperty("--mx", 0);
      el.style.setProperty("--my", 0);
      if (flagRef.current)
        flagRef.current.style.transform =
          "perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1.02)";
      if (cardRef.current)
        cardRef.current.style.transform =
          "perspective(800px) rotateY(0deg) rotateX(0deg) translateZ(0px) scale(1)";
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseleave", handleLeave);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
    >
      {/* Animated blurred flag background */}
      <div
        ref={flagRef}
        aria-hidden
        className="login-flag-bg login-flag-bg--parallax"
      />
      {/* Blur overlay */}
      <div
        className="absolute inset-0 backdrop-blur-md bg-black/40"
        aria-hidden
      />

      {/* Top-right text */}
      <div
        dir="rtl"
        className="fixed top-3 right-3  z-20 text-right animate-headerFade"
      >
        <p className="text-lg md:text-xl lg:text-2xl font-bold tracking-wide text-[#d4af37] drop-shadow-lg font-['Tajawal'] mb-1">
          الجمهورية العربية السورية
        </p>
        <p className="text-base md:text-lg lg:text-xl font-semibold tracking-wide text-[#d4af37] drop-shadow-lg font-['Tajawal']">
          الأمانة العامة لمحافظة طرطوس
        </p>
        <p className="text-base md:text-lg lg:text-xl font-semibold tracking-wide text-[#d4af37] drop-shadow-lg font-['Tajawal']">
          وزارة الادارة المحلية والبيئة
        </p>
        <p className="text-base md:text-lg lg:text-xl font-semibold tracking-wide text-[#d4af37] drop-shadow-lg font-['Tajawal']">
          مديرية التنمية الادارية
        </p>
      </div>

      {/* Centered Login Card */}
      <div className="relative z-10 w-full max-w-md px-1 md:px-2 mt-10">
        <form
          ref={cardRef}
          dir="rtl"
          onSubmit={handleSubmit}
          className="relative z-10 backdrop-blur-3xl bg-white/10 border border-white/20 text-white login-card shadow-[0_30px_80px_rgba(0,0,0,0.4)] p-10 w-full rounded-2xl animate-cardPop font-['Tajawal'] flex flex-col items-center gap-5"
        >
          <div className="flex flex-col items-center gap-2">
            <img
              src={syriaLogo}
              alt="Syria emblem"
              className="w-32 h-24 md:w-36 md:h-36 object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.5)] opacity-100 animate-logo-glow"
            />
            <h2 className="text-xl md:text-2xl font-bold text-center tracking-tight text-[#d4af37] login-title">
              نظام إدارة الموارد البشرية
            </h2>
          </div>

          <div className="w-full flex flex-col gap-4 text-right">
            <label
              className="text-[#d4af37] font-semibold tracking-wide"
              htmlFor="username"
            >
              اسم المستخدم
            </label>
            <input
              id="username"
              aria-invalid={!!usernameError}
              type="text"
              placeholder="اسم المستخدم"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => {
                if (!username.trim())
                  setUsernameError("حقل اسم المستخدم مطلوب");
                else setUsernameError("");
              }}
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 placeholder-white/50 text-[#d4af37] text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white/15 transition-all duration-300"
            />
            {usernameError && (
              <p
                id="username-error"
                role="alert"
                className="text-red-400 text-sm"
              >
                {usernameError}
              </p>
            )}

            <label
              className="text-[#d4af37] font-semibold tracking-wide"
              htmlFor="password"
            >
              كلمة المرور
            </label>
            <div className="relative w-full">
              <input
                id="password"
                aria-invalid={!!passwordError}
                dir="rtl"
                type={showPassword ? "text" : "password"}
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => {
                  if (!password) setPasswordError("حقل كلمة المرور مطلوب");
                  else setPasswordError("");
                }}
                className="w-full p-3 pr-10 rounded-xl bg-white/10 border border-white/20 placeholder-white/50 text-[#d4af37] text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white/15 transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-black hover:text-black/20 transition-colors"
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
            {passwordError && (
              <p
                id="password-error"
                role="alert"
                className="text-red-400 text-sm"
              >
                {passwordError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isFormValid || loading}
            className={`w-full py-3.5 text-base rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${
              !isFormValid || loading
                ? "bg-gray-600 cursor-not-allowed opacity-60 text-white/70"
                : "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white cursor-pointer transform hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/30"
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
      </div>

      {showModal && (
        <ErrorModal
          handleOutsideClick={(e) => {
            if (e.target.id === "error-modal") setShowModal(false);
          }}
          data={{ error }}
          setShowModal={setShowModal}
        />
      )}

      <style>{`
          @keyframes headerFade {
            from { opacity: 0; transform: translateY(-30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes cardPop {
            from { opacity: 0; transform: scale(0.9) translateY(40px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes pulse-slow {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.85; transform: scale(1.03); }
          }
          @keyframes logo-glow {
            0%, 100% { 
              filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.5));
              transform: scale(1.1);

            }
            50% { 
              filter: drop-shadow(0 0 35px rgba(212, 175, 55, 0.8));
              transform: scale(1.03);
            }
          }
          .animate-headerFade { animation: headerFade 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
          .animate-cardPop { animation: cardPop 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both; }
          .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
          .animate-logo-glow { animation: logo-glow 3s ease-in-out infinite; }
        `}</style>
    </div>
  );
}
