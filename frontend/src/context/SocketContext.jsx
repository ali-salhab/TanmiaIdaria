import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

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
    const newSocket = io("http://localhost:5001", {
      transports: ["websocket"],
    });
    setSocket(newSocket);

    newSocket.on("connect", async () => {
      console.log("⚡ Socket connected:", newSocket.id);

      // ✅ Fetch full user from backend
      try {
        const res = await fetch("http://localhost:5001/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch user");

        const user = await res.json();
        console.log("🧑‍💼 Current user:", user.user.role);

        if (user.user.role === "admin") {
          newSocket.emit("registerAdmin", { id: user.user._id });
          console.log("🧑‍💼 Registered as ADMIN");
        } else {
          newSocket.emit("registerUser", { id: user.id });
          console.log("🙋 Registered as USER");
        }
      } catch (err) {
        console.error("❌ Could not fetch user:", err);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
