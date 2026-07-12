import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Check, Warning, Lock } from "@phosphor-icons/react";
import { login, getMe } from "../api/authApi.js";
import { useAuth } from "../context/AuthContext.jsx";
import Input from "../components/common/Input.jsx";
import OAuthButtons from "../components/auth/OAuthButtons.jsx";

const features = [
  "Save and search prompts across all your AI tools",
  "Organize by groups, tags, and favorites",
  "One-click copy with usage tracking",
  "URL-shareable filtered views",
];

export default function LoginPage() {
  const { setUser, saveToken } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  // The remember-me *preference* is non-sensitive, so it may persist locally; only
  // the tokens are kept out of storage. The server enforces the actual session policy.
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem("remember_me_pref") === "true");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(key, value) { setForm((prev) => ({ ...prev, [key]: value })); }

  function toggleRemember(checked) {
    setRememberMe(checked);
    localStorage.setItem("remember_me_pref", String(checked));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login({ ...form, remember_me: rememberMe });
      saveToken(res.data.access_token);
      const meRes = await getMe();
      setUser(meRes.data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail ?? "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex">

      {/* Left brand panel */}
      <div className="hidden lg:flex w-[46%] xl:w-[42%] flex-col justify-between p-12 relative overflow-hidden bg-[#252733]">
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-[#714B67]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-0 w-56 h-56 bg-[#4FA8E0]/8 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-8 h-8 bg-[#714B67] rounded-lg flex items-center justify-center flex-shrink-0">
            <Lock size={15} className="text-white" weight="bold" />
          </div>
          <span className="font-serif text-[#F1F2F6] text-[17px] tracking-tight">PromptNest</span>
        </div>

        <div className="relative z-10">
          <h2 className="font-serif text-4xl leading-tight mb-4 text-[#F1F2F6]">
            Your AI prompts,<br />kept safe.
          </h2>
          <p className="text-[#9CA3AF] text-sm mb-10 leading-relaxed">
            Stop losing your best prompts in chat history.<br />
            Build your personal library and reuse them instantly.
          </p>

          <div className="flex flex-col gap-3.5">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#714B67]/25 border border-[#714B67]/40 flex items-center justify-center flex-shrink-0">
                  <Check size={10} weight="bold" className="text-[#C4A0BA]" />
                </div>
                <span className="text-[#9CA3AF] text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-[#4A4D60] text-xs font-mono">promptnest.app</div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 bg-white">
        <div className="w-full max-w-[360px]">

          <div className="flex lg:hidden items-center justify-center gap-2.5 mb-10">
            <div className="w-8 h-8 bg-[#714B67] rounded-lg flex items-center justify-center">
              <Lock size={15} className="text-white" weight="bold" />
            </div>
            <span className="font-serif text-[#111827] text-lg">PromptNest</span>
          </div>

          <Link to="/"
            className="inline-flex items-center gap-1 text-xs text-[#9CA3AF]
              hover:text-[#714B67] mb-6 transition-colors">
            ← Back to home
          </Link>

          <div className="mb-8">
            <h1 className="font-serif text-2xl text-[#111827] mb-1">Welcome back</h1>
            <p className="text-[#6B7280] text-sm">Sign in to your prompt library</p>
          </div>

          <div className="mb-4">
            <OAuthButtons />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" required />
            <Input label="Password" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••••" required />

            <label className="flex items-center gap-2.5 text-sm text-[#6B7280] cursor-pointer select-none -mt-1">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => toggleRemember(e.target.checked)}
                className="w-4 h-4 rounded border-[#D1D5DB] text-[#714B67] focus:ring-[#714B67]/30 cursor-pointer"
              />
              Keep me signed in
            </label>

            {error && (
              <div className="flex items-center gap-2.5 text-sm text-red-500 bg-red-500/6 border border-red-500/20 rounded-xl px-3.5 py-2.5">
                <Warning size={15} weight="fill" className="flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-full bg-[#714B67] hover:bg-[#5A3A52] text-white text-sm font-medium
                mt-1 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
                shadow-[0_4px_14px_-4px_rgba(113,75,103,0.4)]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-[#6B7280] mt-6">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-[#714B67] hover:text-[#5A3A52] font-semibold transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
