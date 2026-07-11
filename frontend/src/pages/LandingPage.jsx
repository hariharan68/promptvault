import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Lock,
  MagnifyingGlass,
  Star,
  ArrowRight,
  Check,
  List,
  X,
  FolderSimple,
  ClockCounterClockwise,
  BracketsCurly,
  ChartBar,
  DownloadSimple,
  Lightning,
  Robot,
  Code,
  ArrowsClockwise,
  ChatTeardrop,
} from "@phosphor-icons/react";

/* ─── Mock data for hero UI preview ──────────────────────────────────────── */
const MOCK_PROMPTS = [
  {
    id: 1,
    title: "GPT-4 Code Review Expert",
    preview: "Act as a senior software engineer. Review the following code for bugs, performance issues, and best practices...",
    tags: ["code", "python"],
    favorite: true,
    group: "Dev Tools",
  },
  {
    id: 2,
    title: "LangChain Agent System",
    preview: "You are an autonomous AI agent. Always reason step-by-step before acting. Use the available tools only when necessary...",
    tags: ["agents", "llm"],
    favorite: true,
    group: "AI Agents",
  },
  {
    id: 3,
    title: "Claude Response Evaluator",
    preview: "Evaluate the following AI response on: accuracy (1–5), helpfulness (1–5), and hallucination risk (low/med/high)...",
    tags: ["eval", "testing"],
    favorite: false,
    group: "Evaluation",
  },
];

/* ─── Features ────────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    Icon: Lightning,
    title: "Instant ⌘K search",
    desc: "Full-text search across every prompt in milliseconds. Filter by tag, group, or favourite.",
  },
  {
    Icon: ClockCounterClockwise,
    title: "Version history",
    desc: "Every edit tracked automatically. Roll back to any previous version with one click.",
  },
  {
    Icon: BracketsCurly,
    title: "Template variables",
    desc: "Build reusable prompts with {{variable}} placeholders. Fill context before copying.",
  },
  {
    Icon: ChartBar,
    title: "Usage analytics",
    desc: "usage_count updates on every copy. Discover which prompts you actually reach for most.",
  },
  {
    Icon: FolderSimple,
    title: "Groups & tags",
    desc: "Organise by project, model, or workflow stage. Unlimited groups, unlimited tags.",
  },
  {
    Icon: DownloadSimple,
    title: "Import / export",
    desc: "Portable JSON format. Import from ChatGPT or Claude exports. Your prompts, your data.",
  },
];

/* ─── Use cases ───────────────────────────────────────────────────────────── */
const USE_CASES = [
  {
    Icon: Robot,
    badge: "Agent development",
    title: "Version your system prompts like code",
    body: "Keep agent system prompts, tool descriptions, and chain templates searchable and versioned. Roll back when behavior changes unexpectedly — no more diffing chat history.",
    stack: ["LangChain", "CrewAI", "AutoGen"],
  },
  {
    Icon: Lightning,
    badge: "Prompt engineering",
    title: "Iterate fast, track what works",
    body: "Save every variation you try. Version history shows exactly what changed between iterations. Usage counts reveal which rewrites actually stuck.",
    stack: ["GPT-4o", "Claude 3.5", "Gemini"],
  },
  {
    Icon: Code,
    badge: "LLM app development",
    title: "Parameterized templates for every context",
    body: "Build prompt templates with {{variable}} placeholders. Swap persona, context, or output format without rewriting. One template, infinite reuse.",
    stack: ["OpenAI API", "Anthropic API", "Ollama"],
  },
];

/* ─── Scroll-triggered fade-in helper ────────────────────────────────────── */
function Reveal({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Static product mockup for hero ─────────────────────────────────────── */
function ProductMockup() {
  return (
    <div className="relative w-full max-w-[460px] mx-auto">
      {/* Ambient glow */}
      <div className="absolute -inset-6 bg-[#714B67]/18 rounded-3xl blur-3xl pointer-events-none" />

      {/* Browser shell */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10
        shadow-[0_32px_80px_-16px_rgba(0,0,0,0.75)]">

        {/* macOS-style chrome */}
        <div className="bg-[#252733] px-4 py-3 flex items-center gap-3 border-b border-white/6">
          <div className="flex gap-1.5 flex-shrink-0">
            <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <span className="w-3 h-3 rounded-full bg-[#28CA41]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="bg-[#1A1B22] rounded-md px-3 py-1 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full border border-white/20 flex-shrink-0" />
              <span className="text-[11px] text-white/30 font-mono truncate">
                promptnest.app
              </span>
            </div>
          </div>
        </div>

        {/* App top bar */}
        <div className="bg-white px-4 py-2.5 flex items-center justify-between border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#714B67] rounded-md flex items-center justify-center">
              <Lock size={11} weight="bold" className="text-white" />
            </div>
            <span className="text-[13px] font-serif font-medium text-[#111827]">PromptNest</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F3F4F6]
            border border-[#E5E7EB] rounded-full">
            <MagnifyingGlass size={11} className="text-[#9CA3AF]" />
            <span className="text-[11px] text-[#9CA3AF]">Search…</span>
            <kbd className="ml-1 text-[10px] font-mono bg-white border border-[#E5E7EB]
              rounded px-1 text-[#ADB5BD]">⌘K</kbd>
          </div>
        </div>

        {/* Prompt cards */}
        <div className="bg-[#F3F4F6] p-3 flex flex-col gap-2">
          {MOCK_PROMPTS.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.18, duration: 0.4, ease: "easeOut" }}
              className="bg-white rounded-xl border border-[#E5E7EB] px-3.5 py-3"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Star
                    size={12}
                    weight={p.favorite ? "fill" : "regular"}
                    className={`flex-shrink-0 ${p.favorite ? "text-[#714B67]" : "text-[#D1D5DB]"}`}
                  />
                  <span className="text-[12px] font-semibold text-[#111827] truncate">
                    {p.title}
                  </span>
                </div>
                <span className="text-[10px] bg-[#F3EEF3] border border-[#E0D0DC]
                  text-[#714B67] px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                  {p.group}
                </span>
              </div>
              <p className="text-[11px] text-[#6B7280] leading-relaxed line-clamp-1 ml-5">
                {p.preview}
              </p>
              <div className="flex gap-1 mt-1.5 ml-5">
                {p.tags.map((t) => (
                  <span key={t} className="text-[10px] bg-[#F3EEF3] border border-[#E0D0DC]
                    text-[#714B67] px-1.5 py-0.5 rounded-full">
                    #{t}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { to: "#features", label: "Features" },
  { to: "#how-it-works", label: "How it works" },
  { to: "/docs", label: "Docs", route: true },
  { to: "#pricing", label: "Pricing" },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-[#111827] overflow-x-hidden">

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50
        bg-[#1A1B22]/96 backdrop-blur border-b border-white/6">
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-14 flex items-center justify-between">

          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-7 h-7 bg-[#714B67] rounded-lg flex items-center justify-center">
              <Lock size={13} weight="bold" className="text-white" />
            </div>
            <span className="font-serif text-white text-[17px] tracking-tight">PromptNest</span>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            {NAV_ITEMS.map((item) =>
              item.route ? (
                <Link key={item.to} to={item.to}
                  className="text-sm text-white/55 hover:text-white/90 transition-colors">
                  {item.label}
                </Link>
              ) : (
                <a key={item.to} href={item.to}
                  className="text-sm text-white/55 hover:text-white/90 transition-colors">
                  {item.label}
                </a>
              )
            )}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Link to="/login"
              className="px-4 py-1.5 text-sm text-white/60 hover:text-white
                transition-colors rounded-full">
              Sign in
            </Link>
            <Link to="/register"
              className="px-4 py-1.5 rounded-full bg-[#714B67] hover:bg-[#5A3A52]
                text-sm text-white font-medium transition-colors">
              Get started free
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden w-8 h-8 flex items-center justify-center
              text-white/60 hover:text-white transition-colors"
          >
            {menuOpen ? <X size={20} /> : <List size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-[#1A1B22] border-t border-white/6
            px-5 py-5 flex flex-col gap-4">
            {NAV_ITEMS.map((item) =>
              item.route ? (
                <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)}
                  className="text-sm text-white/60 hover:text-white transition-colors">
                  {item.label}
                </Link>
              ) : (
                <a key={item.to} href={item.to} onClick={() => setMenuOpen(false)}
                  className="text-sm text-white/60 hover:text-white transition-colors">
                  {item.label}
                </a>
              )
            )}
            <div className="flex flex-col gap-2.5 pt-3 border-t border-white/8">
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="text-center py-2.5 rounded-full border border-white/15
                  text-sm text-white/70 font-medium">
                Sign in
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}
                className="text-center py-2.5 rounded-full bg-[#714B67]
                  text-sm text-white font-medium">
                Get started free
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#1A1B22] pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px]
          bg-[#714B67]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80
          bg-[#4FA8E0]/6 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-5 md:px-8">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-10 items-center">

            {/* Left: copy */}
            <div>
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full
                  bg-[#714B67]/15 border border-[#714B67]/30 text-[#C4A0BA] text-xs font-medium"
              >
                <Lock size={11} weight="bold" />
                Built for AI developers
              </motion.span>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="font-serif text-[42px] md:text-[52px] lg:text-[56px]
                  leading-[1.1] tracking-tight text-white mb-5"
              >
                Your AI prompts,<br />
                <span className="text-[#C4A0BA]">perfectly organized.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
                className="text-[#9CA3AF] text-[17px] leading-relaxed mb-8 max-w-lg"
              >
                Stop rebuilding system prompts from memory.
                PromptNest is a personal prompt library for AI developers —
                store, search, version, and reuse your best work.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-wrap gap-3 mb-9"
              >
                <Link to="/register"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full
                    bg-[#714B67] hover:bg-[#5A3A52] text-white text-sm font-medium
                    transition-all duration-200 shadow-[0_4px_16px_-4px_rgba(113,75,103,0.55)]">
                  Get started free <ArrowRight size={14} weight="bold" />
                </Link>
                <Link to="/login"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full
                    border border-white/15 hover:border-white/30
                    text-white/65 hover:text-white text-sm font-medium transition-all duration-200">
                  Sign in
                </Link>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.38 }}
                className="text-[#3A3D50] text-[11px] font-mono tracking-wide"
              >
                Works with GPT-4 · Claude · Gemini · LangChain · Ollama · any AI tool
              </motion.p>
            </div>

            {/* Right: mockup */}
            <motion.div
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="hidden lg:flex items-center justify-center"
            >
              <ProductMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── PROBLEM ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-5 md:px-8 text-center">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#714B67] mb-3">
              The problem
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-[#111827] mb-4 leading-tight">
              You're rebuilding the same prompts<br className="hidden sm:block" /> over and over.
            </h2>
            <p className="text-[#6B7280] text-[17px] leading-relaxed max-w-2xl mx-auto">
              Every prompt you craft lives in a chat window. When you need it again
              it's buried 200 messages deep. So you rewrite it from memory — slightly worse each time.
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-3 gap-5 mt-12">
            {[
              {
                Icon: ChatTeardrop,
                title: "Lost in chat history",
                body: "Your best system prompts disappear into conversation threads. There's no way to find them when you need them again.",
              },
              {
                Icon: ArrowsClockwise,
                title: "Rebuilt from memory",
                body: "You rewrite the same prompt multiple times a week, each slightly worse. No baseline to iterate from, no way to improve.",
              },
              {
                Icon: ClockCounterClockwise,
                title: "No version control",
                body: "A prompt stops working and you can't trace what changed. No history, no rollback — just guesswork and wasted time.",
              },
            ].map(({ Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 0.08}>
                <div className="bg-[#F3F4F6] border border-[#E5E7EB] rounded-2xl p-6 text-left h-full">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E7EB]
                    flex items-center justify-center mb-4">
                    <Icon size={20} weight="duotone" className="text-[#374151]" />
                  </div>
                  <h3 className="font-semibold text-[#111827] mb-2">{title}</h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 bg-[#F3F4F6] scroll-mt-14">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <Reveal className="text-center mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#714B67] mb-3">
              Features
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-[#111827] mb-4">
              Everything a prompt engineer needs
            </h2>
            <p className="text-[#6B7280] text-[17px] max-w-2xl mx-auto leading-relaxed">
              Built for developers who take their prompts seriously — from one-off experiments
              to production system prompts.
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ Icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 0.07}>
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 h-full
                  hover:border-[#714B67]/30 hover:shadow-[0_4px_16px_-4px_rgba(113,75,103,0.1)]
                  transition-all duration-200">
                  <div className="w-10 h-10 rounded-xl bg-[#F3EEF3] border border-[#E0D0DC]
                    flex items-center justify-center mb-4">
                    <Icon size={20} weight="duotone" className="text-[#714B67]" />
                  </div>
                  <h3 className="font-semibold text-[#111827] mb-2">{title}</h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── USE CASES ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <Reveal className="text-center mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#714B67] mb-3">
              Use cases
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-[#111827]">
              How AI developers use PromptNest
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {USE_CASES.map(({ Icon, badge, title, body, stack }, i) => (
              <Reveal key={title} delay={i * 0.09}>
                <div className="border border-[#E5E7EB] rounded-2xl p-6 h-full flex flex-col
                  hover:border-[#714B67]/25 transition-colors duration-200">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-[#714B67]
                      flex items-center justify-center flex-shrink-0">
                      <Icon size={19} weight="bold" className="text-white" />
                    </div>
                    <span className="text-xs font-semibold text-[#714B67]
                      bg-[#F3EEF3] border border-[#E0D0DC] px-2.5 py-1 rounded-full">
                      {badge}
                    </span>
                  </div>
                  <h3 className="font-semibold text-[#111827] mb-3 text-[15px] leading-snug">
                    {title}
                  </h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed flex-1">{body}</p>
                  <div className="flex flex-wrap gap-1.5 mt-5">
                    {stack.map((s) => (
                      <span key={s}
                        className="text-[11px] font-mono text-[#6B7280]
                          bg-[#F3F4F6] border border-[#E5E7EB] px-2 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 bg-[#F3F4F6] scroll-mt-14">
        <div className="max-w-4xl mx-auto px-5 md:px-8">
          <Reveal className="text-center mb-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#714B67] mb-3">
              How it works
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-[#111827]">
              Up and running in minutes
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-10 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+2rem)]
              right-[calc(16.67%+2rem)] h-px
              bg-gradient-to-r from-[#714B67]/20 via-[#714B67]/40 to-[#714B67]/20" />

            {[
              {
                n: "01",
                Icon: Check,
                title: "Sign up in 30 seconds",
                body: "Google, GitHub, or email. No credit card. No setup wizard. You're in.",
              },
              {
                n: "02",
                Icon: FolderSimple,
                title: "Add your prompts",
                body: "Paste, import from JSON, or type directly. Tag, group, and organise as you go.",
              },
              {
                n: "03",
                Icon: Lightning,
                title: "Search, copy, ship",
                body: "Hit ⌘K from anywhere to find any prompt. One click copies to clipboard, usage tracked.",
              },
            ].map(({ n, Icon, title, body }, i) => (
              <Reveal key={n} delay={i * 0.12} className="text-center">
                <div className="w-16 h-16 rounded-2xl
                  bg-gradient-to-br from-[#714B67] to-[#5A3A52]
                  flex flex-col items-center justify-center mx-auto mb-5
                  shadow-[0_8px_24px_-8px_rgba(113,75,103,0.5)] relative z-10">
                  <span className="text-[9px] font-bold text-white/50 leading-none mb-0.5">
                    {n}
                  </span>
                  <Icon size={20} weight="bold" className="text-white" />
                </div>
                <h3 className="font-semibold text-[#111827] mb-2">{title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────��───────────────── */}
      <section id="pricing" className="py-20 bg-white scroll-mt-14">
        <div className="max-w-3xl mx-auto px-5 md:px-8">
          <Reveal className="text-center mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#714B67] mb-3">
              Pricing
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-[#111827] mb-4">
              Free while we're in beta
            </h2>
            <p className="text-[#6B7280] text-[17px] max-w-md mx-auto leading-relaxed">
              Build your prompt library now at no cost.
              A Pro plan is coming — get in early.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Beta — active */}
            <Reveal>
              <div className="border-2 border-[#714B67] rounded-2xl p-7 relative h-full flex flex-col">
                <span className="absolute top-5 right-5 bg-[#714B67] text-white
                  text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest">
                  Current
                </span>
                <p className="text-xs font-bold uppercase tracking-widest text-[#714B67] mb-3">
                  Beta
                </p>
                <div className="flex items-baseline gap-1 mb-7">
                  <span className="font-serif text-5xl text-[#111827]">Free</span>
                </div>
                <ul className="flex flex-col gap-3 mb-8 flex-1">
                  {[
                    "Unlimited prompts",
                    "Version history & rollback",
                    "Full-text search  +  ⌘K palette",
                    "Groups, tags & favorites",
                    "Import / export JSON",
                    "Google & GitHub login",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-[#374151]">
                      <div className="w-4 h-4 rounded-full bg-[#F3EEF3] border border-[#E0D0DC]
                        flex items-center justify-center flex-shrink-0">
                        <Check size={9} weight="bold" className="text-[#714B67]" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register"
                  className="block text-center py-2.5 rounded-full bg-[#714B67] hover:bg-[#5A3A52]
                    text-white text-sm font-medium transition-colors">
                  Get started free
                </Link>
              </div>
            </Reveal>

            {/* Pro — coming soon */}
            <Reveal delay={0.1}>
              <div className="border border-[#E5E7EB] rounded-2xl p-7 relative h-full
                flex flex-col opacity-60">
                <span className="absolute top-5 right-5 bg-[#F3F4F6] text-[#9CA3AF]
                  border border-[#E5E7EB] text-[10px] font-bold px-2.5 py-1 rounded-full
                  uppercase tracking-widest">
                  Coming soon
                </span>
                <p className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-3">
                  Pro
                </p>
                <div className="flex items-baseline gap-1 mb-7">
                  <span className="font-serif text-5xl text-[#374151]">$7</span>
                  <span className="text-[#9CA3AF] text-sm mb-1">/month</span>
                </div>
                <ul className="flex flex-col gap-3 mb-8 flex-1">
                  {[
                    "Everything in Beta, forever",
                    "Team sharing & collaboration",
                    "API access",
                    "Advanced analytics",
                    "Priority support",
                    "Custom integrations",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-[#9CA3AF]">
                      <div className="w-4 h-4 rounded-full bg-[#F3F4F6] border border-[#E5E7EB]
                        flex items-center justify-center flex-shrink-0">
                        <Check size={9} weight="bold" className="text-[#D1D5DB]" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <button disabled
                  className="block w-full text-center py-2.5 rounded-full
                    border border-[#E5E7EB] bg-[#F3F4F6] text-[#9CA3AF]
                    text-sm font-medium cursor-not-allowed">
                  Coming soon
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#1A1B22] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-[700px] h-[200px] bg-[#714B67]/12 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-5 md:px-8 text-center">
          <Reveal>
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
              Your prompt library is waiting.
            </h2>
            <p className="text-[#9CA3AF] text-[17px] mb-8 max-w-lg mx-auto leading-relaxed">
              Join developers who stopped losing their best work to chat history.
              Free during beta — no credit card required.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/register"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full
                  bg-[#714B67] hover:bg-[#5A3A52] text-white text-sm font-medium
                  transition-all duration-200 shadow-[0_4px_20px_-4px_rgba(113,75,103,0.6)]">
                Get started free <ArrowRight size={14} weight="bold" />
              </Link>
              <Link to="/login"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full
                  border border-white/15 hover:border-white/30
                  text-white/65 hover:text-white text-sm font-medium transition-all duration-200">
                Sign in
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="bg-[#252733] border-t border-white/6 py-10">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 bg-[#714B67] rounded-md flex items-center justify-center">
                <Lock size={11} weight="bold" className="text-white" />
              </div>
              <span className="font-serif text-white/75 text-[15px] tracking-tight">
                PromptNest
              </span>
            </div>

            <div className="flex items-center gap-5 flex-wrap justify-center">
              <Link to="/login"
                className="text-sm text-white/35 hover:text-white/70 transition-colors">
                Sign in
              </Link>
              <Link to="/register"
                className="text-sm text-white/35 hover:text-white/70 transition-colors">
                Sign up
              </Link>
              <a href="#"
                className="text-sm text-white/35 hover:text-white/70 transition-colors">
                GitHub
              </a>
              <a href="#"
                className="text-sm text-white/35 hover:text-white/70 transition-colors">
                Docs
              </a>
            </div>

            <p className="text-[12px] text-[#3A3D50]">© 2025 PromptNest</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
