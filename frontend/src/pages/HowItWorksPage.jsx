import {
  ArrowRight,
  BracketsCurly,
  ClockCounterClockwise,
  Copy,
  FolderSimple,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import templateWorkflowImage from "../assets/how-it-works/template-workflow.webp";
import workflowHeroImage from "../assets/how-it-works/workflow-hero.webp";
import MarketingShell from "../components/marketing/MarketingShell.jsx";

const WORKFLOW = [
  {
    Icon: Copy,
    title: "Capture a useful prompt",
    body: "Save the title, prompt content, and a short description while the context is still fresh.",
    className: "border-b border-white/10 bg-[#1B1C23] sm:border-r",
  },
  {
    Icon: FolderSimple,
    title: "Give it a home",
    body: "Use one group for its project, then add tags for the people, models, or work it connects to.",
    className: "border-b border-white/10 bg-[#20212A]",
  },
  {
    Icon: MagnifyingGlass,
    title: "Find it on demand",
    body: "Search titles and content, then narrow the library by group, tag, or favorite when you need the right prompt.",
    className: "bg-[#20212A] sm:border-r sm:border-white/10",
  },
  {
    Icon: ClockCounterClockwise,
    title: "Use, then improve it",
    body: "Fill variables, copy a ready prompt, and revise it without losing a version that worked before.",
    className: "bg-[#1B1C23]",
  },
];

function TextLink({ to, children }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-2 text-sm font-semibold text-[#E8CFE0] transition-colors hover:text-[#F4F2F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8CFE0] focus-visible:ring-offset-4 focus-visible:ring-offset-[#12131A]"
    >
      {children}
      <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
    </Link>
  );
}

export default function HowItWorksPage() {
  return (
    <MarketingShell>
      <div className="overflow-hidden bg-[#12131A] text-[#F4F2F0]">
        <section className="border-b border-white/10">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-14 pt-24 md:px-8 md:pb-20 lg:grid-cols-12 lg:items-center lg:gap-8">
            <div className="lg:col-span-6">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#D7ACC9]">How it works</p>
              <h1 className="max-w-2xl font-serif text-4xl leading-[1.03] tracking-[-0.035em] text-[#F4F2F0] md:text-6xl">
                Useful prompts should not end at one answer.
              </h1>
              <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-[#C2C0C5] md:text-lg">
                Save the work, make it easy to retrieve, and strengthen the next version each time you use it.
              </p>
              <Link
                to="/features"
                className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#E6D5E0] px-5 text-sm font-semibold text-[#2A1C27] transition-colors hover:bg-[#F4F2F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4F2F0] focus-visible:ring-offset-4 focus-visible:ring-offset-[#12131A]"
              >
                Explore the library
                <ArrowRight size={16} weight="bold" aria-hidden="true" />
              </Link>
            </div>

            <div className="lg:col-span-6 lg:pl-5">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1B1C23] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
                <img
                  src={workflowHeroImage}
                  alt="Prompt cards moving from an open tray into an organized archival file."
                  className="aspect-[16/10] h-full w-full object-cover"
                  width="1672"
                  height="941"
                  fetchPriority="high"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#17181F] py-16 md:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 md:px-8 lg:grid-cols-12 lg:items-start lg:gap-16">
            <div className="max-w-md lg:col-span-4">
              <h2 className="font-serif text-3xl leading-tight tracking-[-0.03em] text-[#F4F2F0] md:text-5xl">
                Make the next prompt easier.
              </h2>
              <p className="mt-5 text-[17px] leading-relaxed text-[#C2C0C5]">
                The library stays simple because each prompt follows the same practical loop.
              </p>
            </div>

            <ol className="grid overflow-hidden rounded-2xl border border-white/10 sm:grid-cols-2 lg:col-span-8" aria-label="PromptNest workflow">
              {WORKFLOW.map(({ Icon, title, body, className }) => (
                <li key={title} className={`min-h-56 p-6 md:p-8 ${className}`}>
                  <Icon size={22} weight="duotone" className="text-[#D7ACC9]" aria-hidden="true" />
                  <h3 className="mt-12 text-xl font-semibold tracking-[-0.02em] text-[#F4F2F0]">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#B8B6BC]">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 md:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <div className="max-w-xl">
              <BracketsCurly size={25} weight="duotone" className="text-[#D7ACC9]" aria-hidden="true" />
              <h2 className="mt-6 font-serif text-3xl leading-tight tracking-[-0.03em] text-[#F4F2F0] md:text-5xl">
                When a pattern repeats, make it a template.
              </h2>
              <p className="mt-6 text-[17px] leading-relaxed text-[#C2C0C5]">
                Keep the parts that stay the same and fill the changing details only when a specific request needs them.
              </p>
              <div className="mt-8">
                <TextLink to="/docs?p=variables">Read about template variables</TextLink>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1B1C23]">
              <img
                src={templateWorkflowImage}
                alt="A reusable prompt card held above a stack of related cards."
                className="aspect-[4/5] h-full w-full object-cover"
                width="1003"
                height="1568"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#17181F] py-16 md:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 md:px-8 lg:grid-cols-12 lg:items-end">
            <div className="max-w-2xl lg:col-span-7">
              <h2 className="font-serif text-3xl leading-tight tracking-[-0.03em] text-[#F4F2F0] md:text-5xl">
                A record of work, not just a clipboard.
              </h2>
              <p className="mt-6 text-[17px] leading-relaxed text-[#C2C0C5]">
                Changes become version history, deleted prompts move to Trash, and export remains available when you want a copy of your library.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-3 lg:col-span-5">
              <div className="border-t border-white/15 pt-4">
                <p className="text-sm font-semibold text-[#F4F2F0]">Restore earlier drafts</p>
                <p className="mt-2 text-sm leading-relaxed text-[#B8B6BC]">Bring back a version that worked.</p>
              </div>
              <div className="border-t border-white/15 pt-4">
                <p className="text-sm font-semibold text-[#F4F2F0]">Recover deleted prompts</p>
                <p className="mt-2 text-sm leading-relaxed text-[#B8B6BC]">Restore work from Trash when needed.</p>
              </div>
              <div className="border-t border-white/15 pt-4">
                <p className="text-sm font-semibold text-[#F4F2F0]">Export the library</p>
                <p className="mt-2 text-sm leading-relaxed text-[#B8B6BC]">Keep a portable copy of your work.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#714B67] py-14 md:py-20">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 md:px-8 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-2xl font-serif text-3xl leading-tight tracking-[-0.03em] text-[#F4F2F0] md:text-5xl">
              Build the library your next task can use.
            </h2>
            <TextLink to="/pricing">See plans and pricing</TextLink>
          </div>
        </section>
      </div>
    </MarketingShell>
  );
}
