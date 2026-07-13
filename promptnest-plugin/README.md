# PromptNest — Claude Code plugin

Save, search, and reuse your AI prompts locally — from the terminal or from inside
your agent. This plugin is **self-contained**: it bundles the PromptNest CLI, so
installing it gives you a working `pn` with **no npm install required**.

## What you get

| Piece | What it does |
|-------|--------------|
| `/pn` skill | Run any PromptNest command from the agent, e.g. `/pn list`, `/pn search jwt` |
| `/promptsave` command | Save the prompt you just wrote, then tag it |
| `/promptnest` command | Browse or search your library and reuse a prompt |
| Capture hook | Logs each prompt you submit so `pn save -N` can promote recent ones |
| Bundled CLI | `bin/pn.js` + `src/` — the full tool, referenced via `${CLAUDE_PLUGIN_ROOT}` |

Prompts are stored as plain markdown under `~/.promptnest` — no server, no account.

## Install

```
/plugin marketplace add hariharan68/promptnest
/plugin install promptnest@promptnest
```

> If your marketplace lives in a subfolder of the repo, point the marketplace add at
> this directory (it contains its own `.claude-plugin/marketplace.json`). Verify the
> exact command against your Claude Code version's plugin docs.

After install you have `/pn`, `/promptsave`, `/promptnest`, and the capture hook.
Requires **Node.js 18+** on PATH (used to run the bundled CLI).

## Quick use

```
/pn save "Review this {{lang}} code" -t "Lang review" -g code-review
/pn search review
/pn use lang-review --var lang=Python
```

For a large prompt, save it from a file so the terminal can't truncate it:

```
/pn save --file prompt.txt -t "JWT Auth" -g JWT
```

## Layout

```
promptnest-plugin/
├── .claude-plugin/
│   ├── plugin.json          plugin manifest
│   └── marketplace.json     marketplace descriptor (source ".")
├── skills/pn/
│   ├── SKILL.md             short canonical skill
│   └── references/          progressive-disclosure docs, loaded on demand
├── commands/                /promptsave, /promptnest
├── hooks/hooks.json         UserPromptSubmit → pn log
├── bin/ + src/              bundled CLI (synced from ../promptnest — do not hand-edit)
└── scripts/sync-cli.mjs     refresh the bundle from the canonical package
```

## Keeping the bundle current

`bin/` and `src/` are **copies** of the canonical package in `../promptnest`. After
changing the CLI, refresh the bundle:

```
node scripts/sync-cli.mjs
```

See `ARCHITECTURE.md` for why it's built this way.

## License

MIT
