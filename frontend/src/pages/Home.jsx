import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { Bell, MessageCircle, Megaphone, Shield, Lock } from "lucide-react";
import API from "../api/api";
import AdminChat from "../components/chat/AdminChat";
import { checkPermission } from "../utils/permissionHelper";
import {
  getAvailableSections,
  getSectionPermissionStats,
} from "../utils/homeSectionsConfig";
import PermissionBasedSectionGrid from "../components/common/PermissionBasedSectionGrid";
import { useSettings } from "../context/SettingsContext";
import HoverCard from "../components/HoverCard";
import Logo from "../assets/logo.png";

const VITE_API_URL = import.meta.env.VITE_API_URL;

export default function Home() {
  const navigate = useNavigate();
  const { playNotification } = useSettings();
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
          playNotification();
        });

        newSocket.on("notification", (data) => {
          setNotifications((prev) => [data, ...prev].slice(0, 15));
          playNotification();
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

  // Get available sections and group by category
  const allowedSections = useMemo(() => {
    if (!user) return [];
    return getAvailableSections(user);
  }, [user]);

  // Get user permissions count
  const permissionStats = useMemo(() => {
    if (!user) return null;
    return getSectionPermissionStats(user);
  }, [user]);

  // No need for these functions anymore as they're now in the reusable components

  if (loading || !user) {
    return (
      <div
        dir="rtl"
        className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <div className="text-gray-600 text-lg">جاري تحميل البيانات...</div>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === "admin";

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex flex-col"
    >
      {/* Header */}
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-transform duration-500 ${
          showHeader ? "translate-y-0" : "-translate-y-full"
        } backdrop-blur-md bg-white/80 shadow-lg py-3 md:py-4 px-4 md:px-6 flex items-center justify-between border-b border-slate-200/50`}
      >
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 md:p-2.5 hover:bg-emerald-50 rounded-xl transition-all relative group"
            title="الإشعارات"
          >
            <Bell className="w-5 md:w-6 h-5 md:h-6 text-gray-700 group-hover:text-emerald-600 transition-colors" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse font-bold shadow-lg">
                {notifications.length > 9 ? "9+" : notifications.length}
              </span>
            )}
          </button>

          {(isAdmin || checkPermission("chat.access", user)) && (
            <button
              onClick={() => setShowChat(!showChat)}
              className="p-2 md:p-2.5 hover:bg-blue-50 rounded-xl transition-all group"
              title="الدردشة"
            >
              <MessageCircle className="w-5 md:w-6 h-5 md:h-6 text-gray-700 group-hover:text-blue-600 transition-colors" />
            </button>
          )}

          {checkPermission("circulars.view", user) && (
            <button
              onClick={() => navigate("/circulars")}
              className="p-2 md:p-2.5 hover:bg-amber-50 rounded-xl transition-all group"
              title="التعاميم"
            >
              <Megaphone className="w-5 md:w-6 h-5 md:h-6 text-gray-700 group-hover:text-amber-600 transition-colors" />
            </button>
          )}
        </div>

        <div className="flex-1 flex justify-center">
          <div
            className="flex items-center gap-3 md:gap-4 cursor-pointer hover:opacity-90 transition-all group"
            onClick={() => navigate("/profile")}
          >
            <div className="text-right hidden sm:block">
              <h1 className="text-base md:text-xl font-bold text-emerald-700 group-hover:text-emerald-600 transition-colors">
                {user?.username}
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-slate-500 text-xs md:text-sm">
                  {user?.role || "مستخدم"}
                </p>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                    <Shield className="w-3 h-3" />
                    مسؤول
                  </span>
                )}
              </div>
            </div>
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-full border-3 border-emerald-500 bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-base md:text-xl flex-shrink-0 shadow-lg group-hover:shadow-xl transition-shadow">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <img
          src={Logo}
          alt="Logo"
          className="w-12 md:w-20 h-12 md:h-20 object-contain opacity-90 hover:opacity-100 transition-opacity"
        />
      </header>

      {showNotifications && (
        <div className="fixed top-20 right-4 md:right-8 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 space-y-3 max-h-96 overflow-y-auto z-50 text-right backdrop-blur-sm">
          <div className="font-bold text-gray-800 pb-3 border-b border-gray-200 text-base flex items-center justify-between">
            <span>الإشعارات ({notifications.length})</span>
            <button
              onClick={() => setShowNotifications(false)}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          </div>
          {notifications.length > 0 ? (
            notifications.map((notif, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 text-sm hover:shadow-md transition-all cursor-pointer"
              >
                <p className="font-semibold text-blue-800">
                  {notif.title || notif.message}
                </p>
                <p className="text-gray-500 text-xs mt-1.5 flex items-center gap-2">
                  <span>
                    {new Date(notif.createdAt || Date.now()).toLocaleTimeString(
                      "ar-EG"
                    )}
                  </span>
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center p-4">
              لا توجد إشعارات
            </p>
          )}
        </div>
      )}

      <div className="h-20 md:h-28"></div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 md:p-8 shadow-xl text-white">
            <h1 className="text-3xl md:text-5xl font-bold mb-3">
              مرحباً {user?.username} 👋
            </h1>
            <p className="text-emerald-50 text-base md:text-lg mb-4">
              {isAdmin
                ? "لديك وصول كامل لجميع أقسام النظام"
                : permissionStats
                ? `لديك صلاحية الوصول إلى ${permissionStats.available} من ${permissionStats.total} قسم (${permissionStats.percentage}%)`
                : "استكشف الأقسام المتاحة لك"}
            </p>
            {!isAdmin && permissionStats && (
              <div className="flex items-center gap-2 mt-4">
                <div className="flex-1 bg-white/20 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-white h-full rounded-full transition-all duration-500"
                    style={{ width: `${permissionStats.percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">
                  {permissionStats.percentage}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Hover Cards Demo */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            ميزات النظام
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <HoverCard
              title="إدارة الموظفين"
              description="إدارة شاملة لبيانات الموظفين والرواتب والإجازات"
              hoverContent={{
                title: "إحصائيات الموظفين",
                description:
                  "عرض تفصيلي لجميع الموظفين مع إمكانية التعديل والإضافة",
                stats: [
                  { value: "150+", label: "موظف" },
                  { value: "12", label: "قسم" },
                ],
              }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50"
            />
            <HoverCard
              title="نظام الإشعارات"
              description="إشعارات فورية للتحديثات والأحداث المهمة"
              hoverContent={{
                title: "إشعارات اليوم",
                description: "تابع آخر التحديثات والإعلانات في الوقت الفعلي",
                stats: [
                  { value: notifications.length, label: "إشعار جديد" },
                  { value: "24/7", label: "متاح" },
                ],
              }}
              className="bg-gradient-to-br from-emerald-50 to-teal-50"
            />
            <HoverCard
              title="التعاميم والإعلانات"
              description="نشر التعاميم والإعلانات لجميع الموظفين"
              hoverContent={{
                title: "إدارة التعاميم",
                description: "إنشاء وإدارة التعاميم مع إمكانية التوزيع المحدد",
                stats: [
                  { value: "25", label: "تعميم نشط" },
                  { value: "100%", label: "تغطية" },
                ],
              }}
              className="bg-gradient-to-br from-purple-50 to-pink-50"
            />
          </div>
        </div>

        {/* Sections Grid */}
        <PermissionBasedSectionGrid
          allowedSections={allowedSections}
          user={user}
        />

        {/* Quick Stats (if admin or has analytics permission) */}
        {isAdmin && allowedSections.length > 0 && (
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-emerald-500">
              <div className="text-2xl font-bold text-gray-800">
                {allowedSections.length}
              </div>
              <div className="text-sm text-gray-600 mt-1">أقسام متاحة</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
              <div className="text-2xl font-bold text-gray-800">
                {
                  Object.keys(user?.permissions || {}).filter(
                    (k) => user?.permissions[k]
                  ).length
                }
              </div>
              <div className="text-sm text-gray-600 mt-1">صلاحيات مفعلة</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500">
              <div className="text-2xl font-bold text-gray-800">
                {notifications.length}
              </div>
              <div className="text-sm text-gray-600 mt-1">إشعارات جديدة</div>
            </div>
          </div>
        )}
      </main>

      {/* Chat */}
      {showChat && (
        <AdminChat isAdmin={isAdmin} onClose={() => setShowChat(false)} />
      )}

      {/* Footer */}
      <footer className="mt-12 bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-center py-4 md:py-6 shadow-xl">
        <p className="text-sm md:text-base font-medium">
          © {new Date().getFullYear()} جميع الحقوق محفوظة - نظام إدارة الموظفين
        </p>
      </footer>
    </div>
  );
}
