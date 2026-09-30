import { chromium, BASE, LAUNCH } from "./lib.mjs";
const browser = await chromium.launch({ executablePath: LAUNCH.executablePath, args: ["--no-sandbox"] });

/* The sunrise now plays once per session. Tests start past it, unless a
   context is made with { __intro: true } to test the sunrise itself. */
{
  const __real = browser.newContext.bind(browser);
  browser.newContext = async (o = {}) => {
    const { __intro, ...rest } = o;
    const c = await __real(rest);
    if (!__intro) await c.addInitScript(() => { try { sessionStorage.setItem("arun-intro-session", "e2e"); } catch {} });
    return c;
  };
}
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const cr = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
let worst = 99, report = [];
for (const vp of [{ width: 360, height: 780 }, { width: 390, height: 844 }, { width: 1280, height: 900 }]) {
  for (const steps of [0, 5]) {
    for (const scenario of ["fresh", "thoughts"]) {
      const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, reducedMotion: "reduce" });
      const p = await ctx.newPage();
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const arrivals = scenario === "thoughts" ? [{ at: new Date().toISOString(), mood: 2, hope: 2, safety: "thoughts" }] : [];
      await p.addInitScript(([d, a]) => localStorage.setItem("wellbeings-safe-v1", JSON.stringify({ v: 1, arrivals: a, goodThings: [], hope: [], letter: null, plan: { warningSigns: "", coping: "", distractions: "", helpers: [], professionals: [], saferSurroundings: "", reason: "" }, care: null, dawn: d, region: "in", introSeen: true, lastVisit: null })), [{ date: today, steps: ["a", "b", "c", "d", "e"].slice(0, steps) }, arrivals]);
      await p.goto(BASE); await p.waitForTimeout(900);
      const boxes = await p.evaluate(() => [...document.querySelectorAll(".sky-content p, .sky-content h1, .sky-content .dawn-meter span:not(.dawn-dots), .scene-body p, .scene-body h2")].map((el) => { const r = el.getBoundingClientRect(); const c = getComputedStyle(el).color.match(/\d+/g).map(Number); return { t: el.textContent.slice(0, 30), x: r.x, y: r.y, w: r.width, h: r.height, c }; }));
      await p.addStyleTag({ content: ".sky-content, .sky-content *, .scene-body p, .scene-body h2 { color: transparent !important; } .sky-stars{display:none} .glow-text{background:none!important}" });
      await p.waitForTimeout(200);
      const shot = await p.screenshot();
      // decode PNG via canvas in page
      const px = await p.evaluate(async ({ b64, boxes }) => {
        const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
        const cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height;
        const g = cv.getContext("2d"); g.drawImage(img, 0, 0);
        return boxes.map((b) => {
          const d = g.getImageData(Math.max(0, Math.floor(b.x)), Math.max(0, Math.floor(b.y)), Math.max(1, Math.ceil(b.w)), Math.max(1, Math.ceil(b.h))).data;
          const samples = [];
          for (let i = 0; i < d.length; i += 4 * 7) samples.push([d[i], d[i + 1], d[i + 2]]);
          return samples;
        });
      }, { b64: shot.toString("base64"), boxes });
      boxes.forEach((b, i) => {
        const min = Math.min(...px[i].map((s) => cr(b.c, s)));
        if (min < worst) worst = min;
        report.push(`${vp.width}px dawn=${steps} ${scenario} "${b.t}" min ${min.toFixed(2)}:1`);
      });
      await ctx.close();
    }
  }
}
await browser.close();
report.filter((r) => parseFloat(r.split("min ")[1]) < 5).forEach((r) => console.log("  low:", r));
console.log(`sky text: ${report.length} measurements, worst ${worst.toFixed(2)}:1`);
