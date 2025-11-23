import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { X, Send } from "lucide-react";
import API from "../api/api";
import UserAvatar from "./common/UserAvatar";

export default function ChatWindow({ userId, onClose, index = 0 }) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    fetchUserInfo();
  }, [userId]);

  const fetchUserInfo = async () => {
    setLoadingUser(true);
    try {
      const res = await API.post("/auth/users-info", { userIds: [userId] });
      if (res.data && res.data.length > 0) {
        const user = res.data[0];
        setUserInfo({
          ...user,
          image: user.image || user.profile?.avatar || null,
        });
      }
    } catch (err) {
      console.log("Error fetching user info:", err);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handlePrivateMessage = ({ from, message, timestamp }) => {
      if (from === userId) {
        setMessages((prev) => [...prev, { from, message, timestamp: timestamp || new Date() }]);
      }
    };

    socket.on("private_message", handlePrivateMessage);
    return () => socket.off("private_message", handlePrivateMessage);
  }, [socket, userId]);

  const sendMessage = () => {
    const from = localStorage.getItem("userId");
    const fromUsername = localStorage.getItem("username") || "Admin";
    if (!input.trim()) return;
    socket.emit("private_message", { 
      to: userId, 
      message: input, 
      from,
      fromUsername 
    });
    setMessages((prev) => [...prev, { 
      from, 
      message: input, 
      timestamp: new Date() 
    }]);
    setInput("");
  };

  const offset = index * 380;

  const currentUserId = localStorage.getItem("userId");

  return (
    <div 
      className="fixed z-40 bg-white border-2 border-gray-200 rounded-xl shadow-2xl flex flex-col w-80 h-[500px] transition-all duration-300 hover:shadow-3xl" 
      style={{ bottom: '20px', right: `${20 + offset}px` }}
    >
      {/* Header with User Info */}
      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {loadingUser ? (
            <div className="animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full"></div>
              <div className="h-4 bg-white/20 rounded w-24"></div>
            </div>
          ) : userInfo ? (
            <>
              <UserAvatar
                image={userInfo.image}
                username={userInfo.username}
                isOnline={true}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{userInfo.username}</p>
                <p className="text-xs text-blue-100 flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></span>
                  متصل الآن
                </p>
              </div>
            </>
          ) : (
            <span className="font-semibold text-sm">User {userId.slice(-4)}</span>
          )}
        </div>
        <button 
          onClick={onClose} 
          className="text-white hover:text-gray-200 p-1 hover:bg-white/20 rounded transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-8">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-3">
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-center text-gray-400 text-sm">لا توجد رسائل بعد</p>
          </div>
        )}
        {messages.map((m, i) => {
          const isFromCurrent = m.from === currentUserId;
          return (
            <div
              key={i}
              className={`flex items-end gap-2 ${
                isFromCurrent ? "justify-end" : "justify-start"
              }`}
            >
              {/* Avatar for received messages */}
              {!isFromCurrent && (
                <UserAvatar
                  image={userInfo?.image}
                  username={userInfo?.username || "User"}
                  isOnline={false}
                  size="sm"
                  className="flex-shrink-0"
                />
              )}

              <div className={`flex flex-col max-w-[75%] ${
                isFromCurrent ? "items-end" : "items-start"
              }`}>
                <div
                  className={`rounded-2xl text-sm p-3 ${
                    isFromCurrent
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md shadow-lg"
                      : "bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.message}</p>
                  <p className={`text-xs mt-1.5 ${
                    isFromCurrent ? "text-blue-100" : "text-gray-500"
                  }`}>
                    {new Date(m.timestamp).toLocaleTimeString("ar-EG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {/* Avatar for sent messages */}
              {isFromCurrent && (
                <UserAvatar
                  image={null}
                  username={localStorage.getItem("username") || "You"}
                  isOnline={false}
                  size="sm"
                  className="flex-shrink-0"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="p-3 flex gap-2 border-t border-gray-200 bg-white rounded-b-xl">
        <input
          className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="اكتب رسالتك هنا..."
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          dir="rtl"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-blue-800 text-sm font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
