
import { useAuth } from "./contexts/authContext";
import { Navigate } from "react-router-dom";
import React from "react";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { currentUser, loading } = useAuth();
  console.log("ProtectedRoute:", { currentUser, loading });
  if (loading) return null; 
  return currentUser ? <>{children}</> : <Navigate to="/signin" replace />;
};

export default ProtectedRoute;