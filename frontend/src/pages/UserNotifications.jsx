import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useSocket } from "../context/SocketContext";
import API from "../api/api";
import { Trash2, CheckCircle2, Circle } from "lucide-react";

export default function UserNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { socket } = useSocket();

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      toast.success(`📢 ${notification.title}`);
    };

    socket.on("notification", handleNewNotification);
    return () => socket.off("notification", handleNewNotification);
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await API.get("/notifications");
      setNotifications(res.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("فشل جلب الإشعارات");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === id ? { ...notif, read: true } : notif
        )
      );
      toast.success("تم تحديث الإشعار");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("فشل تحديث الإشعار");
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((notif) => notif._id !== id));
      toast.success("تم حذف الإشعار");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("فشل حذف الإشعار");
    }
  };

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.read)
      : filter === "read"
      ? notifications.filter((n) => n.read)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🔔 الإشعارات</h2>
        <span className="text-sm text-gray-600">
          {unreadCount > 0 && (
            <span className="ml-2 px-3 py-1 bg-red-100 text-red-700 rounded-full font-semibold">
              {unreadCount} جديدة
            </span>
          )}
        </span>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg transition ${
            filter === "all"
              ? "bg-teal-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          الكل ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-4 py-2 rounded-lg transition ${
            filter === "unread"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          الجديدة ({unreadCount})
        </button>
        <button
          onClick={() => setFilter("read")}
          className={`px-4 py-2 rounded-lg transition ${
            filter === "read"
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          المقروءة ({notifications.filter((n) => n.read).length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin">
            <div className="w-8 h-8 border-4 border-teal-300 border-t-teal-600 rounded-full"></div>
          </div>
          <p className="mt-2 text-gray-600">جاري تحميل الإشعارات...</p>
        </div>
      ) : filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <div
              key={notif._id}
              className={`p-4 rounded-lg border-2 transition hover:shadow-md ${
                notif.read
                  ? "bg-white border-gray-200"
                  : "bg-blue-50 border-blue-300 shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {notif.read ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-blue-600" />
                    )}
                    <h3 className="font-semibold text-gray-800 text-lg">
                      {notif.title}
                    </h3>
                  </div>
                  <p className="text-gray-700 text-sm mb-2">{notif.message}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>
                      {new Date(notif.createdAt).toLocaleDateString("ar-SA")}
                    </span>
                    <span>
                      {new Date(notif.createdAt).toLocaleTimeString("ar-SA")}
                    </span>
                    {notif.type && (
                      <span className="px-2 py-1 bg-gray-200 rounded text-gray-700">
                        {notif.type === "permission_granted" && "🔐 صلاحية"}
                        {notif.type === "permission_denied" && "⛔ سحب صلاحية"}
                        {notif.type === "system" && "⚙️ نظام"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {!notif.read && (
                    <button
                      onClick={() => handleMarkAsRead(notif._id)}
                      className="p-2 text-green-600 hover:bg-green-100 rounded transition"
                      title="تحديث كمقروء"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteNotification(notif._id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded transition"
                    title="حذف"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">
            {filter === "unread"
              ? "لا توجد إشعارات جديدة 🎉"
              : filter === "read"
              ? "لم تقرأ أي إشعارات بعد"
              : "لا توجد إشعارات"}
          </p>
        </div>
      )}
    </div>
  );
}
