import client, { refreshSession } from "./client.js";

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
      || (import.meta.env.DEV ? "http://127.0.0.1:8002/api/v1" : client.defaults.baseURL)
      || "/api/v1",
  ).replace(/\/$/, "");
  const path = `${baseUrl}/auth/oauth/${provider}/start`;
  return /^https?:\/\//i.test(path) ? path : `${window.location.origin}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function completeOAuthSession() {
  // refresh() is deduped at the client layer, so this is safe to call alongside
  // the AuthContext boot refresh without racing the rotating refresh token.
  return refresh().then(({ data }) => {
    localStorage.setItem("access_token", data.access_token);
    return getMe();
  });
}
