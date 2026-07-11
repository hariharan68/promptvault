import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { Sun, Moon } from "@phosphor-icons/react";
import { changePassword, deleteAccount, exportAccount, revokeAllSessions } from "../api/productApi.js";

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const { logout } = useAuth();
  const [passwords, setPasswords] = useState({ current_password: "", new_password: "" });
  const [message, setMessage] = useState("");

  async function handlePassword(e) {
    e.preventDefault();
    await changePassword(passwords);
    setPasswords({ current_password: "", new_password: "" });
    setMessage("Password changed. Other sessions were signed out.");
  }

  async function handleAccountExport() {
    const result = await exportAccount();
    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "promptnest-account.json"; link.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8">

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#714B67] dark:text-[#C4A0BA] mb-1">Preferences</p>
        <h1 className="font-serif text-3xl text-[#111827] dark:text-[#F1F2F6]">Settings</h1>
        <p className="text-sm text-[#6B7280] mt-1">Manage your account and preferences.</p>
      </div>

      {/* Appearance */}
      <section className="bg-white dark:bg-[#252733] border border-[#E5E7EB] dark:border-[#363847] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB] dark:border-[#363847]">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[#374151] dark:text-[#9CA3AF]">Appearance</h2>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-medium text-[#111827] dark:text-[#F1F2F6]">Theme</p>
              <p className="text-xs text-[#6B7280] mt-0.5">Choose between light and dark interface</p>
            </div>
            <div className="flex items-center gap-1 p-1
              bg-[#F3F4F6] dark:bg-[#2C2E3A] border border-[#E5E7EB] dark:border-[#363847] rounded-full">
              <button
                onClick={() => theme !== "light" && toggle()}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium
                  transition-all duration-200 ${
                  theme === "light"
                    ? "bg-white dark:bg-[#252733] text-[#111827] dark:text-[#F1F2F6] shadow-[0_1px_3px_rgba(17,24,39,0.1)]"
                    : "text-[#6B7280] hover:text-[#111827] dark:hover:text-[#F1F2F6]"
                }`}
              >
                <Sun size={14} weight={theme === "light" ? "fill" : "regular"} /> Light
              </button>
              <button
                onClick={() => theme !== "dark" && toggle()}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium
                  transition-all duration-200 ${
                  theme === "dark"
                    ? "bg-[#252733] text-[#F1F2F6] shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
                    : "text-[#6B7280] hover:text-[#111827] dark:hover:text-[#F1F2F6]"
                }`}
              >
                <Moon size={14} weight={theme === "dark" ? "fill" : "regular"} /> Dark
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Account */}
      <section className="bg-white dark:bg-[#252733] border border-[#E5E7EB] dark:border-[#363847] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB] dark:border-[#363847]">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[#374151] dark:text-[#9CA3AF]">Account</h2>
        </div>
        <div className="px-6 py-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#F3EEF3] dark:bg-[#3D2B3A]
            flex items-center justify-center text-sm font-bold text-[#714B67] dark:text-[#C4A0BA] flex-shrink-0">
            {user?.username?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#111827] dark:text-[#F1F2F6]">{user?.username}</p>
            <p className="text-xs text-[#6B7280] mt-0.5">{user?.email ?? "Personal workspace"}</p>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="bg-white dark:bg-[#252733] border border-[#E5E7EB] dark:border-[#363847] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB] dark:border-[#363847]"><h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[#374151] dark:text-[#9CA3AF]">Security & data</h2></div>
        <div className="px-6 py-5 flex flex-col gap-4">
          {user?.has_password ? (
            <form onSubmit={handlePassword} className="flex flex-col gap-2">
              <input type="password" placeholder="Current password" value={passwords.current_password} onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })} className="rounded-lg border border-[#E5E7EB] dark:border-[#363847] bg-[#F3F4F6] dark:bg-[#2C2E3A] px-3 py-2 text-sm" required />
              <input type="password" placeholder="New password" value={passwords.new_password} onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })} className="rounded-lg border border-[#E5E7EB] dark:border-[#363847] bg-[#F3F4F6] dark:bg-[#2C2E3A] px-3 py-2 text-sm" required />
              <button className="self-start rounded-full bg-[#714B67] px-4 py-2 text-xs font-medium text-white">Change password</button>
            </form>
          ) : (
            <p className="text-xs leading-relaxed text-[#6B7280] dark:text-[#A5A8B8]">
              This account uses Google or GitHub sign-in and does not have a password.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button onClick={handleAccountExport} className="rounded-full border border-[#E5E7EB] dark:border-[#363847] px-4 py-2 text-xs font-medium">Export account data</button>
            <button onClick={() => revokeAllSessions()} className="rounded-full border border-[#E5E7EB] dark:border-[#363847] px-4 py-2 text-xs font-medium">Sign out other sessions</button>
            <button onClick={async () => { if (window.confirm("Delete your account and all prompts?")) { await deleteAccount(); logout(); } }} className="rounded-full border border-red-200 px-4 py-2 text-xs font-medium text-red-500">Delete account</button>
          </div>
          {message && <p className="text-xs text-emerald-600">{message}</p>}
        </div>
      </section>

      {/* About */}
      <section className="bg-white dark:bg-[#252733] border border-[#E5E7EB] dark:border-[#363847] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB] dark:border-[#363847]">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[#374151] dark:text-[#9CA3AF]">About</h2>
        </div>
        <div className="px-6 py-5 flex flex-col gap-3.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#6B7280]">Application</span>
            <span className="text-[#111827] dark:text-[#F1F2F6] font-medium font-serif">PromptNest</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#6B7280]">Stack</span>
            <span className="text-[#111827] dark:text-[#F1F2F6] font-medium">React + FastAPI</span>
          </div>
        </div>
      </section>
    </div>
  );
}
