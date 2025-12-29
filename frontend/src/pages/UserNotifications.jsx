import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useSocket } from "../context/SocketContext";
import API from "../api/api";
import { Trash2, CheckCircle2, Circle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function UserNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { socket } = useSocket();
  const { user } = useAuth();
  const userId = user?._id;

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      if (userId && notification?.userId && notification.userId !== userId) {
        return;
      }
      setNotifications((prev) => [notification, ...prev]);
      toast.success(`📢 ${notification.title}`);
    };

    socket.on("notification", handleNewNotification);
    return () => socket.off("notification", handleNewNotification);
  }, [socket, userId]);

  useEffect(() => {
    if (!userId) return;
    setNotifications((prev) =>
      prev.filter((notification) => {
        if (!notification?.userId) return true;
        return notification.userId === userId;
      })
    );
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await API.get("/notifications");
      const items = Array.isArray(res.data) ? res.data : [];
      setNotifications(items);

      const hasUnread = items.some((notif) => !notif.read);
      if (hasUnread) {
        try {
          await API.put("/notifications/mark-read");
          setNotifications((prev) =>
            prev.map((notif) => (notif.read ? notif : { ...notif, read: true }))
          );
        } catch (error) {
          console.error("Error marking notifications as read:", error);
        }
      }
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
        <h2 className="text-2xl font-bold text-slate-100">🔔 الإشعارات</h2>
        <span className="text-sm text-slate-400">
          {unreadCount > 0 && (
            <span className="ml-2 px-3 py-1 bg-red-500/20 text-red-400 rounded-full font-semibold border border-red-500/20">
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
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          الكل ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-4 py-2 rounded-lg transition ${
            filter === "unread"
              ? "bg-blue-600 text-white"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          الجديدة ({unreadCount})
        </button>
        <button
          onClick={() => setFilter("read")}
          className={`px-4 py-2 rounded-lg transition ${
            filter === "read"
              ? "bg-green-600 text-white"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
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
          <p className="mt-2 text-slate-400">جاري تحميل الإشعارات...</p>
        </div>
      ) : filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <div
              key={notif._id}
              className={`p-4 rounded-lg border transition hover:shadow-md ${
                notif.read
                  ? "bg-slate-800 border-slate-700"
                  : "bg-slate-700/50 border-slate-600 shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {notif.read ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-blue-500" />
                    )}
                    <h3 className="font-semibold text-slate-100 text-lg">
                      {notif.title}
                    </h3>
                  </div>
                  <p className="text-slate-300 text-sm mb-2">{notif.message}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>
                      {new Date(notif.createdAt).toLocaleDateString("ar-SA")}
                    </span>
                    <span>
                      {new Date(notif.createdAt).toLocaleTimeString("ar-SA")}
                    </span>
                    {notif.type && (
                      <span className="px-2 py-1 bg-slate-700 rounded text-slate-300 border border-slate-600">
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
                      className="p-2 text-green-500 hover:bg-green-500/20 rounded transition"
                      title="تحديث كمقروء"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteNotification(notif._id)}
                    className="p-2 text-red-500 hover:bg-red-500/20 rounded transition"
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
        <div className="text-center py-12 bg-slate-800 rounded-lg border border-slate-700">
          <p className="text-slate-500 text-lg">
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
