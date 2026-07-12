import os from "node:os";
import path from "node:path";
import fs from "node:fs";

// ---- small shared utils ------------------------------------------------

export function splitOnce(str, sep) {
  const i = str.indexOf(sep);
  if (i === -1) return [str, undefined];
  return [str.slice(0, i), str.slice(i + 1)];
}

export function slugify(str, fallback = "prompt") {
  const s = String(str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return s || fallback;
}

export function nowIso() {
  return new Date().toISOString();
}

export function todayStamp(d = new Date()) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function readStdin() {
  if (process.stdin.isTTY) return "";
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

// ---- vault location + paths -------------------------------------------

export function resolveDir(flags = {}) {
  return (
    flags.dir ||
    process.env.PROMPTNEST_DIR ||
    path.join(os.homedir(), ".promptnest")
  );
}

export function paths(dir) {
  return {
    dir,
    config: path.join(dir, "config.json"),
    history: path.join(dir, "history.jsonl"),
    index: path.join(dir, "index.json"),
    indexMd: path.join(dir, "INDEX.md"),
    prompts: path.join(dir, "prompts"),
  };
}

export function ensureVault(p) {
  fs.mkdirSync(p.prompts, { recursive: true });
}

// atomic write: temp file then rename
export function writeFileAtomic(file, contents) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + ".tmp-" + process.pid;
  fs.writeFileSync(tmp, contents, "utf8");
  fs.renameSync(tmp, file);
}

// ---- config ------------------------------------------------------------

const CONFIG_DEFAULTS = {
  version: 1,
  defaultGroup: "inbox",
  historyCap: 500,
  editor: process.env.EDITOR || "code",
  output: "human",
};

export function loadConfig(p) {
  try {
    const raw = JSON.parse(fs.readFileSync(p.config, "utf8"));
    return { ...CONFIG_DEFAULTS, ...raw };
  } catch {
    return { ...CONFIG_DEFAULTS };
  }
}

export function saveConfig(p, config) {
  writeFileAtomic(p.config, JSON.stringify(config, null, 2) + "\n");
}
