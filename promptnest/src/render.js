const VAR_RE = /\{\{\s*([\w.-]+)\s*\}\}/g;

// Unique variable names referenced in a prompt body.
export function detectVars(body) {
  const set = new Set();
  let m;
  VAR_RE.lastIndex = 0;
  while ((m = VAR_RE.exec(body)) !== null) set.add(m[1]);
  return [...set];
}

// Parse ["k=v", "a=b"] into { k: "v", a: "b" }.
export function parseVars(pairs = []) {
  const out = {};
  for (const pair of pairs) {
    const i = String(pair).indexOf("=");
    if (i === -1) continue;
    out[pair.slice(0, i)] = pair.slice(i + 1);
  }
  return out;
}

// Fill {{name}} from vars; report any that had no value.
export function fill(body, vars = {}) {
  const missing = new Set();
  const text = body.replace(VAR_RE, (whole, name) => {
    if (Object.prototype.hasOwnProperty.call(vars, name)) return vars[name];
    missing.add(name);
    return whole;
  });
  return { text, missing: [...missing] };
}
