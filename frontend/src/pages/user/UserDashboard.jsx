import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../api/api";
import toast from "react-hot-toast";
import logo from "../../assets/logo.png";
import syriaLogo from "../../assets/syria_logo.svg";
import { useSocket } from "../../context/SocketContext";
import {
  FiUsers,
  FiCalendar,
  FiAlertCircle,
  FiFileText,
  FiMail,
  FiFolder,
  FiSettings,
  FiBell,
  FiBarChart2,
  FiLogOut,
  FiMenu,
  FiX,
  FiAward,
  FiMessageSquare,
  FiClock,
  FiChevronLeft,
  FiUser,
} from "react-icons/fi";

const VITE_API_URL = import.meta.env.VITE_API_URL;

/**
 * Modern User Dashboard
 * Permission-based UI with clean design (Gray Scale Theme)
 */
export default function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [permissionDetails, setPermissionDetails] = useState({
    groups: [],
    permissions: [],
  });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [recentCirculars, setRecentCirculars] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { socket } = useSocket();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await API.get("/auth/me");
      const userData = response.data.user;
      setUser(userData);

      // Build permissions object
      const perms = {};
      if (userData.role === "admin") {
        // Admin has all permissions
        perms["*"] = true;
      } else {
        // Build from direct permissions
        userData.directPermissions?.forEach((perm) => {
          if (perm && perm.key) perms[perm.key] = true;
        });

        // Build from group permissions
        userData.permissionGroups?.forEach((group) => {
          group.permissions?.forEach((perm) => {
            if (perm && perm.key) perms[perm.key] = true;
          });
        });
      }

      setPermissions(perms);
      await fetchDashboardData(perms);
      await fetchUserPermissionDetails(userData._id);
    } catch (error) {
      console.error("Error fetching user:", error);
      toast.error("فشل تحميل بيانات المستخدم");
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async (perms) => {
    try {
      const statsData = {};

      // Fetch different stats based on permissions
      if (hasPermission("employees.view", perms)) {
        const empRes = await API.get("/employees");
        statsData.employees = empRes.data.length || 0;
      }

      if (hasPermission("vacations.view", perms)) {
        // You can add vacation stats endpoint
        statsData.vacations = 0;
      }

      if (hasPermission("incidents.view", perms)) {
        // You can add incidents stats endpoint
        statsData.incidents = 0;
      }

      if (hasPermission("circulars.view", perms)) {
        const circRes = await API.get("/circulars");
        statsData.circulars = circRes.data.length || 0;
        setRecentCirculars(circRes.data.slice(0, 5));
      }

      // Fetch Notifications
      try {
        const notifRes = await API.get("/notifications");
        setRecentNotifications(notifRes.data.slice(0, 5));
      } catch (err) {
        console.error("Error fetching notifications", err);
      }

      // Fetch Unread Messages
      try {
        const msgRes = await API.get("/messages/unread");
        setUnreadMessages(msgRes.data.count || 0);
      } catch (err) {
        console.error("Error fetching messages", err);
      }

      setStats(statsData);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const hasPermission = (permKey, perms = permissions) => {
    if (!perms) return false;
    if (perms["*"]) return true; // Admin wildcard
    return !!perms[permKey];
  };

  const fetchUserPermissionDetails = async (userId) => {
    if (!userId) return;
    try {
      const res = await API.get(`/permissions/user/${userId}/permissions`);
      const userData = res.data.user || {};

      const groupNames = (userData.permissionGroups || []).map(
        (g) => g.name || g._id
      );

      const permLabels = new Set();
      (userData.permissionGroups || []).forEach((group) => {
        (group.permissions || []).forEach((perm) => {
          if (perm?.label) permLabels.add(perm.label);
        });
      });
      (userData.directPermissions || []).forEach((perm) => {
        if (perm?.label) permLabels.add(perm.label);
      });

      setPermissionDetails({
        groups: groupNames,
        permissions: Array.from(permLabels),
      });
    } catch (error) {
      console.error("Error fetching permission details:", error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
    toast.success("تم تسجيل الخروج بنجاح");
  };

  useEffect(() => {
    if (!socket || !user) return;

    const handlePermissionUpdate = (payload) => {
      if (payload?.userId && payload.userId.toString() === user._id) {
        toast.success("تم تحديث صلاحياتك");
        fetchUserData();
      }
    };

    const handlePersonalNotification = (notif) => {
      if (
        notif?.type === "permission_change" &&
        notif.userId &&
        user &&
        notif.userId.toString() === user._id
      ) {
        toast.success("تم تعديل مجموعاتك أو صلاحياتك");
        fetchUserPermissionDetails(user._id);
      }
    };

    socket.on("permission_update", handlePermissionUpdate);
    socket.on("personal_notification", handlePersonalNotification);

    return () => {
      socket.off("permission_update", handlePermissionUpdate);
      socket.off("personal_notification", handlePersonalNotification);
    };
  }, [socket, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-800 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      title: "الملف الشخصي",
      icon: FiUser,
      permission: null,
      link: "/dashboard/profile",
      color: "gray",
    },
    {
      title: "الموظفين",
      icon: FiUsers,
      permission: "employees.view",
      link: "/dashboard/employees",
      color: "gray",
    },
    {
      title: "الإجازات",
      icon: FiCalendar,
      permission: "vacations.view",
      link: "/vacations",
      color: "gray",
    },
    {
      title: "الحوادث والمخالفات",
      icon: FiAlertCircle,
      permission: "incidents.view",
      link: "/incidents",
      color: "gray",
    },
    {
      title: "المنشورات",
      icon: FiFileText,
      permission: "circulars.view",
      link: "/circulars",
      color: "gray",
    },
    {
      title: "الشؤون القانونية",
      icon: FiFileText,
      permission: "legal.view_cases",
      link: "/legal",
      color: "gray",
    },
    {
      title: "مشاركة الملفات",
      icon: FiFolder,
      permission: "file_sharing.view_received",
      link: "/file-sharing",
      color: "gray",
    },
    {
      title: "التقارير",
      icon: FiBarChart2,
      permission: "reports.view",
      link: "/reports",
      color: "gray",
    },
    {
      title: "الإعدادات",
      icon: FiSettings,
      permission: null,
      link: "/dashboard/settings",
      color: "gray",
    },
  ];

  const visibleMenuItems = menuItems.filter((item) =>
    item.permission ? hasPermission(item.permission) : true
  );
  const statCards = [
    {
      title: "الموظفين",
      value: stats?.employees || 0,
      icon: FiUsers,
      color: "blue",
      permission: "employees.view",
    },
    {
      title: "المنشورات",
      value: stats?.circulars || 0,
      link: "/dashboard/settings",
      color: "purple",
      permission: "circulars.view",
    },
    {
      title: "الإجازات",
      value: stats?.vacations || 0,
      icon: FiCalendar,
      color: "green",
      permission: "vacations.view",
    },
    {
      title: "الحوادث",
      value: stats?.incidents || 0,
      icon: FiAlertCircle,
      color: "red",
      permission: "incidents.view",
    },
  ];

  const visibleStats = statCards.filter((stat) =>
    hasPermission(stat.permission)
  );

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <img
                  src={syriaLogo}
                  alt="Government emblem"
                  className="w-12 h-12 object-contain bg-white p-1 rounded-md shadow-sm"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = logo;
                  }}
                />
                <img
                  src={logo}
                  alt="Logo"
                  className="w-10 h-10 object-contain opacity-90 transition-all duration-500"
                />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gov-700 gov-brand-title">
                  نظام إدارة الموارد البشرية
                </h1>
                <p className="text-xs text-gray-500">
                  الأمانة العامة لمحافظة طرطوس — مرحباً، {user?.username}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/messages"
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
              title="الرسائل"
            >
              <FiMessageSquare size={22} />
              {unreadMessages > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                  {unreadMessages}
                </span>
              )}
            </Link>

            <Link
              to="/notifications"
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
              title="الإشعارات"
            >
              <FiBell size={22} />
              {recentNotifications.filter((n) => !n.read).length > 0 && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
              )}
            </Link>

            <Link
              to="/dashboard/profile"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm"
            >
              <FiUser size={16} />
              <span>الملف الشخصي</span>
            </Link>

            {user && (
              <Link
                to="/dashboard/settings"
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm"
              >
                <FiSettings size={16} />
                <span>الإعدادات</span>
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors shadow-sm text-sm"
            >
              <FiLogOut size={16} />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {visibleStats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {visibleStats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full bg-gray-100 text-gray-600`}>
                    <stat.icon size={24} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area (Quick Actions & Circulars) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gov-700 mb-4 flex items-center gap-2">
                <FiSettings className="text-gov-600" />
                الوصول السريع
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {visibleMenuItems.map((item, index) => (
                  <Link
                    key={index}
                    to={item.link}
                    className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all group bg-white"
                  >
                    <div className="p-3 rounded-full bg-gray-100 text-gray-600 group-hover:bg-gray-200 group-hover:text-gray-800 transition-colors mb-2">
                      <item.icon size={24} />
                    </div>
                    <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 text-center">
                      {item.title}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Circulars */}
            {hasPermission("circulars.view") && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <FiFileText className="text-gray-500" />
                    أحدث التعاميم والمنشورات
                  </h2>
                  <Link
                    to="/circulars"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    عرض الكل <FiChevronLeft />
                  </Link>
                </div>

                {recentCirculars.length > 0 ? (
                  <div className="space-y-3">
                    {recentCirculars.map((circ) => (
                      <div
                        key={circ._id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all"
                      >
                        <div className="mt-1 min-w-[40px] h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                          <FiFileText size={18} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">
                            {circ.title}
                          </h3>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {circ.content}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                            <FiClock size={12} />
                            <span>
                              {new Date(circ.createdAt).toLocaleDateString(
                                "ar-EG"
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    لا توجد تعاميم حديثة
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar Area (Notifications & Chat) */}
          <div className="space-y-8">
            {/* Notifications Widget */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FiBell className="text-gray-500" />
                  الإشعارات
                </h2>
                <Link
                  to="/notifications"
                  className="text-sm text-blue-600 hover:underline"
                >
                  عرض الكل
                </Link>
              </div>

              {recentNotifications.length > 0 ? (
                <div className="space-y-4">
                  {recentNotifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`relative pl-4 border-r-2 ${
                        notif.read ? "border-gray-200" : "border-blue-500"
                      } pr-3`}
                    >
                      <p className="text-sm text-gray-800 font-medium">
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        {new Date(notif.createdAt).toLocaleTimeString("ar-EG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4 text-sm">
                  لا توجد إشعارات جديدة
                </p>
              )}
            </div>

            {/* Chat Widget */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FiMessageSquare className="text-gray-500" />
                المحادثات
              </h2>
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <FiMessageSquare
                  size={32}
                  className="mx-auto text-gray-400 mb-2"
                />
                <p className="text-gray-600 text-sm mb-3">
                  تواصل مع الإدارة أو الزملاء
                </p>
                <Link
                  to="/messages"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-900 transition-colors"
                >
                  بدء محادثة
                </Link>
              </div>
            </div>

            {/* Permissions & Groups Snapshot */}
            {user?.role !== "admin" && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FiAward className="text-gray-500" />
                  صلاحياتي ومجموعاتي
                </h2>

                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    المجموعات
                  </p>
                  {permissionDetails.groups.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {permissionDetails.groups.map((name) => (
                        <span
                          key={name}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border border-gray-200"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">
                      لا توجد مجموعات مخصصة
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    الصلاحيات
                  </p>
                  {permissionDetails.permissions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {permissionDetails.permissions
                        .slice(0, 10)
                        .map((perm) => (
                          <span
                            key={perm}
                            className="px-2 py-1 bg-gray-50 text-gray-700 rounded text-xs border border-gray-200"
                          >
                            {perm}
                          </span>
                        ))}
                      {permissionDetails.permissions.length > 10 && (
                        <span className="px-2 py-1 bg-gray-50 text-gray-500 rounded text-xs border border-gray-200">
                          +{permissionDetails.permissions.length - 10}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">
                      لا توجد صلاحيات مباشرة
                    </p>
                  )}
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  سيتم تنبيهك هنا عند تعديل صلاحياتك أو مجموعاتك.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
