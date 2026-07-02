/**
 * Minimal .env loader (no dependency).
 * Loads KEY=VALUE pairs from <root>/.env into process.env without overriding
 * variables that are already set. Vite loads the same file for the client
 * (only VITE_* keys are ever exposed to the browser).
 */
import fs from "node:fs";
import path from "node:path";

export function loadEnv(dir: string) {
  const file = path.join(dir, ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = value;
  }
}
