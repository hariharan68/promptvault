# PromptNest — Local Prompt-Capture Skill (Design & Plan, `implementdocs/`)

A **local, file-based** skill that lets you **capture the good prompts you type** inside an AI
agent — **Claude Code, Cursor, Codex** — and reuse them by name later. Installs via **`npx`**,
driven by slash commands (`/promptsave`, `/savepromt -N`, `/promptnest`), stored as plain
**markdown files you own**. No server, no database, no account.

> **These are design/plan documents. No application code has been changed.**
> Feasibility verdict: **YES** — it's all local file I/O plus a prompt-logging hook; there is no
> backend or auth to build.

## The one-liner

> Graphify turns your **repo** into a queryable graph for any assistant.
> PromptNest lets you **capture the prompts you actually write** into local files and reuse them across any assistant.

## How it works (watch → capture → index → reuse)

1. **Watch** — a `UserPromptSubmit` hook logs every prompt you send → `~/.promptnest/history.jsonl`.
2. **Capture** — `/promptsave` or `/savepromt -N` promotes a logged prompt into a markdown file with description, keywords, and group (auto-created).
3. **Index** — a human `INDEX.md` + machine `index.json` keep listing/counting/search instant.
4. **Reuse** — `/promptnest`, `search`, and `use` fetch a saved prompt and fill its `{{variables}}`.

## Documents

| # | Doc | What's inside |
|---|---|---|
| 00 | [`00_Agent_CLI_Overview.md`](00_Agent_CLI_Overview.md) | The idea, the problem, feasibility, why local markdown, explicit vs always-on. |
| 01 | [`01_Architecture_and_Design.md`](01_Architecture_and_Design.md) | File layout, watcher hook, index, frontmatter schema, command surface, diagrams. |
| 02 | [`02_Implementation_Plan.md`](02_Implementation_Plan.md) | 7 phases with modules, difficulty, risks, acceptance criteria. |
| 03 | [`03_Use_Case_Install_and_Use.md`](03_Use_Case_Install_and_Use.md) | Install, wire into Claude Code / Cursor / Codex, examples, cheat-sheet, troubleshooting. |
| 04 | [`04_Appendix_API_Bridge.md`](04_Appendix_API_Bridge.md) | **Optional/future** door to push captured prompts into the PromptVault web app. |
| 05 | [`05_Full_Design_Spec.md`](05_Full_Design_Spec.md) | **Implementation-ready:** user stories, exact CLI + data schemas, and the actual SKILL.md / slash-command / hook file contents. |

## Locked design decisions

| Decision | Choice |
|---|---|
| Storage | Local **markdown files + small index** under `~/.promptnest/` |
| Distribution | `npx promptnest` (Node/TypeScript) |
| Capture | `UserPromptSubmit` hook logs prompts → `/savepromt -N` by recency |
| App sync | **None** — fully separate; optional `export --to-app` bridge only |
| Surfaces | Slash commands + skill + always-on `CLAUDE.md`/`AGENTS.md` guidance |

## Viewing your prompts locally (the core question, answered)

- **Open the folder** — `npx promptnest open` → browse readable `.md` files.
- **Read the index** — `~/.promptnest/INDEX.md`, auto-generated and linked.
- **From the agent** — `/promptnest` / `pn list` / `pn search`.

## Suggested build order

**Phases 1–3** (vault + index + watcher/`-N`) already let you capture prompts into browsable
files. Phases 4–5 add variable reuse + slash commands; 6 makes it `npx`-installable; 7 is the
optional app bridge.

## Out of scope

Application code changes (this is a plan) · syncing to the web app by default · remote/hosted
storage · scoped multi-user tokens.
