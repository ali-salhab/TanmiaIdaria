import { Outlet, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";
import ChatSidebar from "../components/ChatSidebar";
export default function Dashboard() {
  const navigate = useNavigate();
  const [showChat, setShowChat] = useState(false);

  const { socket } = useSocket();
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");

    if (!socket) return; // wait for socket from context

    // listen for admin notifications
    const handleNotification = (data) => {
      console.log("🔔 New notification from user:", data);
      toast.success(data.message);
    };

    socket.on("adminNotification", handleNotification);

    // cleanup
    return () => {
      socket.off("adminNotification", handleNotification);
    };
  }, [navigate, socket]); // ✅ re-run effect when socket is available

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen font-custom bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 text-white relative overflow-hidden">
      {/* soft blur overlay */}
      <div className="absolute inset-0 backdrop-blur-3xl bg-white/10"></div>

      {/* Sidebar */}
      <aside className="relative z-10 w-64 backdrop-blur-xl bg-white/15 border-r border-white/20 flex flex-col shadow-2xl animate-slideInLeft">
        <div className="p-6 border-b border-white/20 text-center">
          <h1 className="text-2xl font-bold text-white drop-shadow">
            التنمية الإدارية
          </h1>
          <p className="text-sm text-teal-200 mt-1">لوحة التحكم</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/employees"
            className="block py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/25 transition transform hover:translate-x-1 hover:scale-105"
          >
            📋 الموظفين
          </Link>
          <Link
            to="/upload"
            className="block py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/25 transition transform hover:translate-x-1 hover:scale-105"
          >
            📤 ادارة قاعدة البيانات
          </Link>
          <Link
            to="/dashboard/users"
            className="block py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/25 transition transform hover:translate-x-1 hover:scale-105"
          >
            ⚙️ ادارة المستخدمين
          </Link>
          <Link
            to="notifications"
            className="block py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/25 transition transform hover:translate-x-1 hover:scale-105"
          >
            🔔 الإشعارات والأرشيف
          </Link>
          <button
            onClick={() => setShowChat(!showChat)}
            className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-xl z-50"
          >
            💬
          </button>

          {showChat && <ChatSidebar />}
          <div className="p-4 border-t border-white/20">
            <button
              onClick={handleLogout}
              className="w-full bg-rose-500/80 hover:bg-rose-600 text-white py-2 rounded-lg transition transform hover:scale-105"
            >
              Logout
            </button>
          </div>
          <div className="p-4 border-t border-white/20">
            <button
              onClick={handleLogout}
              className="w-full bg-grey-500/80 hover:bg-black text-white py-2 rounded-lg transition transform hover:scale-75"
            >
              Settings
            </button>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col animate-fadeSlide">
        {/* Navbar */}

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Glass wrapper */}
          <div className="backdrop-blur-xl bg-white/15 border border-white/20 rounded-2xl shadow-lg p-6 animate-scaleUp">
            {/* White background for tables or data views */}
            <div className="bg-white rounded-xl shadow-md p-4 text-gray-800">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Animations */}
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
