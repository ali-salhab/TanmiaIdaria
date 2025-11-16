import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";

export default function ChatWindow({ userId, onClose, index = 0 }) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!socket) return;

    const handlePrivateMessage = ({ from, message }) => {
      if (from === userId) {
        setMessages((prev) => [...prev, { from, message }]);
      }
    };

    socket.on("private_message", handlePrivateMessage);
    return () => socket.off("private_message", handlePrivateMessage);
  }, [socket, userId]);

  const sendMessage = () => {
    const from = localStorage.getItem("userId");
    if (!input.trim()) return;
    socket.emit("private_message", { to: userId, message: input, from });
    setMessages((prev) => [...prev, { from, message: input }]);
    setInput("");
  };

  const offset = index * 360;

  return (
    <div className="fixed z-40 bg-white border-2 border-gray-200 rounded-xl shadow-2xl flex flex-col w-80 h-96 transition-all duration-300 hover:shadow-3xl" style={{ bottom: '20px', right: `${20 + offset}px` }}>
      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl">
        <span className="font-semibold">💬 {userId.slice(-4)}</span>
        <button onClick={onClose} className="text-white hover:text-gray-200 font-bold hover:scale-110 transition-transform">
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50 border-b border-gray-100">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">لا توجد رسائل</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.from === localStorage.getItem("userId") ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] p-2 rounded-lg text-sm ${
                m.from === localStorage.getItem("userId")
                  ? "bg-blue-500 text-white rounded-br-none shadow-md"
                  : "bg-gray-300 text-gray-800 rounded-bl-none shadow-sm"
              }`}
            >
              {m.message}
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 flex gap-2 border-t border-gray-200 bg-white rounded-b-xl">
        <input
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="رسالة..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          dir="rtl"
        />
        <button
          onClick={sendMessage}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 text-sm font-medium transition-all transform hover:scale-105"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
