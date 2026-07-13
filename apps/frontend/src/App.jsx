import React, { useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import IOSInstallBanner from "./components/IOSInstallBanner";
import "./styles/global.css";
import API from "./api/axios";

// Ping /health until the backend responds or we give up after 3 attempts.
// This runs immediately on page load so Render's cold-start (up to 30s) is
// absorbed in the background while the user reads the splash screen.
function warmUpBackend() {
  let attempt = 0;
  const MAX = 3;

  function ping() {
    if (attempt >= MAX) return;
    attempt++;

    API.get("/health", { timeout: 20000 })
      .then(() => console.log(`✅ Backend warm (attempt ${attempt})`))
      .catch(() => {
        // Backend still sleeping — retry after 15s
        if (attempt < MAX) setTimeout(ping, 15000);
      });
  }

  ping();
}

function App() {
  useEffect(() => {
    warmUpBackend();
  }, []);

  return (
    <AuthProvider>
      <AppRoutes />
      <IOSInstallBanner />
    </AuthProvider>
  );
}

export default App;
