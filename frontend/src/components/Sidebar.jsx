import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  Bell,
  Users,
  Settings,
  LogOut,
  FileText,
  Archive,
  X,
} from "lucide-react";
import { useSocket } from "../context/SocketContext";
import logo from "../assets/logo.png";

export default function Sidebar({ onLogout, isOpen, onClose }) {
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on("online_users", (users) => {
      setOnlineUsers(users);
    });

    socket.on("notification", (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 10));
    });

    return () => {
      socket.off("online_users");
      socket.off("notification");
    };
  }, [socket]);

  const menuItems = [
    { label: "📋 الموظفين", to: "/dashboard/employees" },
    { label: "📤 قاعدة البيانات", to: "/dashboard/upload" },
    { label: "🎨 تخصيص الصفحة الرئيسية", to: "/dashboard/homepage-builder" },
    { label: "📃 الديوان", to: "/dashboard/dywan" },
    { label: "🖨️ الأرشيف", to: "/dashboard/archive" },
    { label: "reports", to: "/dashboard/reports" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white/90 backdrop-blur-md text-gray-800 hidden md:flex flex-col shadow-2xl border-l border-gray-200 overflow-hidden z-40 animate-slideInLeft">
      <div className="p-6 border-b border-gray-200 text-center bg-white/50 flex flex-col items-center">
        <img
          src={logo}
          alt="Logo"
          className="w-20 h-20 mb-3 object-contain drop-shadow-md grayscale opacity-90 hover:grayscale-0 transition-all duration-500"
        />
        <h1 className="text-xl font-bold drop-shadow-sm text-gray-800">
          التنمية الإدارية
        </h1>
        <p className="text-sm text-gray-500 mt-1 font-medium">لوحة التحكم</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto" dir="rtl">
        {menuItems.map((item, idx) => (
          <Link
            key={idx}
            to={item.to}
            className="group block py-3 px-4 rounded-lg bg-white/50 hover:bg-gray-100 transition-all transform hover:translate-x-1 hover:scale-105 border border-transparent hover:border-gray-200 font-medium text-sm text-gray-700 hover:text-gray-900 shadow-sm hover:shadow-md"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-gray-200 p-4 space-y-4">
        <div className="bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-lg p-3 space-y-2 shadow-inner">
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4" /> المستخدمون المتصلون
          </h3>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {onlineUsers.length > 0 ? (
              onlineUsers.map((user, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs text-gray-600"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  {user}
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">
                لا توجد مستخدمون متصلون
              </p>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 backdrop-blur-sm border border-gray-200 rounded-lg p-3 transition-all group shadow-sm"
          >
            <span className="flex items-center gap-2 font-medium text-sm text-gray-700 group-hover:text-gray-900">
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
                <p className="text-xs text-teal-300 text-center italic p-2">
                  لا توجد إشعارات
                </p>
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
