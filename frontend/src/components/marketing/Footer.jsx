import { Link } from "react-router-dom";
import { EnvelopeSimple, GithubLogo, Lock, Package } from "@phosphor-icons/react";

/* ─── Update these to your real destinations ──────────────────────────────── */
const GITHUB_URL = "https://github.com/promptnest/promptnest";
const NPM_URL = "https://www.npmjs.com/package/promptnest";
const CONTACT_EMAIL = "hello@promptnest.app";

const LINK_COLUMNS = [
  {
    heading: "Product",
    links: [
      { to: "/features", label: "Features", route: true },
      { to: "/cli", label: "CLI", route: true },
      { to: "/how-it-works", label: "How it works", route: true },
      { to: "/pricing", label: "Pricing", route: true },
    ],
  },
  {
    heading: "Resources",
    links: [
      { to: "/docs", label: "Docs", route: true },
      { to: "/docs?p=cli-overview", label: "CLI guide", route: true },
      { to: NPM_URL, label: "npm package", external: true },
      { to: GITHUB_URL, label: "GitHub", external: true },
    ],
  },
  {
    heading: "Legal",
    links: [
      { to: "/privacy", label: "Privacy Policy", route: true },
      { to: "/terms", label: "Terms of Service", route: true },
      { to: "/security", label: "Security", route: true },
    ],
  },
];

const SOCIALS = [
  { href: GITHUB_URL, label: "GitHub", Icon: GithubLogo, external: true },
  { href: NPM_URL, label: "npm", Icon: Package, external: true },
  { href: `mailto:${CONTACT_EMAIL}`, label: "Email", Icon: EnvelopeSimple },
];

function FooterLink({ link }) {
  const cls = "text-sm text-[#7A6A55] transition-colors hover:text-[#714B67]";
  if (link.external) {
    return (
      <a href={link.to} target="_blank" rel="noreferrer noopener" className={cls}>
        {link.label}
      </a>
    );
  }
  return (
    <Link to={link.to} className={cls}>
      {link.label}
    </Link>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#E0D2BC] bg-[#F1E7D6]">
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)] md:gap-8">
          {/* Brand + blurb + socials */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5" aria-label="PromptNest home">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#714B67]">
                <Lock size={13} weight="bold" className="text-white" />
              </div>
              <span className="font-serif text-[17px] tracking-tight text-[#2E2620]">PromptNest</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#7A6A55]">
              A personal prompt library for AI developers. Store, search, version,
              and reuse your best prompts in the browser or straight from the terminal.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {SOCIALS.map(({ href, label, Icon, external }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DDCDB4]
                    bg-white/50 text-[#8A7B68] transition-colors
                    hover:border-[#714B67]/40 hover:bg-[#714B67]/10 hover:text-[#714B67]"
                >
                  <Icon size={17} weight="regular" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {LINK_COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A8A72]">
                {col.heading}
              </h3>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink link={link} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#E0D2BC] pt-7 sm:flex-row">
          <p className="text-[12px] text-[#8A7B68]">
            © {year} PromptNest. All rights reserved.
          </p>
          <p className="text-[12px] text-[#8A7B68]">
            Developed by{" "}
            <span className="font-semibold text-[#714B67]">Triecore Technologies</span>
          </p>
          <p className="font-mono text-[11px] tracking-wide text-[#A2937C]">
            Works with Claude · GPT-4 · Gemini · LangChain · any AI tool
          </p>
        </div>
      </div>
    </footer>
  );
}
