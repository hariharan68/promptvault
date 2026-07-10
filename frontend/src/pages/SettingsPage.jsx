import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { Sun, Moon } from "@phosphor-icons/react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8">

      <div>
        <h1 className="text-2xl font-bold text-[#232735] dark:text-[#e4e6f0]">Settings</h1>
        <p className="text-sm text-[#868da3] dark:text-[#737a95] mt-1">
          Manage your preferences and account settings.
        </p>
      </div>

      {/* Appearance */}
      <section className="bg-white dark:bg-[#161923] border border-[#eaecf3] dark:border-[#252838]
        rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(30,34,52,0.04)]">
        <div className="px-6 py-4 border-b border-[#eaecf3] dark:border-[#252838]">
          <h2 className="text-sm font-semibold text-[#232735] dark:text-[#e4e6f0]">Appearance</h2>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-medium text-[#232735] dark:text-[#e4e6f0]">Theme</p>
              <p className="text-xs text-[#868da3] dark:text-[#737a95] mt-0.5">
                Choose between light and dark interface
              </p>
            </div>
            <div className="flex items-center gap-1.5 p-1 bg-[#f4f6fb] dark:bg-[#0f1118]
              border border-[#e0e3ec] dark:border-[#252838] rounded-xl">
              <button
                onClick={() => theme !== "light" && toggle()}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200 ${
                  theme === "light"
                    ? "bg-white dark:bg-[#161923] text-[#232735] dark:text-[#e4e6f0] shadow-[0_1px_4px_rgba(30,34,52,0.12)]"
                    : "text-[#868da3] dark:text-[#737a95] hover:text-[#232735] dark:hover:text-[#e4e6f0]"
                }`}
              >
                <Sun size={15} weight={theme === "light" ? "fill" : "regular"} />
                Light
              </button>
              <button
                onClick={() => theme !== "dark" && toggle()}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200 ${
                  theme === "dark"
                    ? "bg-white dark:bg-[#1c1f2e] text-[#232735] dark:text-[#e4e6f0] shadow-[0_1px_4px_rgba(0,0,0,0.25)]"
                    : "text-[#868da3] dark:text-[#737a95] hover:text-[#232735] dark:hover:text-[#e4e6f0]"
                }`}
              >
                <Moon size={15} weight={theme === "dark" ? "fill" : "regular"} />
                Dark
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Account */}
      <section className="bg-white dark:bg-[#161923] border border-[#eaecf3] dark:border-[#252838]
        rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(30,34,52,0.04)]">
        <div className="px-6 py-4 border-b border-[#eaecf3] dark:border-[#252838]">
          <h2 className="text-sm font-semibold text-[#232735] dark:text-[#e4e6f0]">Account</h2>
        </div>
        <div className="px-6 py-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#6c63ff] to-[#8b83ff]
            flex items-center justify-center text-sm font-bold text-white flex-shrink-0
            shadow-[0_4px_10px_-3px_rgba(108,99,255,0.5)]">
            {user?.username?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#232735] dark:text-[#e4e6f0]">{user?.username}</p>
            <p className="text-xs text-[#868da3] dark:text-[#737a95] mt-0.5">
              {user?.email ?? "Personal workspace"}
            </p>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="bg-white dark:bg-[#161923] border border-[#eaecf3] dark:border-[#252838]
        rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(30,34,52,0.04)]">
        <div className="px-6 py-4 border-b border-[#eaecf3] dark:border-[#252838]">
          <h2 className="text-sm font-semibold text-[#232735] dark:text-[#e4e6f0]">About</h2>
        </div>
        <div className="px-6 py-5 flex flex-col gap-3.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#868da3] dark:text-[#737a95]">Application</span>
            <span className="text-[#232735] dark:text-[#e4e6f0] font-medium">PromptVault</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#868da3] dark:text-[#737a95]">Stack</span>
            <span className="text-[#232735] dark:text-[#e4e6f0] font-medium">React + FastAPI</span>
          </div>
        </div>
      </section>

    </div>
  );
}
