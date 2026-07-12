# Reference — saving prompts

`pn` below stands for the resolved CLI (see SKILL.md).

## Save flags

| Short | Long | Meaning |
|-------|------|---------|
| `-t` | `--title` | Human name for the prompt (used in search) |
| `-k` | `--keywords` | Comma-separated tags |
| `-g` | `--group` | Folder to file it under |
| `-d` | `--desc` | One-line description |
| `-f` | `--file` | Read the prompt body from a file |
| `-i` | `--interactive` | Guided prompts for each field |
| `-N` | — | Save the Nth-from-latest watched prompt (e.g. `-2`) |

## How `save` chooses its text (priority order)

1. `--text "…"` (explicit flag)
2. `--file <path>`
3. a plain quoted positional argument
4. piped stdin
5. interactive (`-i`, or a bare `pn save` on an empty vault)
6. recency from the watcher (`-N`, default `-1`)

## Long / multi-line prompts

Never inline a big prompt as a command-line argument — terminals truncate it. Use a
file or stdin, which have no size limit:

```bash
pn save --file prompt.txt -t "JWT Auth" -k JWT,AUTH,SECURITY -g JWT
# macOS/Linux stdin:
pn save -t "JWT Auth" -g JWT < prompt.txt
# PowerShell stdin:
Get-Content prompt.txt -Raw | pn save -t "JWT Auth" -g JWT
```

When a user pastes a large prompt for you to save, write it to a temp file first,
then save with `--file`.

## Guided save

`pn save -i` walks through text → title → keywords → group → description. It needs a
real TTY, so run it only when the user can type answers; otherwise gather the fields
yourself and use the one-liner form.

## Notes on values

- Titles and groups may contain spaces — quote them.
- Keyword spaces are trimmed: `"JWT , AUTH"` becomes `[JWT, AUTH]`.
- Omit `-t` and the first line becomes the title; omit `-g` and it lands in `inbox`.
