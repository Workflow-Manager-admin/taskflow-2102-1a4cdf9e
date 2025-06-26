import React from "react";
import "./App.css";
import { AuthProvider } from "./auth";
import Router from "./Router";

// PUBLIC_INTERFACE
function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}

export default App;
