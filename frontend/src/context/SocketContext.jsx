import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Auto-detect backend URL
  const getSocketURL = () => {
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL.replace("/api", "");
    }
    const hostname = window.location.hostname;
    return `http://${hostname}:5000`;
  };

  const getAPIURL = () => {
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    const hostname = window.location.hostname;
    return `http://${hostname}:5000/api`;
  };

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

    // ✅ Connect socket with auto-detected URL
    const socketURL = getSocketURL();
    console.log("🔌 Connecting to socket:", socketURL);
    const newSocket = io(socketURL, {
      transports: ["websocket"],
    });

    setSocket(newSocket);

    newSocket.on("connect", async () => {
      console.log("⚡ Socket connected:", newSocket.id);

      // Ensure we register presence after the connection is established
      if (userId) {
        newSocket.emit("user_connected", userId);
      }

      try {
        const apiURL = getAPIURL();
        const res = await fetch(`${apiURL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch user");

        const data = await res.json();
        const user = data.user;
        console.log("🧑‍💼 Current user:", user.role);

        if (user.role === "admin") {
          newSocket.emit("registerAdmin", { id: user._id });
          // Also register in the generic users map so messages can target admin
          newSocket.emit("registerUser", { id: user._id });
          console.log("🧑‍💼 Registered as ADMIN (and user map)");
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
