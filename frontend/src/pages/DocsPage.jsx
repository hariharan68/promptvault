import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Lock, MagnifyingGlass, House, GithubLogo, Sun, Moon, Copy, Check,
  List, X, ArrowRight, ArrowLeft, TextAlignLeft,
} from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext.jsx";

/* ─────────────────────────────  content primitives  ───────────────────────────── */
const H2 = ({ id, children }) => (
  <h2 id={id} data-toc className="scroll-mt-20 font-serif text-[26px] leading-tight text-[#111827] dark:text-white mt-14 mb-4 first:mt-0">
    {children}
  </h2>
);
const H3 = ({ children }) => (
  <h3 className="font-semibold text-[17px] text-[#111827] dark:text-white mt-8 mb-3">{children}</h3>
);
const P = ({ children }) => (
  <p className="text-[15px] leading-7 text-[#374151] dark:text-[#B4B8C5] mb-4">{children}</p>
);
const Lead = ({ children }) => (
  <p className="text-[18px] leading-8 text-[#4B5563] dark:text-[#C4C8D4] mb-6">{children}</p>
);
const UL = ({ children }) => <ul className="mb-5 space-y-2">{children}</ul>;
const LI = ({ children }) => (
  <li className="flex gap-2.5 text-[15px] leading-7 text-[#374151] dark:text-[#B4B8C5]">
    <span className="mt-[11px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#714B67]" />
    <span className="min-w-0">{children}</span>
  </li>
);
const B = ({ children }) => <strong className="font-semibold text-[#111827] dark:text-white">{children}</strong>;
const Kbd = ({ children }) => (
  <kbd className="rounded border border-[#E5E7EB] dark:border-[#363847] bg-[#F3F4F6] dark:bg-[#252733] px-1.5 py-0.5 font-mono text-[12px] text-[#374151] dark:text-[#C4C8D4]">
    {children}
  </kbd>
);
const Code = ({ children }) => (
  <code className="rounded bg-[#F3F4F6] dark:bg-[#252733] border border-[#E5E7EB] dark:border-[#363847] px-1.5 py-0.5 font-mono text-[13px] text-[#714B67] dark:text-[#C4A0BA] break-words">
    {children}
  </code>
);
const Pre = ({ children }) => (
  <pre className="mb-5 overflow-x-auto rounded-xl border border-[#E5E7EB] dark:border-[#2C2E3A] bg-[#F9FAFB] dark:bg-[#15161C] p-4 font-mono text-[13px] leading-6 text-[#374151] dark:text-[#B4B8C5]">
    <code>{children}</code>
  </pre>
);
const Callout = ({ tone = "note", children }) => {
  const tones = {
    note: "border-[#714B67]/30 bg-[#F3EEF3] dark:bg-[#2A2130] text-[#5A3A52] dark:text-[#C4A0BA]",
    warn: "border-amber-400/40 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300",
    tip: "border-emerald-400/40 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  };
  return <div className={`mb-5 rounded-xl border px-4 py-3 text-[14px] leading-6 ${tones[tone]}`}>{children}</div>;
};
const Steps = ({ children }) => <ol className="mb-6 space-y-3.5">{children}</ol>;
const Step = ({ n, children }) => (
  <li className="flex gap-3 text-[15px] leading-7 text-[#374151] dark:text-[#B4B8C5]">
    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#714B67] text-[12px] font-bold text-white">{n}</span>
    <span className="min-w-0 pt-px">{children}</span>
  </li>
);
const Table = ({ head, rows }) => (
  <div className="mb-5 overflow-x-auto rounded-xl border border-[#E5E7EB] dark:border-[#2C2E3A]">
    <table className="w-full text-left text-[14px]">
      <thead className="bg-[#F9FAFB] dark:bg-[#15161C] text-[#6B7280] dark:text-[#9CA3AF]">
        <tr>{head.map((h) => <th key={h} className="px-4 py-2.5 font-semibold whitespace-nowrap">{h}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#2C2E3A] text-[#374151] dark:text-[#B4B8C5]">
        {rows.map((r, i) => (
          <tr key={i}>{r.map((c, j) => <td key={j} className="px-4 py-2.5 align-top">{c}</td>)}</tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ─────────────────────────────  documentation pages  ───────────────────────────── */
function Welcome() {
  return (
    <>
      <Lead>
        <B>PromptNest</B> is your personal library for AI prompts. Save the prompts you write for
        ChatGPT, Claude, Gemini, or any AI tool once — then find, reuse, and improve them in seconds
        instead of rewriting them from memory.
      </Lead>
      <H2 id="problem">The problem it solves</H2>
      <P>Your best prompts usually live inside chat windows. That creates three everyday frustrations:</P>
      <UL>
        <LI><B>They get lost.</B> A great prompt is buried hundreds of messages deep and impossible to find later.</LI>
        <LI><B>You rewrite them.</B> Without a saved copy you retype prompts from memory — a little worse each time.</LI>
        <LI><B>You can't track changes.</B> When a prompt stops working, there's no history to fall back on.</LI>
      </UL>
      <P>PromptNest gives every prompt a permanent, searchable, organized home so none of that happens.</P>
      <H2 id="what-you-can-do">What you can do with it</H2>
      <UL>
        <LI>Save prompts with a title, notes, and tags so they're easy to find.</LI>
        <LI>Reuse one prompt in many situations using fill-in-the-blank variables.</LI>
        <LI>Search your whole library instantly with a keyboard shortcut.</LI>
        <LI>Organize prompts into groups and mark favorites.</LI>
        <LI>See every past version of a prompt and roll back with one click.</LI>
        <LI>Copy a prompt to your clipboard and track how often you use it.</LI>
        <LI>Import and export your library any time — your prompts stay yours.</LI>
      </UL>
      <H2 id="who">Who it's for</H2>
      <P>
        Anyone who works with AI regularly and wants their prompts organized: developers building AI
        agents and apps, prompt engineers iterating on wording, writers, analysts, and teams who reuse
        the same instructions again and again.
      </P>
      <Callout tone="tip">
        New here? Start with <B>Create your account</B>, then <B>Save your first prompt</B> — you'll have a
        working prompt library in under two minutes.
      </Callout>
    </>
  );
}

function CreateAccount() {
  return (
    <>
      <Lead>Getting into PromptNest takes about thirty seconds. You can use an email and password, or sign in with Google or GitHub.</Lead>
      <H2 id="sign-up">Create an account with email</H2>
      <Steps>
        <Step n={1}>From the landing page, click <B>Get started free</B>.</Step>
        <Step n={2}>Enter a username, your email, and a password (at least 8 characters).</Step>
        <Step n={3}>Click <B>Create Account</B> — you're taken straight to your dashboard.</Step>
      </Steps>
      <H2 id="social">Sign in with Google or GitHub</H2>
      <P>Prefer not to manage another password? On the login or sign-up screen, click <B>Continue with Google</B> or <B>Continue with GitHub</B> and approve access. PromptNest only reads your name and verified email to create your account.</P>
      <Callout tone="note">
        Social sign-in needs a <B>verified email</B> on your Google or GitHub account. If you first signed up
        with email, signing in later with a matching Google/GitHub account links to the same PromptNest account.
      </Callout>
      <H2 id="sign-in-out">Signing in and out</H2>
      <UL>
        <LI><B>Sign in</B> — click <B>Sign in</B> on the landing page and enter your details, or use a social button.</LI>
        <LI><B>Sign out</B> — open the account menu in the top-right of the app and choose <B>Sign out</B>. You'll return to the landing page.</LI>
      </UL>
    </>
  );
}

function Tour() {
  return (
    <>
      <Lead>Here's a quick map of PromptNest so you know where everything lives.</Lead>
      <H2 id="dashboard">Dashboard</H2>
      <P>Your starting point after signing in. It shows an at-a-glance summary of your library and quick links to your most-used and recently edited prompts.</P>
      <H2 id="prompts">Prompts library</H2>
      <P>The main workspace: every prompt you've saved, as cards you can search, filter, open, copy, favorite, or edit. This is where you'll spend most of your time.</P>
      <H2 id="groups">Groups</H2>
      <P>A sidebar of folders you create to keep prompts sorted by project or purpose. Selecting a group filters the library to just that group's prompts.</P>
      <H2 id="palette">Command palette</H2>
      <P>Press <Kbd>⌘K</Kbd> (Mac) or <Kbd>Ctrl K</Kbd> (Windows/Linux) anywhere to jump to any prompt by typing. It's the fastest way to find and reuse something.</P>
      <H2 id="settings">Settings</H2>
      <P>Manage your account: change your password, review active sessions, switch between light and dark mode, export your data, or delete your account.</P>
    </>
  );
}

function FirstPrompt() {
  return (
    <>
      <Lead>Saving a prompt is the core action in PromptNest. Once it's saved, it's searchable, reusable, and versioned forever.</Lead>
      <H2 id="create">Create a prompt</H2>
      <Steps>
        <Step n={1}>Go to the <B>Prompts</B> library and click <B>New Prompt</B>.</Step>
        <Step n={2}>Give it a clear <B>title</B> — this is what you'll search for later (e.g. “Code review expert”).</Step>
        <Step n={3}>Paste the prompt text into the <B>content</B> field.</Step>
        <Step n={4}>Optionally add a short <B>description</B>, a <B>group</B>, and a few <B>tags</B>.</Step>
        <Step n={5}>Click <B>Save</B>. Your prompt now appears as a card in the library.</Step>
      </Steps>
      <H2 id="good-titles">Tips for findable prompts</H2>
      <UL>
        <LI>Use descriptive titles you'd actually search for — the task, not a vague label.</LI>
        <LI>Add a one-line description so future-you remembers what it's for.</LI>
        <LI>Tag by model, purpose, or project so related prompts cluster together.</LI>
      </UL>
      <H2 id="edit">Edit a prompt</H2>
      <P>Open any prompt and click <B>Edit</B> to change its title, content, tags, or group. Every time you save a change, PromptNest quietly records the previous version so you can always go back (see <B>Version history</B>).</P>
    </>
  );
}

function Variables() {
  return (
    <>
      <Lead>
        Variables turn a single prompt into a reusable template. Instead of keeping ten near-identical
        prompts, keep one with fill-in-the-blanks.
      </Lead>
      <H2 id="why">Why use variables</H2>
      <P>
        Say you review code in different languages. Rather than saving a separate prompt for Python, Go,
        and TypeScript, you save <B>one</B> prompt with a placeholder for the language and fill it in each time.
      </P>
      <H2 id="how">How to add variables</H2>
      <Steps>
        <Step n={1}>In the prompt content, wrap any fill-in word in double braces: <Code>{"{{language}}"}</Code>.</Step>
        <Step n={2}>Add as many as you like — <Code>{"{{language}}"}</Code>, <Code>{"{{focus}}"}</Code>, <Code>{"{{code}}"}</Code>.</Step>
        <Step n={3}>Optionally set default values so common cases are pre-filled.</Step>
        <Step n={4}>When you copy the prompt, fill in the blanks for that specific use.</Step>
      </Steps>
      <P>A template might look like this:</P>
      <Pre>{`Review the following {{language}} code for {{focus}}:

{{code}}`}</Pre>
      <Callout tone="tip">Keep variable names short and obvious — <Code>{"{{topic}}"}</Code> is clearer than <Code>{"{{x}}"}</Code>.</Callout>
    </>
  );
}

function CopyUsage() {
  return (
    <>
      <Lead>PromptNest is built around reuse. Copying a prompt is one click, and it quietly learns which prompts matter most to you.</Lead>
      <H2 id="copy">Copy a prompt</H2>
      <P>On any prompt card, click <B>Copy</B>. The full prompt text goes to your clipboard, ready to paste into ChatGPT, Claude, your code, or anywhere else.</P>
      <H2 id="usage">Usage tracking</H2>
      <P>
        Every copy increases that prompt's <B>usage count</B>. Over time this reveals which prompts you
        actually rely on — no manual tracking required.
      </P>
      <H2 id="discover">Discover your top prompts</H2>
      <P>PromptNest surfaces helpful collections so your best work rises to the top:</P>
      <UL>
        <LI><B>Most used</B> — the prompts you copy the most.</LI>
        <LI><B>Recently edited</B> — what you've been refining lately.</LI>
        <LI><B>Favorites</B> — everything you've starred.</LI>
        <LI><B>Recent</B> — your newest additions.</LI>
      </UL>
    </>
  );
}

function Favorites() {
  return (
    <>
      <Lead>Favorites keep the prompts you reach for constantly one click away.</Lead>
      <H2 id="how">How to favorite a prompt</H2>
      <P>Click the <B>star</B> icon on any prompt card or inside the prompt view. Click it again to remove the favorite.</P>
      <H2 id="use">Using favorites</H2>
      <UL>
        <LI>Favorited prompts appear in the <B>Favorites</B> collection for instant access.</LI>
        <LI>Filter the library to show only favorites when you want a focused view.</LI>
      </UL>
      <Callout tone="tip">Star the five or ten prompts you use daily. It turns PromptNest into a one-click launchpad for your go-to instructions.</Callout>
    </>
  );
}

function Versions() {
  return (
    <>
      <Lead>
        Every edit is saved automatically. If a change makes a prompt worse, you can see exactly what it
        looked like before and restore it — no lost work.
      </Lead>
      <H2 id="why">Why it helps</H2>
      <P>Prompts are sensitive: a small wording change can shift the AI's behavior. Version history means you can experiment freely, knowing you can always return to a version that worked.</P>
      <H2 id="how">View and restore a version</H2>
      <Steps>
        <Step n={1}>Open a prompt and choose <B>Version history</B>.</Step>
        <Step n={2}>Browse the list of past versions, newest first.</Step>
        <Step n={3}>Click <B>Restore</B> on the version you want to bring back.</Step>
      </Steps>
      <P>Restoring makes that older version the current one — and, because restoring is itself an edit, your latest text is still kept in history too.</P>
    </>
  );
}

function Trash() {
  return (
    <>
      <Lead>Deleting a prompt isn't permanent right away. Removed prompts go to Trash so an accidental delete is easy to undo.</Lead>
      <H2 id="delete">Delete a prompt</H2>
      <P>Open a prompt and choose <B>Delete</B>. It disappears from your library and search, and moves to Trash.</P>
      <H2 id="restore">Restore from Trash</H2>
      <Steps>
        <Step n={1}>Open the <B>Trash</B> view.</Step>
        <Step n={2}>Find the prompt you removed.</Step>
        <Step n={3}>Click <B>Restore</B> to return it to your library exactly as it was.</Step>
      </Steps>
      <Callout tone="note">While a prompt is in Trash it won't show up in your library, search results, or exports until you restore it.</Callout>
    </>
  );
}

function Groups() {
  return (
    <>
      <Lead>Groups are folders you create to keep prompts sorted by project, client, or workflow.</Lead>
      <H2 id="why">When to use groups</H2>
      <P>Use a group when a set of prompts belongs together — for example <Code>Dev Tools</Code>, <Code>Marketing</Code>, or <Code>Agent Prompts</Code>. A prompt lives in one group at a time, like a file in a folder.</P>
      <H2 id="create">Create and use a group</H2>
      <Steps>
        <Step n={1}>In the Groups sidebar, click <B>New Group</B> and name it.</Step>
        <Step n={2}>Assign a prompt to it when creating or editing the prompt.</Step>
        <Step n={3}>Click a group in the sidebar to see only that group's prompts.</Step>
      </Steps>
      <H2 id="manage">Rename or delete</H2>
      <P>Open a group's menu to rename it or delete it. Deleting a group doesn't delete its prompts — they simply become ungrouped.</P>
    </>
  );
}

function Tags() {
  return (
    <>
      <Lead>Tags are flexible labels for filtering. Where a prompt has just one group, it can have many tags.</Lead>
      <H2 id="why">Groups vs tags</H2>
      <Table
        head={["", "Groups", "Tags"]}
        rows={[
          ["Think of it as", "A folder", "A sticky label"],
          ["How many per prompt", "One", "Many"],
          ["Best for", "Projects / workflows", "Cross-cutting themes"],
        ]}
      />
      <H2 id="how">Add and filter by tags</H2>
      <Steps>
        <Step n={1}>While creating or editing a prompt, type tag names (e.g. <Code>gpt-4</Code>, <Code>eval</Code>, <Code>python</Code>).</Step>
        <Step n={2}>New tags are created automatically as you type them.</Step>
        <Step n={3}>Click a tag anywhere to filter the library to prompts that share it.</Step>
      </Steps>
      <Callout tone="tip">Tag by things that cut across projects — the AI model, the language, or the purpose — so related prompts surface together no matter which group they're in.</Callout>
    </>
  );
}

function Search() {
  return (
    <>
      <Lead>The bigger your library gets, the more search matters. PromptNest is built to find any prompt in seconds.</Lead>
      <H2 id="palette">The command palette</H2>
      <P>Press <Kbd>⌘K</Kbd> or <Kbd>Ctrl K</Kbd> from anywhere in the app. Start typing part of a prompt's title or text, then press <B>Enter</B> to open it — all without leaving the keyboard.</P>
      <H2 id="filter">Filter the library</H2>
      <P>In the Prompts library you can narrow results by combining:</P>
      <UL>
        <LI>A <B>search term</B> across titles, descriptions, and content.</LI>
        <LI>A <B>group</B>.</LI>
        <LI>A <B>tag</B>.</LI>
        <LI><B>Favorites only</B>.</LI>
      </UL>
      <H2 id="share">Shareable views</H2>
      <P>Filtered views are reflected in the page address, so you can bookmark a specific view — like “all favorites tagged <Code>agents</Code>” — and return to it instantly.</P>
    </>
  );
}

function ImportExport() {
  return (
    <>
      <Lead>Your prompts are always portable. Bring existing prompts in, and take your whole library out whenever you want.</Lead>
      <H2 id="import">Import prompts</H2>
      <Steps>
        <Step n={1}>Open <B>Settings</B> (or the library's import option) and choose <B>Import</B>.</Step>
        <Step n={2}>Select a JSON file of prompts — each item just needs the prompt text; titles, tags, and variables are optional.</Step>
        <Step n={3}>Confirm, and the prompts are added to your library.</Step>
      </Steps>
      <H2 id="export">Export your library</H2>
      <P>Export all your prompts in the format that fits your need:</P>
      <Table
        head={["Format", "Best for"]}
        rows={[
          ["JSON", "Backups and re-importing later — keeps everything."],
          ["CSV", "Opening in a spreadsheet for review."],
          ["Markdown", "A readable document you can share or print."],
        ]}
      />
      <Callout tone="tip">Export a JSON backup periodically. It's the simplest way to keep a personal copy of your entire prompt library.</Callout>
    </>
  );
}

function Account() {
  return (
    <>
      <Lead>Everything about your account lives in <B>Settings</B>.</Lead>
      <H2 id="password">Change your password</H2>
      <P>In Settings, enter your current password and a new one to update it. (Accounts created only through Google or GitHub sign-in don't use a password.)</P>
      <H2 id="sessions">Manage active sessions</H2>
      <P>See where you're signed in and, if you ever need to, <B>sign out everywhere</B> at once — useful if you used a shared or public computer.</P>
      <H2 id="theme">Light &amp; dark mode</H2>
      <P>Toggle between light and dark themes from the app or these docs. Your choice is remembered.</P>
      <H2 id="data">Export or delete your data</H2>
      <UL>
        <LI><B>Export account data</B> — download a copy of your account and prompts.</LI>
        <LI><B>Delete account</B> — permanently remove your account and all its data. This can't be undone.</LI>
      </UL>
      <Callout tone="warn">Deleting your account is permanent. Export a backup first if you might want your prompts later.</Callout>
    </>
  );
}

function UseCases() {
  return (
    <>
      <Lead>PromptNest fits naturally into a few common workflows. Here's how people put it to work.</Lead>
      <H2 id="agents">Building AI agents</H2>
      <P>
        Agent developers keep system prompts, tool descriptions, and reasoning templates in PromptNest.
        When an agent's behavior changes unexpectedly, version history shows exactly what the prompt used
        to say — and one click restores it. Group everything under an <Code>Agents</Code> group and tag by
        framework so related prompts stay together.
      </P>
      <H2 id="prompt-engineering">Prompt engineering</H2>
      <P>
        When you're iterating on wording, save each promising variation and let usage counts and version
        history tell you what actually worked. Instead of a messy doc of “v2 final FINAL”, you get a clean,
        searchable trail of every attempt.
      </P>
      <H2 id="apps">Everyday AI work</H2>
      <P>
        Writers, analysts, and support teams save the instructions they reuse constantly — summarizers,
        rewriters, tone adjusters — as templates with variables. A quick <Kbd>⌘K</Kbd> search and one copy
        drops the right prompt into whatever tool they're using.
      </P>
      <Callout tone="tip">Whatever your workflow, the pattern is the same: <B>save once, tag it, then search-and-copy</B> forever after.</Callout>
    </>
  );
}

function Tips() {
  return (
    <>
      <Lead>A few habits that make PromptNest even more useful.</Lead>
      <H2 id="shortcuts">Handy shortcuts</H2>
      <UL>
        <LI><Kbd>⌘K</Kbd> / <Kbd>Ctrl K</Kbd> — open the command palette to jump to any prompt.</LI>
        <LI>Click a tag to instantly filter to related prompts.</LI>
        <LI>Star your daily prompts so they're one click away.</LI>
      </UL>
      <H2 id="best-practices">Best practices</H2>
      <UL>
        <LI>Write descriptive titles — you'll search by them later.</LI>
        <LI>Turn repeated prompts into templates with variables instead of copies.</LI>
        <LI>Keep an occasional JSON export as a personal backup.</LI>
      </UL>
      <H2 id="faq">FAQ</H2>
      <H3>Is PromptNest free?</H3>
      <P>Yes — it's free while in beta. A Pro plan is planned for the future.</P>
      <H3>Does PromptNest run my prompts?</H3>
      <P>No. PromptNest stores and organizes your prompts; you copy them into whichever AI tool you use.</P>
      <H3>Can other people see my prompts?</H3>
      <P>No. Your prompts, groups, and tags are private to your account.</P>
      <H3>Which AI tools does it work with?</H3>
      <P>Any of them. Because prompts are just text you copy, PromptNest works with ChatGPT, Claude, Gemini, and any other tool.</P>
    </>
  );
}

/* ─────────────────────────────  page registry  ───────────────────────────── */
const PAGES = [
  { id: "welcome", group: "Getting Started", title: "Welcome to PromptNest", Component: Welcome },
  { id: "create-account", group: "Getting Started", title: "Create your account", Component: CreateAccount },
  { id: "tour", group: "Getting Started", title: "A quick tour", Component: Tour },

  { id: "first-prompt", group: "Working with Prompts", title: "Save your first prompt", Component: FirstPrompt },
  { id: "variables", group: "Working with Prompts", title: "Template variables", Component: Variables },
  { id: "copy-usage", group: "Working with Prompts", title: "Copy & usage tracking", Component: CopyUsage },
  { id: "favorites", group: "Working with Prompts", title: "Favorites", Component: Favorites },
  { id: "versions", group: "Working with Prompts", title: "Version history", Component: Versions },
  { id: "trash", group: "Working with Prompts", title: "Delete & restore", Component: Trash },

  { id: "groups", group: "Organizing", title: "Organize with groups", Component: Groups },
  { id: "tags", group: "Organizing", title: "Label with tags", Component: Tags },
  { id: "search", group: "Organizing", title: "Find anything fast", Component: Search },
  { id: "import-export", group: "Organizing", title: "Import & export", Component: ImportExport },

  { id: "account", group: "Your Account", title: "Manage your account", Component: Account },

  { id: "use-cases", group: "Guides", title: "Use cases & workflows", Component: UseCases },
  { id: "tips", group: "Guides", title: "Tips & FAQ", Component: Tips },
];

const GROUP_ORDER = ["Getting Started", "Working with Prompts", "Organizing", "Your Account", "Guides"];

/* ─────────────────────────────  main page  ───────────────────────────── */
export default function DocsPage() {
  const { theme, toggle } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const contentRef = useRef(null);
  const searchRef = useRef(null);

  const initial = searchParams.get("p");
  const [activeId, setActiveId] = useState(
    PAGES.some((p) => p.id === initial) ? initial : PAGES[0].id,
  );
  const [query, setQuery] = useState("");
  const [toc, setToc] = useState([]);
  const [activeHeading, setActiveHeading] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeIndex = PAGES.findIndex((p) => p.id === activeId);
  const active = PAGES[activeIndex];
  const ActiveComponent = active.Component;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PAGES;
    return PAGES.filter(
      (p) => p.title.toLowerCase().includes(q) || p.group.toLowerCase().includes(q),
    );
  }, [query]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((p) => { (map[p.group] ||= []).push(p); });
    return GROUP_ORDER.filter((g) => map[g]).map((g) => [g, map[g]]);
  }, [filtered]);

  // Keep URL (?p=) in sync and reset scroll when the page changes.
  useEffect(() => {
    setSearchParams({ p: activeId }, { replace: true });
    window.scrollTo({ top: 0 });
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build the "On this page" TOC from the rendered headings.
  useEffect(() => {
    const build = () => {
      const nodes = contentRef.current?.querySelectorAll("[data-toc]") ?? [];
      setToc(Array.from(nodes).map((n) => ({ id: n.id, label: n.textContent })));
    };
    const raf = requestAnimationFrame(build);
    return () => cancelAnimationFrame(raf);
  }, [activeId]);

  // Scroll-spy: highlight the heading currently in view.
  useEffect(() => {
    const nodes = contentRef.current?.querySelectorAll("[data-toc]");
    if (!nodes?.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActiveHeading(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [toc]);

  // ⌘K / Ctrl+K focuses search.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (id) => { setActiveId(id); setNavOpen(false); };
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const copyPage = async () => {
    const text = contentRef.current?.innerText ?? "";
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };

  const SidebarNav = () => (
    <nav className="flex flex-col gap-6">
      {grouped.map(([group, pages]) => (
        <div key={group}>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9CA3AF] dark:text-[#6B7280]">
            {group}
          </p>
          <div className="flex flex-col">
            {pages.map((p) => {
              const on = p.id === activeId;
              return (
                <button
                  key={p.id}
                  onClick={() => go(p.id)}
                  className={`rounded-lg px-3 py-1.5 text-left text-[14px] transition-colors ${
                    on
                      ? "bg-[#F3EEF3] dark:bg-[#2A2130] font-medium text-[#714B67] dark:text-[#C4A0BA]"
                      : "text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#22242E]"
                  }`}
                >
                  {p.title}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {grouped.length === 0 && (
        <p className="px-3 text-sm text-[#9CA3AF]">No results for “{query}”.</p>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#1A1B22]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 h-14 border-b border-[#E5E7EB] dark:border-[#2C2E3A] bg-white/90 dark:bg-[#1A1B22]/90 backdrop-blur">
        <div className="mx-auto flex h-full max-w-[1400px] items-center gap-4 px-4">
          <button onClick={() => setNavOpen((v) => !v)} className="lg:hidden -ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] dark:hover:bg-[#22242E]">
            {navOpen ? <X size={18} /> : <List size={18} />}
          </button>
          <Link to="/docs" onClick={() => go(PAGES[0].id)} className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#714B67]">
              <Lock size={13} weight="bold" className="text-white" />
            </div>
            <span className="font-serif text-[16px] tracking-tight text-[#111827] dark:text-white">
              PromptNest <span className="text-[#9CA3AF] dark:text-[#6B7280]">Docs</span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-1.5">
            <div className="relative hidden sm:block">
              <MagnifyingGlass size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="h-9 w-44 rounded-full border border-[#E5E7EB] dark:border-[#363847] bg-[#F3F4F6] dark:bg-[#252733] pl-8 pr-9 text-[13px] text-[#111827] dark:text-[#E5E7EB] placeholder:text-[#9CA3AF] focus:border-[#714B67]/50 focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 md:w-56"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-[#E5E7EB] dark:border-[#363847] bg-white dark:bg-[#1A1B22] px-1 text-[10px] font-mono text-[#ADB5BD]">⌘K</kbd>
            </div>
            <Link to="/" className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white md:flex">
              <House size={14} /> Home
            </Link>
            <a href="#" className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white md:flex">
              <GithubLogo size={14} /> GitHub
            </a>
            <button onClick={toggle} title="Toggle theme" className="flex h-9 w-9 items-center justify-center rounded-full text-[#6B7280] hover:bg-[#F3F4F6] dark:hover:bg-[#22242E]">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link to="/login" className="ml-1 hidden rounded-full bg-[#714B67] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[#5A3A52] sm:block">
              Open App
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {navOpen && (
        <div className="lg:hidden border-b border-[#E5E7EB] dark:border-[#2C2E3A] bg-white dark:bg-[#1A1B22] px-4 py-5 max-h-[70vh] overflow-y-auto">
          <SidebarNav />
        </div>
      )}

      <div className="mx-auto max-w-[1400px] px-4 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[15rem_minmax(0,1fr)_14rem]">
        {/* Left sidebar */}
        <aside className="hidden lg:block sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-8 pr-2">
          <SidebarNav />
        </aside>

        {/* Main content */}
        <main className="min-w-0 py-10">
          <div className="mb-6 flex items-start justify-between gap-4">
            <h1 className="font-serif text-[40px] leading-tight tracking-tight text-[#111827] dark:text-white">
              {active.title}
            </h1>
            <button
              onClick={copyPage}
              className="mt-2 flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#363847] bg-white dark:bg-[#252733] px-3 py-1.5 text-[13px] text-[#4B5563] dark:text-[#9CA3AF] hover:border-[#714B67]/40 hover:text-[#714B67] dark:hover:text-[#C4A0BA]"
            >
              {copied ? <Check size={14} weight="bold" className="text-emerald-500" /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <article ref={contentRef} className="max-w-2xl">
            <ActiveComponent />
          </article>

          {/* Prev / next */}
          <div className="mt-16 flex items-center justify-between gap-4 border-t border-[#E5E7EB] dark:border-[#2C2E3A] pt-6 max-w-2xl">
            {activeIndex > 0 ? (
              <button onClick={() => go(PAGES[activeIndex - 1].id)} className="group flex items-center gap-2 text-[14px] text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#714B67] dark:hover:text-[#C4A0BA]">
                <ArrowLeft size={15} /> <span>{PAGES[activeIndex - 1].title}</span>
              </button>
            ) : <span />}
            {activeIndex < PAGES.length - 1 ? (
              <button onClick={() => go(PAGES[activeIndex + 1].id)} className="group ml-auto flex items-center gap-2 text-right text-[14px] text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#714B67] dark:hover:text-[#C4A0BA]">
                <span>{PAGES[activeIndex + 1].title}</span> <ArrowRight size={15} />
              </button>
            ) : <span />}
          </div>
        </main>

        {/* Right "on this page" */}
        <aside className="hidden xl:block sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-10">
          {toc.length > 0 && (
            <>
              <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9CA3AF] dark:text-[#6B7280]">
                <TextAlignLeft size={13} /> On this page
              </p>
              <div className="flex flex-col gap-1.5 border-l border-[#E5E7EB] dark:border-[#2C2E3A]">
                {toc.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => scrollTo(t.id)}
                    className={`-ml-px border-l pl-3 text-left text-[13px] leading-5 transition-colors ${
                      activeHeading === t.id
                        ? "border-[#714B67] text-[#714B67] dark:text-[#C4A0BA]"
                        : "border-transparent text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
