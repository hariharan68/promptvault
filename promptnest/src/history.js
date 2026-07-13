import fs from "node:fs";
import { nowIso } from "./paths.js";

// Append one prompt to history.jsonl. Never throws to the caller of the hook.
export function append(p, entry) {
  const line =
    JSON.stringify({
      ts: entry.ts || nowIso(),
      text: entry.text || "",
      source: entry.source || "unknown",
      session: entry.session || null,
    }) + "\n";
  fs.mkdirSync(p.dir, { recursive: true });
  fs.appendFileSync(p.history, line, "utf8");
}

export function readAll(p) {
  let raw;
  try {
    raw = fs.readFileSync(p.history, "utf8");
  } catch {
    return [];
  }
  const out = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
      /* skip malformed line */
    }
  }
  return out;
}

export function count(p) {
  return readAll(p).length;
}

// n = 1 => latest, 2 => before latest, ...
export function byRecency(p, n) {
  const all = readAll(p);
  if (n < 1 || n > all.length) return null;
  return all[all.length - n];
}

// Keep only the last `cap` lines.
export function trim(p, cap) {
  const all = readAll(p);
  if (all.length <= cap) return;
  const kept = all.slice(all.length - cap);
  fs.writeFileSync(p.history, kept.map((e) => JSON.stringify(e)).join("\n") + "\n", "utf8");
}
