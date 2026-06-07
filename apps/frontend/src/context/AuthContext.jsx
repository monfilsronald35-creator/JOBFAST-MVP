import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "jobfast_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        setUser(saved ? JSON.parse(saved) : null);
      } catch (err) {
        console.error("[JOBFAST AUTH]: Load error:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const syncStorage = (data) => {
    try {
      if (data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.error("[JOBFAST STORAGE]: Sync error:", err);
    }
  };

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key !== STORAGE_KEY) return;
      
      try {
        const updatedData = event.newValue ? JSON.parse(event.newValue) : null;
        setUser(updatedData);
      } catch (err) {
        console.error("[JOBFAST STORAGE]: Sync cross-tab error:", err);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = (userData) => {
    setUser(userData);
    syncStorage(userData);
  };

  const logout = () => {
    setUser(null);
    syncStorage(null);
  };

  const toggleAvailability = () => {
    setUser((prev) => {
      if (!prev) return prev;

      const updated = {
        ...prev,
        available: !Boolean(prev.available),
      };

      syncStorage(updated);
      return updated;
    });
  };

  const contextValue = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    toggleAvailability,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("[JOBFAST AUTH]: useAuth must be used inside AuthProvider");
  }
  return ctx;
}

export default AuthContext;
