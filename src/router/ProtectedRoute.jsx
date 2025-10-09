// src/router/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function ProtectedRoute() {
  const { isAuth } = useAuth();
  // Si no hay sesión -> al login
  if (!isAuth) return <Navigate to="/login" replace />;
  return <Outlet />;
}
