---
name: pn
description: "Use whenever the user wants to save, find, reuse, or organize a prompt — anything like 'save this prompt', 'do I have a prompt for X', 'reuse my code-review prompt', 'list my prompts', '/pn ...'. PromptNest is a local CLI that stores prompts as plain markdown under ~/.promptnest and reuses them by name, with {{variable}} templating, search, groups, and file/stdin capture for long prompts."
trigger: /pn
---

# /pn — PromptNest

Capture, find, and reuse prompts stored locally under `~/.promptnest`. Everything is
plain markdown on the user's machine — no server, no account.

## Running the CLI

This plugin bundles the CLI, so it always works. Resolve the command in this order:

1. `pn` if it's on PATH (installed via `npm link` / npm global), else
2. the bundled binary: `node "${CLAUDE_PLUGIN_ROOT}/bin/pn.js"`, else
3. `npx promptnest` (only if the package has been published).

In the examples below, `pn` stands for whichever of these resolves.

## How to handle `/pn <args>`

Treat everything after `/pn` as PromptNest CLI arguments and run it directly.
`/pn list` → `pn list`. `/pn search jwt` → `pn search jwt`. With no args, run
`pn list` and offer next actions. Prefer `--json` when you need to read a result to
act on it (e.g. grab an `id` before a follow-up `use`); show the human the friendly output.

## Core commands

```
pn save ["text"] [options]     Save a prompt into the library.
pn list [-g group] [--keyword k]   List saved prompts.
pn search "<query>"            Search titles, keywords, descriptions, bodies.
pn get <id>                    Print one prompt's body exactly as saved.
pn path <id>                   Print the prompt's .md file path (absolute).
pn use <id> [--var k=v ...]    Fill {{variables}} and print; tracks usage.
pn count                       History depth + saved count.
```

## The one rule that matters: never inline a long prompt

Terminals truncate very long command-line arguments, so a big pasted prompt can be
silently cut off. When the user gives you a long or multi-line prompt to save, write
it to a temp file and use `--file` (or pipe via stdin) — never put it on the command line:

```bash
pn save --file prompt.txt -t "JWT Auth" -k JWT,AUTH,SECURITY -g JWT
```

## Deeper reference (load on demand)

Only read these when the task needs them:

- `references/save-flags.md` — every save flag, guided save, file/stdin details.
- `references/search-and-list.md` — list/search/get/path/use, ids, `{{variable}}` templates.
- `references/recency-and-hooks.md` — `pn save -N` recency, the capture hook, `pn count`.

## Notes

- Exit codes: 0 success · 1 bad usage (empty text / missing query) · 2 not found or
  out of range (bad id, `-N` too deep, missing `--file`).
- Vault location can be overridden with `PROMPTNEST_DIR` or `--dir <path>`.
