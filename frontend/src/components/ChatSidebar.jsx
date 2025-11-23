import { useState } from "react";
import { useSocket } from "../context/SocketContext";
import ChatWindow from "./ChatWindow";
import { X } from "lucide-react";

export default function ChatSidebar({ onClose, isAdmin }) {
  const { onlineUsers } = useSocket();
  const [openChats, setOpenChats] = useState([]);

  if (!isAdmin) {
    return null;
  }

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
      <div className="fixed left-0 top-16 md:top-0 h-screen w-72 bg-white border-l border-gray-200 shadow-2xl flex flex-col z-40 md:z-50">
        <div className="p-4 border-b border-gray-200 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-tl-lg flex justify-between items-center">
          <span>💬 المستخدمون ({onlineUsers.length})</span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto divide-y">
          {onlineUsers.length === 0 && (
            <p className="p-4 text-gray-400 text-center text-sm">
              لا يوجد مستخدمون متصلون
            </p>
          )}
          {onlineUsers.map((id) => (
            <div
              key={id}
              onClick={() => openChat(id)}
              className="p-3 flex items-center gap-2 hover:bg-blue-50 cursor-pointer transition-colors duration-200"
            >
              <div className="relative">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                  alt="avatar"
                  className="w-8 h-8 rounded-full border border-gray-200"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-md"></span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-700 text-sm truncate">User {id.slice(-4)}</p>
                <p className="text-xs text-green-600">متصل الآن</p>
              </div>
            </div>
          ))}
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
