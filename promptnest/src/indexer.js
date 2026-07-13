import fs from "node:fs";
import path from "node:path";
import { listFiles, readFileRecord } from "./prompts.js";
import { detectVars } from "./render.js";
import { writeFileAtomic } from "./paths.js";

function toRecord(p, file) {
  const { meta, body } = readFileRecord(file);
  return {
    id: meta.id || path.basename(file, ".md"),
    title: meta.title || "Untitled",
    description: meta.description || "",
    group: meta.group || "inbox",
    keywords: Array.isArray(meta.keywords) ? meta.keywords : [],
    file: path.relative(p.dir, file).split(path.sep).join("/"),
    variables: meta.variables?.length ? meta.variables : detectVars(body),
    created: meta.created || "",
    uses: Number(meta.uses || 0),
  };
}

// Rebuild index.json + INDEX.md from the prompt files (files are source of truth).
export function build(p) {
  const records = listFiles(p).map((f) => toRecord(p, f));
  records.sort((a, b) => (b.created > a.created ? 1 : b.created < a.created ? -1 : 0));

  const groups = [...new Set(records.map((r) => r.group))].sort();
  const index = { version: 1, count: records.length, groups, prompts: records };
  writeFileAtomic(p.index, JSON.stringify(index, null, 2) + "\n");
  writeFileAtomic(p.indexMd, renderIndexMd(records, groups));
  return index;
}

// Load index.json, rebuilding if missing/stale-unreadable.
export function load(p) {
  try {
    return JSON.parse(fs.readFileSync(p.index, "utf8"));
  } catch {
    return build(p);
  }
}

function renderIndexMd(records, groups) {
  const lines = [
    `# PromptNest Index  (${records.length} prompt${records.length === 1 ? "" : "s"} · ${groups.length} group${groups.length === 1 ? "" : "s"})`,
    "",
  ];
  if (records.length === 0) {
    lines.push("_No prompts saved yet. Use `pn save -1` after writing a prompt._", "");
    return lines.join("\n");
  }
  for (const group of groups) {
    lines.push(`## ${group}`, "");
    for (const r of records.filter((x) => x.group === group)) {
      const kw = r.keywords.length ? " — " + r.keywords.join(", ") : "";
      lines.push(`- [${r.title}](${r.file})${kw} · used ${r.uses}×`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
