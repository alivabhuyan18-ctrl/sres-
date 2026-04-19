import { createContext, useContext, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("sres_token"));
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("sres_user") || "null"));

  const persistSession = (data) => {
    localStorage.setItem("sres_token", data.token);
    localStorage.setItem("sres_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const login = async (payload) => {
    const { data } = await api.post("/auth/login", payload);
    persistSession(data);
    toast.success(`Welcome, ${data.user.name}`);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    persistSession(data);
    toast.success(`Account created for ${data.user.name}`);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("sres_token");
    localStorage.removeItem("sres_user");
    setToken(null);
    setUser(null);
    toast("Signed out");
  };

  const value = useMemo(() => ({ token, user, isAuthenticated: Boolean(token), login, register, logout }), [token, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
