
import React, { createContext, useContext, useState, useEffect } from "react";

// ===============================
// 🚀 AUTH CONTEXT (MVP SAFE)
// ===============================

// Create context
const AuthContext = createContext();

// ===============================
// 🔐 PROVIDER
// ===============================
export function AuthProvider({ children }) {
  // 👤 USER STATE (safe MVP structure)
  const [user, setUser] = useState(null);

  // 🔄 LOADING STATE (avoid flicker / crash)
  const [loading, setLoading] = useState(true);

  // ===============================
  // 📦 INIT AUTH (LOCAL STORAGE SAFE)
  // ===============================
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("user");

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.log("Auth load error:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ===============================
  // 🔑 LOGIN (MVP SAFE)
  // ===============================
  const login = (userData) => {
    try {
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (err) {
      console.log("Login error:", err);
    }
  };

  // ===============================
  // 🚪 LOGOUT
  // ===============================
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // ===============================
  // 📍 UPDATE AVAILABILITY (CORE FOR CONSTRUCTION SYSTEM)
  // ===============================
  const toggleAvailability = () => {
    if (!user) return;

    const updatedUser = {
      ...user,
      available: user.available === false ? true : false,
    };

    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  // ===============================
  // 📦 CONTEXT VALUE
  // ===============================
  const value = {
    user,
    setUser,
    login,
    logout,
    loading,
    toggleAvailability,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ===============================
// 🧠 HOOK (SAFE USAGE)
// ===============================
export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;