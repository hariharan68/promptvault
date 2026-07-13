# PromptNest — The Complete Guide

**Save the good prompts you type into AI agents, and reuse them later by name.**

Think of PromptNest as a personal library for your best prompts. Every prompt is
a plain text file on your own computer (under `~/.promptnest/`). There is no
server, no login, no cloud. If you can open a folder in your editor, you can read
and edit everything PromptNest stores.

This guide takes you from zero to fluent. Read it top to bottom the first time;
after that, use it as a lookup.

---

## Table of contents

1. [Why PromptNest exists](#1-why-promptnest-exists)
2. [The 60-second mental model](#2-the-60-second-mental-model)
3. [Installing and first-time setup](#3-installing-and-first-time-setup)
4. [Your first prompt (saving)](#4-your-first-prompt-saving)
5. [Saving long prompts safely (files & pipes)](#5-saving-long-prompts-safely-files--pipes)
6. [Variables: reusable templates](#6-variables-reusable-templates)
7. [Finding and using saved prompts](#7-finding-and-using-saved-prompts)
8. [The watcher: saving prompts by recency](#8-the-watcher-saving-prompts-by-recency)
9. [Using PromptNest from inside your AI agent](#9-using-promptnest-from-inside-your-ai-agent)
10. [Where your data lives](#10-where-your-data-lives)
11. [Full command reference](#11-full-command-reference)
12. [Recipes: real-world workflows](#12-recipes-real-world-workflows)
13. [Troubleshooting](#13-troubleshooting)
14. [Glossary](#14-glossary)

---

## 1. Why PromptNest exists

You spend time crafting a great prompt — a code-review checklist, a "explain this
like I'm five" template, a full spec for a backend feature. Then it scrolls out of
your chat history and is gone. Next week you rewrite it from scratch.

PromptNest fixes that. You **save** the prompt once, give it a name, and **reuse**
it forever — optionally with fill-in-the-blank **variables** so one saved template
covers many situations.

---

## 2. The 60-second mental model

There are only five verbs to learn:

| Verb | What it does | Example |
|------|--------------|---------|
| **save** | Put a prompt into your library | `pn save "Review my code" -t "Review"` |
| **list** | Show everything you've saved | `pn list` |
| **search** | Find a saved prompt by word | `pn search jwt` |
| **get** | Print one saved prompt | `pn get 2026-07-12_jwt-auth` |
| **use** | Print one prompt, filling in blanks | `pn use lang-review --var language=Python` |

Everything else (`count`, `open`, `init`, `rebuild-index`, `log`) is support
machinery. If you only remember `save`, `search`, and `use`, you can already use
the tool well.

**The loop:** `save` → `search`/`list` → `get`/`use`. That's the whole product.

---

## 3. Installing and first-time setup

PromptNest is a small Node.js command-line tool. You need **Node.js 18 or newer**.

### Option A — run it without installing (simplest)

```bash
npx promptnest help
```

`npx` downloads and runs it on demand. Good for trying it out.

### Option B — get a global `pn` command (recommended for daily use)

From inside the `promptnest` project folder, run once:

```bash
npm link
```

Now you can type `pn …` (or the longer `promptnest …`) from **any** folder on
this machine. Every example in this guide uses `pn`.

> `npm link` is a one-time setup **per machine**. A teammate who clones the repo
> runs it themselves, or just uses `npx promptnest …`.

### Set up the vault

```bash
pn init
```

This creates your vault at `~/.promptnest/` and (for Claude Code) installs a few
slash commands into the current project. It also prints a **watcher hook** snippet
— see [section 8](#8-the-watcher-saving-prompts-by-recency) for what that's for.
You can safely ignore the hook at first and add it later.

---

## 4. Your first prompt (saving)

The simplest save is a quoted string plus a title:

```bash
pn save "Summarize this article in 5 bullet points" -t "Article summary"
```

You'll see:

```
saved C:\Users\you\.promptnest\prompts\inbox\2026-07-12_article-summary.md
  id: 2026-07-12_article-summary  group: inbox
```

That **id** (`2026-07-12_article-summary`) is the name you'll use later to fetch it.

### The save options (short flag → meaning)

| Short | Long | Meaning | Example |
|-------|------|---------|---------|
| `-t` | `--title` | A human name for the prompt | `-t "Lang review"` |
| `-k` | `--keywords` | Comma-separated tags for search | `-k review,security` |
| `-g` | `--group` | A folder to file it under | `-g code-review` |
| `-d` | `--desc` | A one-line description | `-d "For PR reviews"` |
| `-f` | `--file` | Read the prompt body from a file | `-f prompt.txt` |
| `-i` | `--interactive` | Ask me for each field, one at a time | `-i` |

A fully specified save:

```bash
pn save "Review this {{language}} code for {{focus}}" \
  -t "Lang review" \
  -k review,security \
  -g code-review \
  -d "Quick language-specific code review"
```

Notes that will save you grief:

- **Titles and groups can have spaces** — just quote them: `-g "Code Review"`.
- **Keywords are split on commas**, and surrounding spaces are trimmed
  automatically: `-k "JWT , AUTH , SECURITY"` becomes `[JWT, AUTH, SECURITY]`.
- If you **omit `-t`**, PromptNest uses the first line of your prompt as the title.
- If you **omit `-g`**, the prompt goes into the `inbox` group.

### Guided save (no flags to remember)

Don't want to remember flags? Let PromptNest ask you:

```bash
pn save -i
```

It walks you through **text → title → keywords → group → description**, one
question at a time. (For a multi-line prompt body, type your lines and finish with
a single empty line.)

---

## 5. Saving long prompts safely (files & pipes)

> **Read this if you have ever seen a long prompt get cut off.**

When you type `pn save "…a really long prompt…"` directly in a terminal, the
prompt travels as a **command-line argument**. Terminals cap how much text a
single command line can hold. Paste something big and the terminal silently
**truncates** it — PromptNest then saves only the part that survived. This is a
terminal limitation, not a PromptNest one.

The robust fix: don't cram a large prompt onto the command line. Feed it in from a
**file** or a **pipe** instead. These have no practical size limit.

### From a file (`-f` / `--file`)

Put your prompt in a text file, then:

```bash
pn save --file prompt.txt -t "JWT Auth" -k JWT,AUTH,SECURITY -g JWT
```

The entire file becomes the prompt body — no matter how long.

### From a pipe (stdin)

**macOS / Linux (bash):**

```bash
pn save -t "JWT Auth" -g JWT < prompt.txt
```

**Windows PowerShell:**

```powershell
Get-Content prompt.txt -Raw | pn save -t "JWT Auth" -g JWT
```

Rule of thumb: **short prompt → inline quotes are fine. Long or multi-line prompt
→ use `--file` or a pipe.** That single habit permanently avoids truncation.

---

## 6. Variables: reusable templates

A saved prompt can contain **placeholders** written as `{{name}}`. PromptNest
detects them automatically when you save, and you fill them in when you use the
prompt. One template then serves every variation.

Save a template with two variables:

```bash
pn save "Review this {{language}} code for {{focus}}" -t "Lang review" -g code-review
```

Use it, filling the blanks:

```bash
pn use 2026-07-12_lang-review --var language=Python --var focus=security
```

Output:

```
Review this Python code for security
```

Same template, different values:

```bash
pn use 2026-07-12_lang-review --var language=Rust --var focus="memory safety"
# → Review this Rust code for memory safety
```

- Use `--var name=value` **once per variable**.
- Wrap values with spaces in quotes: `--var focus="memory safety"`.
- If you **forget** a variable, PromptNest leaves the `{{placeholder}}` in place and
  warns you: `[missing variables: focus]`. Nothing breaks — you just see what's
  unfilled.

A prompt with **no** `{{variables}}` doesn't need `--var` at all; `pn use` then
behaves just like `pn get`.

---

## 7. Finding and using saved prompts

### List everything

```bash
pn list
```

Filter to one group or one keyword:

```bash
pn list -g JWT
pn list --keyword security
```

### Search by word

`search` looks across titles, keywords, descriptions, and the prompt body, and
ranks the best matches first:

```bash
pn search jwt
```

### Print a prompt

```bash
pn get 2026-07-12_jwt-auth
```

`get` prints the body exactly as saved — ready to copy and paste into any agent.

> **Tip:** you don't have to type the whole id. `pn get jwt-auth` works too —
> PromptNest matches on any id that contains what you typed.

### `get` vs `use` — what's the difference?

- **`get`** is a pure read. It prints the prompt and changes nothing.
- **`use`** is "I'm running this now." It fills any `{{variables}}`, bumps the
  prompt's **uses** counter (so you can see which prompts you actually rely on),
  and updates the `updated` timestamp.

For a prompt with no variables, either works. Reach for `use` when there are
blanks to fill or when you want usage tracked.

---

## 8. The watcher: saving prompts by recency

This is the "magic" feature — but it's **optional** and only fully automatic in
**Claude Code**.

### What it is

PromptNest can passively **watch** the prompts you type into your agent and log
them to a history file (`~/.promptnest/history.jsonl`). Later, you can promote any
recent one into your library **without retyping it**:

```bash
pn save -1     # save the most recent prompt you typed
pn save -2     # save the 2nd-most-recent
pn save -3     # ...and so on
```

`pn count` tells you how much history you've captured and how many prompts you've
saved:

```
history: 13   saved: 3
```

- **history** = raw prompts the watcher has logged (capped at the last 500).
- **saved** = prompts you've deliberately promoted into your library.

### How to turn it on (Claude Code)

`pn init` prints a **hook** snippet. Add it to your Claude Code `settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      { "hooks": [ { "type": "command", "command": "npx -y promptnest log" } ] }
    ]
  }
}
```

After that, every prompt you submit is quietly logged, and `pn save -N` works.
The `log` command is intentionally silent and never blocks or delays your prompt.

> **Cursor / Codex:** there's no auto-watch hook, so `-N` recency isn't available.
> Everything else (`save "text"`, `--file`, `list`, `search`, `use`) works
> identically.

---

## 9. Using PromptNest from inside your AI agent

`pn init` installs three **slash commands** for Claude Code so you rarely touch the
terminal:

| Slash command | What it does |
|---------------|--------------|
| `/promptsave` | Save the prompt you just wrote, then ask you for description/keywords/group |
| `/savepromt -2` | Save an earlier prompt by recency (e.g. the 2nd-most-recent) |
| `/promptnest [query]` | Browse or search your library; offer to `use` one |

The recommended agent workflow: **before** you hand-write a reusable prompt,
checklist, or template, search your library first — you may already have a better
version saved. If you write a good new one, save it with `/promptsave`.

---

## 10. Where your data lives

Everything is plain text under `~/.promptnest/`:

```
~/.promptnest/
├── config.json               # your settings (default group, editor, history cap)
├── history.jsonl             # the watcher log (powers `save -N`)
├── index.json                # machine-readable index (for fast list/search)
├── INDEX.md                  # human-readable index — open it in any editor
└── prompts/
    └── <group>/
        └── <id>.md           # one file per saved prompt
```

Each prompt file is Markdown with a small header (frontmatter) and your prompt body:

```markdown
---
id: 2026-07-12_jwt-auth
title: JWT Auth
description: ""
keywords: [JWT, AUTH, SECURITY]
group: JWT
source: file
created: 2026-07-12T09:15:00.000Z
updated: 2026-07-12T09:15:00.000Z
uses: 0
variables: []
---
Implement JWT-based authentication for my Node.js + Express + PostgreSQL backend.
...
```

Because it's all plain text, you can:

- **Open the folder** in your editor: `pn open`
- **Read the index**: open `~/.promptnest/INDEX.md`
- **Edit prompts by hand** (then run `pn rebuild-index` to refresh the indexes)
- **Put it in git**, sync it, or back it up like any other folder

**Change where the vault lives** by setting the `PROMPTNEST_DIR` environment
variable (or passing `--dir <path>` to any command). Handy for a project-local or
test vault.

---

## 11. Full command reference

```
pn init [-a claude]              Set up the vault + install agent slash commands.
pn log                           (Hook) Append a piped prompt to history. Silent.
pn save ["text"] [options]       Save a prompt. See below for how text is chosen.
pn list [-g group] [--keyword k] List saved prompts (optionally filtered).
pn search "<query>"              Search titles, keywords, descriptions, and bodies.
pn get <id>                      Print one prompt's body exactly as saved.
pn use <id> [--var k=v ...]      Fill {{variables}} and print; tracks usage.
pn count                         Show history depth and saved count.
pn open                          Open the vault folder in your editor.
pn rebuild-index                 Regenerate index.json + INDEX.md (after hand-edits).
pn help                          Show built-in help.
```

### How `save` decides what to save

When you run `save`, PromptNest looks for the prompt body in this **priority
order** and uses the first one it finds:

1. `--text "…"` (explicit flag)
2. `--file <path>` (read the file)
3. A plain quoted positional argument: `pn save "…"`
4. **Piped stdin** (`… | pn save …` or `pn save … < file`)
5. **Interactive** (`-i`, or a human running a bare `pn save` on an empty vault)
6. **Recency** from the watcher: `-N` (e.g. `-2`), defaulting to `-1`

### Flags

**Save flags:** `-t/--title`, `-k/--keywords`, `-g/--group`, `-d/--desc`,
`-f/--file`, `-i/--interactive`, `-N` (recency, e.g. `-2`).

**Use flag:** `--var name=value` (repeat once per variable).

**Global flags (work on any command):**

- `--json` / `-j` — machine-readable JSON output (great for scripting).
- `--quiet` / `-q` — suppress the friendly confirmation lines.
- `--dir <path>` — use a different vault folder for this one command.

### Exit codes (for scripting)

- `0` — success.
- `1` — bad usage (e.g. empty prompt text, missing search query).
- `2` — not found / out of range (e.g. `pn get badid`, `pn save -99` with only 3
  in history, or `--file` pointing at a missing file).

---

## 12. Recipes: real-world workflows

**Save a big multi-line spec from a file:**

```bash
# 1. paste your spec into spec.txt in your editor
pn save --file spec.txt -t "Backend feature spec" -k spec,backend -g specs
```

**Turn a one-off prompt into a reusable template:** save it with `{{blanks}}`,
then fill them each time.

```bash
pn save "Write a {{tone}} email to {{recipient}} about {{topic}}" -t "Email draft" -g writing
pn use email-draft --var tone=friendly --var recipient="the team" --var topic="the launch"
```

**Promote something you typed 3 prompts ago (Claude Code, watcher on):**

```bash
pn count            # check history depth first
pn save -3 -t "Nice refactor prompt" -g refactoring
```

**Find and reuse in one flow:**

```bash
pn search review            # locate it
pn use lang-review --var language=Go --var focus=concurrency
```

**Keep a project-local vault (not your global one):**

```bash
pn --dir ./team-prompts list
# or, for a whole session:
export PROMPTNEST_DIR=./team-prompts   # PowerShell: $env:PROMPTNEST_DIR = "./team-prompts"
```

---

## 13. Troubleshooting

**"My long prompt got cut off / truncated."**
The terminal truncated it before PromptNest saw it. Save from a file or a pipe
instead — see [section 5](#5-saving-long-prompts-safely-files--pipes). PromptNest
itself has no length limit.

**`pn: command not found`**
You haven't linked it. Run `npm link` inside the `promptnest` folder, or use
`npx promptnest …`, or `node bin/pn.js …` from the project.

**`nothing to save (empty prompt text)`**
PromptNest received no body — often an empty file, an empty pipe, or an over-
truncated argument. Check your input source.

**`no prompt at -N; only X captured`**
You asked for a recency slot deeper than your history. Run `pn count` to see how
many prompts are captured, and pick a smaller `-N`.

**`prompt not found: <id>`**
The id doesn't match. Run `pn list` to see exact ids — remember you can match on a
partial id (`pn get jwt` finds `2026-07-12_jwt-auth`).

**`save -N` does nothing / history is empty.**
The watcher hook isn't installed, or you're not in Claude Code. See
[section 8](#8-the-watcher-saving-prompts-by-recency). In Cursor/Codex, save with a
quoted string or `--file` instead.

**I edited a prompt file by hand and `list` looks stale.**
Run `pn rebuild-index` to regenerate the indexes from the files on disk.

---

## 14. Glossary

- **Vault** — the folder holding all your data (`~/.promptnest/` by default).
- **Prompt / record** — one saved prompt: a Markdown file with a header + body.
- **id** — the auto-generated name of a prompt, like `2026-07-12_jwt-auth`. This is
  what you pass to `get` and `use`.
- **Group** — a folder that organizes related prompts (e.g. `code-review`, `JWT`).
- **Keywords** — comma-separated tags that make a prompt easier to `search`.
- **Variable** — a `{{placeholder}}` in a prompt body, filled at use-time with
  `--var name=value`.
- **Frontmatter** — the small `--- … ---` header at the top of each prompt file
  holding its metadata (title, keywords, group, timestamps, usage count).
- **History** — the watcher's raw log of prompts you've typed, powering `save -N`.
- **Watcher / hook** — the `UserPromptSubmit` hook that pipes each prompt to
  `pn log`. Optional; Claude Code only.
- **Index** — `INDEX.md` (for humans) and `index.json` (for the tool), regenerated
  automatically so `list`/`search`/`count` stay instant.

---

*PromptNest stores everything as plain text on your machine. Nothing leaves your
computer unless you choose to sync or share the folder yourself.*
