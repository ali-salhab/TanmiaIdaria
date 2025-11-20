import { Outlet, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";
import AdminChat from "../components/AdminChat";
import { Menu, X } from "lucide-react";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const navigate = useNavigate();
  const [showChat, setShowChat] = useState(false);
  const isMobileInit = window.innerWidth < 1024;
  const [sidebarOpen, setSidebarOpen] = useState(!isMobileInit);
  const [isMobile, setIsMobile] = useState(isMobileInit);
  const [userInfo, setUserInfo] = useState(null);

  const { socket } = useSocket();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");

    const fetchUserInfo = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserInfo(data.user);
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    };

    fetchUserInfo();

    if (!socket) return;

    const handleNotification = (data) => {
      console.log("🔔 New notification from user:", data);
      toast.success(data.message);
    };

    socket.on("adminNotification", handleNotification);

    return () => {
      socket.off("adminNotification", handleNotification);
    };
  }, [navigate, socket]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebarOnMobile = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-gray-900 font-custom text-white relative overflow-hidden">
      <div className="absolute inset-0 backdrop-blur-3xl bg-white/10"></div>

      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-100"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <aside
        className={`fixed  lg:relative left-0 top-0 h-screen w-56 sm:w-64 lg:bg-gray-800 bg-white/15 border-r lg:border-gray-700 border-white/20 flex flex-col shadow-2xl z-40 transition-transform duration-300 ${
          sidebarOpen ? " sm:mt-12 lg:mt-0" : " hidden"
        } z-100`}
      >
        <div className="p-4 sm:p-6 lg:border-gray-700 border-b border-white/20 bg-gradient-to-r lg:from-gray-700 lg:to-gray-800 text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow">
            التنمية الإدارية
          </h1>
          <p className="text-xs sm:text-sm lg:text-gray-300 text-gray-200 mt-1">
            لوحة التحكم
          </p>
        </div>

        <nav
          className="flex-1 bg-black z-111 p-3 sm:p-4 space-y-2 overflow-y-auto"
          dir="rtl"
        >
          <Link
            to="/dashboard/employees"
            onClick={closeSidebarOnMobile}
            className="block py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg  lg:bg-gray-700 lg:hover:bg-gray-600 bg-white hover:bg-white/25 transition transform hover:translate-x-1 hover:scale-105 text-sm sm:text-base"
          >
            📋 الموظفين
          </Link>
          <Link
            to="/dashboard/upload"
            onClick={closeSidebarOnMobile}
            className="block py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg lg:bg-gray-700 lg:hover:bg-gray-600 bg-white hover:bg-white/25 transition transform hover:translate-x-1 hover:scale-105 text-sm sm:text-base"
          >
            📤 ادارة قاعدة البيانات
          </Link>

          <Link
            to="/dashboard/dywan"
            onClick={closeSidebarOnMobile}
            className="block py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg lg:bg-gray-700 lg:hover:bg-gray-600 bg-white hover:bg-white transition transform hover:translate-x-1 hover:scale-105 text-sm sm:text-base"
          >
            الديوان 📃
          </Link>
          <Link
            to="/dashboard/permissions"
            onClick={closeSidebarOnMobile}
            className="block py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg lg:bg-gray-700 lg:hover:bg-gray-600 bg-white hover:bg-white transition transform hover:translate-x-1 hover:scale-105 text-sm sm:text-base"
          >
            الديوان 📃
          </Link>
          <Link
            to="/dashboard/dywan"
            onClick={closeSidebarOnMobile}
            className="block py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg lg:bg-gray-700 lg:hover:bg-gray-600 bg-white hover:bg-white transition transform hover:translate-x-1 hover:scale-105 text-sm sm:text-base"
          >
            القانونية 📃
          </Link>
          <Link
            to="/dashboard/dywan"
            onClick={closeSidebarOnMobile}
            className="block py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg lg:bg-gray-700 lg:hover:bg-gray-600 bg-white hover:bg-white/25 transition transform hover:translate-x-1 hover:scale-105 text-sm sm:text-base"
          >
            📃 الشكاوى
          </Link>
          <Link
            to="/dashboard"
            onClick={closeSidebarOnMobile}
            className="block py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg lg:bg-gray-700 lg:hover:bg-gray-600 bg-white/10 hover:bg-white/25 transition transform hover:translate-x-1 hover:scale-105 text-sm "
          >
            الأرشيف 🖨️
          </Link>
          <Link
            to="/dashboard/notifications"
            onClick={closeSidebarOnMobile}
            className="block py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg lg:bg-gray-700 lg:hover:bg-gray-600 bg-white/10 hover:bg-white/25 transition transform hover:translate-x-1 hover:scale-105 text-sm sm:text-base"
          >
            🔔الاشعارات
          </Link>
          <Link
            to="/dashboard/homepage-builder"
            onClick={closeSidebarOnMobile}
            className="block py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg lg:bg-gray-700 lg:hover:bg-gray-600 bg-white/10 hover:bg-white/25 transition transform hover:translate-x-1 hover:scale-105 text-sm sm:text-base"
          >
            🎨 تخصيص الصفحة الرئيسية
          </Link>
        </nav>

        <div className="lg:border-gray-700 border-t border-white/20 p-3 sm:p-4 space-y-2 sm:space-y-3">
          <button
            onClick={handleLogout}
            className="w-full lg:bg-red-700 lg:hover:bg-red-600 bg-rose-500/80 hover:bg-rose-600 text-red-500 py-2 rounded-lg transition transform hover:scale-105 font-medium text-sm sm:text-base"
          >
            تسجيل الخروج 📤
          </button>
        </div>
      </aside>

      <div className="relative z-10 flex-1 flex flex-col animate-fadeSlide min-w-0">
        <Navbar
          userInfo={userInfo}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
          onOpenChat={() => setShowChat(true)}
        />

        <main className="flex-1 p-2 sm:p-4 md:p-6 overflow-y-auto mt-16">
          <div className="backdrop-blur-xl bg-white/15 border border-white/20 rounded-lg md:rounded-2xl shadow-lg p-3 md:p-6 animate-scaleUp">
            <div className="bg-white rounded-lg md:rounded-xl shadow-md p-3 md:p-4 text-gray-800 overflow-x-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {showChat && (
        <AdminChat
          isAdmin={userInfo?.role === "admin"}
          onClose={() => setShowChat(false)}
        />
      )}

      <style>
        {`
          @keyframes slideInLeft {
            from { transform: translateX(-80px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes fadeSlide {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes scaleUp {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }

          .animate-slideInLeft {
            animation: slideInLeft 0.6s ease-out forwards;
          }
          .animate-fadeSlide {
            animation: fadeSlide 0.6s ease-out forwards;
          }
          .animate-scaleUp {
            animation: scaleUp 0.4s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
}
