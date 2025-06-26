import React from "react";
import { useAuth } from "./auth";
import Dashboard from "./components/Dashboard";
import AuthPage from "./components/AuthPage";

// Only two routes for now (can be expanded for more pages)
export default function Router() {
  const { user } = useAuth();
  return user ? <Dashboard /> : <AuthPage />;
}
