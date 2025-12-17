import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "../../context/SocketContext";
import { useSettings } from "../../context/SettingsContext";
import { X, Send, Users as UsersIcon, Bell } from "lucide-react";
import { toast } from "react-hot-toast";
import API from "../../api/api";
import UserAvatar from "../common/UserAvatar";

export default function AdminChat({ isAdmin, onClose }) {
  const { socket, onlineUsers } = useSocket();
  const { playMessage } = useSettings();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersInfo, setUsersInfo] = useState({});
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [messageCache, setMessageCache] = useState(new Set()); // For deduplication
  const messagesEndRef = useRef(null);
  const { playNotification } = useSettings();
  const [currentUserId, setCurrentUserId] = useState(() =>
    localStorage.getItem("userId")
  );

  const ensureCurrentUserId = useCallback(async () => {
    let storedId = localStorage.getItem("userId");
    if (storedId) {
      setCurrentUserId(storedId);
      return storedId;
    }

    try {
      const { data } = await API.get("/auth/me", {
        headers: { "Cache-Control": "no-cache" },
      });
      const fetchedId = data?.user?._id;
      if (fetchedId) {
        localStorage.setItem("userId", fetchedId);
        if (data.user?.username) {
          localStorage.setItem("username", data.user.username);
        }
        setCurrentUserId(fetchedId);
        return fetchedId;
      }
    } catch (error) {
      console.error("Error refreshing user identity:", error);
      toast.error("تعذر التحقق من المستخدم، يرجى تسجيل الدخول مرة أخرى.");
    }

    return null;
  }, []);

  useEffect(() => {
    ensureCurrentUserId();
  }, [ensureCurrentUserId]);

  // Generate unique message identifier
  const generateMessageId = useCallback((message, from, timestamp) => {
    // Create a unique identifier based on message content, sender, and timestamp
    const timeSlot = Math.floor(new Date(timestamp).getTime() / 1000); // 1-second precision
    return `${from}-${message}-${timeSlot}`;
  }, []);

  // Check if message is duplicate
  const isDuplicateMessage = useCallback(
    (messageData) => {
      const messageId = generateMessageId(
        messageData.message,
        messageData.from,
        messageData.timestamp
      );
      return messageCache.has(messageId);
    },
    [generateMessageId, messageCache]
  );

  // Add message to cache
  const addToMessageCache = useCallback(
    (messageData) => {
      const messageId = generateMessageId(
        messageData.message,
        messageData.from,
        messageData.timestamp
      );
      setMessageCache((prev) => new Set(prev).add(messageId));

      // Clean up old cache entries (keep only last 1000 messages)
      if (messageCache.size > 1000) {
        const iterator = messageCache.values();
        const first = iterator.next().value;
        if (first) {
          const newCache = new Set(messageCache);
          newCache.delete(first);
          setMessageCache(newCache);
        }
      }
    },
    [generateMessageId, messageCache]
  );

  useEffect(() => {
    if (isAdmin && onlineUsers.length > 0) {
      const filteredUsers = onlineUsers.filter(
        (userId) => userId !== currentUserId
      );
      setUsers(filteredUsers);
      fetchUsersInfo(filteredUsers);
    } else if (isAdmin) {
      setUsers([]);
      setUsersInfo({});
    }
  }, [onlineUsers, isAdmin, currentUserId]);

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

  useEffect(() => {
    if (!socket) return;

    const handlePrivateMessage = ({
      from,
      message,
      fromUsername,
      timestamp,
      to,
      messageId, // Unique ID from server
    }) => {
      // For received messages
      if (from !== currentUserId) {
        const messageData = {
          from,
          message,
          fromUsername,
          timestamp: timestamp || new Date(),
          messageId:
            messageId ||
            generateMessageId(message, from, timestamp || new Date()),
        };

        // Check for duplicates using both client-side cache and server-side ID
        if (
          isDuplicateMessage(messageData) ||
          (messageId && messageCache.has(messageId))
        ) {
          console.log("Duplicate message detected, ignoring:", messageData);
          return;
        }

        // Add to cache and state
        addToMessageCache(messageData);
        setMessages((prev) => [...prev, messageData]);

        playMessage();
        playNotification();

        // Show toast notification
        const senderInfo = usersInfo[from] || { username: fromUsername };
        toast.success(
          `💬 رسالة جديدة من ${senderInfo.username || fromUsername}`,
          {
            icon: <Bell className="w-5 h-5" />,
          }
        );
      }
    };

    const handleMessageConfirmation = ({
      from,
      message,
      timestamp,
      messageId,
    }) => {
      // This confirms the message was sent successfully
      console.log("✅ Message sent confirmation received");
    };

    socket.on("private_message", handlePrivateMessage);
    socket.on("message_sent_confirmation", handleMessageConfirmation);

    return () => {
      socket.off("private_message", handlePrivateMessage);
      socket.off("message_sent_confirmation", handleMessageConfirmation);
    };
  }, [
    socket,
    playMessage,
    playNotification,
    usersInfo,
    isDuplicateMessage,
    addToMessageCache,
    generateMessageId,
    messageCache,
    currentUserId,
  ]);

  // Load chat history when user is selected
  useEffect(() => {
    if (selectedUser && isAdmin) {
      loadChatHistory(selectedUser);
    } else if (!isAdmin) {
      // For non-admin users, load history with admin
      loadChatHistoryWithAdmin();
    }
  }, [selectedUser, isAdmin]);

  const loadChatHistory = async (otherUserId) => {
    setLoadingHistory(true);
    try {
      const res = await API.get(`/messages/history/${otherUserId}`);
      const historyMessages = res.data.map((msg) => ({
        from: msg.from,
        message: msg.message,
        fromUsername: msg.fromUsername,
        timestamp: msg.createdAt || msg.timestamp,
        messageId: msg._id, // Use MongoDB ID as unique identifier
      }));

      // Populate cache with existing messages
      const newCache = new Set();
      historyMessages.forEach((msg) => {
        if (msg.messageId) {
          newCache.add(msg.messageId);
        }
        const clientId = generateMessageId(
          msg.message,
          msg.from,
          msg.timestamp
        );
        newCache.add(clientId);
      });
      setMessageCache(newCache);

      setMessages(historyMessages);
    } catch (error) {
      console.error("Error loading chat history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadChatHistoryWithAdmin = async () => {
    setLoadingHistory(true);
    try {
      // Find admin user ID
      const adminRes = await API.get("/users?role=admin");
      if (adminRes.data && adminRes.data.length > 0) {
        const adminId = adminRes.data[0]._id;
        const res = await API.get(`/messages/history/${adminId}`);
        const historyMessages = res.data.map((msg) => ({
          from: msg.from,
          message: msg.message,
          fromUsername: msg.fromUsername,
          timestamp: msg.createdAt || msg.timestamp,
          messageId: msg._id, // Use MongoDB ID as unique identifier
        }));

        // Populate cache with existing messages
        const newCache = new Set();
        historyMessages.forEach((msg) => {
          if (msg.messageId) {
            newCache.add(msg.messageId);
          }
          const clientId = generateMessageId(
            msg.message,
            msg.from,
            msg.timestamp
          );
          newCache.add(clientId);
        });
        setMessageCache(newCache);

        setMessages(historyMessages);
      }
    } catch (error) {
      console.error("Error loading chat history with admin:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Filter messages for selected user
  const filteredMessages =
    isAdmin && selectedUser
      ? messages.filter(
          (m) => m.from === selectedUser || m.from === currentUserId
        )
      : messages;

  const sendMessage = useCallback(async () => {
    if (!socket || !input.trim()) return;

    const from = await ensureCurrentUserId();
    if (!from) {
      return;
    }

    const fromUsername = localStorage.getItem("username") || "Admin";

    if (isAdmin && selectedUser) {
      // Admin sending to specific user
      const messageData = {
        to: selectedUser,
        message: input,
        from,
        fromUsername,
      };

      socket.emit("private_message", messageData);

      // Add message to local state immediately
      const newMessage = {
        from,
        message: input,
        fromUsername,
        timestamp: new Date(),
        messageId: `temp-${Date.now()}-${Math.random()}`, // Temporary ID until server confirms
      };

      // Check for duplicates before adding
      if (!isDuplicateMessage(newMessage)) {
        addToMessageCache(newMessage);
        setMessages((prev) => [...prev, newMessage]);
        playMessage();
      }

      setInput("");
    } else if (!isAdmin) {
      // Normal user sending to admin
      const messageData = {
        message: input,
        from,
        fromUsername,
      };

      socket.emit("admin_message", messageData);

      // Add message to local state immediately
      const newMessage = {
        from,
        message: input,
        fromUsername,
        timestamp: new Date(),
        messageId: `temp-${Date.now()}-${Math.random()}`, // Temporary ID until server confirms
      };

      // Check for duplicates before adding
      if (!isDuplicateMessage(newMessage)) {
        addToMessageCache(newMessage);
        setMessages((prev) => [...prev, newMessage]);
        playMessage();
      }

      setInput("");
    }
  }, [
    socket,
    input,
    isAdmin,
    selectedUser,
    ensureCurrentUserId,
    isDuplicateMessage,
    addToMessageCache,
    playMessage,
  ]);

  const selectedUserInfo = selectedUser ? usersInfo[selectedUser] : null;

  return (
    <div className="fixed bottom-0 md:left-0 right-0 w-full sm:w-96 h-screen md:h-[600px] md:bottom-4 md:right-4 bg-slate-900 border-2 border-slate-700 rounded-t-xl md:rounded-xl shadow-2xl flex flex-col z-[100]">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-t-xl">
        <div className="flex items-center gap-3 flex-1">
          {isAdmin && selectedUserInfo && (
            <>
              <UserAvatar
                image={selectedUserInfo.image}
                username={selectedUserInfo.username}
                isOnline={true}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {selectedUserInfo.username}
                </p>
                <p className="text-xs text-blue-100 flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  متصل الآن
                </p>
              </div>
            </>
          )}
          {!isAdmin && (
            <span className="font-semibold">💬 الدردشة مع الإدارة</span>
          )}
          {isAdmin && !selectedUser && (
            <span className="font-semibold flex items-center gap-2">
              <UsersIcon className="w-5 h-5" />
              اختر مستخدماً
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-slate-200 transition-colors p-1 hover:bg-white/10 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Users List (Admin Only) */}
      {isAdmin && (
        <div className="border-b border-slate-700 bg-slate-800">
          <div className="p-3">
            <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-2">
              <UsersIcon className="w-4 h-4" />
              المستخدمون المتصلون ({users.length})
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {loadingUsers ? (
                <div className="flex items-center justify-center w-full py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : users.length > 0 ? (
                users.map((userId) => {
                  const userInfo = usersInfo[userId];
                  const isSelected = selectedUser === userId;

                  return (
                    <button
                      key={userId}
                      onClick={() => {
                        setSelectedUser(userId);
                        setMessages([]);
                        setMessageCache(new Set()); // Clear cache when switching users
                      }}
                      className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all min-w-[70px] ${
                        isSelected
                          ? "bg-blue-900/30 border-2 border-blue-500 shadow-md scale-105"
                          : "bg-slate-700 border border-slate-600 hover:border-blue-500 hover:shadow-md"
                      }`}
                      title={userInfo?.username || "User"}
                    >
                      <UserAvatar
                        image={userInfo?.image}
                        username={userInfo?.username || "User"}
                        isOnline={true}
                        size="lg"
                      />
                      <span
                        className={`text-xs font-medium text-center max-w-[60px] truncate ${
                          isSelected ? "text-blue-400" : "text-slate-300"
                        }`}
                      >
                        {userInfo?.username || "User"}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="w-full py-4 text-center">
                  <p className="text-xs text-slate-500">
                    لا يوجد مستخدمون متصلون
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900">
        {loadingHistory && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}
        {!loadingHistory && filteredMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-8">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <UsersIcon className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-center text-slate-500 text-sm">
              {isAdmin && !selectedUser
                ? "اختر مستخدماً للبدء بالدردشة"
                : "لا توجد رسائل بعد"}
            </p>
          </div>
        )}
        {filteredMessages.map((m, i) => {
          const isFromCurrent = m.from === localStorage.getItem("userId");
          const messageUserInfo = isFromCurrent
            ? null
            : isAdmin
            ? usersInfo[m.from]
            : null;

          return (
            <div
              key={m.messageId || i} // Use message ID as key when available
              className={`flex items-end gap-2 ${
                isFromCurrent ? "justify-end" : "justify-start"
              }`}
            >
              {/* Avatar for received messages */}
              {!isFromCurrent && (
                <UserAvatar
                  image={messageUserInfo?.image}
                  username={m.fromUsername || "User"}
                  isOnline={false}
                  size="sm"
                  className="flex-shrink-0"
                />
              )}

              <div
                className={`flex flex-col max-w-[75%] ${
                  isFromCurrent ? "items-end" : "items-start"
                }`}
              >
                {!isFromCurrent && (
                  <p className="text-xs font-semibold text-slate-400 mb-1 px-1">
                    {m.fromUsername || messageUserInfo?.username || "User"}
                  </p>
                )}
                <div
                  className={`rounded-2xl text-sm p-3 ${
                    isFromCurrent
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md shadow-lg"
                      : "bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-md shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.message}</p>
                  <p
                    className={`text-xs mt-1.5 ${
                      isFromCurrent ? "text-blue-100" : "text-slate-500"
                    }`}
                  >
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 flex gap-2 border-t border-slate-700 bg-slate-800 rounded-b-xl">
        <input
          className="flex-1 border border-slate-600 bg-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isAdmin && !selectedUser
              ? "اختر مستخدماً أولاً..."
              : "اكتب رسالتك هنا..."
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          disabled={isAdmin && !selectedUser}
          dir="rtl"
        />
        <button
          onClick={sendMessage}
          disabled={(isAdmin && !selectedUser) || !input.trim()}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 text-sm font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">إرسال</span>
        </button>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
