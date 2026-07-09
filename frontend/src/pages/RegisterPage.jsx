import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register, login, getMe } from "../api/authApi.js";
import { useAuth } from "../context/AuthContext.jsx";
import Input from "../components/common/Input.jsx";
import Button from "../components/common/Button.jsx";

function BrandLogo() {
  return (
    <div className="w-8 h-8 bg-gradient-to-br from-[#6c63ff] to-[#8b83ff] rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_6px_16px_-4px_rgba(108,99,255,0.5)]">
      <span className="text-white font-black text-sm">V</span>
    </div>
  );
}

const steps = [
  { icon: "◈", label: "Build your prompt library" },
  { icon: "⊞", label: "Group by project or use case" },
  { icon: "★", label: "Favorite your best prompts" },
];

export default function RegisterPage() {
  const { setUser, saveToken } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      const loginRes = await login({ email: form.email, password: form.password });
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
    <div className="min-h-screen bg-[#f4f6fb] flex">

      {/* ── Left panel (desktop) ── */}
      <div className="hidden lg:flex w-[46%] xl:w-[42%] flex-col justify-between p-12 relative overflow-hidden
        bg-gradient-to-br from-[#6c63ff] to-[#8b83ff]">

        <div className="absolute bottom-1/3 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 left-0 w-56 h-56 bg-white/8 rounded-full blur-2xl pointer-events-none" />

        {/* Brand */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-sm">V</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">PromptVault</span>
        </div>

        {/* Middle */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 border border-white/25 rounded-full mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-white text-xs font-medium">Free to get started</span>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-4 text-white">
            Start building your
            <br />
            prompt library today
          </h2>
          <p className="text-white/80 text-base mb-10 leading-relaxed">
            Join thousands of AI power users who organize
            <br />
            their prompts with PromptVault.
          </p>

          <div className="flex flex-col gap-4">
            {steps.map((s) => (
              <div key={s.label} className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/25
                  flex items-center justify-center text-white flex-shrink-0">
                  {s.icon}
                </div>
                <span className="text-white/85 text-sm">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/60 text-xs font-medium">
          PromptVault v1.0 · Personal Edition
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-[360px]">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-2.5 mb-10">
            <BrandLogo />
            <span className="text-[#232735] font-bold text-lg">PromptVault</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#232735] mb-1">Create account</h1>
            <p className="text-[#868da3] text-sm">Start building your personal prompt library</p>
          </div>

          <div className="bg-white border border-[#eaecf3] rounded-2xl p-6
            shadow-[0_10px_40px_-15px_rgba(30,34,52,0.15)]">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Username"
                value={form.username}
                onChange={(e) => set("username", e.target.value)}
                placeholder="your_username"
                required
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@example.com"
                required
              />
              <Input
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Min. 8 characters"
                required
              />

              {error && (
                <div className="flex items-center gap-2.5 text-sm text-red-500
                  bg-red-500/6 border border-red-500/20 rounded-xl px-3.5 py-2.5">
                  <span className="flex-shrink-0">⚠</span>
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full justify-center mt-1" size="lg">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : "Create Account"}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-[#868da3] mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-[#6c63ff] hover:text-[#5a52e0] font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
