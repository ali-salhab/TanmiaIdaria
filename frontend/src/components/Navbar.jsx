import { useState, useRef, useEffect } from "react";
import {
  Bell,
  User,
  Megaphone,
  Search,
  Menu,
  X,
  MessageCircle,
  Settings,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useSettings } from "../context/SettingsContext";
import API from "../api/api";
import GlobalSearchModal from "./GlobalSearchModal";

const navbarMessages = [
  "🎯 مرحباً بك في نظام إدارة الموارد البشرية",
  "📊 إدارة فعالة للموارد البشرية",
  "⚡ تحسين الإنتاجية والكفاءة",
  "🚀 تطبيق حديث وآمن",
];

export default function Navbar({
  userInfo,
  sidebarOpen,
  sidebarMinimized,
  onToggleSidebar,
  onToggleMinimize,
  onOpenChat,
  unreadChatCount = 0,
}) {
  const navigate = useNavigate();
  const { playNotification } = useSettings();
  const [showSearchModal, setShowSearchModal] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const { socket } = useSocket();
  const isAdmin = userInfo?.role === "admin";
  const userId = userInfo?._id;

  const handleNotificationClick = async () => {
    try {
      await API.put("/notifications/mark-read");
      setNotifications([]);
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }

    if (isAdmin) {
      navigate("/dashboard/admin-notifications");
    } else {
      navigate("/dashboard/notifications");
    }
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await API.get("/notifications");
        // Filter unread notifications only if needed, or just show all
        // Assuming API returns all, we might want to filter unread for the badge
        const unread = res.data.filter((n) => !n.read);
        setNotifications(unread);
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };
    if (userInfo) {
      fetchNotifications();
    }
  }, [userInfo]);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % navbarMessages.length);
        setIsFlipping(false);
      }, 500);
    }, 3000);

    return () => clearInterval(messageInterval);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification) => {
      const targetId = notification?.userId;
      if (userId && targetId && targetId !== userId) {
        return;
      }
      setNotifications((prev) => [notification, ...prev].slice(0, 15));
      playNotification();
    };

    const handlePermissionUpdate = (data) => {
      const message = data.changes
        .map(
          (c) =>
            `${c.name}: ${c.oldValue ? "مفعل" : "معطل"} → ${
              c.newValue ? "مفعل" : "معطل"
            }`
        )
        .join(", ");
      setNotifications((prev) =>
        [
          {
            type: "permission_change",
            message: `تم تحديث صلاحياتك: ${message}`,
            time: data.timestamp,
          },
          ...prev,
        ].slice(0, 15)
      );
      playNotification();
    };

    socket.on("notification", handleNotification);
    socket.on("permission_update", handlePermissionUpdate);

    return () => {
      socket.off("notification", handleNotification);
      socket.off("permission_update", handlePermissionUpdate);
    };
  }, [socket, playNotification, userId]);

  useEffect(() => {
    if (!userId) return;
    setNotifications((prev) =>
      prev.filter((notification) => {
        if (!notification?.userId) return true;
        return notification.userId === userId;
      })
    );
  }, [userId]);

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 h-16 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800 flex items-center justify-between px-4 md:px-6 z-30 shadow-lg shadow-black/30 transition-all duration-300 ${sidebarMinimized ? 'lg:right-20' : 'lg:right-64'} right-0`}
        dir="rtl"
      >
        <div className="flex items-center gap-2 md:gap-4 flex-1">
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                onToggleSidebar();
              } else {
                onToggleMinimize();
              }
            }}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-all transform hover:scale-110 text-slate-300"
            title={
              sidebarOpen ? "إغلاق القائمة الجانبية" : "فتح القائمة الجانبية"
            }
          >
            <Menu className="w-5 h-5 lg:block hidden" />
            <div className="lg:hidden">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </div>
          </button>

          {/* search container */}
          <div className="relative rounded flex-1 max-w-md hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="ابحث..."
              readOnly
              onFocus={() => setShowSearchModal(true)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm text-slate-100 placeholder-slate-500 cursor-pointer"
              dir="rtl"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative bg-slate-800/50 gap-2 rounded-lg p-1 flex border border-slate-700">
            <button
              onClick={handleNotificationClick}
              className="relative p-2 hover:bg-slate-700/70 rounded-lg transition group"
              title="الإشعارات"
            >
              <Bell className="w-5 h-5 text-slate-300 group-hover:text-amber-300 transition" />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse font-bold shadow-lg">
                  {notifications.length > 9 ? "9+" : notifications.length}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate("/dashboard/circulars")}
              className="p-1.5 md:p-2 hover:bg-slate-700/70 rounded-lg transition group"
              title="التعاميم"
            >
              <Megaphone className="w-5 h-5 text-slate-300 group-hover:text-amber-300 transition" />
            </button>
          </div>

          <button
            onClick={() => onOpenChat && onOpenChat()}
            className="p-2 bg-slate-800/50 border border-slate-700 hover:bg-slate-700/70 rounded-lg transition relative"
            title="الدردشة"
          >
            <MessageCircle className="w-5 h-5 text-slate-300" />
            {unreadChatCount > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center animate-pulse font-bold shadow-lg">
                {unreadChatCount > 9 ? "9+" : unreadChatCount}
              </span>
            )}
          </button>

          {userInfo && (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-100">
                  {userInfo.username}
                </p>
                <p className="text-xs text-slate-400">{userInfo.role}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/dashboard/settings")}
                  className="p-2 hover:bg-slate-700/70 rounded-lg transition"
                  title="الإعدادات"
                >
                  <Settings className="w-5 h-5 text-slate-300" />
                </button>
                <img
                  src={
                    userInfo.image ||
                    "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                  }
                  alt={userInfo.username}
                  className="w-10 h-10 rounded-full border-2 border-amber-500 object-cover cursor-pointer hover:opacity-80 transition"
                  onClick={() => navigate("/dashboard/profile")}
                />
              </div>
            </div>
          )}
        </div>
      </nav>
      <GlobalSearchModal
        show={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
    </>
  );
}
