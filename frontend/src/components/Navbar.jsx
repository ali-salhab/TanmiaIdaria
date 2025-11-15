import { useState, useEffect } from "react";
import { Bell, User, Search, Menu } from "lucide-react";
import { useSocket } from "../context/SocketContext";

export default function Navbar({ userInfo }) {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on("notification", (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 10));
    });

    return () => {
      socket.off("notification");
    };
  }, [socket]);

  return (
    <nav className="fixed top-0 right-0 left-64 h-16 bg-gradient-to-r from-white/80 via-white/70 to-white/80 backdrop-blur-md border-b border-teal-200/50 flex items-center justify-between px-6 z-30 shadow-md">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="ابحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            dir="rtl"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse font-bold">
                {notifications.length > 9 ? "9+" : notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-2xl p-3 space-y-2 max-h-80 overflow-y-auto z-50">
              {notifications.length > 0 ? (
                notifications.map((notif, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 border border-gray-200 rounded p-2 text-sm text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                  >
                    <p className="font-medium text-teal-600">{notif.message || notif}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {new Date(notif.time || Date.now()).toLocaleTimeString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center italic p-2">لا توجد إشعارات</p>
              )}
            </div>
          )}
        </div>

        {userInfo && (
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">{userInfo.username}</p>
              <p className="text-xs text-gray-500">{userInfo.role}</p>
            </div>
            <img
              src={userInfo.image || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
              alt={userInfo.username}
              className="w-10 h-10 rounded-full border-2 border-teal-500 object-cover"
            />
          </div>
        )}
      </div>
    </nav>
  );
}
