import React from "react";
import { AuthProvider } from "./Context/AuthContext"; // ✨ Nou mete gwo "C" nan Context!
import AppRoutes from "./routes/AppRoutes";
import "./styles/global.css";

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
