import React from "react";
import { Navigate } from "react-router-dom";
import { canAccess } from "../auth/permissions";

const ProtectedRoute = ({ isLoggedIn, permissions = [], requireAll = false, children }) => {
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!canAccess(permissions, requireAll)) return <Navigate to="/unauthorized" replace />;
  return children;
};

export default ProtectedRoute;
