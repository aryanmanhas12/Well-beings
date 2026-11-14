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

/**
 * Go to a room the way a person does.
 *
 * Three tabs since November 2026: Home, Me, Talk. Watch is a door on Home;
 * Hope and Plan are rows in Me. The suites were written when each room had
 * its own tab, and they still say which room they want; this takes the
 * real path there, so every suite also proves the path exists.
 */
export async function goRoom(p, room) {
  const tab = (name) => p.locator(".tabbar").getByRole("button", { name, exact: true }).click();
  if (room === "here") await tab("Home");
  else if (room === "me") await tab("Me");
  else if (room === "reach") await tab("Talk");
  else if (room === "watch") {
    await tab("Home");
    await p.locator(".door", { hasText: "Talks and stories" }).click();
  } else if (room === "hope") {
    await tab("Me");
    await p.locator(".me .tool-row", { hasText: "My hope path" }).click();
  } else if (room === "plan") {
    await tab("Me");
    await p.locator(".me .tool-row", { hasText: "My safety plan" }).click();
  } else throw new Error(`no such room: ${room}`);
}

/** Which room is on screen: here, watch, me, hope, plan or reach. */
export const roomOf = (p) => p.evaluate(() => document.querySelector("main.haven")?.className.match(/haven-(\w+)/)?.[1] ?? null);
