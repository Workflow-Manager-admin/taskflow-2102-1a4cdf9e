import React, { useState } from "react";
import { useAuth } from "../auth";

// PUBLIC_INTERFACE
export default function AuthPage() {
  const { login, register, loading, error, setError } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch { /* error shown in error */ }
  }
  return (
    <div className="auth-box">
      <h2>{mode === "login" ? "Login" : "Sign Up"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          className="input"
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
        />
        <input
          className="input"
          required
          type="password"
          placeholder="Password"
          value={password}
          onChange={e=>setPassword(e.target.value)}
        />
        {error && <div className="err" role="alert">{error}</div>}
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Authenticating..." : mode === "login" ? "Login" : "Register"}
        </button>
      </form>
      <button className="btn-link" onClick={()=>setMode(mode==="login"?"register":"login")}>
        {mode === "login" ? "No account? Sign up" : "Already registered? Log in"}
      </button>
    </div>
  );
}
