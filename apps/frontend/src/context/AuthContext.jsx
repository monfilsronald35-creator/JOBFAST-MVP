import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "jobfast_user";

// ======================================================
// 🌍 JOBFAST — AUTH PROVIDER (COMPLETE & OPTIMIZED)
// ======================================================
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Chaje itilizatè a depi nan kòmansman an
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setUser(saved ? JSON.parse(saved) : null);
    } catch (err) {
      console.error("[JOBFAST AUTH]: Load error:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sinkronizasyon sekirite ak LocalStorage
  const syncStorage = useCallback((data) => {
    try {
      if (data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.error("[JOBFAST STORAGE]: Sync error:", err);
    }
  }, []);

  // Aksyon Koneksyon (Login)
  const login = useCallback((userData) => {
    setUser(userData);
    syncStorage(userData);
  }, [syncStorage]);

  // Aksyon Dekoneksyon (Logout)
  const logout = useCallback(() => {
    setUser(null);
    syncStorage(null);
  }, [syncStorage]);

  // Chanje disponiblite travayè a dinamikman
  const toggleAvailability = useCallback(() => {
    setUser((prev) => {
      if (!prev) return prev;

      const updated = {
        ...prev,
        available: !Boolean(prev.available),
      };

      syncStorage(updated);
      return updated;
    });
  }, [syncStorage]);

  // Optimize referans memwa pou evite re-render initil
  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      login,
      logout,
      toggleAvailability,
    }),
    [user, loading, login, logout, toggleAvailability]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ======================================================
// 🧠 CUSTOM HOOK POU APLIKASYON AN
// ======================================================
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("[JOBFAST AUTH]: useAuth must be used inside AuthProvider");
  }
  return ctx;
}

export default AuthContext;
