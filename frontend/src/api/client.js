import axios from "axios";
import { getToken, setToken, beginLogout, currentEpoch } from "./authState.js";

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;
if (import.meta.env.PROD && !configuredBaseUrl) {
  throw new Error("VITE_API_BASE_URL must be configured for production builds");
}

const client = axios.create({
  baseURL: configuredBaseUrl || "/api/v1",
  withCredentials: true,
});

let refreshPromise = null;

// Single in-flight refresh shared by every caller (interceptor, AuthContext boot,
// OAuth callback). Refresh tokens rotate on use, so concurrent refreshes would race
// and invalidate each other. Funnelling them through one promise prevents that.
export function refreshSession() {
  refreshPromise ??= client
    .post("/auth/refresh")
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? "";
    const isAuthEndpoint = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"].some((path) => url.includes(path));
    if (error.response?.status === 401 && !isAuthEndpoint && !error.config?._retry) {
      error.config._retry = true;
      // Capture the epoch before refreshing: if a logout races in, the write-back
      // is dropped by setToken and we don't resurrect the session.
      const epochAtStart = currentEpoch();
      return refreshSession().then(({ data }) => {
        setToken(data.access_token, epochAtStart);
        error.config.headers.Authorization = `Bearer ${data.access_token}`;
        return client(error.config);
      }).catch((refreshError) => {
        beginLogout();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      });
    }
    return Promise.reject(error);
  }
);

export default client;
