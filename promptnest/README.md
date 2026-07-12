# PromptNest

**Capture the prompts you type inside AI agents, and reuse them locally by name.**
Local markdown files under `~/.promptnest/` — no server, no database, no account.

Works with **Claude Code, Cursor, and Codex**. Install-free via `npx`.

> Design docs: see [`../implementdocs/`](../implementdocs/) (00–05).

## Quick start

```bash
# set up the vault + install Claude Code slash commands in this project
npx promptnest init

# add the printed UserPromptSubmit hook to your Claude Code settings.json
# (that's the "watcher" that lets you save prompts by recency)
```

Then, inside your agent:

- `/promptsave` — save the prompt you just wrote
- `/savepromt -2` — save the 2nd-most-recent prompt
- `/promptnest [query]` — browse / search your library

## How it works

1. **Watch** — a `UserPromptSubmit` hook pipes each prompt to `promptnest log`, appended to `~/.promptnest/history.jsonl`.
2. **Capture** — `save -N` promotes the Nth-from-latest prompt into `prompts/<group>/<id>.md` (group auto-created), with description, keywords, and auto-detected `{{variables}}`.
3. **Index** — `INDEX.md` (human) + `index.json` (machine) are regenerated so listing, counting, and search stay instant.
4. **Reuse** — `use <id> --var k=v` fills the template and prints it.

## Commands

```
pn init [-a claude]                  set up vault + slash commands
pn log                               (hook) append piped prompt to history
pn save ["text"] [-N] [-i]           save given text / Nth-latest / guided
     [-t title] [-d desc] [-k a,b] [-g group]
pn list [-g group] [--keyword k]
pn search "<query>"
pn get <id>
pn use <id> [--var k=v ...]
pn count
pn open
pn rebuild-index
```

Three ways to save — pick whichever is least typing:

```bash
pn save "Review {{lang}} code" -t "Lang review" -k review -g code-review   # one-liner
pn save -i                                                                 # guided prompts
pn save -2                                                                 # 2nd-latest watched prompt
```

Short flags: `-t` title · `-k` keywords · `-g` group · `-d` desc · `-i` interactive.
Global flags: `--json`/`-j`, `--quiet`/`-q`, `--dir <path>`.
Alias: `pn`. Vault location override: `PROMPTNEST_DIR`.

> Run `npm link` once in this folder to use `pn` from anywhere (otherwise `node bin/pn.js …`).

## Storage

```
~/.promptnest/
├── config.json
├── history.jsonl                 # watcher log (the -N counter)
├── index.json                    # machine index
├── INDEX.md                      # human index (auto-generated)
└── prompts/<group>/<id>.md       # your prompts (frontmatter + body)
```

Everything is plain text — browse it in your editor (`pn open`), put it in git, edit by hand.

## Viewing your prompts

- `pn open` → open the folder in your editor
- open `~/.promptnest/INDEX.md` → one linked list of everything
- `pn list` / `pn search "<q>"` → from the terminal or agent

## Platform notes

| Feature | Claude Code | Cursor | Codex |
|---|---|---|---|
| Auto-watch + `/savepromt -N` | ✅ (hook) | ⚠️ use `save --text` | ⚠️ use `save --text` |
| save / list / search / use | ✅ | ✅ | ✅ |

## Development

```bash
node --test          # run the smoke tests
node bin/pn.js help  # run locally without installing
```

No runtime dependencies — plain Node.js (>=18) ESM.

## License

MIT
