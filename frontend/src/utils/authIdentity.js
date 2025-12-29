import { jwtDecode } from "jwt-decode";

export function getCurrentUserId() {
  const stored = localStorage.getItem("userId");
  if (stored && stored !== "undefined" && stored !== "null") return stored;

  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    const id = decoded?.id;
    if (id) {
      localStorage.setItem("userId", id);
      return id;
    }
  } catch {
    // ignore
  }
  return null;
}

export function getCurrentUsername() {
  return localStorage.getItem("username") || "User";
}
