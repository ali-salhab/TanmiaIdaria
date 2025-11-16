import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import EmployeesSVG from "../assets/employees.svg";
import VacationsSVG from "../assets/vacation.svg";
import ReportsSVG from "../assets/report.svg";
import Logo from "../assets/logo.png";
import API from "../api/api";
const VITE_API_URL = import.meta.env.VITE_API_URL;
console.log(VITE_API_URL);
export default function ViewerHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showHeader, setShowHeader] = useState(true);

  // ✅ Track scroll direction to hide header
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      if (window.scrollY > lastScrollY) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      lastScrollY = window.scrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ Fetch user from API using decoded token
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      console.log("there is token in viewer home page ", token);

      if (!token) return navigate("/login");

      try {
        const decoded = jwtDecode(token);
        const me = await API.get(`/auth/me`);
        console.log("loading user data ----------->", me.data);
        setUser(me.data.user);

        const newSocket = io(VITE_API_URL);
        setSocket(newSocket);
        newSocket.emit("joinUser", me.data.user.username);

        return () => newSocket.disconnect();
      } catch (err) {
        console.log("Error loading user:", err);
        navigate("/login");
      }
    };
    init();
  }, [navigate]);

  // ✅ Notify admin through socket
  const notifyAdmin = (message) => {
    console.log("notify admin function from user ", message);

    if (socket && user) {
      socket.emit("notifyAdmin", {
        from: user.username,
        message,
        time: new Date(),
      });
    }
  };

  // ✅ Handle section clicks
  const handleCardClick = (section) => {
    notifyAdmin(`قام المستخدم ${user?.username} بفتح قسم ${section}`);
    navigate(`/${section}`);
  };

  if (!user) {
    return (
      <div
        dir="rtl"
        className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-600"
      >
        جاري تحميل بيانات المستخدم...
      </div>
    );
  }

  const { permissions } = user;

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col"
    >
      {/* === App Bar === */}
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-transform duration-500 ${
          showHeader ? "translate-y-0" : "-translate-y-full"
        } backdrop-blur bg-white/70 shadow-md py-3 px-6 flex items-center justify-between border-b border-slate-200`}
      >
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          <img
            src={
              user?.image ||
              "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
            }
            alt="User Avatar"
            className="w-12 h-12 rounded-full border-2 border-emerald-500"
          />

          <div>
            <h1 className="text-lg font-semibold text-emerald-700">
              {user?.username}
            </h1>
            <p className="text-slate-500 text-sm">
              {user?.role || "مستخدم عادي"}
            </p>
          </div>
        </div>
        <img src={Logo} alt="App Logo" className="w-16 h-16 object-contain" />
      </header>

      {/* === Spacer to avoid content under fixed header === */}
      <div className="h-24"></div>

      {/* === Dashboard Main === */}
      <main className="flex-1 p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {permissions?.viewEmployees && (
          <DashboardCard
            title="الموظفين"
            subtitle="عرض وتحديث بيانات الموظفين"
            svg={EmployeesSVG}
            color="from-green-400 to-emerald-500"
            onClick={() => handleCardClick("employees")}
          />
        )}

        {permissions?.viewDocuments && (
          <DashboardCard
            title="الوثائق"
            subtitle="استعراض وأرشفة المستندات"
            svg={ReportsSVG}
            color="from-blue-400 to-sky-500"
            onClick={() => handleCardClick("documents")}
          />
        )}

        {permissions?.viewSalary && (
          <DashboardCard
            title="الرواتب والمكافآت"
            subtitle="تتبع الأداء والمكافآت الشهرية"
            svg={VacationsSVG}
            color="from-orange-400 to-amber-500"
            onClick={() => handleCardClick("salary")}
          />
        )}
      </main>

      {/* === Send Message Section === */}
      <section className="p-6 bg-white shadow-inner mt-auto">
        <MessageBox
          onSend={(msg) => notifyAdmin(`رسالة من ${user?.username}: ${msg}`)}
        />
      </section>

      {/* === Footer === */}
      <footer className="bg-emerald-600 text-white text-center py-3 mt-6 space-y-2">
        <p className="text-sm">
          © {new Date().getFullYear()} جميع الحقوق محفوظة | تم التطوير بواسطة
          فريق الدعم الفني
        </p>
        {/* ✅ Test notification button */}
        <button
          onClick={() => notifyAdmin(`🔔 اختبار الإشعارات من ${user.username}`)}
          className="bg-white/20 hover:bg-white/30 text-white px-4 py-1 rounded-md transition"
        >
          🔔 اختبار الإشعار
        </button>
      </footer>

      {/* === User Info Modal === */}
      {showModal && (
        <UserInfoModal user={user} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

/* === Dashboard Card === */
function DashboardCard({ title, subtitle, svg, color, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`relative group bg-white shadow-lg rounded-2xl p-6 cursor-pointer overflow-hidden border border-slate-100 transition-all transform hover:-translate-y-2 hover:shadow-2xl`}
    >
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${color}`}
      ></div>
      <div className="relative z-10 flex items-center gap-4">
        <div className="w-16 h-16 bg-emerald-50 flex items-center justify-center rounded-xl">
          <img src={svg} alt={title} className="w-10 h-10 animate-fadeIn" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800 group-hover:text-white transition-colors">
            {title}
          </h3>
          <p className="text-slate-500 text-sm mt-1 group-hover:text-white/90 transition-colors">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

/* === Message Box === */
function MessageBox({ onSend }) {
  const [msg, setMsg] = useState("");

  const handleSend = () => {
    if (!msg.trim()) return;
    onSend(msg.trim());
    setMsg("");
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center gap-3">
      <input
        type="text"
        placeholder="اكتب رسالة إلى المشرف..."
        className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
      />
      <button
        onClick={handleSend}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg shadow transition-all"
      >
        إرسال
      </button>
    </div>
  );
}

/* === User Info Modal === */
function UserInfoModal({ user, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full text-right relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-2 left-2 text-gray-400 hover:text-gray-700"
        >
          ✕
        </button>
        <h2 className="text-2xl font-semibold text-emerald-700 mb-4">
          معلومات المستخدم
        </h2>
        <div className="text-gray-700 space-y-2">
          <p>
            <strong>الاسم:</strong> {user.username}
          </p>
          <p>
            <strong>الدور:</strong> {user.role}
          </p>
          <p>
            <strong>تاريخ الإنشاء:</strong>{" "}
            {new Date(user.createdAt).toLocaleString("ar-EG")}
          </p>
          <p>
            <strong>آخر تحديث:</strong>{" "}
            {new Date(user.updatedAt).toLocaleString("ar-EG")}
          </p>
          <div>
            <strong>الصلاحيات:</strong>
            <ul className="list-disc list-inside mt-2 text-sm text-gray-600">
              {Object.entries(user.permissions || {}).map(([key, val]) => (
                <li key={key}>
                  {key}:{" "}
                  <span
                    className={`font-bold ${
                      val ? "text-emerald-600" : "text-rose-500"
                    }`}
                  >
                    {val ? "مفعل" : "غير مفعل"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
