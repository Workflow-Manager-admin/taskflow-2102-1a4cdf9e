//
// API Utilities for Task Tracker Frontend
//
// PUBLIC_INTERFACE
// Handles API requests with JWT authentication/refresh logic.
//
const API_URL = "http://localhost:3001";

export async function apiRequest(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  if (!res.ok) {
    let msg;
    try { 
      msg = await res.text();
    } catch { msg = res.statusText; }
    throw new Error(msg);
  }
  return await res.json();
}
// PUBLIC_INTERFACE
export function getToken() {
  return localStorage.getItem("token");
}
// PUBLIC_INTERFACE
export function setToken(token) {
  localStorage.setItem("token", token);
}
