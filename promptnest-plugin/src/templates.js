// Agent-integration artifacts written by `pn init`.

export const AGENT_FILES = {
  claudeCommands: {
    "promptsave.md": `---
description: Save my latest prompt to PromptNest
argument-hint: (optional description)
allowed-tools: Bash(npx promptnest:*)
---
Run \`npx promptnest save -1 --json\`. Show me the captured prompt text, then ask me for:
(1) a short description, (2) comma-separated keywords, (3) a group name.
Re-run \`npx promptnest save -1 --desc "<d>" --keywords "<k>" --group "<g>" --json\`
and confirm the saved file path.
`,
    "savepromt.md": `---
description: Save an earlier prompt by recency, e.g. /savepromt -2
argument-hint: -N  (e.g. -1, -2, -3)
allowed-tools: Bash(npx promptnest:*)
---
Run \`npx promptnest save $ARGUMENTS --json\` to grab the Nth-from-latest prompt.
If N is out of range, run \`npx promptnest count\` and tell me the valid range.
Then ask me for description, keywords, and group, and re-run with those flags.
`,
    "promptnest.md": `---
description: Browse or search my PromptNest library
argument-hint: (optional search text)
allowed-tools: Bash(npx promptnest:*)
---
If arguments are given, run \`npx promptnest search "$ARGUMENTS" --json\`;
otherwise run \`npx promptnest list --json\`. Present the results as a compact list
(title · group · keywords). If I pick one, offer to \`npx promptnest use <id>\`
and ask for any required variables.
`,
  },

  hookSnippet: `{
  "hooks": {
    "UserPromptSubmit": [
      { "hooks": [ { "type": "command", "command": "npx -y promptnest log" } ] }
    ]
  }
}`,

  guidance: `PromptNest: before writing a reusable prompt/checklist/template, run
\`npx promptnest search "<topic>" --json\` and prefer a saved prompt
(\`npx promptnest use <id> --var k=v\`). To save one: \`npx promptnest save -1\`.
All local under ~/.promptnest/.`,
};
