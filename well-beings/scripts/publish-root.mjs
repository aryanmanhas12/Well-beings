/**
 * npm run publish:root: put the built export at the repository root, which
 * is what GitHub Pages serves ("Deploy from a branch", main, /).
 *
 * The site is only live once the export is at the root: editing source is
 * not shipping it, and source and live site have disagreed here before.
 * `.pages-manifest` lists exactly the root entries the export owns, so this
 * removes precisely those (never a source folder) and writes the new list.
 *
 *   NEXT_PUBLIC_BASE_PATH=/Well-beings npx next build   (npm run verify does this)
 *   npm run publish:root
 *   git add -A && git commit && git push origin HEAD:main
 */
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = join(APP, "..");
const OUT = join(APP, "out");
const MANIFEST = join(ROOT, ".pages-manifest");
/* Never touched, whatever a manifest says. */
const KEEP = new Set([".git", ".github", ".claude", "well-beings", "README.md", "AGENTS.md", "CLAUDE.md", "LICENSE", ".pages-manifest", ".gitignore"]);

const index = join(OUT, "index.html");
if (!existsSync(index) || !readFileSync(index, "utf8").includes("/Well-beings/_next/")) {
  console.error("No export built for GitHub Pages. Run: NEXT_PUBLIC_BASE_PATH=/Well-beings npx next build");
  process.exit(1);
}

const old = existsSync(MANIFEST) ? readFileSync(MANIFEST, "utf8").split("\n").filter(Boolean) : [];
for (const entry of old) {
  if (KEEP.has(entry) || entry.includes("/") || entry.startsWith("..")) continue;
  rmSync(join(ROOT, entry), { recursive: true, force: true });
}
const next = readdirSync(OUT).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
const clash = next.filter((e) => KEEP.has(e));
if (clash.length) {
  console.error(`The export would overwrite source entries: ${clash.join(", ")}`);
  process.exit(1);
}
cpSync(OUT, ROOT, { recursive: true });
writeFileSync(MANIFEST, next.join("\n") + "\n");
console.log(`Published ${next.length} entries to the repository root (${old.length ? `was ${old.length}` : "first run"}). Commit and push to main.`);
