import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { List, GearSix, Sun, Moon, SignOut, CaretDown } from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/prompts": "Prompts",
  "/groups": "Groups",
  "/settings": "Settings",
};

export default function Navbar({ onMenuOpen }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const title = PAGE_TITLES[pathname] ?? "PromptVault";
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
    navigate("/login");
  }

  return (
    <header className="h-16 flex items-center justify-between px-5 md:px-7
      bg-white dark:bg-[#161923] border-b border-[#eaecf3] dark:border-[#252838] flex-shrink-0">

      {/* Mobile: hamburger + logo */}
      <div className="flex items-center gap-3 md:hidden">
        <button
          onClick={onMenuOpen}
          className="w-9 h-9 flex items-center justify-center rounded-lg
            text-[#868da3] dark:text-[#737a95] hover:text-[#232735] dark:hover:text-[#e4e6f0]
            hover:bg-[#f4f6fb] dark:hover:bg-[#1a1d2a] transition-colors"
        >
          <List size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-[#6c63ff] to-[#8b83ff] rounded-md flex items-center justify-center">
            <span className="text-white font-black text-xs">V</span>
          </div>
          <span className="font-bold text-[#232735] dark:text-[#e4e6f0] text-base">PromptVault</span>
        </div>
      </div>

      {/* Desktop: page title */}
      <h1 className="hidden md:block text-base font-semibold text-[#232735] dark:text-[#e4e6f0] tracking-tight">
        {title}
      </h1>

      {/* Right side */}
      <div className="flex items-center gap-1.5">

        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="w-9 h-9 flex items-center justify-center rounded-lg
            text-[#868da3] dark:text-[#737a95] hover:text-[#232735] dark:hover:text-[#e4e6f0]
            hover:bg-[#f4f6fb] dark:hover:bg-[#1a1d2a] transition-colors"
        >
          {theme === "dark"
            ? <Sun size={18} weight="regular" />
            : <Moon size={18} weight="regular" />}
        </button>

        {/* Settings */}
        <button
          onClick={() => navigate("/settings")}
          title="Settings"
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors
            ${pathname === "/settings"
              ? "bg-[#6c63ff]/10 text-[#6c63ff]"
              : "text-[#868da3] dark:text-[#737a95] hover:text-[#232735] dark:hover:text-[#e4e6f0] hover:bg-[#f4f6fb] dark:hover:bg-[#1a1d2a]"
            }`}
        >
          <GearSix size={18} weight={pathname === "/settings" ? "fill" : "regular"} />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-[#eaecf3] dark:bg-[#252838] mx-1" />

        {/* User avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-lg
              hover:bg-[#f4f6fb] dark:hover:bg-[#1a1d2a] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6c63ff] to-[#8b83ff]
              flex items-center justify-center text-sm font-bold text-white flex-shrink-0
              shadow-[0_3px_8px_-2px_rgba(108,99,255,0.45)]">
              {avatarLetter}
            </div>
            <span className="hidden md:block text-sm font-medium text-[#4b5169] dark:text-[#b0b6cc] max-w-[6rem] truncate">
              {user?.username}
            </span>
            <CaretDown
              size={12}
              weight="bold"
              className={`hidden md:block text-[#aeb4c6] dark:text-[#525872] transition-transform duration-150 ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] w-48
              bg-white dark:bg-[#1c1f2e] border border-[#eaecf3] dark:border-[#252838]
              rounded-xl shadow-[0_12px_32px_-8px_rgba(30,34,52,0.18)] z-50 py-1.5 overflow-hidden animate-in">
              <div className="px-4 py-3 border-b border-[#f0f1f6] dark:border-[#252838] mb-1">
                <p className="text-sm font-semibold text-[#232735] dark:text-[#e4e6f0] truncate">{user?.username}</p>
                <p className="text-xs text-[#aeb4c6] dark:text-[#525872] mt-0.5">Signed in</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm
                  text-[#868da3] dark:text-[#737a95] hover:text-red-500 hover:bg-red-500/6 transition-all"
              >
                <SignOut size={15} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
