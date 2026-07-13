import {
  Archive,
  ArrowRight,
  BracketsCurly,
  ClockCounterClockwise,
  Copy,
  FolderSimple,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import heroImage from "../assets/features/prompt-library-hero.webp";
import organizationImage from "../assets/features/prompt-organization.webp";
import versionsImage from "../assets/features/prompt-versions.webp";
import MarketingShell from "../components/marketing/MarketingShell.jsx";

const CAPABILITIES = [
  {
    Icon: Copy,
    title: "Capture work worth reusing",
    body: "Create, edit, duplicate, and favorite prompts as soon as they prove useful.",
    className: "lg:col-span-7",
  },
  {
    Icon: BracketsCurly,
    title: "Turn patterns into templates",
    body: "Add variables to repeated prompt structures and fill in the details only when a task calls for them.",
    className: "lg:col-span-5 bg-[#20212A]",
  },
  {
    Icon: MagnifyingGlass,
    title: "Search with the context intact",
    body: "Filter by title, content, group, tag, or favorites. Useful views stay shareable in the URL.",
    className: "lg:col-span-5 bg-[#20212A]",
  },
  {
    Icon: Archive,
    title: "Keep your library recoverable",
    body: "Restore a version, bring a deleted prompt back from Trash, or export a backup when you need one.",
    className: "lg:col-span-7",
  },
];

function TextLink({ to, children }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-2 text-sm font-semibold text-[#E8CFE0] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8CFE0] focus-visible:ring-offset-4 focus-visible:ring-offset-[#12131A]"
    >
      {children}
      <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
    </Link>
  );
}

export default function FeaturesPage() {
  return (
    <MarketingShell>
      <div className="overflow-hidden bg-[#12131A] text-[#F4F2F0]">
        <section className="border-b border-white/10">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-14 pt-24 md:px-8 md:pb-20 lg:grid-cols-12 lg:items-center lg:gap-8">
            <div className="lg:col-span-6">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#D7ACC9]">Prompt library</p>
              <h1 className="max-w-2xl font-serif text-4xl leading-[1.03] tracking-[-0.035em] text-[#F4F2F0] md:text-6xl">
                Keep the prompts that keep working.
              </h1>
              <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-[#C2C0C5] md:text-lg">
                Capture, organize, reuse, and protect your best AI workflows in one private library.
              </p>
              <Link
                to="/how-it-works"
                className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#E6D5E0] px-5 text-sm font-semibold text-[#2A1C27] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#12131A]"
              >
                Explore the workflow
                <ArrowRight size={16} weight="bold" aria-hidden="true" />
              </Link>
            </div>

            <div className="lg:col-span-6 lg:pl-5">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1B1C23] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
                <img
                  src={heroImage}
                  alt="Layered prompt cards with plum dividers and a magnifying glass."
                  className="aspect-[16/10] h-full w-full object-cover"
                  width="1600"
                  height="1000"
                  fetchPriority="high"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#17181F] py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D7ACC9]">Built for the long run</p>
              <h2 className="mt-4 font-serif text-3xl leading-tight tracking-[-0.03em] text-[#F4F2F0] md:text-5xl">
                A complete system for prompt work.
              </h2>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-12">
              {CAPABILITIES.map(({ Icon, title, body, className }) => (
                <article
                  key={title}
                  className={`group min-h-64 rounded-2xl border border-white/10 bg-[#1B1C23] p-6 transition-colors duration-200 hover:border-[#8A5B7D] md:p-8 ${className}`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#714B67] text-[#F4F2F0]">
                    <Icon size={21} weight="duotone" aria-hidden="true" />
                  </div>
                  <div className="mt-14 max-w-md">
                    <h3 className="text-xl font-semibold tracking-[-0.02em] text-[#F4F2F0]">{title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#B8B6BC]">{body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1B1C23]">
              <img
                src={organizationImage}
                alt="Prompt cards organized in a dark archival drawer with plum dividers."
                className="aspect-[4/5] h-full w-full object-cover"
                width="1000"
                height="1250"
                loading="lazy"
              />
            </div>
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D7ACC9]">Organization that follows your work</p>
              <h2 className="mt-4 font-serif text-3xl leading-tight tracking-[-0.03em] text-[#F4F2F0] md:text-5xl">
                Organize without losing the thread.
              </h2>
              <p className="mt-6 text-[17px] leading-relaxed text-[#C2C0C5]">
                Give every prompt one clear home, then add as many tags as it needs. Groups define the project. Tags keep useful ideas connected across the library.
              </p>
              <div className="mt-8">
                <TextLink to="/docs?p=groups">Read the organization guide</TextLink>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#17181F] py-16 md:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 md:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <div className="order-2 max-w-xl lg:order-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D7ACC9]">Version history and recovery</p>
              <h2 className="mt-4 font-serif text-3xl leading-tight tracking-[-0.03em] text-[#F4F2F0] md:text-5xl">
                Experiment without losing the version that worked.
              </h2>
              <p className="mt-6 text-[17px] leading-relaxed text-[#C2C0C5]">
                Every edit is versioned. Restore a previous version whenever you need to, while the newer work stays available in your history.
              </p>
              <div className="mt-8">
                <TextLink to="/docs?p=versions">Learn about version history</TextLink>
              </div>
            </div>
            <div className="order-1 overflow-hidden rounded-2xl border border-white/10 bg-[#1B1C23] lg:order-2">
              <img
                src={versionsImage}
                alt="Layered prompt cards arranged as a version history with a metal clip."
                className="aspect-[4/3] h-full w-full object-cover"
                width="1200"
                height="900"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        <section className="bg-[#714B67] py-14 md:py-20">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 md:px-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#F1DDEB]">A library you can rely on</p>
              <h2 className="mt-4 font-serif text-3xl leading-tight tracking-[-0.03em] text-white md:text-5xl">
                Your prompt history should help you move faster.
              </h2>
            </div>
            <TextLink to="/pricing">See plans and pricing</TextLink>
          </div>
        </section>
      </div>
    </MarketingShell>
  );
}
