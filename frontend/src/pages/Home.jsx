import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { Bell, MessageCircle, Megaphone } from "lucide-react";
import API from "../api/api";
import AdminChat from "../components/AdminChat";
import { checkPermission } from "../utils/permissionHelper";
import { getAvailableSections } from "../utils/homeSectionsConfig";
import Logo from "../assets/logo.png";

const VITE_API_URL = import.meta.env.VITE_API_URL;

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [loading, setLoading] = useState(true);

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

  const fetchUserData = useCallback(async () => {
    try {
      const response = await API.get("/auth/me");
      setUser(response.data.user);
      localStorage.setItem("userId", response.data.user._id);
      localStorage.setItem("username", response.data.user.username);
    } catch (error) {
      console.error("Error fetching user:", error);
      navigate("/login");
    }
  }, [navigate]);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await API.get("/notifications");
      setNotifications(response.data || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      try {
        await fetchUserData();
        await fetchNotifications();

        const newSocket = io(VITE_API_URL);

        newSocket.emit("user_connected", localStorage.getItem("userId"));

        newSocket.on("permission_update", async () => {
          await fetchUserData();
        });

        newSocket.on("personal_notification", (data) => {
          setNotifications((prev) => [data, ...prev].slice(0, 15));
        });

        newSocket.on("notification", (data) => {
          setNotifications((prev) => [data, ...prev].slice(0, 15));
        });

        return () => {
          newSocket.off("permission_update");
          newSocket.off("personal_notification");
          newSocket.off("notification");
          newSocket.disconnect();
        };
      } catch (error) {
        console.error("Error initializing:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [navigate, fetchUserData, fetchNotifications]);

  if (loading || !user) {
    return (
      <div dir="rtl" className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-gray-600">جاري تحميل البيانات...</div>
      </div>
    );
  }

  const allowedSections = getAvailableSections(user);

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-transform duration-500 ${
          showHeader ? "translate-y-0" : "-translate-y-full"
        } backdrop-blur bg-white/70 shadow-md py-2 md:py-3 px-3 md:px-6 flex items-center justify-between border-b border-slate-200`}
      >
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition relative"
            title="الإشعارات"
          >
            <Bell className="w-4 md:w-5 h-4 md:h-5 text-gray-600" />
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 md:w-5 md:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse font-bold">
                {notifications.length > 9 ? "9+" : notifications.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowChat(!showChat)}
            className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition"
            title="الدردشة"
          >
            <MessageCircle className="w-4 md:w-5 h-4 md:h-5 text-gray-600" />
          </button>

          <button
            onClick={() => navigate("/circulars")}
            className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition"
            title="التعاميم"
          >
            <Megaphone className="w-4 md:w-5 h-4 md:h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-2 md:gap-3 cursor-pointer hover:opacity-80 transition" onClick={() => navigate("/profile")}>
            <div className="text-right hidden sm:block">
              <h1 className="text-sm md:text-lg font-semibold text-emerald-700">{user?.username}</h1>
              <p className="text-slate-500 text-xs">{user?.role || "مستخدم"}</p>
            </div>
            <div className="w-9 h-9 md:w-12 md:h-12 rounded-full border-2 md:border-3 border-emerald-500 bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm md:text-lg flex-shrink-0">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <img src={Logo} alt="Logo" className="w-10 md:w-16 h-10 md:h-16 object-contain" />
      </header>

      {showNotifications && (
        <div className="fixed top-16 right-3 md:right-6 w-72 sm:w-80 bg-white border border-gray-200 rounded-xl shadow-2xl p-3 space-y-2 max-h-80 overflow-y-auto z-50 text-right">
          <div className="font-semibold text-gray-800 pb-2 border-b border-gray-200 text-sm">الإشعارات ({notifications.length})</div>
          {notifications.length > 0 ? (
            notifications.map((notif, idx) => (
              <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-2 md:p-3 text-xs md:text-sm hover:shadow-md transition">
                <p className="font-medium text-blue-700">{notif.title || notif.message}</p>
                <p className="text-gray-500 text-xs mt-1">{new Date(notif.createdAt || Date.now()).toLocaleTimeString("ar-EG")}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500 text-center p-2">لا توجد إشعارات</p>
          )}
        </div>
      )}

      <div className="h-16 md:h-24"></div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        {allowedSections.length > 0 ? (
          <>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">مرحباً {user?.username} 👋</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
              {allowedSections.map((section) => (
                <button
                  key={section.category}
                  onClick={() => {
                    console.log(`Navigating to ${section.path}`);
                    navigate(section.path);
                  }}
                  className={`relative group bg-white shadow-md rounded-xl md:rounded-2xl p-4 md:p-6 cursor-pointer overflow-hidden border border-slate-200 transition-all transform hover:-translate-y-1 md:hover:-translate-y-2 hover:shadow-xl text-left w-full`}
                >
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${section.color}`}></div>
                  <div className="relative z-10 text-center">
                    <div className="text-4xl md:text-5xl mb-3">{section.icon}</div>
                    <h3 className="text-base md:text-lg font-semibold text-slate-800 group-hover:text-white transition-colors">{section.label}</h3>
                    <p className="text-xs text-slate-500 group-hover:text-white/80 mt-2 transition-colors">{section.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 px-4 bg-white rounded-xl shadow">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">لا توجد صلاحيات متاحة</h3>
            <p className="text-slate-500 text-center">يرجى التواصل مع المسؤول لتفعيل الصلاحيات</p>
          </div>
        )}
      </main>

      {/* Chat */}
      {showChat && <AdminChat isAdmin={false} onClose={() => setShowChat(false)} />}

      {/* Footer */}
      <footer className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-center py-3 md:py-4 space-y-2 shadow-lg">
        <p className="text-xs md:text-sm">© {new Date().getFullYear()} جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
}
