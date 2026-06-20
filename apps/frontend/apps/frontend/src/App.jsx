import React from "react";
import { AuthProvider } from "./context/AuthContext"; // ✨ Ti "c" nan context, gwo "A" nan AuthContext
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


