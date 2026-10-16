import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("hyco_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("hyco_token");
    if (!token) { setLoading(false); return; }

    api.get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem("hyco_user", JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem("hyco_token");
        localStorage.removeItem("hyco_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("hyco_token", res.data.token);
    localStorage.setItem("hyco_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem("hyco_token");
    localStorage.removeItem("hyco_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
