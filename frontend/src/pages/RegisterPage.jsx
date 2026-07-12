import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Archive, FolderSimple, Star, Warning, Lock } from "@phosphor-icons/react";
import { register, login, getMe } from "../api/authApi.js";
import { useAuth } from "../context/AuthContext.jsx";
import Input from "../components/common/Input.jsx";
import OAuthButtons from "../components/auth/OAuthButtons.jsx";

const steps = [
  { Icon: Archive, label: "Build your prompt library" },
  { Icon: FolderSimple, label: "Group by project or use case" },
  { Icon: Star, label: "Favorite your best prompts" },
];

export default function RegisterPage() {
  const { setUser, saveToken } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(key, value) { setForm((prev) => ({ ...prev, [key]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      // Fresh signup: default to a persistent session so a new user isn't idled out.
      const loginRes = await login({ email: form.email, password: form.password, remember_me: true });
      saveToken(loginRes.data.access_token);
      const meRes = await getMe();
      setUser(meRes.data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex">

      {/* Left panel */}
      <div className="hidden lg:flex w-[46%] xl:w-[42%] flex-col justify-between p-12 relative overflow-hidden bg-[#252733]">
        <div className="absolute bottom-1/3 right-0 w-72 h-72 bg-[#714B67]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 left-0 w-48 h-48 bg-[#4FA8E0]/8 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-8 h-8 bg-[#714B67] rounded-lg flex items-center justify-center flex-shrink-0">
            <Lock size={15} className="text-white" weight="bold" />
          </div>
          <span className="font-serif text-[#F1F2F6] text-[17px] tracking-tight">PromptNest</span>
        </div>

        <div className="relative z-10">
          <h2 className="font-serif text-4xl leading-tight mb-4 text-[#F1F2F6]">
            Start building your<br />prompt library today
          </h2>
          <p className="text-[#9CA3AF] text-sm mb-10 leading-relaxed">
            Organize your best AI prompts.<br />
            Find and reuse them in seconds.
          </p>

          <div className="flex flex-col gap-4">
            {steps.map((s) => {
              const { Icon } = s;
              return (
                <div key={s.label} className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-[#714B67]/20 border border-[#714B67]/30
                    flex items-center justify-center text-[#C4A0BA] flex-shrink-0">
                    <Icon size={18} weight="regular" />
                  </div>
                  <span className="text-[#9CA3AF] text-sm">{s.label}</span>
                </div>
              );
            })}
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
            <h1 className="font-serif text-2xl text-[#111827] mb-1">Create account</h1>
            <p className="text-[#6B7280] text-sm">Start building your personal prompt library</p>
          </div>

          <div className="mb-4">
            <OAuthButtons />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Username" value={form.username} onChange={(e) => set("username", e.target.value)} placeholder="your_username" required />
            <Input label="Email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" required />
            <Input label="Password" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Min. 8 characters" required />

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
                  Creating account...
                </span>
              ) : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-[#6B7280] mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-[#714B67] hover:text-[#5A3A52] font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
