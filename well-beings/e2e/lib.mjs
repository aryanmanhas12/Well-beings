/**
 * What every end-to-end suite shares: the browser, where the built site
 * is served, and axe for the accessibility scans.
 *
 * The suites drive the real static export (out/, built with
 * NEXT_PUBLIC_BASE_PATH=/Well-beings) in a real Chromium, because most of
 * what has broken in Arun was invisible to anything that did not: a tap
 * swallowed on iPhone, a sunrise out of step with its music, a line of
 * Ooh stuck behind a glow. `npm run e2e` runs them all (e2e/run.mjs).
 */
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export { chromium } from "playwright-core";

const here = dirname(fileURLToPath(import.meta.url));
export const APP = join(here, "..");
export const OUT = join(APP, "out");
export const PORT = Number(process.env.E2E_PORT || 8099);
export const ORIGIN = `http://127.0.0.1:${PORT}`;
export const BASE = `${ORIGIN}/Well-beings/`;
export const LAB = `${ORIGIN}/lab/`;

/* The browser: PW_CHROME wins; then the one preinstalled in Claude's cloud
   container; then Playwright's own (npx playwright-core install chromium). */
const LOCAL = "/opt/pw-browsers/chromium";
export const EXE = process.env.PW_CHROME || (existsSync(LOCAL) ? LOCAL : undefined);
export const LAUNCH = { executablePath: EXE, args: ["--no-sandbox"] };

const require = createRequire(import.meta.url);
export const AXE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
