import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";
import AdminChat from "../components/chat/AdminChat";
import Navbar from "../components/Navbar";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";

export default function Dashboard() {
  const navigate = useNavigate();
  const [showChat, setShowChat] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const { socket } = useSocket();

  // Handle sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      const isLargeScreen = window.innerWidth >= 1024;
      setSidebarOpen(isLargeScreen);
    };

    // Set initial state
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handlePrivateMessage = (data) => {
      // If chat is closed, increment unread count
      // Also check if the message is NOT from me
      if (!showChat && data.from !== userInfo?._id) {
        setUnreadChatCount((prev) => prev + 1);
        toast.success(`رسالة جديدة من ${data.fromUsername}`);
      }
    };

    socket.on("private_message", handlePrivateMessage);

    return () => {
      socket.off("private_message", handlePrivateMessage);
    };
  }, [socket, showChat, userInfo]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchUserInfo = async () => {
      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL ||
            `http://${window.location.hostname}:5000/api`
          }/auth/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setUserInfo(data.user);
        } else {
          navigate("/login");
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
        navigate("/login");
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
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 font-custom text-white relative overflow-hidden">
      <div className="absolute inset-0 backdrop-blur-3xl bg-black/20"></div>

      {/* Sidebar Component */}
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        onLogout={handleLogout}
        userInfo={userInfo}
      />

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col animate-fadeSlide min-w-0 lg:ml-0">
        <Navbar
          userInfo={userInfo}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
          onOpenChat={() => {
            setShowChat(true);
            setUnreadChatCount(0);
          }}
          unreadChatCount={unreadChatCount}
        />

        <main className="flex-1  sm:p-4 md:p-6 overflow-y-auto mt-14">
          <div className="bg-slate-800/80 backdrop-blur-md rounded-lg md:rounded-xl shadow-md p-1 md:p-4 text-gray-100 overflow-x-auto border">
            <Outlet context={{ userInfo }} />
          </div>
        </main>
      </div>

      {/* Chat Modal */}
      {showChat && (
        <AdminChat
          isAdmin={userInfo?.role === "admin"}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Animations */}
      <style>
        {`
          @keyframes fadeSlide {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes scaleUp {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
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
