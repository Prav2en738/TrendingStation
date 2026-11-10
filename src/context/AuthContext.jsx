import { createContext, useContext, useState } from "react";
import { getSessionUser, clearSession } from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Demo auth: the session ({ id, name, role, isLoggedIn }) lives in localStorage, so the user
  // is restored synchronously on every page refresh. No server is involved.
  const [user, setUser] = useState(() => getSessionUser());

  // Login.jsx has already saved the session through api.login(); this just updates the app state.
  const login = (userData) => setUser(userData);

  // lets pages (e.g. checkout) refresh the saved phone / address
  const updateUser = (userData) => setUser(userData);

  const logout = () => {
    clearSession();
    setUser(null);
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === "ADMIN";

  return (
    <AuthContext.Provider
      value={{ user, loading: false, isAuthenticated, isAdmin, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
