import React from "react";
import { AuthProvider } from "./context/AuthContext"; 
import AppRoutes from "./routes/AppRoutes";
import "./styles/master.css"; 

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
