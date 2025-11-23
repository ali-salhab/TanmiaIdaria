import { useState, useEffect } from "react";
import { useSocket } from "../../context/SocketContext";
import { X } from "lucide-react";
import API from "../../api/api";

export default function AdminChat({ isAdmin, onClose }) {
  const { socket, onlineUsers } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersInfo, setUsersInfo] = useState({});

  useEffect(() => {
    if (isAdmin && onlineUsers.length > 0) {
      const currentUserId = localStorage.getItem("userId");
      const filteredUsers = onlineUsers.filter(userId => userId !== currentUserId);
      setUsers(filteredUsers);
      fetchUsersInfo(filteredUsers);
    }
  }, [onlineUsers, isAdmin]);

  const fetchUsersInfo = async (userIds) => {
    try {
      const res = await API.post("/auth/users-info", { userIds });
      const infoMap = {};
      res.data.forEach((user) => {
        infoMap[user._id] = user;
      });
      setUsersInfo(infoMap);
    } catch (err) {
      console.log("Error fetching users info:", err);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handlePrivateMessage = ({ from, message, fromUsername }) => {
      setMessages((prev) => [
        ...prev,
        { from, message, fromUsername, timestamp: new Date() },
      ]);
    };

    socket.on("private_message", handlePrivateMessage);
    return () => socket.off("private_message", handlePrivateMessage);
  }, [socket]);

  const sendMessage = () => {
    const from = localStorage.getItem("userId");
    const fromUsername = localStorage.getItem("username") || "Admin";

    if (!input.trim()) return;

    if (isAdmin && selectedUser) {
      socket.emit("private_message", {
        to: selectedUser,
        message: input,
        from,
        fromUsername,
      });
      setMessages((prev) => [
        ...prev,
        { from, message: input, fromUsername, timestamp: new Date() },
      ]);
      setInput("");
    } else if (!isAdmin) {
      socket.emit("admin_message", {
        message: input,
        from,
        fromUsername,
      });
      setMessages((prev) => [
        ...prev,
        { from, message: input, fromUsername, timestamp: new Date() },
      ]);
      setInput("");
    }
  };

  return (
    <div className="fixed bottom-0 right-0 w-96 h-screen md:h-[600px] md:bottom-4 md:right-4 bg-white border-2 border-gray-200 rounded-t-xl md:rounded-xl shadow-2xl flex flex-col z-50 md:z-40">
      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl">
        <span className="font-semibold">
          {isAdmin ? "💬 الدردشة مع المستخدمين" : "💬 الدردشة مع الإدارة"}
        </span>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors"
        >
          ✕
        </button>
      </div>

      {isAdmin && (
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <p className="text-sm font-semibold text-gray-700 mb-3 text-right">
            المستخدمون المتصلون ({users.length})
          </p>
          <div className="flex flex-wrap gap-3 max-h-24 overflow-y-auto">
            {users.length > 0 ? (
              users.map((userId) => {
                const userInfo = usersInfo[userId];
                const initials = userInfo?.username?.charAt(0).toUpperCase() || "U";
                const isSelected = selectedUser === userId;
                
                return (
                  <button
                    key={userId}
                    onClick={() => {
                      setSelectedUser(userId);
                      setMessages([]);
                    }}
                    className={`flex flex-col items-center gap-1 transition-all ${
                      isSelected ? "opacity-100" : "opacity-80 hover:opacity-100"
                    }`}
                    title={userInfo?.username || "User"}
                  >
                    <div
                      className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-white text-sm shadow-md transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-500 scale-110"
                          : "border-gray-300 bg-gradient-to-br from-emerald-400 to-emerald-600"
                      }`}
                    >
                      {userInfo?.image ? (
                        <img
                          src={userInfo.image}
                          alt={userInfo.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    <span className="text-xs text-gray-700 font-medium text-center max-w-12 truncate">
                      {userInfo?.username || "User"}
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="text-xs text-gray-500">لا يوجد مستخدمون متصلون</p>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">
            {isAdmin && !selectedUser
              ? "اختر مستخدماً للبدء بالدردشة"
              : "لا توجد رسائل"}
          </p>
        )}
        {messages.map((m, i) => {
          const isFromCurrent = m.from === localStorage.getItem("userId");
          return (
            <div
              key={i}
              className={`flex ${
                isFromCurrent ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] rounded-lg text-sm p-3 ${
                  isFromCurrent
                    ? "bg-blue-500 text-white rounded-br-none shadow-md"
                    : "bg-gray-300 text-gray-800 rounded-bl-none shadow-sm"
                }`}
              >
                {!isAdmin && !isFromCurrent && (
                  <p className="text-xs font-semibold mb-1 opacity-75">
                    {m.fromUsername || "Admin"}
                  </p>
                )}
                <p>{m.message}</p>
                <p className="text-xs mt-1 opacity-75">
                  {new Date(m.timestamp).toLocaleTimeString("ar-EG", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 flex gap-2 border-t border-gray-200 bg-white rounded-b-xl">
        <input
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isAdmin && !selectedUser ? "اختر مستخدماً أولاً..." : "رسالة..."}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          disabled={isAdmin && !selectedUser}
          dir="rtl"
        />
        <button
          onClick={sendMessage}
          disabled={isAdmin && !selectedUser}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 text-sm font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ➤
        </button>
      </div>
    </div>
  );
}

