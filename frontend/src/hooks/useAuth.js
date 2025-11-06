// src/hooks/useAuth.js
import { useEffect, useState } from "react";

export default function useAuth() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    setRole(localStorage.getItem("role"));
  }, []);

  return role;
}
