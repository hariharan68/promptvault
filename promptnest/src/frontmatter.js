// Minimal, dependency-free YAML-subset frontmatter for PromptNest's own files.
// Supports: scalar strings/numbers, and inline arrays `key: [a, b, c]`.
// This is intentionally NOT a general YAML parser — it only round-trips the
// controlled fields PromptNest writes.

function needsQuote(s) {
  return /[:#\[\]{}"']/.test(s) || /^\s|\s$/.test(s) || s === "";
}

function serializeScalar(v) {
  if (typeof v === "number") return String(v);
  const s = String(v);
  if (needsQuote(s)) return JSON.stringify(s);
  return s;
}

function serializeValue(v) {
  if (Array.isArray(v)) {
    return "[" + v.map((x) => serializeScalar(x)).join(", ") + "]";
  }
  return serializeScalar(v);
}

export function serialize(meta, body) {
  const lines = ["---"];
  for (const [key, value] of Object.entries(meta)) {
    if (value === undefined || value === null) continue;
    lines.push(`${key}: ${serializeValue(value)}`);
  }
  lines.push("---", "");
  return lines.join("\n") + "\n" + (body || "").replace(/^\n+/, "") + "\n";
}

function parseScalar(raw) {
  const s = raw.trim();
  if (s === "") return "";
  if (s.startsWith('"') || s.startsWith("'")) {
    try {
      return JSON.parse(s.replace(/^'/, '"').replace(/'$/, '"'));
    } catch {
      return s.replace(/^['"]|['"]$/g, "");
    }
  }
  if (/^-?\d+$/.test(s)) return Number(s);
  return s;
}

function parseValue(raw) {
  const s = raw.trim();
  if (s.startsWith("[") && s.endsWith("]")) {
    const inner = s.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map((x) => parseScalar(x));
  }
  return parseScalar(s);
}

export function parse(text) {
  const src = text.replace(/^﻿/, "");
  if (!src.startsWith("---")) {
    return { meta: {}, body: src };
  }
  const end = src.indexOf("\n---", 3);
  if (end === -1) return { meta: {}, body: src };

  const header = src.slice(3, end).replace(/^\n/, "");
  let body = src.slice(end + 4); // skip "\n---"
  body = body.replace(/^[^\n]*\n/, ""); // drop rest of the "---" line
  body = body.replace(/^\n+/, "");

  const meta = {};
  for (const line of header.split("\n")) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const [key, rest] = splitKey(line);
    if (key === undefined) continue;
    meta[key] = parseValue(rest);
  }
  return { meta, body };
}

function splitKey(line) {
  const i = line.indexOf(":");
  if (i === -1) return [undefined, ""];
  return [line.slice(0, i).trim(), line.slice(i + 1)];
}
