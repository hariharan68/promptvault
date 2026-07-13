import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "pn-marketing-theme";
const MarketingThemeContext = createContext(null);

export function MarketingThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem(STORAGE_KEY) ?? "dark";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  return (
    <MarketingThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </MarketingThemeContext.Provider>
  );
}

export function useMarketingTheme() {
  const context = useContext(MarketingThemeContext);

  if (!context) {
    throw new Error("useMarketingTheme must be used within MarketingThemeProvider");
  }

  return context;
}
