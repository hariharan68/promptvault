import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { spawn } from "node:child_process";
import {
  ensureVault,
  saveConfig,
  writeFileAtomic,
  readStdin,
  nowIso,
} from "./paths.js";
import * as history from "./history.js";
import * as prompts from "./prompts.js";
import * as indexer from "./indexer.js";
import { fill, parseVars } from "./render.js";
import * as fm from "./frontmatter.js";
import { AGENT_FILES } from "./templates.js";

function out(ctx, human, json) {
  if (ctx.flags.json) console.log(JSON.stringify(json, null, 2));
  else if (!ctx.flags.quiet) console.log(human);
}

function fail(ctx, code, message, extra = {}) {
  if (ctx.flags.json) console.log(JSON.stringify({ error: { message, ...extra } }, null, 2));
  else console.error("promptnest: " + message);
  return code;
}

// ---- log (called by the UserPromptSubmit hook; must stay silent) ------
export async function log(ctx) {
  ensureVault(ctx.p);
  const raw = await readStdin();
  let text = "";
  let session = null;
  let source = "unknown";
  if (raw.trim()) {
    try {
      const data = JSON.parse(raw);
      text = data.prompt ?? data.user_prompt ?? data.message ?? "";
      session = data.session_id ?? data.session ?? null;
      source = data.hook_event_name ? "claude-code" : source;
    } catch {
      text = raw.trim();
    }
  }
  if (text.trim()) {
    history.append(ctx.p, { text, session, source, ts: nowIso() });
    history.trim(ctx.p, ctx.config.historyCap);
  }
  return 0; // never block a prompt, never print
}

// ---- save -------------------------------------------------------------
// Text is resolved in priority order: --text flag → --file <path> → plain
// positional → piped stdin → interactive prompt (-i, or a human running
// `pn save` on an empty vault) → the Nth-from-latest watched prompt
// (-N, default -1). File/stdin exist so large prompts never depend on the
// terminal's argument/paste length limit.
export async function save(ctx) {
  let text = strOrUndef(ctx.flags.text);
  let source = "manual";

  if (text === undefined && ctx.flags.file) {
    const file = String(ctx.flags.file);
    try {
      text = fs.readFileSync(file, "utf8");
    } catch (e) {
      return fail(ctx, 2, `cannot read --file ${file}: ${e.code || e.message}`);
    }
    source = "file";
  }

  if (text === undefined) {
    const posText = ctx.positionals.find((x) => !/^-\d+$/.test(x));
    if (posText !== undefined) text = posText;
  }

  // Piped body: `pn save -t t < prompt.txt`. Only when no explicit text was
  // given, no history slot was requested, and we're not going interactive.
  if (
    text === undefined &&
    !hasRecency(ctx) &&
    !ctx.flags.interactive &&
    !process.stdin.isTTY
  ) {
    const piped = await readStdin();
    if (piped.trim()) {
      text = piped;
      source = "stdin";
    }
  }

  let meta = {
    title: strOrUndef(ctx.flags.title),
    description: strOrUndef(ctx.flags.desc) || strOrUndef(ctx.flags.description),
    keywords: splitList(ctx.flags.keywords),
    group: strOrUndef(ctx.flags.group) || ctx.config.defaultGroup,
  };

  const auto =
    text === undefined &&
    !hasRecency(ctx) &&
    process.stdin.isTTY &&
    history.count(ctx.p) === 0;
  if (ctx.flags.interactive || auto) {
    const ans = await interactiveSave(ctx, { text, ...meta });
    text = ans.text;
    meta = ans;
    source = "interactive";
  }

  if (text === undefined) {
    const n = recencyFrom(ctx);
    const entry = history.byRecency(ctx.p, n);
    if (!entry) {
      const total = history.count(ctx.p);
      return fail(ctx, 2, `no prompt at -${n}; only ${total} captured (see: promptnest count)`, {
        history: total,
      });
    }
    text = entry.text;
    source = `history:-${n}`;
  }

  if (!String(text).trim()) return fail(ctx, 1, "nothing to save (empty prompt text)");

  const record = prompts.createPrompt(ctx.p, {
    text,
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    group: meta.group,
    source,
  });
  indexer.build(ctx.p);

  out(ctx, `saved ${record.file}\n  id: ${record.meta.id}  group: ${record.meta.group}`, {
    saved: record.meta,
    file: path.relative(ctx.dir, record.file).split(path.sep).join("/"),
  });
  return 0;
}

function hasRecency(ctx) {
  return ctx.positionals.some((x) => /^-\d+$/.test(x)) || ctx.flags.n !== undefined;
}

function recencyFrom(ctx) {
  const pos = ctx.positionals.find((x) => /^-\d+$/.test(x));
  if (pos) return Math.abs(Number(pos));
  if (ctx.flags.n) return Math.abs(Number(ctx.flags.n));
  return 1;
}

// Guided save: ask for anything not already supplied on the command line.
async function interactiveSave(ctx, seed) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = async (label, def) => {
    const suffix = def ? ` [${def}]` : "";
    const a = (await rl.question(`${label}${suffix}: `)).trim();
    return a || def || "";
  };
  try {
    let text = seed.text;
    if (text === undefined) {
      console.log("Prompt text (finish with an empty line):");
      const lines = [];
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const line = await rl.question("");
        if (line === "") break;
        lines.push(line);
      }
      text = lines.join("\n").trim();
    }
    const title = await ask("Title", seed.title);
    const keywords = splitList(await ask("Keywords (comma-separated)", (seed.keywords || []).join(", ")));
    const group = await ask("Group", seed.group || ctx.config.defaultGroup);
    const description = await ask("Description (optional)", seed.description);
    return { text, title: strOrUndef(title), description: strOrUndef(description), keywords, group };
  } finally {
    rl.close();
  }
}

// ---- list -------------------------------------------------------------
export async function list(ctx) {
  const index = indexer.load(ctx.p);
  let items = index.prompts;
  if (ctx.flags.group) items = items.filter((r) => r.group === ctx.flags.group);
  if (ctx.flags.keyword)
    items = items.filter((r) => r.keywords.includes(ctx.flags.keyword));

  if (ctx.flags.json) return void console.log(JSON.stringify(items, null, 2));
  if (items.length === 0) return void console.log("(no prompts) — save one with `pn save -1`");
  for (const r of items) {
    const kw = r.keywords.length ? "  [" + r.keywords.join(", ") + "]" : "";
    console.log(`${r.id}\n  ${r.title} · ${r.group}${kw}`);
  }
}

// ---- search -----------------------------------------------------------
export async function search(ctx) {
  const q = (ctx.positionals[0] || "").toLowerCase();
  if (!q) return fail(ctx, 1, "usage: promptnest search \"<query>\"");
  const index = indexer.load(ctx.p);
  const scored = [];
  for (const r of index.prompts) {
    let score = 0;
    if (r.title.toLowerCase().includes(q)) score += 3;
    if (r.keywords.some((k) => k.toLowerCase().includes(q))) score += 2;
    if (r.description.toLowerCase().includes(q)) score += 1;
    try {
      const body = fs.readFileSync(path.join(ctx.dir, r.file), "utf8").toLowerCase();
      if (body.includes(q)) score += 1;
    } catch {}
    if (score > 0) scored.push({ score, r });
  }
  scored.sort((a, b) => b.score - a.score);
  const results = scored.map((s) => s.r);

  if (ctx.flags.json) return void console.log(JSON.stringify(results, null, 2));
  if (results.length === 0) return void console.log(`(no matches for "${q}")`);
  for (const r of results) console.log(`${r.id}  ·  ${r.title}  ·  ${r.group}`);
}

// ---- get --------------------------------------------------------------
export async function get(ctx) {
  const rec = findById(ctx, ctx.positionals[0]);
  if (!rec) return fail(ctx, 2, `prompt not found: ${ctx.positionals[0] || "(none)"}`);
  const { meta, body } = prompts.readFileRecord(rec.file);
  if (ctx.flags.json) return void console.log(JSON.stringify({ ...meta, file: rec.file, body }, null, 2));
  console.log(body);
}

// ---- path -------------------------------------------------------------
// Print the absolute .md file path for a prompt (handy for editors/scripts).
export async function pathCmd(ctx) {
  const rec = findById(ctx, ctx.positionals[0]);
  if (!rec) return fail(ctx, 2, `prompt not found: ${ctx.positionals[0] || "(none)"}`);
  if (ctx.flags.json) return void console.log(JSON.stringify({ id: rec.id, path: rec.file }, null, 2));
  console.log(rec.file);
}

// ---- use --------------------------------------------------------------
export async function use(ctx) {
  const rec = findById(ctx, ctx.positionals[0]);
  if (!rec) return fail(ctx, 2, `prompt not found: ${ctx.positionals[0] || "(none)"}`);
  const { meta, body } = prompts.readFileRecord(rec.file);
  const { text, missing } = fill(body, parseVars(ctx.vars));

  // bump usage
  meta.uses = Number(meta.uses || 0) + 1;
  meta.updated = nowIso();
  prompts.writeRecord(ctx.p, { meta, body });
  indexer.build(ctx.p);

  if (ctx.flags.json)
    return void console.log(JSON.stringify({ id: meta.id, text, missing_variables: missing }, null, 2));
  console.log(text);
  if (missing.length) console.error(`\n[missing variables: ${missing.join(", ")}]`);
}

// ---- count ------------------------------------------------------------
export async function count(ctx) {
  const h = history.count(ctx.p);
  const index = indexer.load(ctx.p);
  out(ctx, `history: ${h}   saved: ${index.count}`, { history: h, saved: index.count });
}

// ---- open -------------------------------------------------------------
export async function open(ctx) {
  const editor = ctx.config.editor;
  try {
    spawn(editor, [ctx.dir], { detached: true, stdio: "ignore" }).unref();
    out(ctx, `opening ${ctx.dir} in ${editor}`, { dir: ctx.dir, editor });
  } catch {
    out(ctx, ctx.dir, { dir: ctx.dir });
  }
}

// ---- rebuild-index ----------------------------------------------------
export async function rebuildIndex(ctx) {
  const index = indexer.build(ctx.p);
  out(ctx, `rebuilt index: ${index.count} prompt(s)`, { count: index.count });
}

// ---- init -------------------------------------------------------------
export async function init(ctx) {
  ensureVault(ctx.p);
  if (!fs.existsSync(ctx.p.config)) saveConfig(ctx.p, ctx.config);
  indexer.build(ctx.p);

  const agent = ctx.flags.agent || "claude";
  const written = [];
  if (agent === "claude") {
    const base = path.join(process.cwd(), ".claude", "commands");
    fs.mkdirSync(base, { recursive: true });
    for (const [name, content] of Object.entries(AGENT_FILES.claudeCommands)) {
      const file = path.join(base, name);
      writeFileAtomic(file, content);
      written.push(path.relative(process.cwd(), file));
    }
  }

  const msg = [
    `PromptNest vault ready at ${ctx.dir}`,
    written.length ? `installed slash commands:\n  - ${written.join("\n  - ")}` : "",
    "",
    "Add the watcher hook to your Claude Code settings.json:",
    AGENT_FILES.hookSnippet,
    "",
    "Optional — add to CLAUDE.md / AGENTS.md:",
    AGENT_FILES.guidance,
  ]
    .filter(Boolean)
    .join("\n");
  out(ctx, msg, { dir: ctx.dir, commands: written });
}

// ---- help -------------------------------------------------------------
export function help() {
  console.log(`promptnest — capture & reuse prompts locally

Usage: promptnest <command> [options]     (alias: pn)

Commands:
  init [-a claude]           set up the vault + install slash commands
  log                        (hook) append a piped prompt to history
  save ["text"] [-N] [-i]    save given text / Nth-from-latest / guided
        [-f file] [-t title] [-d desc] [-k a,b] [-g group]
        (also reads piped stdin: pn save -t t < prompt.txt)
  list [-g group] [--keyword k]      list saved prompts
  search "<query>"           search saved prompts
  get <id>                   print one prompt
  path <id>                  print the prompt's .md file path
  use <id> [--var k=v ...]   fill {{vars}} and print
  count                      history depth + saved count
  open                       open the vault folder
  rebuild-index              regenerate index.json + INDEX.md

Save shortcuts:
  pn save "Review {{lang}} code" -t "Lang review" -k review -g code-review
  pn save -i                 guided prompts for every field
  pn save -2                 save the 2nd-most-recent watched prompt

Long/large prompts (avoids terminal paste limits):
  pn save --file prompt.txt -t "JWT Auth" -g JWT
  pn save -t "JWT Auth" -g JWT < prompt.txt

Short flags: -t title  -k keywords  -g group  -d desc  -f file  -i interactive
Global:      --json/-j  --quiet/-q  --dir <path>

Vault: ~/.promptnest  (override with PROMPTNEST_DIR)`);
  return 0;
}

// ---- helpers ----------------------------------------------------------
function findById(ctx, id) {
  if (!id) return null;
  const index = indexer.load(ctx.p);
  let rec = index.prompts.find((r) => r.id === id);
  if (!rec) rec = index.prompts.find((r) => r.id.includes(id));
  if (!rec) return null;
  return { ...rec, file: path.join(ctx.dir, rec.file) };
}

function strOrUndef(v) {
  return typeof v === "string" && v.length ? v : undefined;
}

function splitList(v) {
  if (typeof v !== "string" || !v.length) return [];
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}
