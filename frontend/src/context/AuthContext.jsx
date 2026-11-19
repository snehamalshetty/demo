import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const reset = () => {
      setUser(null);
      setLoading(false);
    };
    window.addEventListener("campus:unauthorized", reset);
    if (!localStorage.getItem("campus-token")) {
      setLoading(false);
    } else {
      api.get("/auth/me")
        .then(({ data }) => setUser(data.user))
        .catch(() => localStorage.removeItem("campus-token"))
        .finally(() => setLoading(false));
    }
    return () => window.removeEventListener("campus:unauthorized", reset);
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    async login(credentials) {
      const { data } = await api.post("/auth/login", credentials);
      localStorage.setItem("campus-token", data.token);
      setUser(data.user);
      return data.user;
    },
    async register(values) {
      const { data } = await api.post("/auth/register", values);
      localStorage.setItem("campus-token", data.token);
      setUser(data.user);
      return data.user;
    },
    async logout() {
      try { await api.post("/auth/logout"); } finally {
        localStorage.removeItem("campus-token");
        setUser(null);
      }
    },
    updateUser(nextUser) { setUser(nextUser); }
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
