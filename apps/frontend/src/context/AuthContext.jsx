import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
// 👑 KOREKSYON 1: Akolad sa yo ap debloke Rollup sou Vercel nèt!
import { io } from "socket.io-client";

const AuthContext = createContext(null);
const STORAGE_KEY = "jobfast_user";

// Socket URL: direct to Render backend (Vercel proxy doesn't support WebSockets)
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.PROD
    ? "https://jobfast-backend.onrender.com"
    : "http://localhost:5000");

const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 3,
  reconnectionDelay: 2000,
  transports: ["websocket", "polling"],
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const userRef = useRef(null);
  const socketInitRef = useRef(false);

  useEffect(() => {
    let parsed = null;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      parsed = saved ? JSON.parse(saved) : null;

      // Backend retounen user.id, men AuthContext itilize _id
      // Map id to _id pou konsistans
      if (parsed?.user?.id && !parsed?.user?._id) {
        parsed.user._id = parsed.user.id;
      }
    } catch {
      parsed = null;
    }

    setUser(parsed);
    userRef.current = parsed;
    setLoading(false);
  }, []);

  useEffect(() => {
    userRef.current = user;

    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (socketInitRef.current) return;
    socketInitRef.current = true;

    const join = () => {
      const current = userRef.current;
      if (!current?._id) return;

      socket.emit("auth:join", {
        userId: current._id,
        role: current.role,
      });
    };

    const onAuthUpdate = (updatedUser) => {
      if (!updatedUser || typeof updatedUser !== "object") return;

      setUser((prev) => {
        const merged = prev
          ? { ...prev, ...updatedUser, _id: updatedUser._id || prev._id }
          : updatedUser;

        userRef.current = merged;
        return merged;
      });
    };

    const onStatus = (data) => {
      const current = userRef.current;
      if (!current?._id || data?.id !== current._id) return;

      setUser((prev) => {
        if (!prev) return prev;

        const updated = { ...prev, status: data.status };
        userRef.current = updated;
        return updated;
      });
    };

    socket.on("connect", join);
    socket.on("user:auth_update", onAuthUpdate);
    socket.on("user:status_change", onStatus);

    return () => {
      socket.off("connect", join);
      socket.off("user:auth_update", onAuthUpdate);
      socket.off("user:status_change", onStatus);
    };
  }, []);

  useEffect(() => {
    if (!user?._id) {
      if (socket.connected) socket.disconnect();
      return;
    }

    if (!socket.connected) {
      socket.connect();
    } else {
      socket.emit("auth:join", {
        userId: user._id,
        role: user.role,
      });
    }
  }, [user?._id, user?.role]);

  const login = useCallback((data) => {
    if (!data?._id) return;

    setUser(data);
    userRef.current = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    if (!socket.connected) {
      socket.connect();
    } else {
      socket.emit("auth:join", {
        userId: data._id,
        role: data.role,
      });
    }
  }, []);

  const logout = useCallback(() => {
    const current = userRef.current;

    if (current?._id && socket.connected) {
      socket.emit("auth:logout", { userId: current._id });
    }

    setUser(null);
    userRef.current = null;
    localStorage.removeItem(STORAGE_KEY);

    if (socket.connected) {
      socket.disconnect();
    }
  }, []);

  const attachStripeSession = useCallback(async (sessionId) => {
    const current = userRef.current;
    if (!current?._id) return;

    try {
      const base = import.meta.env.VITE_API_URL || "/api/v1";
      const res = await fetch(`${base}/stripe/bind`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: current._id,
          sessionId,
        }),
      });

      const data = await res.json();
      if (!data?.customerId) return;

      setUser((prev) =>
        prev ? { ...prev, stripeCustomerId: data.customerId } : prev
      );
    } catch (err) {
      console.error("Stripe error:", err);
    }
  }, []);

  const toggleAvailability = useCallback(() => {
    const current = userRef.current;
    if (!current?._id) return;

    const updated = {
      ...current,
      available: !current.available,
    };

    setUser(updated);
    userRef.current = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    socket.emit("user:status_change", {
      id: updated._id,
      status: updated.available ? "available" : "busy",
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
      toggleAvailability,
      attachStripeSession,
      socket,
    }),
    [user, loading, login, logout, toggleAvailability, attachStripeSession]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export default AuthContext;

