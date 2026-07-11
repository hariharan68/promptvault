import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { List, GearSix, Sun, Moon, SignOut, CaretDown, Lock, MagnifyingGlass } from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/prompts": "Prompts",
  "/groups": "Groups",
  "/settings": "Settings",
};

export default function Navbar({ onMenuOpen, onOpenPalette }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const title = PAGE_TITLES[pathname] ?? "PromptNest";
  const avatarLetter = user?.username?.[0]?.toUpperCase() ?? "U";

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="h-14 flex items-center justify-between px-5 md:px-6
      bg-white/90 dark:bg-[#1A1B22]/90 border-b border-[#E5E7EB] dark:border-[#363847]
      backdrop-blur flex-shrink-0">

      {/* Mobile: hamburger + logo */}
      <div className="flex items-center gap-3 md:hidden">
        <button
          onClick={onMenuOpen}
          className="w-8 h-8 flex items-center justify-center rounded-full
            text-[#6B7280] hover:text-[#111827] dark:hover:text-[#F1F2F6]
            hover:bg-[#F3F4F6] dark:hover:bg-[#2C2E3A] transition-colors"
        >
          <List size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#714B67] rounded-md flex items-center justify-center">
            <Lock size={14} className="text-white" weight="bold" />
          </div>
          <span className="font-serif text-[#111827] dark:text-[#F1F2F6] text-base tracking-tight">PromptNest</span>
        </div>
      </div>

      {/* Desktop: page title */}
      <p className="hidden md:block text-[13px] font-semibold uppercase tracking-[0.1em] text-[#9CA3AF] dark:text-[#6B7280]">
        {title}
      </p>

      {/* Search trigger (desktop) */}
      <button
        onClick={onOpenPalette}
        className="hidden md:flex items-center gap-2.5 px-3 py-1.5
          bg-[#F3F4F6] dark:bg-[#2C2E3A] border border-[#E5E7EB] dark:border-[#363847]
          rounded-full text-xs text-[#9CA3AF] hover:border-[#714B67]/40 hover:text-[#6B7280]
          transition-all duration-200 cursor-pointer"
      >
        <MagnifyingGlass size={13} />
        <span>Search…</span>
        <kbd className="ml-1 text-[10px] font-mono bg-white dark:bg-[#252733]
          border border-[#E5E7EB] dark:border-[#363847] rounded px-1 py-0.5 text-[#ADB5BD]">
          ⌘K
        </kbd>
      </button>

      {/* Right side */}
      <div className="flex items-center gap-1">

        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          title={theme === "dark" ? "Switch to light" : "Switch to dark"}
          className="w-8 h-8 flex items-center justify-center rounded-full
            text-[#6B7280] dark:text-[#6B7280] hover:text-[#111827] dark:hover:text-[#F1F2F6]
            hover:bg-[#F3F4F6] dark:hover:bg-[#2C2E3A] transition-colors"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Settings */}
        <button
          onClick={() => navigate("/settings")}
          title="Settings"
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors
            ${pathname === "/settings"
              ? "bg-[#F3EEF3] dark:bg-[#3D2B3A] text-[#714B67] dark:text-[#C4A0BA]"
              : "text-[#6B7280] dark:text-[#6B7280] hover:text-[#111827] dark:hover:text-[#F1F2F6] hover:bg-[#F3F4F6] dark:hover:bg-[#2C2E3A]"
            }`}
        >
          <GearSix size={16} weight={pathname === "/settings" ? "fill" : "regular"} />
        </button>

        {/* Divider */}
        <div className="w-px h-4 bg-[#E5E7EB] dark:bg-[#363847] mx-1.5" />

        {/* User avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full
              hover:bg-[#F3F4F6] dark:hover:bg-[#2C2E3A] transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[#F3EEF3] dark:bg-[#3D2B3A]
              flex items-center justify-center text-xs font-bold text-[#714B67] dark:text-[#C4A0BA] flex-shrink-0">
              {avatarLetter}
            </div>
            <span className="hidden md:block text-sm font-medium text-[#374151] dark:text-[#9CA3AF] max-w-[6rem] truncate">
              {user?.username}
            </span>
            <CaretDown
              size={11}
              weight="bold"
              className={`hidden md:block text-[#9CA3AF] dark:text-[#6B7280] transition-transform duration-150 ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] w-48
              bg-white dark:bg-[#252733] border border-[#E5E7EB] dark:border-[#363847]
              rounded-xl shadow-[0_12px_32px_-8px_rgba(17,24,39,0.15)] z-50 py-1.5 overflow-hidden animate-in">
              <div className="px-4 py-3 border-b border-[#E5E7EB] dark:border-[#363847] mb-1">
                <p className="text-sm font-semibold text-[#111827] dark:text-[#F1F2F6] truncate">{user?.username}</p>
                <p className="text-xs text-[#9CA3AF] dark:text-[#6B7280] mt-0.5">Signed in</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm
                  text-[#6B7280] dark:text-[#6B7280] hover:text-red-500 hover:bg-red-500/6 transition-all"
              >
                <SignOut size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
