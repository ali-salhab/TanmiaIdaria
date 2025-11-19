import { useState, useRef, useEffect } from "react";
import { Bell, User, Search, Menu, X, MessageCircle } from "lucide-react";
import { useSocket } from "../context/SocketContext";

const navbarMessages = [
  "🎯 مرحباً بك في نظام إدارة التنمية الإدارية",
  "📊 إدارة فعالة للموارد البشرية",
  "⚡ تحسين الإنتاجية والكفاءة",
  "🚀 تطبيق حديث وآمن",
];

export default function Navbar({
  userInfo,
  sidebarOpen,
  onToggleSidebar,
  onOpenChat,
}) {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const notifRef = useRef(null);
  const notifBtnRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const { socket } = useSocket();
  const isAdmin = userInfo?.role === "admin";
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        notifRef.current &&
        !notifRef.current.contains(e.target) &&
        notifBtnRef.current &&
        !notifBtnRef.current.contains(e.target)
      ) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
      setNotifications((prev) => [notification, ...prev].slice(0, 15));
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
    };

    socket.on("notification", handleNotification);
    socket.on("permission_update", handlePermissionUpdate);

    return () => {
      socket.off("notification", handleNotification);
      socket.off("permission_update", handlePermissionUpdate);
    };
  }, [socket]);

  return (
    <>
      <nav className="fixed top-0 right-0 left-0 h-16 bg-gradient-to-r from-white/80 via-white/70 to-white/80 backdrop-blur-md border-b border-teal-200/50 flex items-center justify-between px-4 md:px-6 z-30 shadow-md">
        <div className="flex items-center gap-2 md:gap-4 flex-1">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all transform hover:scale-110 lg:hidden"
            title={
              sidebarOpen ? "إغلاق القائمة الجانبية" : "فتح القائمة الجانبية"
            }
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-gray-600 animate-spin-slow" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600 animate-pulse" />
            )}
          </button>

          {/* Animated Message with 3D Flip */}
          <div className="hidden sm:flex items-center gap-3 flex-1 max-w-md">
            <div className="relative h-10 flex-1 overflow-hidden perspective">
              <div
                className={`absolute inset-0 flex items-center justify-center px-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-lg border border-blue-300/50 transition-all duration-700 transform ${
                  isFlipping ? "scale-y-0 opacity-0" : "scale-100 opacity-100"
                }`}
                style={{
                  transformStyle: "preserve-3d",
                }}
              >
                <p className="text-sm font-bold text-white truncate drop-shadow-lg">
                  {navbarMessages[currentMessageIndex]}
                </p>
              </div>
            </div>
          </div>
          {/* search container */}
          <div className="relative rounded  flex-1 max-w-md hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="ابحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearchModal(true)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 border-r-8 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm text-black"
              dir="rtl"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              ref={notifBtnRef}
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition"
              title="الإشعارات"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse font-bold shadow-lg">
                  {notifications.length > 9 ? "9+" : notifications.length}
                </span>
              )}
            </button>

            {
              <div
                ref={notifRef}
                className={`absolute top-full right-0 mt-2 w-80 md:w-96 bg-white border border-gray-200 rounded-xl shadow-xl p-3 space-y-2 max-h-96 overflow-y-auto z-50 transform transition-all duration-300 origin-top-right
    ${showNotifications ? "animate-slideIn" : "animate-slideOut"}
  `}
              >
                {" "}
                <div className="font-semibold text-gray-800 pb-2 border-b border-gray-200">
                  الإشعارات ({notifications.length})
                </div>
                {notifications.length > 0 ? (
                  notifications.map((notif, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-lg p-3 text-sm hover:shadow-md transition cursor-pointer ${
                        notif.type === "permission_change"
                          ? "bg-blue-50 border-blue-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <p
                        className={`font-medium ${
                          notif.type === "permission_change"
                            ? "text-blue-700"
                            : "text-teal-600"
                        }`}
                      >
                        {notif.type === "permission_change" ? "🔐" : "📢"}{" "}
                        {notif.message || notif}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(
                          notif.time || Date.now()
                        ).toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center italic p-2">
                    لا توجد إشعارات
                  </p>
                )}
              </div>
            }
          </div>

          {isAdmin && (
            <button
              onClick={() => onOpenChat && onOpenChat()}
              className="p-2 hover:bg-gray-100 rounded-lg transition relative"
              title="الدردشة مع المستخدمين"
            >
              <MessageCircle className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {userInfo && (
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">
                  {userInfo.username}
                </p>
                <p className="text-xs text-gray-500">{userInfo.role}</p>
              </div>
              <img
                src={
                  userInfo.image ||
                  "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                }
                alt={userInfo.username}
                className="w-10 h-10 rounded-full border-2 border-teal-500 object-cover"
              />
            </div>
          )}
        </div>
      </nav>
      <style>{`
      @keyframes spin-slow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .animate-spin-slow {
        animation: spin-slow 1s linear infinite;
      }
      
      @keyframes flip-3d {
        0% { transform: rotateY(0deg) scaleY(1); opacity: 1; }
        50% { transform: rotateY(90deg) scaleY(0); opacity: 0; }
        51% { transform: rotateY(-90deg) scaleY(0); opacity: 0; }
        100% { transform: rotateY(0deg) scaleY(1); opacity: 1; }
      }
      
      .perspective {
        perspective: 1000px;
      }
        @keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes slideOut {
  from {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateX(20px) scale(0.95);
  }
}

.animate-slideIn {
  animation: slideIn 0.25s ease-out forwards;
}

.animate-slideOut {
  animation: slideOut 0.25s ease-in forwards;
}

    `}</style>
    </>
  );
}
