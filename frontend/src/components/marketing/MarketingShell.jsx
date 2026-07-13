import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { List, Lock, Moon, Sun, X } from "@phosphor-icons/react";
import Footer from "./Footer.jsx";
import { useMarketingTheme } from "../../context/MarketingThemeContext.jsx";

const NAV_ITEMS = [
  { to: "/features", label: "Features" },
  { to: "/cli", label: "CLI" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/pricing", label: "Pricing" },
  { to: "/docs", label: "Docs" },
];

function navClassName({ isActive }, isDark) {
  if (isDark) {
    return `text-[15px] transition-colors ${
      isActive ? "text-white" : "text-white/55 hover:text-white/90"
    }`;
  }

  return `text-[15px] transition-colors ${
    isActive ? "text-[#714B67]" : "text-[#6B7280] hover:text-[#111827]"
  }`;
}

export default function MarketingShell({ children, showFooter = true }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useMarketingTheme();
  const isDark = theme === "dark";
  const ThemeIcon = isDark ? Sun : Moon;
  const nextTheme = isDark ? "light" : "dark";

  const headerClass = isDark
    ? "border-white/6 bg-[#1A1B22]/96"
    : "border-[#E5E7EB] bg-white/96";
  const brandClass = isDark ? "text-white" : "text-[#111827]";
  const menuButtonClass = isDark
    ? "text-white/60 hover:text-white"
    : "text-[#6B7280] hover:text-[#111827]";
  const drawerClass = isDark
    ? "border-white/6 bg-[#1A1B22]"
    : "border-[#E5E7EB] bg-white";
  const mobileSignInClass = isDark
    ? "border-white/15 text-white/80"
    : "border-[#D1D5DB] text-[#374151]";

  return (
    <div className={`marketing-theme marketing-theme--${theme} min-h-screen overflow-x-hidden ${isDark ? "bg-[#12131A] text-[#F4F2F0]" : "bg-white text-[#111827]"}`}>
      <header className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur ${headerClass}`}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#714B67]">
              <Lock size={14} weight="bold" className="text-white" />
            </div>
            <span className={`font-serif text-lg tracking-tight ${brandClass}`}>PromptNest</span>
          </div>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Marketing navigation">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className={(state) => navClassName(state, isDark)}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${nextTheme} theme`}
              aria-pressed={isDark}
              title={`Switch to ${nextTheme} theme`}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#714B67] focus-visible:ring-offset-2 ${isDark ? "text-white/70 hover:bg-white/8 hover:text-white focus-visible:ring-offset-[#1A1B22]" : "text-[#6B7280] hover:bg-[#F3EEF3] hover:text-[#714B67] focus-visible:ring-offset-white"}`}
            >
              <ThemeIcon size={17} weight="bold" aria-hidden="true" />
            </button>
            <Link to="/login" className={`rounded-full px-4 py-2 text-sm transition-colors ${menuButtonClass}`}>
              Sign in
            </Link>
            <Link to="/register" className="rounded-full bg-[#714B67] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5A3A52] active:translate-y-px">
              Get started free
            </Link>
          </div>

          <div className="flex items-center gap-1 lg:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${nextTheme} theme`}
              aria-pressed={isDark}
              title={`Switch to ${nextTheme} theme`}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#714B67] focus-visible:ring-offset-2 ${isDark ? "text-white/70 hover:bg-white/8 hover:text-white focus-visible:ring-offset-[#1A1B22]" : "text-[#6B7280] hover:bg-[#F3EEF3] hover:text-[#714B67] focus-visible:ring-offset-white"}`}
            >
              <ThemeIcon size={17} weight="bold" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className={`flex h-9 w-9 items-center justify-center transition-colors ${menuButtonClass}`}
            >
              {menuOpen ? <X size={20} /> : <List size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className={`flex flex-col gap-4 border-t px-5 py-5 lg:hidden ${drawerClass}`} aria-label="Mobile marketing navigation">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className={(state) => navClassName(state, isDark)}>
                {item.label}
              </NavLink>
            ))}
            <div className="mt-1 flex flex-col gap-2.5 border-t border-white/8 pt-4">
              <Link to="/login" onClick={() => setMenuOpen(false)} className={`rounded-full border py-2.5 text-center text-sm font-medium ${mobileSignInClass}`}>
                Sign in
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="rounded-full bg-[#714B67] py-2.5 text-center text-sm font-medium text-white">
                Get started free
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main>{children}</main>

      {showFooter && <Footer />}
    </div>
  );
}
