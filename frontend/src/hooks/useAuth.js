// src/hooks/useAuth.js
import { useEffect, useState } from "react";
import API from "../api/api";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await API.get("/auth/me");
        setUser(response.data.user);
        setRole(response.data.user.role);
      } catch (error) {
        console.error("Error fetching user:", error);
        setRole(localStorage.getItem("role"));
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  return { user, role, loading };
}
