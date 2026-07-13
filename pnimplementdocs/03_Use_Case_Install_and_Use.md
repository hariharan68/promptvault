# PromptNest — Install & Use (User / Use-Case Report)

> **Status:** design report. Commands below describe the **intended** UX once the skill in [`02_Implementation_Plan.md`](02_Implementation_Plan.md) is built. It is a local file-based tool — no server, no account.
> **Prev:** [`02_Implementation_Plan.md`](02_Implementation_Plan.md) · **Index:** [`README.md`](README.md)

---

## 1. Who this is for

Anyone using **Claude Code, Cursor, or Codex** who wants to *capture the good prompts they type* and reuse them by name later — with everything stored locally as files they own.

## 2. Prerequisites

- **Node.js 18+** (for `npx`). That's it — no backend, no database, no login.

## 3. Install & set up (one command)

```bash
npx promptnest init
```
`init` creates the vault at `~/.promptnest/`, and (for Claude Code) installs:
- the **`UserPromptSubmit` hook** (the watcher that logs your prompts), and
- the **slash commands** `/promptsave`, `/savepromt`, `/promptnest`.

Verify:
```bash
npx promptnest count      # "0 prompts in history, 0 saved" on a fresh vault
npx promptnest open       # opens ~/.promptnest/ in your editor
```

## 4. The everyday loop

### Save the prompt you just wrote
```
You:  /promptsave
Skill: "Saved from your latest prompt. Description? Keywords? Group?"
You:  "lang-aware review; review,security; code-review"
      → ~/.promptnest/prompts/code-review/2026-07-12_lang-review.md   (group auto-created)
```

### Save an earlier prompt by recency
```
/savepromt -1     ← latest prompt
/savepromt -2     ← the one before
/savepromt -3     ← three back
```
(The skill knows the range because it counts every prompt — `npx promptnest count`.)

### View your vault (three ways)
1. **Open the folder:** `npx promptnest open` → browse `.md` files in VS Code.
2. **Read the index:** open `~/.promptnest/INDEX.md` — every prompt, grouped, linked.
3. **From the agent:** `/promptnest` or `/promptnest review` to list/search.

### Reuse a saved prompt (with variables)
```
You:  "use my lang-aware review prompt on this file"
Agent:(runs) npx promptnest search "lang-aware review" --json  → gets the id
      (runs) npx promptnest use <id> --var language=python --var focus=security
      → injects the filled prompt and reviews your file
```

## 5. Wiring into each agent

### 5a. Claude Code (best support)
`npx promptnest init` does it for you. What it installs:

- **Hook** (`settings.json`) — the watcher:
  ```json
  {
    "hooks": {
      "UserPromptSubmit": [
        { "hooks": [ { "type": "command", "command": "npx -y promptnest log" } ] }
      ]
    }
  }
  ```
- **Slash commands** (`.claude/commands/`) — e.g. `promptsave.md`:
  ```md
  ---
  description: Save my latest prompt to PromptNest
  ---
  Run `npx promptnest save -1 --json`. Then ask me for a description, keywords,
  and group name, and re-run with `--desc`, `--keywords`, `--group`.
  ```

### 5b. Cursor
Cursor has no `UserPromptSubmit` hook, so the automatic `-N` capture isn't available. Instead:
- Save explicitly: the agent runs `npx promptnest save --text "<the prompt>" --group ...`.
- Add the §7 snippet to `.cursorrules` so Cursor knows to check/save via PromptNest.
- Viewing + reuse (`list`, `search`, `use`) work exactly the same.

### 5c. Codex / other CLI agents
- Put the §7 snippet in `AGENTS.md`.
- The agent shells out: `npx promptnest save --text "..."`, `npx promptnest search "..."`, `npx promptnest use <id>`.

**Platform summary**

| Feature | Claude Code | Cursor | Codex |
|---|---|---|---|
| Auto-watch + `/savepromt -N` | ✅ (hook) | ⚠️ explicit `--text` | ⚠️ explicit `--text` |
| Save / list / search / use | ✅ | ✅ | ✅ |
| Slash commands | ✅ | rules/commands | AGENTS.md + CLI |

## 6. Command cheat-sheet

| I want to… | Command |
|---|---|
| Save my latest prompt | `npx promptnest save -1 --group g` |
| Save the 2nd-latest | `npx promptnest save -2 --group g` |
| Save explicit text | `npx promptnest save --text "..." --group g` |
| How many can I go back? | `npx promptnest count` |
| List / filter | `npx promptnest list --group review` |
| Search | `npx promptnest search "commit"` |
| Use one (fill vars) | `npx promptnest use <id> --var lang=python` |
| View the vault | `npx promptnest open` (or open `~/.promptnest/INDEX.md`) |
| Rebuild the index | `npx promptnest rebuild-index` |
| (Optional) push to app | `npx promptnest export <id> --to-app` |

Install globally to drop the `npx`: `npm i -g promptnest` → then just `pn save -1`.

## 7. Always-on guidance snippet (`CLAUDE.md` / `AGENTS.md` / `.cursorrules`)

```md
## PromptNest (my local prompt library)

- When I write a genuinely reusable prompt and say "save that" / "/promptsave",
  run `npx promptnest save -1` (or `save -N` for older ones; `--text` if no hook),
  then ask me for description, keywords, and group.
- Before writing a reusable instruction (review checklist, commit template, refactor
  prompt), FIRST check my library: `npx promptnest search "<topic>" --json`, and prefer
  a saved prompt (`npx promptnest use <id> --var k=v`) over improvising.
- If a prompt needs variables I haven't given, ask me for them.
Everything is local under ~/.promptnest/ — no server or account needed.
```

## 8. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `-N out of range` | Fewer prompts logged than N | `npx promptnest count`; pick a smaller N |
| `no prompt captured` | Empty history (hook not firing) | check the `UserPromptSubmit` hook; or use `save --text "..."` |
| `/savepromt` not found | Slash commands not installed | re-run `npx promptnest init` |
| Prompt not in list | Index drift | `npx promptnest rebuild-index` |
| Variables not filled | Missing `--var` | the CLI lists `missing_variables`; pass them |

## 9. Where your data lives

Everything is under **`~/.promptnest/`** — plain markdown files + a small index. Back it up, put it in git, sync it with your dotfiles, or edit it by hand. No cloud, no account, no lock-in. The optional `export --to-app` bridge ([`04_...`](04_Appendix_API_Bridge.md)) is the *only* thing that ever touches the network, and only when you run it.

---

**Index / start here:** [`README.md`](README.md)
