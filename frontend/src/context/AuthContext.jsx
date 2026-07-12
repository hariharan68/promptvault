import { createContext, useContext, useEffect, useState } from "react";
import { getMe, logout as logoutApi, refresh } from "../api/authApi.js";
import { setToken, beginLogout, currentEpoch } from "../api/authState.js";
import { useToast } from "../components/common/Toast.jsx";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    // The access token lives in memory only, so a cold load always has nothing.
    // Ask the server to resume from the httpOnly refresh cookie; a 401 just means
    // "not signed in" and the app falls through to the login/landing page.
    refresh()
      .then(({ data }) => {
        setToken(data.access_token, currentEpoch());
        return getMe();
      })
      .then((res) => setUser(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function saveToken(token) {
    setToken(token, currentEpoch());
  }

  async function logout() {
    // Local-first: the UI is signed out immediately and the epoch bump prevents any
    // in-flight refresh from restoring the session. The server call is best-effort.
    beginLogout();
    setUser(null);
    try {
      await logoutApi();
    } catch {
      toast?.info(
        "Signed out on this device, but couldn't reach the server. If this device is shared, use \"Sign out other sessions\" from another session.",
      );
    }
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
