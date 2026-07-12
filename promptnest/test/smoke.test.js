import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BIN = path.join(__dirname, "..", "bin", "pn.js");

function makeVault() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pnest-"));
  return dir;
}

function pn(dir, args, input) {
  const out = execFileSync(process.execPath, [BIN, ...args], {
    env: { ...process.env, PROMPTNEST_DIR: dir },
    input: input ?? undefined,
    encoding: "utf8",
  });
  return out;
}

test("save --text creates a file and indexes it", () => {
  const dir = makeVault();
  const res = JSON.parse(
    pn(dir, ["save", "--text", "Review {{language}} code for {{focus}}", "--title", "Lang review", "--keywords", "review,security", "--group", "code-review", "--json"]),
  );
  assert.equal(res.saved.group, "code-review");
  assert.deepEqual(res.saved.variables.sort(), ["focus", "language"]);
  assert.ok(fs.existsSync(path.join(dir, res.file)), "prompt file exists");
  assert.ok(fs.existsSync(path.join(dir, "INDEX.md")), "INDEX.md written");

  const list = JSON.parse(pn(dir, ["list", "--json"]));
  assert.equal(list.length, 1);
  assert.equal(list[0].title, "Lang review");
});

test("positional text + short flags save the same as long flags", () => {
  const dir = makeVault();
  const res = JSON.parse(
    pn(dir, ["save", "Review {{language}} code for {{focus}}", "-t", "Lang review", "-k", "review,security", "-g", "code-review", "--json"]),
  );
  assert.equal(res.saved.title, "Lang review");
  assert.equal(res.saved.group, "code-review");
  assert.deepEqual(res.saved.keywords, ["review", "security"]);
  assert.deepEqual(res.saved.variables.sort(), ["focus", "language"]);

  const body = JSON.parse(pn(dir, ["get", res.saved.id, "--json"])).body;
  assert.equal(body.trim(), "Review {{language}} code for {{focus}}");
});

test("save --file reads the body from a file (no arg-length limit)", () => {
  const dir = makeVault();
  const big = "Line " + "x".repeat(2000) + " with {{topic}}";
  const src = path.join(dir, "prompt-src.txt");
  fs.writeFileSync(src, big, "utf8");

  const res = JSON.parse(
    pn(dir, ["save", "--file", src, "-t", "Big", "-g", "big", "--json"]),
  );
  assert.equal(res.saved.source, "file");
  assert.deepEqual(res.saved.variables, ["topic"]);

  const body = JSON.parse(pn(dir, ["get", res.saved.id, "--json"])).body;
  assert.equal(body.trim(), big);
});

test("save reads a piped body from stdin", () => {
  const dir = makeVault();
  const res = JSON.parse(
    pn(dir, ["save", "-t", "Piped", "-g", "p", "--json"], "hello from {{stdin}}"),
  );
  assert.equal(res.saved.source, "stdin");
  assert.deepEqual(res.saved.variables, ["stdin"]);

  const body = JSON.parse(pn(dir, ["get", res.saved.id, "--json"])).body;
  assert.equal(body.trim(), "hello from {{stdin}}");
});

test("save --file with a missing path fails with code 2", () => {
  const dir = makeVault();
  let code = 0;
  try {
    execFileSync(process.execPath, [BIN, "save", "--file", path.join(dir, "nope.txt")], {
      env: { ...process.env, PROMPTNEST_DIR: dir },
      encoding: "utf8",
    });
  } catch (e) {
    code = e.status;
  }
  assert.equal(code, 2);
});

test("group folder is auto-created", () => {
  const dir = makeVault();
  pn(dir, ["save", "--text", "hi", "--group", "brand-new-group"]);
  assert.ok(fs.existsSync(path.join(dir, "prompts", "brand-new-group")));
});

test("watcher log + save -N by recency", () => {
  const dir = makeVault();
  pn(dir, ["log"], JSON.stringify({ hook_event_name: "UserPromptSubmit", prompt: "first prompt", session_id: "s1" }));
  pn(dir, ["log"], JSON.stringify({ hook_event_name: "UserPromptSubmit", prompt: "second prompt", session_id: "s1" }));

  const count = JSON.parse(pn(dir, ["count", "--json"]));
  assert.equal(count.history, 2);

  const saved = JSON.parse(pn(dir, ["save", "-2", "--group", "g", "--json"]));
  const rec = JSON.parse(pn(dir, ["get", saved.saved.id, "--json"]));
  assert.equal(rec.body.trim(), "first prompt");
  assert.equal(saved.saved.source, "history:-2");
});

test("use fills variables and reports missing", () => {
  const dir = makeVault();
  const saved = JSON.parse(pn(dir, ["save", "--text", "Do {{x}} and {{y}}", "--title", "t", "--json"]));
  const used = JSON.parse(pn(dir, ["use", saved.saved.id, "--var", "x=ALPHA", "--json"]));
  assert.match(used.text, /Do ALPHA and \{\{y\}\}/);
  assert.deepEqual(used.missing_variables, ["y"]);

  // uses incremented
  const rec = JSON.parse(pn(dir, ["get", saved.saved.id, "--json"]));
  assert.equal(rec.uses, 1);
});

test("search finds by title and keyword", () => {
  const dir = makeVault();
  pn(dir, ["save", "--text", "commit format", "--title", "Conventional commit", "--keywords", "git,commit", "--group", "commits"]);
  const results = JSON.parse(pn(dir, ["search", "commit", "--json"]));
  assert.ok(results.length >= 1);
  assert.equal(results[0].title, "Conventional commit");
});

test("save -N out of range fails with code 2", () => {
  const dir = makeVault();
  let code = 0;
  try {
    execFileSync(process.execPath, [BIN, "save", "-5"], {
      env: { ...process.env, PROMPTNEST_DIR: dir },
      encoding: "utf8",
    });
  } catch (e) {
    code = e.status;
  }
  assert.equal(code, 2);
});
