import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";

export default function ChatWindow({ userId, onClose }) {
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

  return (
    <div className="fixed bottom-4 right-8 w-80 bg-white border border-gray-300 rounded-lg shadow-xl flex flex-col">
      <div className="flex justify-between items-center p-3 bg-blue-600 text-white rounded-t-lg">
        <span>دردشة مع {userId.slice(-4)}</span>
        <button onClick={onClose} className="text-white hover:text-gray-200">
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[70%] p-2 rounded-lg ${
              m.from === localStorage.getItem("userId")
                ? "bg-blue-500 text-white self-end ml-auto"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            {m.message}
          </div>
        ))}
      </div>
      <div className="p-2 flex gap-2 border-t">
        <input
          className="flex-1 border rounded px-2 py-1 text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="اكتب رسالة..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          إرسال
        </button>
      </div>
    </div>
  );
}
