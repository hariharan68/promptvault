# Reference — capture by recency & the watcher hook

`pn` below stands for the resolved CLI (see SKILL.md).

## Save by recency

When the capture hook is active, recent prompts are logged and can be promoted
without retyping:

```bash
pn save -1     # the most recent prompt you typed
pn save -2     # the 2nd-most-recent
```

If `-N` is out of range, run `pn count` and report the valid range instead of
failing silently.

## `pn count`

```bash
pn count       # e.g. "history: 13   saved: 3"
```

- **history** — raw prompts the watcher has logged (capped at the last 500).
- **saved** — prompts promoted into the library as `.md` files.

## The capture hook

This plugin ships a `UserPromptSubmit` hook (`hooks/hooks.json`) that pipes each
prompt to `pn log`, appended to `~/.promptnest/history.jsonl`. It is silent and
never blocks or delays a prompt. Because it's part of the plugin, installing the
plugin wires it automatically — no manual `settings.json` edit needed.

## Platform notes

Auto-watch works in agents that fire `UserPromptSubmit` (Claude Code). Where that
hook isn't available, `-N` recency won't have data — save with a quoted string or
`--file` instead. Everything else (save/list/search/get/path/use) works the same.
