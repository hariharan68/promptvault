---
description: Browse or search my PromptNest library
argument-hint: (optional search text)
allowed-tools: Bash(node:*)
---
If arguments are given, run
`node "${CLAUDE_PLUGIN_ROOT}/bin/pn.js" search "$ARGUMENTS" --json`;
otherwise run `node "${CLAUDE_PLUGIN_ROOT}/bin/pn.js" list --json`.

Present the results as a compact list (title · group · keywords). If I pick one, offer
to run `node "${CLAUDE_PLUGIN_ROOT}/bin/pn.js" use <id>` and ask for any required
variables before filling them in.
