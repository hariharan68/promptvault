import { createContext, useContext, useEffect, useState } from "react";
import { getMe, logout as logoutApi, refresh } from "../api/authApi.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const session = token
      ? getMe()
      : refresh().then(({ data }) => {
          localStorage.setItem("access_token", data.access_token);
          return getMe();
        });
    session
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem("access_token"))
      .finally(() => setLoading(false));
  }, []);

  function saveToken(token) {
    localStorage.setItem("access_token", token);
  }

  function logout() {
    logoutApi().catch(() => {});
    localStorage.removeItem("access_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, saveToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
