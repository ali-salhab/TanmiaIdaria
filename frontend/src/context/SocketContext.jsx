import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let userId = null;
    try {
      const decoded = jwtDecode(token);
      userId = decoded.id;
      console.log("✅ Decoded user ID:", userId);
    } catch (err) {
      console.error("❌ Invalid token", err);
      return;
    }

    // ✅ Connect socket
    const newSocket = io("http://localhost:5000", {
      transports: ["websocket"],
    });

    // Notify backend user connected
    if (userId) newSocket.emit("user_connected", userId);

    setSocket(newSocket);

    newSocket.on("connect", async () => {
      console.log("⚡ Socket connected:", newSocket.id);

      try {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch user");

        const data = await res.json();
        const user = data.user;
        console.log("🧑‍💼 Current user:", user.role);

        if (user.role === "admin") {
          newSocket.emit("registerAdmin", { id: user._id });
          console.log("🧑‍💼 Registered as ADMIN");
        } else {
          newSocket.emit("registerUser", { id: user._id });
          console.log("🙋 Registered as USER");
        }
      } catch (err) {
        console.error("❌ Could not fetch user:", err);
      }
    });

    // ✅ Listen for online users list from backend
    newSocket.on("online_users", (users) => {
      console.log("👥 Online users:", users);
      setOnlineUsers(users);
    });

    // Cleanup
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // ✅ Correct context value (must be an object)
  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
