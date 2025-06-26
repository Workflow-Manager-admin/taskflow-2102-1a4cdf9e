import React, { createContext, useContext, useState } from "react";
import { apiRequest, setToken as setStoredToken } from "./api";

// Auth context for easy consumption
const AuthContext = createContext(null);

export function AuthProvider({children}) {
  const [user, setUser] = useState(() =>
    localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user")) : null
  );
  const [token, setTokenState] = useState(localStorage.getItem("token") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // PUBLIC_INTERFACE
  async function login(email, password) {
    setLoading(true); setError(null);
    try {
      const data = await apiRequest("/auth/login", {method:"POST", body:{email, password}});
      setUser(data.user);
      setTokenState(data.token);
      setStoredToken(data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      return data;
    } catch(e) { setError(e.message); throw e; }
    finally { setLoading(false); }
  }
  // PUBLIC_INTERFACE
  async function register(email, password) {
    setLoading(true); setError(null);
    try {
      const data = await apiRequest("/auth/register", {method:"POST", body:{email, password}});
      setUser(data.user);
      setTokenState(data.token);
      setStoredToken(data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      return data;
    } catch(e) { setError(e.message); throw e; }
    finally { setLoading(false); }
  }
  // PUBLIC_INTERFACE
  function logout() {
    setTokenState("");
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  const value = {user, token, login, register, logout, loading, error, setError};
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext);
}
