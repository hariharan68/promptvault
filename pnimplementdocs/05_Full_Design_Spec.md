# PromptNest — Full Design Spec (implementation-ready)

> **Status:** design report (no code changed). This is the concrete, build-from spec: exact
> commands, data schemas, and the actual agent artifacts (SKILL.md, slash commands, hook).
> **Prev:** [`04_Appendix_API_Bridge.md`](04_Appendix_API_Bridge.md) · **Index:** [`README.md`](README.md)

---

## 1. Use case & user stories (the design driver)

**Primary use case:** capture a good prompt the moment you write it, reuse it by name later — locally, across agents.

| # | As a… | I want to… | So that… | Command |
|---|---|---|---|---|
| U1 | dev in an agent | save the prompt I just wrote | I don't lose it | `/promptsave` → `pn save -1` |
| U2 | dev | save a prompt from a few turns ago | I can capture one I skipped | `/savepromt -N` → `pn save -N` |
| U3 | dev | tag it with description/keywords/group | I can find it later | flags on `save` |
| U4 | dev | have the group made automatically | I don't manage folders | `save --group x` auto-creates |
| U5 | dev | see everything I've saved | I can browse my library | `/promptnest`, `INDEX.md`, `pn open` |
| U6 | dev | search my prompts | I find the right one fast | `pn search "<q>"` |
| U7 | dev | reuse a prompt with values filled in | it's a reusable template | `pn use <id> --var k=v` |
| U8 | dev | know how far back I can save | I pick a valid `-N` | `pn count` |
| U9 | dev | keep it all local | I own my data, no account | files under `~/.promptnest/` |
| U10 | dev (later) | optionally push one to the web app | I can see it in the browser | `pn export <id> --to-app` (opt-in) |

**Non-goals:** cloud sync, accounts, teams, multi-user — all out of scope.

## 2. Vault paths (single source of truth)

| Path | Role |
|---|---|
| `~/.promptnest/config.json` | settings |
| `~/.promptnest/history.jsonl` | watcher log (the counter) |
| `~/.promptnest/prompts/<group>/<id>.md` | saved prompts (group = folder) |
| `~/.promptnest/index.json` | machine index |
| `~/.promptnest/INDEX.md` | human index (auto-generated) |

`id` format: `YYYY-MM-DD_<slug>` (slug from title, lowercased, non-alnum → `-`, deduped with `-2`, `-3`). Vault dir overridable via `PROMPTNEST_DIR` env or `--dir`.

## 3. Data schemas (exact)

### 3.1 `history.jsonl` — one JSON object per line
```json
{"ts":"2026-07-12T14:29:40.123Z","text":"review this file for security issues","source":"claude-code","session":"a1b2"}
```
| Field | Type | Notes |
|---|---|---|
| `ts` | ISO-8601 string | capture time |
| `text` | string | the prompt as sent |
| `source` | string | agent id (best-effort) |
| `session` | string? | session id if available |

Recency: `-1` = last line, `-N` = Nth from end. Cap: keep last **500** lines (configurable) to bound size.

### 3.2 Saved prompt — YAML frontmatter + markdown body
```markdown
---
id: 2026-07-12_lang-review
title: Lang-aware code review
description: Reviews a file for a given language and focus area
keywords: [review, security, python]
group: code-review
source: history:-2
created: 2026-07-12T14:32:10Z
updated: 2026-07-12T14:32:10Z
uses: 0
variables:
  language: { description: "programming language", required: true }
  focus:    { description: "what to focus on",     required: false, default: "correctness" }
---

Review the following {{language}} code, focusing on {{focus}}.
List issues by severity, each with a concrete fix.
```
`variables` is optional and auto-detected from `{{...}}` on save (user can refine).

### 3.3 `index.json`
```json
{
  "version": 1,
  "count": 1,
  "groups": ["code-review"],
  "prompts": [
    {
      "id": "2026-07-12_lang-review",
      "title": "Lang-aware code review",
      "description": "Reviews a file for a given language and focus area",
      "group": "code-review",
      "keywords": ["review","security","python"],
      "file": "prompts/code-review/2026-07-12_lang-review.md",
      "variables": ["language","focus"],
      "created": "2026-07-12T14:32:10Z",
      "uses": 0
    }
  ]
}
```

### 3.4 `config.json`
```json
{
  "version": 1,
  "defaultGroup": "inbox",
  "historyCap": 500,
  "editor": "code",
  "output": "human"
}
```

## 4. Complete CLI reference

Binary: `promptnest` (alias `pn`). Global flags: `--json`, `--dir <path>`, `--quiet`.
Exit codes: `0` ok · `1` usage error · `2` not found / out of range · `3` I/O error.

### `pn init [--agent claude|cursor|codex]`
Creates the vault, writes starter `config.json`, and installs agent artifacts (§6). Idempotent.

### `pn log`  *(called by the hook — silent)*
Reads the agent's hook JSON on **stdin**, extracts the prompt text, appends a line to `history.jsonl`. Writes **nothing to stdout** (so it never pollutes agent context). Always exits `0` (logging must never block a prompt).
```
stdin:  {"hook_event_name":"UserPromptSubmit","prompt":"...","session_id":"..."}
effect: append {ts,text,source,session} to history.jsonl
```

### `pn save [-N] [--text "<s>"] [--title t] [--desc d] [--keywords a,b] [--group g] [--yes]`
Promotes a prompt into a saved file.
- Source: `-N` (default `-1`) reads `history.jsonl[-N]`; or `--text` uses an explicit string.
- If `--title` omitted → derive from first line / ask. If `--group` omitted → `config.defaultGroup`.
- Auto-creates `prompts/<group>/`. Auto-detects `{{variables}}`. Updates both indexes.
- `--json` returns the created record; human mode prints the path + id.
```
$ pn save -2 --desc "conventional commit" --keywords commit,git --group commits
→ saved prompts/commits/2026-07-12_conventional.md  (id: 2026-07-12_conventional)
```

### `pn list [--group g] [--keyword k] [--json]`
Lists from `index.json`. Human = grouped table; `--json` = array of records.

### `pn search "<q>" [--json]`
Ranks by match in title > keywords > body. Returns records (with `id`, `file`, snippet).

### `pn get <id> [--json]`
Prints one saved prompt (body in human mode; full record in `--json`).

### `pn use <id> [--var k=v ...] [--json]`
Loads the prompt, fills `{{vars}}`, increments `uses`, updates indexes. Any unresolved `{{x}}` is returned under `missing_variables` (does not fail).
```
$ pn use 2026-07-12_lang-review --var language=python --var focus=security
→ "Review the following python code, focusing on security. ..."
```

### `pn count [--json]`
`{ "history": 12, "saved": 5 }` — history length is the valid `-N` range.

### `pn open`
Opens `~/.promptnest/` in `config.editor` (fallback: print the path).

### `pn rebuild-index`
Regenerates `index.json` + `INDEX.md` from the prompt files (files are source of truth).

### `pn export <id> --to-app` / `pn import --from-app`  *(optional — see [`04`](04_Appendix_API_Bridge.md))*
Opt-in bridge to the PromptVault web app. Not part of the core loop.

## 5. Command → slash-command map

| Slash | CLI | Notes |
|---|---|---|
| `/promptsave` | `pn save -1` | interactive metadata |
| `/savepromt <N>` e.g. `/savepromt -2` | `pn save -2` | recency capture |
| `/promptnest [query]` | `pn list` / `pn search` | browse/search |

## 6. Agent artifacts (actual file contents `pn init` writes)

### 6.1 Claude Code — hook (`~/.claude/settings.json` or project `.claude/settings.json`)
```json
{
  "hooks": {
    "UserPromptSubmit": [
      { "hooks": [ { "type": "command", "command": "npx -y promptnest log" } ] }
    ]
  }
}
```

### 6.2 Claude Code — `.claude/commands/promptsave.md`
```md
---
description: Save my latest prompt to PromptNest
argument-hint: (optional description)
allowed-tools: Bash(npx promptnest:*)
---
Run `npx promptnest save -1 --json`. Show me the captured prompt text, then ask me for:
(1) a short description, (2) comma-separated keywords, (3) a group name.
Re-run `npx promptnest save -1 --desc "<d>" --keywords "<k>" --group "<g>" --json`
and confirm the saved file path.
```

### 6.3 Claude Code — `.claude/commands/savepromt.md`
```md
---
description: Save an earlier prompt by recency, e.g. /savepromt -2
argument-hint: -N  (e.g. -1, -2, -3)
allowed-tools: Bash(npx promptnest:*)
---
Run `npx promptnest save $ARGUMENTS --json` to grab the Nth-from-latest prompt.
If N is out of range, run `npx promptnest count` and tell me the valid range.
Then ask me for description, keywords, and group, and re-run with those flags.
```

### 6.4 Claude Code — `.claude/commands/promptnest.md`
```md
---
description: Browse or search my PromptNest library
argument-hint: (optional search text)
allowed-tools: Bash(npx promptnest:*)
---
If arguments are given, run `npx promptnest search "$ARGUMENTS" --json`;
otherwise run `npx promptnest list --json`. Present the results as a compact list
(title · group · keywords). If I pick one, offer to `npx promptnest use <id>`
and ask for any required variables.
```

### 6.5 `SKILL.md` (optional — teaches the agent the whole workflow)
```md
---
name: promptnest
description: Capture and reuse prompts locally. Trigger on /promptsave, /savepromt, /promptnest, or "save this prompt".
---
# PromptNest

Local prompt library stored as markdown under ~/.promptnest/ (no server/account).

## When to act
- "save this prompt" / "/promptsave"        → `npx promptnest save -1`
- "/savepromt -N"                            → `npx promptnest save -N`
- "use my <name> prompt" / "/promptnest x"   → `npx promptnest search "x" --json` then `use <id>`
- Before writing a reusable instruction, check the library first and prefer a saved prompt.

## Rules
- On save, always ask for description, keywords, and group (group auto-creates).
- On use, fill {{variables}} from what I provide; if any are missing, ask me.
- Everything is local; never sync unless I explicitly run `export --to-app`.
```

### 6.6 Always-on line for `CLAUDE.md` / `AGENTS.md` / `.cursorrules`
```md
PromptNest: before writing a reusable prompt/checklist/template, run
`npx promptnest search "<topic>" --json` and prefer a saved prompt
(`npx promptnest use <id> --var k=v`). To save one: `npx promptnest save -1`.
All local under ~/.promptnest/.
```

## 7. End-to-end scenarios (mapped to exact calls)

**S1 — Save latest & reuse next day**
```
/promptsave
  → npx promptnest save -1 --desc "lang review" --keywords review,security --group code-review
(next day) "use my lang review prompt on this file"
  → npx promptnest search "lang review" --json        # find id
  → npx promptnest use <id> --var language=python --var focus=security
```

**S2 — Grab a prompt from 3 turns ago**
```
/savepromt -3
  → npx promptnest count            # confirm range if needed
  → npx promptnest save -3 --group experiments
```

**S3 — Browse everything**
```
/promptnest              → npx promptnest list --json      (or open ~/.promptnest/INDEX.md)
/promptnest commit       → npx promptnest search "commit" --json
```

## 8. Edge cases & decisions

| Case | Decision |
|---|---|
| Empty history on `save -N` | exit 2, message: "no prompt at -N; only M captured (`pn count`)" |
| Duplicate title/id | append `-2`, `-3` to slug |
| Group name with spaces/slashes | slugify to a safe folder name; store original in frontmatter `group` |
| Very long prompt | stored as-is; index snippet truncated to ~160 chars |
| Index vs files disagree | `pn rebuild-index`; files always win |
| Hook not firing (Cursor/Codex) | `save --text "<prompt>"` explicit path |
| `use` with missing vars | return text + `missing_variables`, never fail |
| Concurrent writes | append-only history; save writes to a temp file then renames (atomic) |

## 9. Build checklist (traceable to [`02`](02_Implementation_Plan.md))

- [ ] P1 `save --text` writes frontmatter file; group auto-create
- [ ] P2 `index.json` + `INDEX.md`; `list`/`search`/`get`/`count`/`open`/`rebuild-index`
- [ ] P3 `log` (stdin) + `history.jsonl`; `save -N`; `count` range
- [ ] P4 `render` `{{vars}}`; `use` + `uses` increment + `missing_variables`
- [ ] P5 `init` installs hook + 3 slash commands + optional SKILL.md; CLAUDE.md/AGENTS.md snippet
- [ ] P6 npm `bin` (`promptnest`,`pn`); cross-platform paths; publish
- [ ] P7 (optional) `export --to-app` / `import --from-app`

---

**Back to:** [`README.md`](README.md)
