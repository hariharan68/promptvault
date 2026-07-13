#!/usr/bin/env node
// Refresh the bundled CLI in this plugin from the canonical promptnest/ package.
//
// The promptnest/ package (a sibling of this plugin dir) is the single source of
// truth. This plugin ships a *copy* of bin/ and src/ so it runs self-contained —
// a user who installs the plugin gets a working CLI with no npm install.
//
// Run this whenever the CLI changes:  node scripts/sync-cli.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(here, "..");
const canonical = path.resolve(pluginRoot, "..", "promptnest");

if (!fs.existsSync(canonical)) {
  console.error(`sync-cli: canonical package not found at ${canonical}`);
  process.exit(1);
}

for (const dir of ["bin", "src"]) {
  const from = path.join(canonical, dir);
  const to = path.join(pluginRoot, dir);
  if (!fs.existsSync(from)) {
    console.error(`sync-cli: source not found: ${from}`);
    process.exit(1);
  }
  fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(from, to, { recursive: true });
  console.log(`synced ${dir}/  ←  ${path.relative(pluginRoot, from)}`);
}

console.log("CLI bundle is up to date.");
