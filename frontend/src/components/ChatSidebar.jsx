import { useState } from "react";
import { useSocket } from "../context/SocketContext";
import ChatWindow from "./ChatWindow";

export default function ChatSidebar() {
  const { onlineUsers } = useSocket();
  console.log(onlineUsers);
  const [openChats, setOpenChats] = useState([]);

  const openChat = (userId) => {
    if (!openChats.includes(userId)) {
      setOpenChats([...openChats, userId]);
    }
  };

  return (
    <div className="fixed z-20 top-0 h-full w-72 bg-white border-xl border-gray-200 shadow-xl flex flex-col">
      <div className="p-3  z-20 border-b text-lg font-semibold bg-blue-600 text-white">
        المستخدمون المتصلونj
      </div>
      <div className="flex-1 overflow-y-auto divide-y">
        {onlineUsers.length === 0 && (
          <p className="p-4 text-gray-400 text-center">
            لا يوجد مستخدمون متصلون
          </p>
        )}
        {onlineUsers.map((id) => (
          <div
            key={id}
            onClick={() => openChat(id)}
            className="p-3 flex items-center gap-2 hover:bg-blue-50 cursor-pointer"
          >
            <div className="relative">
              <img
                src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                alt="avatar"
                className="w-8 h-8 rounded-full border"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <p className="font-medium text-gray-700">User {id.slice(-4)}</p>
              <p className="text-xs text-green-600">متصل الآن</p>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Chat Windows */}
      {openChats.map((userId) => (
        <ChatWindow
          key={userId}
          userId={userId}
          onClose={() => setOpenChats(openChats.filter((id) => id !== userId))}
        />
      ))}
    </div>
  );
}
