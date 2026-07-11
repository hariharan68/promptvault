import axios from "axios";

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
  const token = localStorage.getItem("access_token");
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
      return refreshSession().then(({ data }) => {
        localStorage.setItem("access_token", data.access_token);
        error.config.headers.Authorization = `Bearer ${data.access_token}`;
        return client(error.config);
      }).catch((refreshError) => {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      });
    }
    return Promise.reject(error);
  }
);

export default client;
