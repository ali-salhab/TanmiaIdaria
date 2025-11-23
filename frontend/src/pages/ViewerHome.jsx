import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { Bell, MessageCircle } from "lucide-react";
import EmployeesSVG from "../assets/employees.svg";
import VacationsSVG from "../assets/vacation.svg";
import ReportsSVG from "../assets/report.svg";
import Logo from "../assets/logo.png";
import API from "../api/api";
import AdminChat from "../components/chat/AdminChat";
import { checkPermission } from "../utils/permissionHelper";
const VITE_API_URL = import.meta.env.VITE_API_URL;
console.log(VITE_API_URL);
export default function ViewerHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [permissionsUpdated, setPermissionsUpdated] = useState(0);

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
  // fettch user data
  const fetchUserData = async (token) => {
    try {
      const me = await API.get(`/auth/me`);
      console.log("📥 Fetched user data:", me.data);
      console.log("📌 User ID:", me.data.user._id);
      console.log("📌 User permissions object:", me.data.user.permissions);
      console.log("📌 User permission groups:", me.data.user.permissionGroups);
      console.log(
        "📌 User direct permissions:",
        me.data.user.directPermissions
      );
      console.log("📊 Permission breakdown:");
      Object.entries(me.data.user.permissions || {}).forEach(([key, value]) => {
        console.log(`   ${key}: ${value ? "✅" : "❌"}`);
      });
      setUser(me.data.user);
      localStorage.setItem("userId", me.data.user._id);
      localStorage.setItem("username", me.data.user.username);
    } catch (err) {
      console.error("❌ Error loading user:", err);
      navigate("/login");
    }
  };
  // get notifications
  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data || []);
    } catch (err) {
      console.log("Error loading notifications:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      console.log("there is token in viewer home page ", token);

      if (!token) return navigate("/login");

      try {
        const decoded = jwtDecode(token);
        await fetchUserData(token);
        await fetchNotifications();

        console.log("🔌 Creating socket connection to:", VITE_API_URL);
        const newSocket = io(VITE_API_URL);
        setSocket(newSocket);
        console.log("✅ Emitting user_connected with ID:", decoded.id);
        newSocket.emit("user_connected", decoded.id);

        newSocket.on("permission_update", async (data) => {
          console.log("🔔 Permission update received:", data);
          console.log("📌 Current user ID:", decoded.id);
          console.log("📌 Updated user ID:", data.userId);

          const isForThisUser =
            data.userId === decoded.id ||
            data.userId === localStorage.getItem("userId");
          console.log("🎯 Is for this user?", isForThisUser);

          if (isForThisUser) {
            console.log("✅ This permission update is for me!");

            try {
              await fetchUserData(token);
              console.log("✅ Fetched fresh user data from server");
            } catch (err) {
              console.error("❌ Failed to fetch fresh data:", err);
            }

            setPermissionsUpdated((prev) => {
              console.log(
                "🔄 Triggering re-render, permissionsUpdated:",
                prev + 1
              );
              return prev + 1;
            });
          }
        });

        newSocket.on("personal_notification", (data) => {
          console.log("Personal notification received:", data);
          setNotifications((prev) => [data, ...prev].slice(0, 15));
        });

        newSocket.on("notification", (data) => {
          console.log("New notification:", data);
          setNotifications((prev) => [data, ...prev].slice(0, 15));
        });

        return () => {
          newSocket.off("permission_update");
          newSocket.off("notification");
          newSocket.disconnect();
        };
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
  console.log("🎨 Rendering ViewerHome with permissions:", permissions);

  const canViewEmployees = checkPermission("employees.view", user);
  const canViewDocuments = checkPermission("documents.view", user);
  const canViewSalary = checkPermission("salary.view", user);

  const hasNoPermissions =
    !canViewEmployees && !canViewDocuments && !canViewSalary;
  console.log("🔒 Has no permissions (show lock message):", hasNoPermissions);
  console.log("📋 canViewEmployees:", canViewEmployees);
  console.log("📋 canViewDocuments:", canViewDocuments);
  console.log("📋 canViewSalary:", canViewSalary);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col"
    >
      {/* === App Bar === */}
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-transform duration-500 ${
          showHeader ? "translate-y-0" : "-translate-y-full"
        } backdrop-blur bg-white/70 shadow-md py-2 md:py-3 px-3 md:px-6 flex items-center justify-between border-b border-slate-200`}
      >
        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition relative"
              title="الإشعارات"
            >
              <Bell className="w-4 md:w-5 h-4 md:h-5 text-gray-600" />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 md:w-5 md:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse font-bold shadow-lg text-xs">
                  {notifications.length > 9 ? "9+" : notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 bg-white border border-gray-200 rounded-xl shadow-2xl p-3 space-y-2 max-h-80 overflow-y-auto z-50 text-right">
                <div className="font-semibold text-gray-800 pb-2 border-b border-gray-200 text-sm md:text-base">
                  الإشعارات ({notifications.length})
                </div>
                {notifications.length > 0 ? (
                  notifications.map((notif, idx) => (
                    <div
                      key={idx}
                      className="bg-blue-50 border border-blue-200 rounded-lg p-2 md:p-3 text-xs md:text-sm hover:shadow-md transition cursor-pointer"
                    >
                      <p className="font-medium text-blue-700">
                        {notif.title || notif.message || notif}
                      </p>
                      <p className="text-gray-600 text-xs mt-1">
                        {notif.message}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(
                          notif.createdAt || Date.now()
                        ).toLocaleTimeString("ar-EG")}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs md:text-sm text-gray-500 text-center italic p-2">
                    لا توجد إشعارات
                  </p>
                )}
              </div>
            )}
          </div>

          {checkPermission("chat.access", user) && (
            <button
              onClick={() => setShowChat(!showChat)}
              className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition"
              title="الدردشة مع الإدارة"
            >
              <MessageCircle className="w-4 md:w-5 h-4 md:h-5 text-gray-600" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-4 flex-1 justify-center">
          <div
            className="flex items-center gap-2 md:gap-3 cursor-pointer hover:opacity-80 transition"
            onClick={() => setShowModal(true)}
          >
            <div className="text-right hidden sm:block">
              <h1 className="text-sm md:text-lg font-semibold text-emerald-700">
                {user?.username}
              </h1>
              <p className="text-slate-500 text-xs">
                {user?.role || "مستخدم عادي"}
              </p>
            </div>
            <div className="w-9 h-9 md:w-12 md:h-12 rounded-full border-2 md:border-3 border-emerald-500 bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm md:text-lg shadow-md flex-shrink-0">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
        <img
          src={Logo}
          alt="App Logo"
          className="w-10 md:w-16 h-10 md:h-16 object-contain"
        />
      </header>

      {/* === Spacer to avoid content under fixed header === */}
      <div className="h-16 md:h-24"></div>

      {/* === Dashboard Main === */}
      <main
        key={permissionsUpdated}
        className="flex-1 p-4 md:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
      >
        {canViewEmployees && (
          <DashboardCard
            title="الموظفين"
            subtitle="عرض وتحديث بيانات الموظفين"
            svg={EmployeesSVG}
            color="from-green-400 to-emerald-500"
            onClick={() => handleCardClick("employees")}
          />
        )}

        {canViewDocuments && (
          <DashboardCard
            title="الوثائق"
            subtitle="استعراض وأرشفة المستندات"
            svg={ReportsSVG}
            color="from-blue-400 to-sky-500"
            onClick={() => handleCardClick("documents")}
          />
        )}

        {canViewSalary && (
          <DashboardCard
            title="الرواتب والمكافآت"
            subtitle="تتبع الأداء والمكافآت الشهرية"
            svg={VacationsSVG}
            color="from-orange-400 to-amber-500"
            onClick={() => handleCardClick("salary")}
          />
        )}

        {hasNoPermissions && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 px-4">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              لا توجد صلاحيات متاحة
            </h3>
            <p className="text-slate-500 text-center">
              يرجى التواصل مع المسؤول لتفعيل الصلاحيات
            </p>
          </div>
        )}
      </main>

      {/* === Send Message Section === */}
      {/* <section className="p-4 md:p-6 bg-gradient-to-r from-slate-50 to-blue-50 shadow-inner mt-auto border-t border-slate-200">
        <MessageBox
          onSend={(msg) => notifyAdmin(`رسالة من ${user?.username}: ${msg}`)}
        />
      </section> */}

      {/* === Footer === */}
      <footer className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-center py-3 md:py-4 mt-auto space-y-2 shadow-lg">
        <p className="text-xs md:text-sm">
          © {new Date().getFullYear()} جميع الحقوق محفوظة | تم التطوير بواسطة
          فريق الدعم الفني
        </p>
        <button
          onClick={() => notifyAdmin(`🔔 اختبار الإشعارات من ${user.username}`)}
          className="bg-white/20 hover:bg-white/30 text-white px-3 md:px-4 py-1.5 rounded-md transition text-xs md:text-sm inline-block"
        >
          🔔 اختبار الإشعار
        </button>
      </footer>

      <style>
        {`
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-scaleIn {
            animation: scaleIn 0.4s ease-out forwards;
          }
        `}
      </style>

      {/* === User Info Modal === */}
      {showModal && (
        <UserInfoModal user={user} onClose={() => setShowModal(false)} />
      )}

      {/* === Admin Chat === */}
      {showChat && (
        <AdminChat isAdmin={false} onClose={() => setShowChat(false)} />
      )}
    </div>
  );
}

/* === Dashboard Card === */
function DashboardCard({ title, subtitle, svg, color, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`relative group bg-white shadow-md rounded-xl md:rounded-2xl p-4 md:p-6 cursor-pointer overflow-hidden border border-slate-200 transition-all transform hover:-translate-y-1 md:hover:-translate-y-2 hover:shadow-xl animate-scaleIn`}
    >
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${color}`}
      ></div>
      <div className="relative z-10 flex items-center gap-3 md:gap-4">
        <div className="w-12 md:w-16 h-12 md:h-16 bg-emerald-100 flex items-center justify-center rounded-lg md:rounded-xl flex-shrink-0 group-hover:bg-white/20 transition-colors">
          <img
            src={svg}
            alt={title}
            className="w-8 md:w-10 h-8 md:h-10 animate-fadeIn"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base md:text-lg font-semibold text-slate-800 group-hover:text-white transition-colors truncate">
            {title}
          </h3>
          <p className="text-slate-500 text-xs md:text-sm mt-1 group-hover:text-white/90 transition-colors line-clamp-2">
            {subtitle}
          </p>
        </div>
      </div>
      <div className="absolute top-2 right-2 md:top-3 md:right-3 w-2 h-2 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </div>
  );
}

/* === Message Box === */

/* === User Info Modal === */
function UserInfoModal({ user, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-6 max-w-md w-full text-right relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-3 left-3 md:top-4 md:left-4 text-gray-400 hover:text-gray-600 transition text-lg"
        >
          ✕
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-emerald-700">
              {user.username}
            </h2>
            <p className="text-xs md:text-sm text-gray-500">{user.role}</p>
          </div>
        </div>
        <hr className="my-4" />
        <div className="text-gray-700 space-y-3 max-h-80 overflow-y-auto">
          <div>
            <p className="text-xs text-gray-500">تاريخ الإنشاء</p>
            <p className="text-sm font-medium">
              {new Date(user.createdAt).toLocaleString("ar-EG")}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">آخر تحديث</p>
            <p className="text-sm font-medium">
              {new Date(user.updatedAt).toLocaleString("ar-EG")}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">الصلاحيات</p>
            <div className="space-y-1.5">
              {Object.entries(user.permissions || {}).map(([key, val]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                >
                  <span className="capitalize text-gray-700">{key}</span>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                      val
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {val ? "✓ مفعل" : "✗ معطل"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
