import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useSocket } from "../context/SocketContext";
import { useSettings } from "../context/SettingsContext";
import API from "../api/api";
import {
  Search,
  Filter,
  Calendar,
  User,
  Building2,
  CheckCircle2,
  Circle,
  X,
  Bell,
  RefreshCw,
} from "lucide-react";
import UserAvatar from "../components/common/UserAvatar";

export default function AdminNotifications() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { playNotification } = useSettings();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    employeeName: "",
    department: "",
    section: "",
    action: "",
    startDate: "",
    endDate: "",
    search: "",
    read: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchNotifications();
  }, [filters, pagination.page]);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
      playNotification();
      toast.success(`🔔 ${notification.title || "إشعار جديد"}`);
    };

    const handleNotificationRead = ({ _id }) => {
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === _id ? { ...notif, read: true } : notif
        )
      );
    };

    socket.on("admin_notification", handleNewNotification);
    socket.on("notification_read", handleNotificationRead);

    return () => {
      socket.off("admin_notification", handleNewNotification);
      socket.off("notification_read", handleNotificationRead);
    };
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== "")
        ),
      });

      const res = await API.get(`/notifications/admin?${params}`);
      setNotifications(res.data.notifications || []);
      setPagination({
        page: res.data.page || 1,
        limit: res.data.limit || 50,
        total: res.data.total || 0,
        totalPages: res.data.totalPages || 0,
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("❌ فشل في جلب الإشعارات");
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
      toast.success("✅ تم تحديد الإشعار كمقروء");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("❌ فشل في تحديث الإشعار");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await API.put("/notifications/admin/read-all");
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
      toast.success("✅ تم تحديد جميع الإشعارات كمقروءة");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("❌ فشل في تحديث الإشعارات");
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({
      employeeName: "",
      department: "",
      section: "",
      action: "",
      startDate: "",
      endDate: "",
      search: "",
      read: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const getSectionIcon = (section) => {
    const icons = {
      employees: "👥",
      incidents: "⚠️",
      vacations: "🏖️",
      documents: "📄",
      circulars: "📢",
      users: "👤",
      default: "📋",
    };
    return icons[section] || icons.default;
  };

  const getActionColor = (action) => {
    const colors = {
      create: "bg-green-100 text-green-700",
      update: "bg-blue-100 text-blue-700",
      delete: "bg-red-100 text-red-700",
      edit: "bg-yellow-100 text-yellow-700",
      default: "bg-gray-100 text-gray-700",
    };
    return colors[action] || colors.default;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div dir="rtl" className="min-h-screen 50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-slate-700 rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Bell className="w-8 h-8 text-blue-600" />
                إشعارات الإدارة
              </h1>
              <p className="text-gray-600 mt-2">
                {unreadCount > 0 ? (
                  <span className="text-red-600 font-semibold">
                    {unreadCount} إشعار غير مقروء
                  </span>
                ) : (
                  "جميع الإشعارات مقروءة"
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                تحديد الكل كمقروء
              </button>
              <button
                onClick={fetchNotifications}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                تحديث
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-slate-700 rounded-2xl shadow-lg p-6 mb-6">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث في الإشعارات..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full pr-10 pl-4 py-3 border bg-slate-600 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? "إخفاء الفلاتر" : "عرض الفلاتر"}
          </button>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              {/* Employee Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  اسم الموظف
                </label>
                <input
                  type="text"
                  value={filters.employeeName}
                  onChange={(e) =>
                    handleFilterChange("employeeName", e.target.value)
                  }
                  placeholder="ابحث بالاسم..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  القسم
                </label>
                <input
                  type="text"
                  value={filters.department}
                  onChange={(e) =>
                    handleFilterChange("department", e.target.value)
                  }
                  placeholder="ابحث بالقسم..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  القسم
                </label>
                <select
                  value={filters.section}
                  onChange={(e) =>
                    handleFilterChange("section", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">الكل</option>
                  <option value="employees">الموظفين</option>
                  <option value="incidents">الحوادث</option>
                  <option value="vacations">الإجازات</option>
                  <option value="documents">الوثائق</option>
                  <option value="circulars">التعاميم</option>
                  <option value="users">المستخدمين</option>
                </select>
              </div>

              {/* Action */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الإجراء
                </label>
                <select
                  value={filters.action}
                  onChange={(e) => handleFilterChange("action", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">الكل</option>
                  <option value="create">إنشاء</option>
                  <option value="update">تحديث</option>
                  <option value="edit">تعديل</option>
                  <option value="delete">حذف</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  من تاريخ
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  إلى تاريخ
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Read Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الحالة
                </label>
                <select
                  value={filters.read}
                  onChange={(e) => handleFilterChange("read", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">الكل</option>
                  <option value="false">غير مقروء</option>
                  <option value="true">مقروء</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  مسح الفلاتر
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">لا توجد إشعارات</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 m-2 hover:bg-slate-900 transition ${
                      !notification.read
                        ? "bg-slate-700 border-r-4 border-slate-500"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {notification.actionBy ? (
                          <UserAvatar
                            image={notification.actionBy?.profile?.avatar}
                            username={notification.actionByUsername || "مستخدم"}
                            isOnline={false}
                            size="md"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-white">
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                              )}
                            </div>
                            <p className="text-white-600 text-sm mb-2">
                              {notification.message}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              {notification.section && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full flex items-center gap-1">
                                  {getSectionIcon(notification.section)}{" "}
                                  {notification.section}
                                </span>
                              )}
                              {notification.action && (
                                <span
                                  className={`px-2 py-1 rounded-full ${getActionColor(
                                    notification.action
                                  )}`}
                                >
                                  {notification.action}
                                </span>
                              )}
                              {notification.employeeName && (
                                <span className="px-2 py-1 bg-purple-200 text-purple-700 rounded-full">
                                  👤 {notification.employeeName}
                                </span>
                              )}
                              {notification.department && (
                                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                                  🏢 {notification.department}
                                </span>
                              )}
                              {notification.actionByUsername && (
                                <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded-full">
                                  من: {notification.actionByUsername}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(notification.createdAt).toLocaleString(
                                "ar-EG",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <button
                                onClick={() =>
                                  handleMarkAsRead(notification._id)
                                }
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="تحديد كمقروء"
                              >
                                <Circle className="w-5 h-5" />
                              </button>
                            )}
                            {notification.read && (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    عرض {notifications.length} من {pagination.total} إشعار
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.max(1, prev.page - 1),
                        }))
                      }
                      disabled={pagination.page === 1}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      السابق
                    </button>
                    <span className="px-4 py-2 text-gray-700">
                      صفحة {pagination.page} من {pagination.totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.min(prev.totalPages, prev.page + 1),
                        }))
                      }
                      disabled={pagination.page === pagination.totalPages}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      التالي
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
