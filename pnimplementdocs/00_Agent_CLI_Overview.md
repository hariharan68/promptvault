# PromptNest — Local Prompt-Capture Skill for AI Agents (Overview & Feasibility)

> **Status:** design report (no code changed). Part of the `implementdocs/` set.
> **Companion docs:** [`01_Architecture_and_Design.md`](01_Architecture_and_Design.md) · [`02_Implementation_Plan.md`](02_Implementation_Plan.md) · [`03_Use_Case_Install_and_Use.md`](03_Use_Case_Install_and_Use.md) · [`04_Appendix_API_Bridge.md`](04_Appendix_API_Bridge.md)

---

## 1. The idea in one line

> **Graphify turns your *repo* into a queryable graph any AI assistant can read.
> PromptNest lets you *capture the good prompts you actually type* — straight from the chat, into local files — and reuse them by name across Claude Code, Cursor, and Codex.**

It runs entirely **locally** (plain files, no server, no database), installs via **`npx`**, and is driven by **slash commands** like `/promptsave` and `/promptnest`.

## 2. The problem

You write a genuinely good prompt *inside the agent* — a review checklist, a refactor instruction, a commit-message format — it works great… and then it's gone, buried in scroll-back. Next week you half-remember it and rewrite it worse.

PromptNest **watches the prompts you send** and lets you save the good ones in one keystroke, tagged and grouped, as local markdown files you own forever.

## 3. How it feels to use

```
You:  (write a great review prompt, agent uses it)
You:  /promptsave           ← saves your latest prompt
Skill: "Saved. Description? Keywords? Group?"
You:  "lang-aware review; review,security; code-review"
        → written to ~/.promptnest/prompts/code-review/2026-07-12_lang-review.md

Later, in ANY project:
You:  /promptnest review    ← lists/searches your saved review prompts
You:  "use my lang-aware review prompt on this file"
        → agent pulls the saved prompt, fills {{variables}}, applies it
```

And because the skill **counts every prompt you send**, you can reach back in time:

```
/savepromt -1     ← save the latest prompt
/savepromt -2     ← save the one before that
/savepromt -3     ← three prompts back
```

## 4. What makes it work: watch → capture → index → reuse

| Stage | What happens | Where |
|---|---|---|
| **Watch** | A hook logs every prompt you send, with a timestamp | `~/.promptnest/history.jsonl` |
| **Capture** | `/promptsave` / `/savepromt -N` promotes a logged prompt into a saved file with description + keywords + group (auto-creates the group folder) | `~/.promptnest/prompts/<group>/<file>.md` |
| **Index** | A human `INDEX.md` and a machine `index.json` are updated so listing, counting, and search stay instant | `~/.promptnest/INDEX.md` + `index.json` |
| **Reuse** | `/promptnest`, search, and `use` fetch a saved prompt and fill its `{{variables}}` | any agent |

This is the exact pattern a well-run memory system uses — **individual markdown files + one index file** — which is proven to scale to hundreds of entries while staying human-readable.

## 5. Feasibility verdict — **YES, and it's simpler than the API route**

Everything it needs already exists as primitives:

- **Local files** — just read/write markdown; no DB, no Postgres, no network.
- **The "watcher"** — a **`UserPromptSubmit` hook** (Claude Code) that pipes each prompt to `npx promptnest log`. (Well-supported in Claude Code; other agents fall back to explicit save — see `03_...` §Platform notes.)
- **Slash commands** — thin wrappers that call the `npx promptnest` CLI.
- **Distribution** — one npm package, run with `npx promptnest`.

No backend, no auth, no sync. That removes every hard part of the earlier API-based design.

## 6. Fully local, fully yours (with an optional door)

- **No sync to the PromptVault web app.** PromptNest is a **separate** product; your captured prompts live only in `~/.promptnest/`.
- **Optional bridge (future):** an `export … --to-app` / `import` command *can* push a captured prompt into the PromptVault app if you ever want the two connected. Off by default. See [`04_Appendix_API_Bridge.md`](04_Appendix_API_Bridge.md).

## 7. Two ways it surfaces prompts

- **Explicit** — you ask: `/promptnest commit`, or "use my conventional-commit prompt." The agent looks it up and injects it.
- **Always-on (optional)** — a line in `CLAUDE.md` / `AGENTS.md` tells the agent to *check PromptNest first* before improvising a reusable instruction, so your saved prompts show up exactly when relevant.

## 8. Why local markdown files (answering the core design question)

**Yes — markdown-with-timestamp is the right storage choice**, because:

- **Viewable with zero tooling** — open `~/.promptnest/` in VS Code and browse; every prompt is a readable file.
- **Portable & durable** — plain text, git-friendly, no lock-in, survives any tool change.
- **Editable by hand** — fix a prompt in the editor, done.

The one addition that makes it *fast* (counting, `-1/-2` recency, search) is a small **index** alongside the files. Files for humans, index for the machine. Details in [`01_Architecture_and_Design.md`](01_Architecture_and_Design.md).

## 9. Scope guard

- Local files only; no server, DB, or auth.
- Not synced to the web app (bridge is optional/future).
- Recency capture (`-N`) is best on Claude Code (hook support); degraded-but-usable elsewhere.

---

**Next:** [`01_Architecture_and_Design.md`](01_Architecture_and_Design.md) — file layout, the watcher hook, the index, and the command surface.
