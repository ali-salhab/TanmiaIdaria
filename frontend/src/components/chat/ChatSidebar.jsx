import { useState, useEffect } from "react";
import { useSocket } from "../../context/SocketContext";
import ChatWindow from "./ChatWindow";
import { X, Users as UsersIcon } from "lucide-react";
import API from "../../api/api";
import UserAvatar from "../common/UserAvatar";

export default function ChatSidebar({ onClose, isAdmin }) {
  const { onlineUsers } = useSocket();
  const [openChats, setOpenChats] = useState([]);
  const [usersInfo, setUsersInfo] = useState({});
  const [loadingUsers, setLoadingUsers] = useState(false);

  if (!isAdmin) {
    return null;
  }

  useEffect(() => {
    if (onlineUsers.length > 0) {
      fetchUsersInfo(onlineUsers);
    } else {
      setUsersInfo({});
    }
  }, [onlineUsers]);

  const fetchUsersInfo = async (userIds) => {
    if (userIds.length === 0) return;
    setLoadingUsers(true);
    try {
      const res = await API.post("/auth/users-info", { userIds });
      const infoMap = {};
      res.data.forEach((user) => {
        infoMap[user._id] = {
          ...user,
          image: user.image || user.profile?.avatar || null,
        };
      });
      setUsersInfo(infoMap);
    } catch (err) {
      console.log("Error fetching users info:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const openChat = (userId) => {
    if (!openChats.includes(userId)) {
      setOpenChats([...openChats, userId]);
    }
  };

  const closeChat = (userId) => {
    setOpenChats(openChats.filter((id) => id !== userId));
  };

  return (
    <>
      <div className="fixed left-0 top-16 md:top-0 h-screen w-80 bg-white border-l border-gray-200 shadow-2xl flex flex-col z-40 md:z-50">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5" />
            <span className="font-semibold">المستخدمون المتصلون</span>
            <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full font-medium">
              {onlineUsers.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          {loadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : onlineUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <UsersIcon className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-400 text-center text-sm">
                لا يوجد مستخدمون متصلون
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {onlineUsers.map((userId) => {
                const userInfo = usersInfo[userId];
                const isChatOpen = openChats.includes(userId);
                
                return (
                  <div
                    key={userId}
                    onClick={() => openChat(userId)}
                    className={`p-4 flex items-center gap-3 cursor-pointer transition-all duration-200 ${
                      isChatOpen
                        ? "bg-blue-50 border-r-4 border-blue-500"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <UserAvatar
                      image={userInfo?.image}
                      username={userInfo?.username || `User ${userId.slice(-4)}`}
                      isOnline={true}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">
                        {userInfo?.username || `User ${userId.slice(-4)}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <p className="text-xs text-emerald-600 font-medium">متصل الآن</p>
                      </div>
                    </div>
                    {isChatOpen && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Chat Windows */}
      {openChats.map((userId, idx) => (
        <ChatWindow
          key={userId}
          userId={userId}
          index={idx}
          isAdmin={isAdmin}
          onClose={() => closeChat(userId)}
        />
      ))}
    </>
  );
}

