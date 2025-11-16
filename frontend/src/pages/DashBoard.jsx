import { Outlet, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";
import ChatSidebar from "../components/ChatSidebar";
import { Menu, X } from "lucide-react";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const navigate = useNavigate();
  const [showChat, setShowChat] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [userInfo, setUserInfo] = useState(null);

  const { socket } = useSocket();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
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
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
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
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <aside
        className={`fixed md:relative left-0 top-0 h-screen w-64 bg-white/15 border-r border-white/20 flex flex-col shadow-2xl animate-slideInLeft z-40 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${sidebarOpen ? "md:block" : "md:block"}`}
      >
        <div className="p-6 border-b border-white/20 text-center">
          <h1 className="text-2xl font-bold text-white drop-shadow">
            التنمية الإدارية
          </h1>
          <p className="text-sm text-teal-200 mt-1">لوحة التحكم</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto" dir="rtl">
          <Link
            to="/dashboard/employees"
            onClick={closeSidebarOnMobile}
            className="block py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/25 transition transform hover:translate-x-1 hover:scale-105"
          >
            📋 الموظفين
          </Link>
          <Link
            to="/dashboard/upload"
            onClick={closeSidebarOnMobile}
            className="block py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/25 transition transform hover:translate-x-1 hover:scale-105"
          >
            📤 ادارة قاعدة البيانات
          </Link>
          <Link
            to="/dashboard/users"
            onClick={closeSidebarOnMobile}
            className="block py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/25 transition transform hover:translate-x-1 hover:scale-105"
          >
            ⚙️ ادارة المستخدمين
          </Link>
          <Link
            to="/dashboard/dywan"
            onClick={closeSidebarOnMobile}
            className="block py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/25 transition transform hover:translate-x-1 hover:scale-105"
          >
            الديوان 📃
          </Link>
          <Link
            to="/dashboard"
            onClick={closeSidebarOnMobile}
            className="block py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/25 transition transform hover:translate-x-1 hover:scale-105"
          >
            الأرشيف 🖨️
          </Link>
          <Link
            to="/dashboard/notifications"
            onClick={closeSidebarOnMobile}
            className="block py-2 px-4 text-x rounded-lg bg-white/10 hover:bg-white/25 transition transform hover:translate-x-1 hover:scale-105"
          >
            🔔الاشعارات
          </Link>
          <Link
            to="/dashboard/homepage-builder"
            onClick={closeSidebarOnMobile}
            className="block py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/25 transition transform hover:translate-x-1 hover:scale-105"
          >
            🎨 تخصيص الصفحة الرئيسية
          </Link>
        </nav>

        <div className="border-t border-white/20 p-4 space-y-3">
          <button
            onClick={() => {
              setShowChat(!showChat);
              if (isMobile) setSidebarOpen(false);
            }}
            className="w-full bg-blue-600/80 hover:bg-blue-700 text-white py-2 rounded-lg transition transform hover:scale-105 font-medium"
          >
            💬 محادثة
          </button>

          <button
            onClick={handleLogout}
            className="w-full bg-rose-500/80 hover:bg-rose-600 text-white py-2 rounded-lg transition transform hover:scale-105 font-medium"
          >
            تسجيل الخروج 📤
          </button>
        </div>
      </aside>

      <div className="relative z-10 flex-1 flex flex-col animate-fadeSlide">
        <Navbar
          userInfo={userInfo}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
        />

        <main className="flex-1 p-4 md:p-6 overflow-y-auto mt-16">
          <div className="backdrop-blur-xl bg-white/15 border border-white/20 rounded-2xl shadow-lg p-6 animate-scaleUp">
            <div className="bg-white rounded-xl shadow-md p-4 text-gray-800">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {showChat && <ChatSidebar onClose={() => setShowChat(false)} />}

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
