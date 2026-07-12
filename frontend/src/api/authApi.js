import client, { refreshSession } from "./client.js";
import { setToken, currentEpoch } from "./authState.js";

export const register = (data) => client.post("/auth/register", data);
export const login = (data) => client.post("/auth/login", data);
export const getMe = () => client.get("/auth/me");
// Shared, in-flight-deduped refresh — see client.js refreshSession().
export const refresh = () => refreshSession();
export const logout = () => client.post("/auth/logout");

export function oauthStartUrl(provider) {
  if (!["google", "github"].includes(provider)) {
    throw new Error("Unsupported OAuth provider");
  }
  const baseUrl = String(
    import.meta.env.VITE_OAUTH_API_BASE_URL
      || (import.meta.env.DEV ? "http://127.0.0.1:8000/api/v1" : client.defaults.baseURL)
      || "/api/v1",
  ).replace(/\/$/, "");
  // Carry the (non-sensitive) remember-me preference so the OAuth callback can pick
  // the matching server session policy.
  const remember = localStorage.getItem("remember_me_pref") === "true";
  const path = `${baseUrl}/auth/oauth/${provider}/start?remember_me=${remember}`;
  return /^https?:\/\//i.test(path) ? path : `${window.location.origin}${path.startsWith("/") ? "" : "/"}${path}`;
}

// Confirm a pending OAuth→password-account link by re-entering the password.
// The link_challenge cookie is sent automatically; on success a session is issued.
export const confirmOAuthLink = (password) => client.post("/auth/oauth/link/confirm", { password });

export function completeOAuthSession() {
  // refresh() is deduped at the client layer, so this is safe to call alongside
  // the AuthContext boot refresh without racing the rotating refresh token.
  return refresh().then(({ data }) => {
    setToken(data.access_token, currentEpoch());
    return getMe();
  });
}
