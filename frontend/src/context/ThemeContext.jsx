import { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const ThemeContext = createContext(null);
const MARKETING_PATHS = new Set(["/", "/features", "/cli", "/docs", "/how-it-works", "/pricing"]);

export function ThemeProvider({ children }) {
  const location = useLocation();
  const [theme, setTheme] = useState(
    () => localStorage.getItem("pv-theme") ?? "light"
  );

  useEffect(() => {
    const isMarketingRoute = MARKETING_PATHS.has(location.pathname);
    document.documentElement.classList.toggle("dark", !isMarketingRoute && theme === "dark");
    localStorage.setItem("pv-theme", theme);
  }, [location.pathname, theme]);

  function toggle() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
