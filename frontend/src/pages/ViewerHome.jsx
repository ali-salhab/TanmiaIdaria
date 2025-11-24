import React, { useEffect, useState, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { Bell, MessageCircle, User, Shield, Award, FileText, Users, DollarSign } from "lucide-react";
import EmployeesSVG from "../assets/employees.svg";
import VacationsSVG from "../assets/vacation.svg";
import ReportsSVG from "../assets/report.svg";
import Logo from "../assets/logo.png";
import API from "../api/api";
import AdminChat from "../components/chat/AdminChat";
import { checkPermission } from "../utils/permissionHelper";
// Import decorative circle images
import purplePattern from "../assets/circles/patterns/circle-pattern-purple.svg";
import userIcon1 from "../assets/circles/icons/user-circle-1.svg";
import badgeIcon1 from "../assets/circles/icons/badge-circle-1.svg";
import floatingOrb1 from "../assets/circles/decorative/floating-orb-1.svg";
import floatingOrb2 from "../assets/circles/decorative/floating-orb-2.svg";

const VITE_API_URL = import.meta.env.VITE_API_URL;

export default function ViewerHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [permissionsUpdated, setPermissionsUpdated] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    employees: 0,
    documents: 0,
    salaryRecords: 0
  });

  // ✅ Track scroll direction to hide header
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

  // Fetch user data
  const fetchUserData = useCallback(async (token) => {
    try {
      const me = await API.get(`/auth/me`);
      setUser(me.data.user);
      localStorage.setItem("userId", me.data.user._id);
      localStorage.setItem("username", me.data.user.username);
      
      // Fetch stats for dashboard cards
      fetchDashboardStats(me.data.user);
    } catch (err) {
      console.error("❌ Error loading user:", err);
      navigate("/login");
    }
  }, [navigate, fetchDashboardStats]);

  // Fetch dashboard statistics
  const fetchDashboardStats = useCallback(async (userData) => {
    try {
      // Simulate fetching stats - in a real app, you would call actual endpoints
      const canViewEmployees = checkPermission("employees.view", userData);
      const canViewDocuments = checkPermission("documents.view", userData);
      const canViewSalary = checkPermission("salary.view", userData);
      
      setStats({
        employees: canViewEmployees ? Math.floor(Math.random() * 100) + 50 : 0,
        documents: canViewDocuments ? Math.floor(Math.random() * 200) + 100 : 0,
        salaryRecords: canViewSalary ? Math.floor(Math.random() * 50) + 20 : 0
      });
    } catch (err) {
      console.log("Error loading stats:", err);
    }
  }, []);

  // Get notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data || []);
    } catch (err) {
      console.log("Error loading notifications:", err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      try {
        setIsLoading(true);
        const decoded = jwtDecode(token);
        await fetchUserData(token);
        await fetchNotifications();

        const newSocket = io(VITE_API_URL);
        setSocket(newSocket);
        newSocket.emit("user_connected", decoded.id);

        newSocket.on("permission_update", async (data) => {
          const isForThisUser =
            data.userId === decoded.id ||
            data.userId === localStorage.getItem("userId");

          if (isForThisUser) {
            try {
              await fetchUserData(token);
            } catch (err) {
              console.error("❌ Failed to fetch fresh data:", err);
            }

            setPermissionsUpdated((prev) => prev + 1);
          }
        });

        newSocket.on("personal_notification", (data) => {
          setNotifications((prev) => [data, ...prev].slice(0, 15));
        });

        newSocket.on("notification", (data) => {
          setNotifications((prev) => [data, ...prev].slice(0, 15));
        });

        return () => {
          newSocket.off("permission_update");
          newSocket.off("notification");
          newSocket.disconnect();
        };
      } catch (err) {
        console.log("Error loading user:", err);
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [navigate, fetchUserData, fetchNotifications]);

  // ✅ Notify admin through socket
  const notifyAdmin = (message) => {
    if (socket && user) {
      socket.emit("notifyAdmin", {
        from: user.username,
        message,
        time: new Date(),
      });
    }
  };

  // ✅ Handle section clicks
  const handleCardClick = (section) => {
    notifyAdmin(`قام المستخدم ${user?.username} بفتح قسم ${section}`);
    navigate(`/${section}`);
  };

  if (isLoading) {
    return (
      <div
        dir="rtl"
        className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100"
      >
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        dir="rtl"
        className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100"
      >
        <div className="text-center animate-pulse">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-gray-600">حدث خطأ في تحميل البيانات</p>
        </div>
      </div>
    );
  }

  const { permissions } = user;
  const canViewEmployees = checkPermission("employees.view", user);
  const canViewDocuments = checkPermission("documents.view", user);
  const canViewSalary = checkPermission("salary.view", user);

  const hasNoPermissions =
    !canViewEmployees && !canViewDocuments && !canViewSalary;

  // Dashboard cards data
  const dashboardCards = [
    {
      id: "employees",
      title: "الموظفين",
      subtitle: "عرض وتحديث بيانات الموظفين",
      icon: <Users size={32} />,
      svg: EmployeesSVG,
      color: "from-green-400 to-emerald-500",
      stat: stats.employees,
      enabled: canViewEmployees
    },
    {
      id: "documents",
      title: "الوثائق",
      subtitle: "استعراض وأرشفة المستندات",
      icon: <FileText size={32} />,
      svg: ReportsSVG,
      color: "from-blue-400 to-sky-500",
      stat: stats.documents,
      enabled: canViewDocuments
    },
    {
      id: "salary",
      title: "الرواتب والمكافآت",
      subtitle: "تتبع الأداء والمكافآت الشهرية",
      icon: <DollarSign size={32} />,
      svg: VacationsSVG,
      color: "from-orange-400 to-amber-500",
      stat: stats.salaryRecords,
      enabled: canViewSalary
    }
  ].filter(card => card.enabled);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col relative overflow-hidden"
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-64 h-64 opacity-20">
        <img src={floatingOrb1} alt="" className="w-full h-full object-contain animate-float" />
      </div>
      <div className="absolute bottom-0 right-0 w-64 h-64 opacity-20">
        <img src={floatingOrb2} alt="" className="w-full h-full object-contain animate-floatRandom" />
      </div>
      
      {/* === App Bar === */}
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out ${
          showHeader ? "translate-y-0" : "-translate-y-full"
        } backdrop-blur-lg bg-white/80 shadow-lg py-3 px-4 md:px-6 flex items-center justify-between border-b border-slate-200/50`}
      >
        <div className="flex items-center gap-3 md:gap-4">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all relative group"
              title="الإشعارات"
            >
              <Bell className="w-5 h-5 text-gray-700 group-hover:text-blue-600 transition-colors" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse font-bold shadow-lg">
                  {notifications.length > 9 ? "9+" : notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 space-y-3 max-h-96 overflow-y-auto z-50 text-right animate-fadeInUp">
                <div className="font-semibold text-gray-800 pb-2 border-b border-gray-200 flex items-center justify-between">
                  <span>الإشعارات ({notifications.length})</span>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                {notifications.length > 0 ? (
                  notifications.map((notif, idx) => (
                    <div
                      key={idx}
                      className="bg-blue-50/50 border border-blue-200 rounded-xl p-3 text-sm hover:shadow-md transition-all cursor-pointer animate-fadeIn delay-100"
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bell className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-blue-800">
                            {notif.title || notif.message || notif}
                          </p>
                          <p className="text-gray-600 text-xs mt-1">
                            {notif.message}
                          </p>
                          <p className="text-gray-500 text-xs mt-2">
                            {new Date(
                              notif.createdAt || Date.now()
                            ).toLocaleTimeString("ar-EG")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                      <img src={badgeIcon1} alt="" className="w-6 h-6 opacity-70" />
                    </div>
                    <p className="text-gray-500 text-sm">لا توجد إشعارات</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {checkPermission("chat.access", user) && (
            <button
              onClick={() => setShowChat(!showChat)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all group"
              title="الدردشة مع الإدارة"
            >
              <MessageCircle className="w-5 h-5 text-gray-700 group-hover:text-green-600 transition-colors" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 md:gap-4 flex-1 justify-center">
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-all group"
            onClick={() => setShowModal(true)}
          >
            <div className="text-right hidden sm:block">
              <h1 className="text-sm md:text-base font-semibold text-emerald-700 group-hover:text-emerald-800 transition-colors">
                {user?.username}
              </h1>
              <p className="text-slate-500 text-xs">
                {user?.role || "مستخدم عادي"}
              </p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-emerald-500 bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm md:text-lg shadow-lg group-hover:shadow-xl transition-all transform group-hover:scale-105 flex-shrink-0">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <img
              src={Logo}
              alt="App Logo"
              className="w-8 h-8 md:w-10 md:h-10 object-contain"
            />
          </div>
        </div>
      </header>

      {/* === Spacer to avoid content under fixed header === */}
      <div className="h-20"></div>

      {/* === Dashboard Main === */}
      <main
        key={permissionsUpdated}
        className="flex-1 p-4 md:p-6 pb-20 relative z-10"
      >
        {/* Welcome Section */}
        <div className="mb-8 animate-fadeInDown">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              مرحباً بك، <span className="text-emerald-600">{user?.username}</span> 👋
            </h1>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
              <img src={userIcon1} alt="" className="w-6 h-6" />
            </div>
          </div>
          <p className="text-gray-600">هنا يمكنك الوصول إلى جميع الخدمات المتاحة لك</p>
        </div>

        {/* Stats Overview */}
        {dashboardCards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {dashboardCards.map((card, index) => (
              <div 
                key={card.id}
                className={`bg-gradient-to-br ${card.color} rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 animate-fadeInUp delay-${index * 100}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold mb-1">{card.title}</h3>
                    <p className="text-white/90 text-sm">{card.subtitle}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    {card.icon}
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <span className="text-2xl font-bold">{card.stat}</span>
                  <span className="text-white/80 text-sm mr-2">سجل</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dashboard Cards */}
        {dashboardCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardCards.map((card, index) => (
              <DashboardCard
                key={card.id}
                title={card.title}
                subtitle={card.subtitle}
                svg={card.svg}
                color={card.color}
                onClick={() => handleCardClick(card.id)}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 animate-fadeIn">
            <div className="text-6xl mb-6 animate-bounce">🔒</div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3 text-center">
              لا توجد صلاحيات متاحة
            </h3>
            <p className="text-slate-600 text-center max-w-md mb-6">
              يرجى التواصل مع المسؤول لتفعيل الصلاحيات الخاصة بك
            </p>
            <button
              onClick={() => notifyAdmin(`طلب صلاحيات من ${user.username}`)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <Shield className="w-5 h-5" />
              طلب الصلاحيات
            </button>
          </div>
        )}
      </main>

      {/* === Footer === */}
      <footer className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-center py-4 mt-auto shadow-xl relative z-10">
        <div className="container mx-auto px-4">
          <p className="text-sm md:text-base">
            © {new Date().getFullYear()} جميع الحقوق محفوظة | تم التطوير بواسطة
            فريق الدعم الفني
          </p>
          <button
            onClick={() => notifyAdmin(`🔔 اختبار الإشعارات من ${user.username}`)}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition text-xs md:text-sm inline-block mt-2"
          >
            🔔 اختبار الإشعار
          </button>
        </div>
      </footer>

      {/* === User Info Modal === */}
      {showModal && (
        <UserInfoModal user={user} onClose={() => setShowModal(false)} />
      )}

      {/* === Admin Chat === */}
      {showChat && (
        <AdminChat isAdmin={false} onClose={() => setShowChat(false)} />
      )}
    </div>
  );
}

/* === Enhanced Dashboard Card === */
function DashboardCard({ title, subtitle, svg, color, onClick, index }) {
  return (
    <div
      onClick={onClick}
      className={`relative group bg-white rounded-2xl p-6 cursor-pointer overflow-hidden border border-slate-200/50 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 animate-fadeInUp delay-${index * 100} perspective-1000`}
    >
      {/* Decorative background pattern */}
      <div className="absolute -top-6 -right-6 w-24 h-24 opacity-10">
        <img src={purplePattern} alt="" className="w-full h-full object-contain" />
      </div>
      
      {/* Card content */}
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md group-hover:shadow-lg transition-all`}>
            <img
              src={svg}
              alt={title}
              className="w-8 h-8 filter brightness-0 invert"
            />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 group-hover:text-slate-900 transition-colors">
              {title}
            </h3>
            <p className="text-slate-500 text-sm mt-1 group-hover:text-slate-600 transition-colors">
              {subtitle}
            </p>
          </div>
        </div>
        
        <div className="mt-auto pt-4 border-t border-slate-100/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">انقر للفتح</span>
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <svg className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hover effect overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
    </div>
  );
}

/* === User Info Modal === */
function UserInfoModal({ user, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full text-right relative animate-scaleIn border border-slate-200/50">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition text-lg"
        >
          ✕
        </button>
        
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-2xl font-bold text-emerald-700 mb-1">
            {user.username}
          </h2>
          <p className="text-gray-500">{user.role}</p>
        </div>
        
        <div className="bg-gray-50 rounded-2xl p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            معلومات الحساب
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">تاريخ الإنشاء</span>
              <span className="font-medium">
                {new Date(user.createdAt).toLocaleDateString("ar-EG")}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">آخر تحديث</span>
              <span className="font-medium">
                {new Date(user.updatedAt).toLocaleDateString("ar-EG")}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">الحالة</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                ✓ نشط
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            الصلاحيات
          </h3>
          
          {user.permissions && Object.keys(user.permissions).length > 0 ? (
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {Object.entries(user.permissions).map(([key, val]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-2 bg-white rounded-lg text-sm border border-gray-100"
                >
                  <span className="capitalize text-gray-700 truncate mr-2">{key}</span>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                      val
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {val ? "✓" : "✗"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">لا توجد صلاحيات محددة</p>
          )}
        </div>
        
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}