import fs from "node:fs";
import path from "node:path";
import * as fm from "./frontmatter.js";
import { detectVars } from "./render.js";
import { slugify, todayStamp, nowIso, writeFileAtomic } from "./paths.js";

// Build a unique id like "2026-07-12_lang-review", deduping against existing files.
export function makeId(title, p, date = new Date()) {
  const base = `${todayStamp(date)}_${slugify(title)}`;
  const existing = new Set(listFiles(p).map((f) => idFromFile(f)));
  if (!existing.has(base)) return base;
  let i = 2;
  while (existing.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

function idFromFile(file) {
  return path.basename(file, ".md");
}

export function groupDir(p, group) {
  return path.join(p.prompts, slugify(group, "inbox"));
}

export function fileFor(p, id, group) {
  return path.join(groupDir(p, group), id + ".md");
}

// Recursively collect *.md files under prompts/.
export function listFiles(p) {
  const out = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile() && e.name.endsWith(".md")) out.push(full);
    }
  };
  walk(p.prompts);
  return out;
}

export function readFileRecord(file) {
  const text = fs.readFileSync(file, "utf8");
  const { meta, body } = fm.parse(text);
  return { meta, body, file };
}

export function writeRecord(p, { meta, body }) {
  const file = fileFor(p, meta.id, meta.group);
  writeFileAtomic(file, fm.serialize(meta, body));
  return file;
}

// Create a fresh saved prompt from captured text + metadata.
export function createPrompt(p, { text, title, description, keywords, group, source }) {
  const finalTitle = title || firstLine(text) || "Untitled prompt";
  const finalGroup = group || "inbox";
  const id = makeId(finalTitle, p);
  const meta = {
    id,
    title: finalTitle,
    description: description || "",
    keywords: keywords || [],
    group: finalGroup,
    source: source || "manual",
    created: nowIso(),
    updated: nowIso(),
    uses: 0,
    variables: detectVars(text),
  };
  const file = writeRecord(p, { meta, body: text });
  return { meta, file };
}

function firstLine(text) {
  const line = String(text || "").split("\n").find((l) => l.trim());
  if (!line) return "";
  return line.trim().slice(0, 60);
}
