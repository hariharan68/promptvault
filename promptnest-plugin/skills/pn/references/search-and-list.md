# Reference — finding, printing, and reusing prompts

`pn` below stands for the resolved CLI (see SKILL.md).

## List & filter

```bash
pn list                 # everything
pn list -g JWT          # one group
pn list --keyword security
```

## Search

`search` ranks matches across title, keywords, description, and body:

```bash
pn search jwt
```

## Print a prompt

`get` prints the body exactly as saved — ready to paste. Partial ids work:

```bash
pn get 2026-07-12_jwt-auth
pn get jwt               # partial id also matches
```

## Get the file path

```bash
pn path jwt             # → ~/.promptnest/prompts/jwt/2026-07-12_jwt-auth.md
```

## Templates: `{{variables}}`

A saved prompt can contain `{{placeholders}}`, auto-detected on save. Fill them at
use-time:

```bash
pn use lang-review --var language=Python --var focus=security
# → Review this Python code for security
```

- Use `--var name=value` once per variable; quote values with spaces.
- A missing variable is left as `{{name}}` and reported — nothing breaks.
- A prompt with no variables makes `pn use` behave like `pn get`.

## get vs. use

- **get** is a pure read — prints and changes nothing.
- **use** fills variables, bumps the usage counter, and updates the timestamp.

## Ids

Ids look like `2026-07-12_jwt-auth`. Partial ids match. Run `pn list` to discover
exact ids.
