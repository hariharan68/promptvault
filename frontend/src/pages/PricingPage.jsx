import { Check } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import MarketingShell from "../components/marketing/MarketingShell.jsx";
import { useMarketingTheme } from "../context/MarketingThemeContext.jsx";

const FREE_FEATURES = [
  "Unlimited prompts",
  "Version history and rollback",
  "Full-text search and command palette",
  "Groups, tags, and favorites",
  "JSON import and export",
  "Google and GitHub login",
];

const PRO_FEATURES = [
  "Everything in the free plan",
  "Shared team libraries",
  "API access",
  "Advanced analytics",
  "Priority support",
  "Custom integrations",
];

function FeatureList({ items, muted = false, isDark }) {
  const textClass = muted
    ? isDark
      ? "text-[#8F9098]"
      : "text-[#9CA3AF]"
    : isDark
      ? "text-[#C8C6CB]"
      : "text-[#374151]";
  const iconClass = muted
    ? isDark
      ? "bg-white/5 text-[#676874]"
      : "bg-[#F3F4F6] text-[#D1D5DB]"
    : isDark
      ? "bg-[#714B67]/30 text-[#E8CFE0]"
      : "bg-[#F3EEF3] text-[#714B67]";

  return (
    <ul className="mt-8 flex flex-col gap-3">
      {items.map((item) => (
        <li key={item} className={`flex items-start gap-2.5 text-sm ${textClass}`}>
          <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
            <Check size={10} weight="bold" aria-hidden="true" />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function PricingPage() {
  const { theme } = useMarketingTheme();
  const isDark = theme === "dark";

  return (
    <MarketingShell>
      <div className={isDark ? "bg-[#12131A] text-[#F4F2F0]" : "bg-white text-[#111827]"}>
        <section className={`border-b pb-16 pt-24 md:pb-20 ${isDark ? "border-white/10 bg-[#12131A]" : "border-[#E5E7EB] bg-white"}`}>
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <div className="max-w-3xl">
              <p className={`mb-4 text-xs font-semibold uppercase tracking-[0.14em] ${isDark ? "text-[#D7ACC9]" : "text-[#714B67]"}`}>Pricing</p>
              <h1 className={`font-serif text-4xl leading-[1.08] tracking-tight md:text-6xl ${isDark ? "text-[#F4F2F0]" : "text-[#111827]"}`}>
                Start with your whole library, free.
              </h1>
              <p className={`mt-6 max-w-xl text-[17px] leading-relaxed ${isDark ? "text-[#C2C0C5]" : "text-[#6B7280]"}`}>
                PromptNest is free while the product is in beta. Create your library now and use every core workflow.
              </p>
            </div>
          </div>
        </section>

        <section className={`py-12 md:py-20 ${isDark ? "bg-[#17181F]" : "bg-white"}`}>
          <div className="mx-auto grid max-w-5xl gap-5 px-5 md:grid-cols-2 md:px-8">
            <article className={`flex min-h-[34rem] flex-col rounded-2xl border-2 p-7 md:p-8 ${isDark ? "border-[#A56F96] bg-[#1B1C23]" : "border-[#714B67] bg-white"}`}>
              <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${isDark ? "text-[#E0B7D4]" : "text-[#714B67]"}`}>Free beta</p>
              <div className="mt-5 flex items-baseline gap-2">
                <span className={`font-serif text-5xl tracking-tight ${isDark ? "text-[#F4F2F0]" : "text-[#111827]"}`}>Free</span>
                <span className={`text-sm ${isDark ? "text-[#A9A7AD]" : "text-[#6B7280]"}`}>during beta</span>
              </div>
              <p className={`mt-4 text-sm leading-relaxed ${isDark ? "text-[#C2C0C5]" : "text-[#6B7280]"}`}>Everything you need to build and maintain a prompt library.</p>
              <FeatureList items={FREE_FEATURES} isDark={isDark} />
              <Link to="/register" className={`mt-auto rounded-full px-5 py-3 text-center text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#714B67] focus-visible:ring-offset-4 ${isDark ? "bg-[#E6D5E0] text-[#2A1C27] hover:bg-[#F4F2F0] focus-visible:ring-offset-[#1B1C23]" : "bg-[#714B67] text-white hover:bg-[#5A3A52] focus-visible:ring-offset-white"}`}>
                Create your free account
              </Link>
            </article>

            <article className={`flex min-h-[34rem] flex-col rounded-2xl border p-7 md:p-8 ${isDark ? "border-white/10 bg-[#20212A]" : "border-[#E5E7EB] bg-[#F8F9FB]"}`}>
              <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${isDark ? "text-[#8F9098]" : "text-[#9CA3AF]"}`}>Pro</p>
              <div className="mt-5 flex items-baseline gap-2">
                <span className={`font-serif text-5xl tracking-tight ${isDark ? "text-[#D7D4D8]" : "text-[#374151]"}`}>$7</span>
                <span className={`text-sm ${isDark ? "text-[#8F9098]" : "text-[#9CA3AF]"}`}>per month</span>
              </div>
              <p className={`mt-4 text-sm leading-relaxed ${isDark ? "text-[#8F9098]" : "text-[#9CA3AF]"}`}>For shared libraries and advanced product workflows. Coming soon.</p>
              <FeatureList items={PRO_FEATURES} muted isDark={isDark} />
              <span className={`mt-auto rounded-full border px-5 py-3 text-center text-sm font-medium ${isDark ? "border-white/10 bg-white/5 text-[#8F9098]" : "border-[#E5E7EB] bg-[#F3F4F6] text-[#9CA3AF]"}`}>
                Coming soon
              </span>
            </article>
          </div>
        </section>
      </div>
    </MarketingShell>
  );
}
