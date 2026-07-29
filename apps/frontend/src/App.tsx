import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import IOSInstallBanner from "./components/IOSInstallBanner";
import "./styles/global.css";
import API from "./api/axios";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:  1000 * 60 * 5,   // 5 min
      gcTime:     1000 * 60 * 10,  // 10 min
      retry:      1,
      refetchOnWindowFocus: false,
    },
  },
});

// Ping /health until the backend responds or we give up after 3 attempts.
// This runs immediately on page load so Render's cold-start (up to 30s) is
// absorbed in the background while the user reads the splash screen.
function warmUpBackend(): void {
  let attempt = 0;
  const MAX = 3;

  function ping(): void {
    if (attempt >= MAX) return;
    attempt++;

    API.get<unknown>("/health", { timeout: 20000 })
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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
        <IOSInstallBanner />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;