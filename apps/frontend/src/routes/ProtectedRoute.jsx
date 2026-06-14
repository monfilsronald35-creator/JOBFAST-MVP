import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";

function ProtectedRoute({ children, redirectTo = "/login", replace = true }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loader text="Ap tcheke sesyon w..." showProgress={false} />;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace={replace} />;
  }

  return children;
}

export default ProtectedRoute;