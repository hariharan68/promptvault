# Plugin architecture

This directory packages PromptNest as a **self-contained Claude Code plugin**. It is
deliberately kept **separate** from the canonical CLI package in `../promptnest` — the
plugin never modifies the CLI source; it only bundles a copy of it.

## Two artifacts, one source of truth

```
repo/
├── promptnest/           ← CANONICAL: the CLI package (npm). Single source of truth.
│   ├── bin/  src/  test/
│   └── package.json
└── promptnest-plugin/    ← DISTRIBUTION: the Claude Code plugin (this dir).
    ├── .claude-plugin/   manifest + marketplace
    ├── skills/ commands/ hooks/
    ├── bin/  src/        a synced COPY of the CLI (generated, not authored)
    └── scripts/sync-cli.mjs
```

- **Author code in `../promptnest`.** Its 12 smoke tests are the quality gate.
- **The plugin ships a copy** of `bin/` and `src/` so it runs with zero setup — no
  npm install, no `npx`. Commands and the hook invoke it via
  `node "${CLAUDE_PLUGIN_ROOT}/bin/pn.js"`, which resolves to the installed plugin dir.
- **`scripts/sync-cli.mjs` regenerates the copy** from the canonical package. Run it
  after any CLI change. This mirrors the "generated, not hand-maintained" convention
  used by larger skill/plugin projects.

Why copy instead of symlink or npm-depend? A plugin is distributed as a self-contained
folder; symlinks don't survive that, and depending on `npx promptnest` would require
the package to be published. Bundling keeps the install friction-free while the tiny,
dependency-free CLI keeps the copy cheap.

## Progressive disclosure in the skill

`skills/pn/SKILL.md` stays short — what `/pn` is, how to run the CLI, the core
commands, and the one rule that matters (never inline a long prompt). Deeper material
lives in `skills/pn/references/` and is loaded only when a task needs it:

| Reference | Covers |
|-----------|--------|
| `save-flags.md` | every save flag, guided save, file/stdin |
| `search-and-list.md` | list/search/get/path/use, ids, `{{variable}}` templates |
| `recency-and-hooks.md` | `pn save -N`, the capture hook, `pn count` |

## How the CLI is resolved at runtime

Order of preference (documented in the skill):

1. `pn` on PATH (if the user also installed the npm package / ran `npm link`)
2. the bundled binary: `node "${CLAUDE_PLUGIN_ROOT}/bin/pn.js"`
3. `npx promptnest` (only if published)

Commands and the hook hard-wire option 2 via `${CLAUDE_PLUGIN_ROOT}` so they always
work regardless of what's on PATH.

## Data & storage

Unchanged from the CLI: everything lives under `~/.promptnest` (override with
`PROMPTNEST_DIR`). The plugin adds no storage of its own.

## To verify before publishing

- Confirm `plugin.json` / `marketplace.json` field names against the current Claude
  Code plugin docs (schemas evolve).
- Confirm `${CLAUDE_PLUGIN_ROOT}` is expanded in the contexts you rely on (hooks and
  commands: yes; double-check skill-body bash if you depend on it there).
