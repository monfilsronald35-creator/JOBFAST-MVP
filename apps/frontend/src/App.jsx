import React, { useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import "./styles/global.css";
import API from "./api/axios";

function App() {
  useEffect(() => {
    // Wake up Render free-tier backend immediately on app load (fire-and-forget).
    // By the time user fills the form, the server should be warm.
    API.get("/health").catch(() => {});
  }, []);

  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;


