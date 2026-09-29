/**
 * npm run e2e: every end-to-end suite against the built export.
 *
 *   NEXT_PUBLIC_BASE_PATH=/Well-beings npx next build   (or npm run verify)
 *   npm run e2e                  all suites
 *   npm run e2e -- ooh feel      just these
 *
 * Starts the static server, runs each suite in its own process (so one
 * crash cannot hide another suite's result), and exits non-zero if any
 * check failed. Each suite prints ✓/✗ per check and a summary line.
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { APP, OUT } from "./lib.mjs";
import { serve } from "./serve.mjs";

const index = join(OUT, "index.html");
if (!existsSync(index) || !readFileSync(index, "utf8").includes("/Well-beings/_next/")) {
  console.error("Build first, with the Pages path: NEXT_PUBLIC_BASE_PATH=/Well-beings npx next build");
  process.exit(2);
}
const all = readdirSync(join(APP, "e2e")).filter((f) => f.endsWith(".e2e.mjs")).sort();
const want = process.argv.slice(2);
const suites = want.length ? all.filter((f) => want.some((w) => f.startsWith(w))) : all;
const server = await serve();
const results = [];
for (const s of suites) {
  const t0 = Date.now();
  const out = await new Promise((ok) => {
    let buf = "";
    const p = spawn(process.execPath, [join(APP, "e2e", s)], { cwd: APP, env: process.env });
    p.stdout.on("data", (d) => { buf += d; process.stdout.write(d); });
    p.stderr.on("data", (d) => { buf += d; process.stderr.write(d); });
    p.on("close", (code) => ok({ buf, code }));
  });
  const failed = (out.buf.match(/✗/g) || []).length;
  results.push({ s, failed, code: out.code, secs: ((Date.now() - t0) / 1000).toFixed(0) });
}
server.close();
console.log("\n── e2e summary ──");
for (const r of results) console.log(`${r.failed || r.code ? "✗" : "✓"} ${r.s.padEnd(22)} ${r.failed} failed, exit ${r.code}, ${r.secs}s`);
process.exit(results.some((r) => r.failed || r.code) ? 1 : 0);
