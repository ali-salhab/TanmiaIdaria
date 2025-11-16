import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Bell, Users, Settings, LogOut, FileText, Archive, X } from "lucide-react";
import { useSocket } from "../context/SocketContext";

export default function Sidebar({ onLogout, isOpen, onClose }) {
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    socket.on("notification", (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 10));
    });

    return () => {
      socket.off("onlineUsers");
      socket.off("notification");
    };
  }, [socket]);

  const menuItems = [
    { label: "📋 الموظفين", to: "/dashboard/employees" },
    { label: "📤 قاعدة البيانات", to: "/dashboard/upload" },
    { label: "⚙️ المستخدمين", to: "/dashboard/users" },
    { label: "🎨 تخصيص الصفحة الرئيسية", to: "/dashboard/homepage-builder" },
    { label: "📃 الديوان", to: "/dashboard/dywan" },
    { label: "🖨️ الأرشيف", to: "/dashboard" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-teal-600 via-teal-700 to-teal-800 text-white flex flex-col shadow-2xl border-l border-teal-400/20 overflow-hidden z-40 animate-slideInLeft md:block hidden">
      <div className="p-6 border-b border-teal-400/30 text-center backdrop-blur-sm bg-teal-600/50">
        <h1 className="text-2xl font-bold drop-shadow-lg text-white">التنمية الإدارية</h1>
        <p className="text-sm text-teal-100 mt-1 font-medium">لوحة التحكم</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto" dir="rtl">
        {menuItems.map((item, idx) => (
          <Link
            key={idx}
            to={item.to}
            className="group block py-3 px-4 rounded-lg bg-white/10 hover:bg-white/25 transition-all transform hover:translate-x-1 hover:scale-105 backdrop-blur-sm border border-white/10 hover:border-white/30 font-medium text-sm"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-teal-400/30 p-4 space-y-4">
        <div className="bg-teal-500/30 backdrop-blur-sm border border-teal-400/30 rounded-lg p-3 space-y-2">
          <h3 className="text-xs font-semibold text-teal-100 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4" /> المستخدمون المتصلون
          </h3>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {onlineUsers.length > 0 ? (
              onlineUsers.map((user, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-teal-100">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  {user}
                </div>
              ))
            ) : (
              <p className="text-xs text-teal-300 italic">لا توجد مستخدمون متصلون</p>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-full flex items-center justify-between bg-teal-500/30 hover:bg-teal-500/50 backdrop-blur-sm border border-teal-400/30 rounded-lg p-3 transition-all group"
          >
            <span className="flex items-center gap-2 font-medium text-sm">
              <Bell className="w-4 h-4" /> الإشعارات
            </span>
            {notifications.length > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                {notifications.length > 9 ? "9+" : notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute bottom-full right-0 mb-2 w-72 bg-teal-900/95 backdrop-blur-md border border-teal-400/30 rounded-lg shadow-2xl p-3 space-y-2 max-h-64 overflow-y-auto z-50">
              {notifications.length > 0 ? (
                notifications.map((notif, idx) => (
                  <div
                    key={idx}
                    className="bg-teal-800/50 border border-teal-400/20 rounded p-2 text-xs text-teal-100 hover:bg-teal-800/70 transition cursor-pointer"
                  >
                    {notif.message || notif}
                    <p className="text-teal-300 text-xs mt-1">
                      {new Date(notif.time || Date.now()).toLocaleTimeString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-teal-300 text-center italic p-2">لا توجد إشعارات</p>
              )}
            </div>
          )}
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 bg-rose-500/80 hover:bg-rose-600 text-white py-2 rounded-lg transition-all transform hover:scale-105 font-medium text-sm border border-rose-400/30"
        >
          <LogOut className="w-4 h-4" /> تسجيل الخروج
        </button>
      </div>

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.6s ease-out forwards;
        }
      `}</style>
    </aside>
  );
}
