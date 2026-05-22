import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo
} from "react";

// ===============================
// 🚀 AUTH CONTEXT (FINAL SAFE)
// ===============================

// ===============================
// 📦 CREATE CONTEXT
// ===============================

const AuthContext = createContext(null);

// ===============================
// 🔐 AUTH PROVIDER
// ===============================

export function AuthProvider({ children }) {

  // ===============================
  // 👤 USER STATE
  // ===============================

  const [user, setUser] = useState(null);

  // ===============================
  // ⏳ LOADING STATE
  // ===============================

  const [loading, setLoading] = useState(true);

  // ===============================
  // 🚀 INITIAL AUTH LOAD
  // ===============================

  useEffect(() => {

    const loadUser = () => {
      try {

        const savedUser =
          localStorage.getItem("user");

        const savedToken =
          localStorage.getItem("token");

        // ===============================
        // ✅ RESTORE USER
        // ===============================

        if (savedUser && savedToken) {

          const parsedUser =
            JSON.parse(savedUser);

          setUser(parsedUser);

        } else {

          // cleanup invalid state
          localStorage.removeItem("user");
          localStorage.removeItem("token");

          setUser(null);
        }

      } catch (error) {

        console.error(
          "❌ Auth restore error:",
          error
        );

        localStorage.removeItem("user");
        localStorage.removeItem("token");

        setUser(null);

      } finally {

        setLoading(false);
      }
    };

    loadUser();

  }, []);

  // ===============================
  // 🔑 LOGIN
  // ===============================

  const login = (userData, token = null) => {

    try {

      // safe user object
      const safeUser = {
        id: userData?.id || null,
        name: userData?.name || "User",
        email: userData?.email || "",
        role: userData?.role || "user",
        available:
          userData?.available ?? true
      };

      setUser(safeUser);

      localStorage.setItem(
        "user",
        JSON.stringify(safeUser)
      );

      // optional token
      if (token) {
        localStorage.setItem("token", token);
      }

    } catch (error) {

      console.error(
        "❌ Login error:",
        error
      );
    }
  };

  // ===============================
  // 🚪 LOGOUT
  // ===============================

  const logout = () => {

    setUser(null);

    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // ===============================
  // 🔄 UPDATE USER
  // ===============================

  const updateUser = (newData) => {

    if (!user) return;

    const updatedUser = {
      ...user,
      ...newData
    };

    setUser(updatedUser);

    localStorage.setItem(
      "user",
      JSON.stringify(updatedUser)
    );
  };

  // ===============================
  // 📍 TOGGLE AVAILABILITY
  // ===============================

  const toggleAvailability = () => {

    if (!user) return;

    const updatedUser = {
      ...user,
      available: !user.available
    };

    setUser(updatedUser);

    localStorage.setItem(
      "user",
      JSON.stringify(updatedUser)
    );
  };

  // ===============================
  // 🧠 MEMOIZED CONTEXT VALUE
  // ===============================

  const value = useMemo(() => ({
    user,
    setUser,
    loading,

    login,
    logout,

    updateUser,
    toggleAvailability
  }), [user, loading]);

  // ===============================
  // 🚀 PROVIDER
  // ===============================

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ===============================
// 🧠 SAFE AUTH HOOK
// ===============================

export function useAuth() {

  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}

export default AuthContext;