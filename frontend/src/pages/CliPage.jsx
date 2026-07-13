import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Lock,
  TerminalWindow,
  DownloadSimple,
  BracketsCurly,
  MagnifyingGlass,
  Robot,
  FolderSimple,
  ArrowRight,
  ArrowLeft,
  BookOpen,
} from "@phosphor-icons/react";
import MarketingShell from "../components/marketing/MarketingShell.jsx";

/* ─── Content ─────────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    Icon: DownloadSimple,
    title: "One-command install",
    desc: "npx promptnest init creates your local vault and installs the agent slash commands. No build step, no account.",
  },
  {
    Icon: Robot,
    title: "Agent skills built in",
    desc: "Use /pn, /promptsave, and /promptnest right inside Claude Code to save and reuse prompts without leaving the chat.",
  },
  {
    Icon: BracketsCurly,
    title: "{{variable}} templates",
    desc: "pn use <id> --var key=value fills placeholders, so one saved prompt covers every language, tone, or context.",
  },
  {
    Icon: MagnifyingGlass,
    title: "Instant local search",
    desc: "pn search and pn list surface any saved prompt in milliseconds — plain markdown under ~/.promptnest.",
  },
  {
    Icon: TerminalWindow,
    title: "No size limits",
    desc: "Pipe long prompts from a file or stdin with --file. Never silently truncated by the terminal's argument limit.",
  },
  {
    Icon: FolderSimple,
    title: "Local-first & git-friendly",
    desc: "Every prompt is a markdown file you own. Read it, edit it by hand, put it in version control, back it up.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Set up your vault",
    body: "One command creates ~/.promptnest and installs the Claude Code slash commands.",
    code: "npx promptnest init",
  },
  {
    n: "02",
    title: "Save a prompt",
    body: "Give it a title, group, and keywords. Add {{variables}} for the fill-in-the-blank parts.",
    code: 'pn save "Review this {{lang}} code" -t "Lang review" -g code-review',
  },
  {
    n: "03",
    title: "Find & reuse it",
    body: "Search by any word, then fill the variables at use-time. One template, infinite reuse.",
    code: "pn use lang-review --var lang=Python",
  },
];

const COMMANDS = [
  ["pn save [\"text\"] [options]", "Save a prompt (text, --file, stdin, -i, or -N recency)"],
  ["pn list [-g group]", "List saved prompts, optionally filtered"],
  ["pn search \"<query>\"", "Search titles, keywords, descriptions, and bodies"],
  ["pn get <id>", "Print one prompt's body exactly as saved"],
  ["pn path <id>", "Print the prompt's .md file path"],
  ["pn use <id> --var k=v", "Fill {{variables}} and print; tracks usage"],
  ["pn count", "History depth + saved count"],
  ["pn init [-a claude]", "Set up the vault + install agent skills"],
];

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

/* ─── Terminal mockup ─────────────────────────────────────────────────────── */
function Terminal() {
  const LINES = [
    ["$", "npx promptnest init", "✔ vault ready at ~/.promptnest  ·  installed /promptsave, /promptnest"],
    ["$", 'pn save "Review {{lang}} code" -t "Lang review" -g code-review', "saved ~/.promptnest/prompts/code-review/lang-review.md"],
    ["$", "pn use lang-review --var lang=Python", "Review Python code"],
    ["$", "pn search review", "2026-07-12_lang-review  ·  Lang review  ·  code-review"],
  ];
  return (
    <div className="relative w-full max-w-[560px] mx-auto">
      <div className="absolute -inset-6 bg-[#714B67]/18 rounded-3xl blur-3xl pointer-events-none" />
      <div className="relative rounded-2xl overflow-hidden border border-white/10
        shadow-[0_32px_80px_-16px_rgba(0,0,0,0.75)]">
        <div className="bg-[#252733] px-4 py-3 flex items-center gap-3 border-b border-white/6">
          <div className="flex gap-1.5 flex-shrink-0">
            <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <span className="w-3 h-3 rounded-full bg-[#28CA41]" />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-white/30 font-mono">
            <TerminalWindow size={12} weight="bold" />
            <span>promptnest — zsh</span>
          </div>
        </div>
        <div className="bg-[#12131A] px-4 py-4 flex flex-col gap-3 font-mono text-[12px] leading-relaxed">
          {LINES.map(([prompt, cmd, out], i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 + i * 0.2, duration: 0.4 }}
            >
              <div className="flex gap-2">
                <span className="text-[#28CA41] flex-shrink-0">{prompt}</span>
                <span className="text-white/90 break-all">{cmd}</span>
              </div>
              <div className="text-[#8A8FA3] pl-4 break-all">{out}</div>
            </motion.div>
          ))}
          <div className="flex gap-2 items-center">
            <span className="text-[#28CA41]">$</span>
            <span className="w-2 h-4 bg-white/70 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
const DOCS_LINK = "/docs?p=cli-overview";
export default function CliPage() {
  return (
    <MarketingShell showFooter={false}>
      <div className="min-h-screen bg-[#1A1B22] text-white overflow-x-hidden">

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px]
          bg-[#714B67]/12 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-5 md:px-8">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-10 items-center">
            <div>
              <motion.span
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
                className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full
                  bg-[#714B67]/15 border border-[#714B67]/30 text-[#C4A0BA] text-xs font-medium"
              >
                <TerminalWindow size={12} weight="bold" /> Command line
              </motion.span>

              <motion.h1
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="font-serif text-[40px] md:text-[52px] leading-[1.1] tracking-tight text-white mb-5"
              >
                Your prompt library,<br />
                <span className="text-[#C4A0BA]">in the terminal.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
                className="text-[#9CA3AF] text-[17px] leading-relaxed mb-8 max-w-lg"
              >
                The PromptNest CLI captures the prompts you type into AI agents and stores them as plain
                markdown on your machine — save, search, and reuse by name, right from your shell or inside
                Claude Code.
              </motion.p>

              {/* Install command */}
              <motion.div
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center gap-3 bg-[#12131A] border border-white/10 rounded-xl
                  px-4 py-3 font-mono text-[13px] max-w-md mb-6"
              >
                <span className="text-[#28CA41] flex-shrink-0">$</span>
                <code className="text-white/90 flex-1 truncate">npx promptnest init</code>
                <span className="text-[10px] text-white/40 uppercase tracking-widest hidden sm:inline">Start here</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.26 }}
                className="flex flex-wrap gap-3"
              >
                <Link to={DOCS_LINK}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full
                    bg-[#714B67] hover:bg-[#5A3A52] text-white text-sm font-medium transition-all
                    shadow-[0_4px_16px_-4px_rgba(113,75,103,0.55)]">
                  <BookOpen size={15} weight="bold" /> Read the CLI docs
                </Link>
                <Link to="/features"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full
                    border border-white/15 hover:border-white/30 text-white/65 hover:text-white
                    text-sm font-medium transition-all">
                  <ArrowLeft size={14} /> Explore Features
                </Link>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}
                className="text-[#3A3D50] text-[11px] font-mono tracking-wide mt-8"
              >
                Works with Claude Code · Cursor · Codex · any terminal · Node.js 18+
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="hidden lg:block"
            >
              <Terminal />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 bg-[#15161C] scroll-mt-14">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <Reveal className="text-center mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C4A0BA] mb-3">Features</p>
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">Everything you need from the shell</h2>
            <p className="text-[#9CA3AF] text-[17px] max-w-2xl mx-auto leading-relaxed">
              A local-first CLI for developers who live in the terminal and in AI coding agents.
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ Icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 0.07}>
                <div className="bg-[#1A1B22] border border-white/8 rounded-2xl p-6 h-full
                  hover:border-[#714B67]/40 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-[#714B67]/15 border border-[#714B67]/30
                    flex items-center justify-center mb-4">
                    <Icon size={20} weight="duotone" className="text-[#C4A0BA]" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{title}</h3>
                  <p className="text-sm text-[#9CA3AF] leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW TO USE ──────────────────────────────────────────────────── */}
      <section id="how" className="py-20 scroll-mt-14">
        <div className="max-w-4xl mx-auto px-5 md:px-8">
          <Reveal className="text-center mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C4A0BA] mb-3">How to use</p>
            <h2 className="font-serif text-3xl md:text-4xl text-white">Three steps to a reusable prompt</h2>
          </Reveal>

          <div className="flex flex-col gap-5">
            {STEPS.map(({ n, title, body, code }, i) => (
              <Reveal key={n} delay={i * 0.08}>
                <div className="flex flex-col sm:flex-row gap-5 bg-[#15161C] border border-white/8
                  rounded-2xl p-6">
                  <div className="flex items-start gap-4 sm:w-64 flex-shrink-0">
                    <span className="text-[13px] font-bold text-[#714B67] font-mono pt-0.5">{n}</span>
                    <div>
                      <h3 className="font-semibold text-white mb-1">{title}</h3>
                      <p className="text-sm text-[#9CA3AF] leading-relaxed">{body}</p>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex items-center bg-[#12131A] border border-white/8
                    rounded-xl px-4 py-3 font-mono text-[12.5px]">
                    <span className="text-[#28CA41] mr-2 flex-shrink-0">$</span>
                    <code className="text-white/90 break-all">{code}</code>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <div className="mt-8 rounded-2xl border border-[#714B67]/30 bg-[#714B67]/10 px-5 py-4
              text-[14px] leading-6 text-[#C4A0BA] flex gap-3">
              <TerminalWindow size={18} weight="duotone" className="flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Saving a long prompt?</strong> Don't paste it onto the command
                line — terminals truncate big arguments. Use <code className="font-mono text-white">--file prompt.txt</code> or
                pipe it via stdin. No size limit.
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── COMMANDS ────────────────────────────────────────────────────── */}
      <section id="commands" className="py-20 bg-[#15161C] scroll-mt-14">
        <div className="max-w-4xl mx-auto px-5 md:px-8">
          <Reveal className="text-center mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C4A0BA] mb-3">Reference</p>
            <h2 className="font-serif text-3xl md:text-4xl text-white">Command cheat sheet</h2>
          </Reveal>

          <Reveal>
            <div className="rounded-2xl border border-white/8 overflow-hidden">
              {COMMANDS.map(([cmd, desc], i) => (
                <div key={cmd}
                  className={`flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-5 py-3.5
                    ${i % 2 ? "bg-[#1A1B22]" : "bg-[#16171E]"}`}>
                  <code className="font-mono text-[13px] text-[#C4A0BA] sm:w-72 flex-shrink-0 break-all">{cmd}</code>
                  <span className="text-[14px] text-[#9CA3AF]">{desc}</span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="text-center text-[13px] text-[#6B7280] mt-6">
              Full details, flags, and troubleshooting live in the{" "}
              <Link to={DOCS_LINK} className="text-[#C4A0BA] hover:text-white underline underline-offset-2">
                CLI documentation
              </Link>.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── AGENT SKILLS / CTA ──────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-[700px] h-[220px] bg-[#714B67]/12 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-5 md:px-8 text-center">
          <Reveal>
            <div className="flex justify-center gap-2 mb-6 flex-wrap">
              {["/pn", "/promptsave", "/promptnest"].map((s) => (
                <span key={s} className="font-mono text-[13px] text-[#C4A0BA]
                  bg-[#714B67]/15 border border-[#714B67]/30 px-3 py-1 rounded-full">{s}</span>
              ))}
            </div>
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
              Built for your AI agent, too.
            </h2>
            <p className="text-[#9CA3AF] text-[17px] mb-8 max-w-lg mx-auto leading-relaxed">
              <code className="font-mono text-[#C4A0BA]">pn init</code> installs slash commands so you can save
              and reuse prompts without ever leaving Claude Code.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to={DOCS_LINK}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full
                  bg-[#714B67] hover:bg-[#5A3A52] text-white text-sm font-medium transition-all
                  shadow-[0_4px_20px_-4px_rgba(113,75,103,0.6)]">
                Read the CLI docs <ArrowRight size={14} weight="bold" />
              </Link>
              <Link to="/features"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full
                  border border-white/15 hover:border-white/30 text-white/65 hover:text-white
                  text-sm font-medium transition-all">
                Explore the web app
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="bg-[#252733] border-t border-white/6 py-10">
        <div className="max-w-6xl mx-auto px-5 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-[#714B67] rounded-md flex items-center justify-center">
              <Lock size={11} weight="bold" className="text-white" />
            </div>
            <span className="font-serif text-white/75 text-[15px] tracking-tight">PromptNest CLI</span>
          </div>
          <div className="flex items-center gap-5 flex-wrap justify-center">
            <Link to="/features" className="text-sm text-white/35 hover:text-white/70 transition-colors">Features</Link>
            <Link to={DOCS_LINK} className="text-sm text-white/35 hover:text-white/70 transition-colors">CLI Docs</Link>
            <Link to="/docs" className="text-sm text-white/35 hover:text-white/70 transition-colors">Web app docs</Link>
          </div>
          <p className="text-[12px] text-[#3A3D50]">© 2025 PromptNest</p>
        </div>
      </footer>
      </div>
    </MarketingShell>
  );
}
