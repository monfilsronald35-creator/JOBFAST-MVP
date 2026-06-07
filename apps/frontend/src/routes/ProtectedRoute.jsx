import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "./Loader";

function ProtectedRoute({
  children,
  fallback,
  redirectTo = "/login",
  replace = true,
}) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loader text="Ap tcheke sesyon w..." showProgress={false} />;
  }

  if (!isAuthenticated) {
    return fallback ?? <Navigate to={redirectTo} replace={replace} />;
  }

  return children || null;
}

export default ProtectedRoute;
