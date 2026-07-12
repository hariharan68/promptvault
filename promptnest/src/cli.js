import { resolveDir, paths, ensureVault, loadConfig } from "./paths.js";
import * as commands from "./commands.js";

const BOOL_FLAGS = new Set([
  "json",
  "yes",
  "quiet",
  "help",
  "version",
  "interactive",
  "to-app",
  "from-app",
]);

// Single-letter shortcuts, expanded to their long form before parsing.
const SHORT_FLAGS = {
  t: "title",
  k: "keywords",
  g: "group",
  d: "desc",
  f: "file",
  i: "interactive",
  q: "quiet",
  j: "json",
  h: "help",
  v: "version",
  a: "agent",
  n: "n",
};

// Expand `-t` / `-t=value` short flags to `--title` / `--title=value`.
// Leaves recency positionals like `-2` and long `--flags` untouched.
function expandShort(argv) {
  return argv.map((a) => {
    const m = /^-([a-zA-Z])(=.*)?$/.exec(a);
    if (!m) return a;
    const long = SHORT_FLAGS[m[1]];
    return long ? `--${long}${m[2] || ""}` : a;
  });
}

// Lightweight argv parser: supports --flag, --flag value, --flag=value,
// -t short flags, repeatable --var k=v, negative recency positionals like -2.
export function parseArgs(rawArgv) {
  const argv = expandShort(rawArgv);
  const positionals = [];
  const flags = {};
  const vars = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") {
      positionals.push(...argv.slice(i + 1));
      break;
    }
    if (a.startsWith("--")) {
      let key = a.slice(2);
      let val;
      if (key.includes("=")) [key, val] = splitFirst(key, "=");
      if (key === "var") {
        vars.push(val !== undefined ? val : argv[++i]);
        continue;
      }
      if (val !== undefined) {
        flags[key] = val;
        continue;
      }
      if (BOOL_FLAGS.has(key)) {
        flags[key] = true;
        continue;
      }
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) flags[key] = true;
      else flags[key] = argv[++i];
    } else if (/^-\d+$/.test(a)) {
      positionals.push(a); // recency, e.g. -2
    } else {
      positionals.push(a);
    }
  }
  return { positionals, flags, vars };
}

function splitFirst(str, sep) {
  const i = str.indexOf(sep);
  return [str.slice(0, i), str.slice(i + 1)];
}

const DISPATCH = {
  init: commands.init,
  log: commands.log,
  save: commands.save,
  list: commands.list,
  search: commands.search,
  get: commands.get,
  use: commands.use,
  count: commands.count,
  open: commands.open,
  "rebuild-index": commands.rebuildIndex,
  help: commands.help,
};

export async function main(argv) {
  const { positionals, flags, vars } = parseArgs(argv);
  const command = positionals.shift();

  if (flags.version) {
    console.log("promptnest 0.1.0");
    return 0;
  }
  if (!command || command === "help" || flags.help) {
    return commands.help();
  }

  const handler = DISPATCH[command];
  if (!handler) {
    console.error(`promptnest: unknown command "${command}" (try: promptnest help)`);
    return 1;
  }

  const dir = resolveDir(flags);
  const p = paths(dir);
  if (command !== "log") ensureVault(p);
  const config = loadConfig(p);

  const ctx = { positionals, flags, vars, dir, p, config };
  return (await handler(ctx)) ?? 0;
}
