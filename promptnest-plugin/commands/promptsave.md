---
description: Save my latest prompt to PromptNest
argument-hint: (optional description)
allowed-tools: Bash(node:*)
---
Run `node "${CLAUDE_PLUGIN_ROOT}/bin/pn.js" save -1 --json` to grab the prompt I just
submitted. Show me the captured prompt text, then ask me for: (1) a short description,
(2) comma-separated keywords, (3) a group name.

Re-run `node "${CLAUDE_PLUGIN_ROOT}/bin/pn.js" save -1 --desc "<d>" --keywords "<k>" --group "<g>" --json`
with my answers and confirm the saved file path.

If there is no recent prompt in history, tell me the capture hook may not be active and
offer to save explicit text instead with
`node "${CLAUDE_PLUGIN_ROOT}/bin/pn.js" save "<text>" -t "<title>" -g "<group>"`.
