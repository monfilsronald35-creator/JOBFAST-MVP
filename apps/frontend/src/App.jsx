import React from "react";
// 🔥 Enpòte AuthProvider
import { AuthProvider } from "./context/AuthContext"; 
// Enpòte AppRoutes nou te kreye anvan an
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <AuthProvider>
      {/* Tout navigasyon an ak sekirite paj yo (PrivateRoute) 
         kounye a jere nan AppRoutes.jsx 
      */}
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
