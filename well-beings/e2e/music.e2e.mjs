import { chromium, LAB, LAUNCH } from "./lib.mjs";
import { writeFileSync } from "fs";
const b = await chromium.launch({ executablePath: LAUNCH.executablePath, args: ["--no-sandbox"] });
const p = await b.newPage();
await p.goto(LAB);
const r = await p.evaluate(async () => {
  const { createAmbient, BELL_NOTES, CHORD_SECONDS } = await import("/lab/ambient-core.mjs");
  const SR = 44100, SEC = 44;
  const ctx = new OfflineAudioContext(2, SR * SEC, SR);
  const a = createAmbient(ctx);
  a.out.gain.setValueAtTime(0, 0);
  a.out.gain.linearRampToValueAtTime(0.55, 5);
  for (let i = 0; i * CHORD_SECONDS < SEC; i++) a.chord(0.1 + i * CHORD_SECONDS, i);
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let t = 4; t < SEC - 2; t += 5 + rnd() * 4) a.bell(t, BELL_NOTES[Math.floor(rnd() * BELL_NOTES.length)]);
  const buf = await ctx.startRendering();
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  let peak = 0; const perSec = [];
  for (let s = 0; s < SEC; s++) { let sum = 0; for (let i = s * SR; i < (s + 1) * SR; i++) { const v = (L[i] + R[i]) / 2; sum += v * v; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); } perSec.push(10 * Math.log10(sum / SR + 1e-12)); }
  // 16-bit WAV at 22050 Hz for listening
  const step = 2, n = Math.floor(L.length / step), data = new DataView(new ArrayBuffer(44 + n * 4));
  const w = (o, s) => [...s].forEach((c, i) => data.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF"); data.setUint32(4, 36 + n * 4, true); w(8, "WAVE"); w(12, "fmt "); data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, 2, true); data.setUint32(24, SR / step, true); data.setUint32(28, (SR / step) * 4, true); data.setUint16(32, 4, true); data.setUint16(34, 16, true); w(36, "data"); data.setUint32(40, n * 4, true);
  for (let i = 0; i < n; i++) { data.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i * step])) * 32767, true); data.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i * step])) * 32767, true); }
  let bin = ""; const u8 = new Uint8Array(data.buffer); for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return { peak, perSec, wav: btoa(bin) };
});
if (process.argv[2]) writeFileSync(process.argv[2], Buffer.from(r.wav, "base64"));
const settled = r.perSec.slice(6);
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else fail++; console.log(`  ${c ? "✓" : "✗"} ${m}`); };
console.log("peak", r.peak.toFixed(3), "(dBFS", (20 * Math.log10(r.peak)).toFixed(1) + ")");
console.log("RMS dBFS after fade-in: min", Math.min(...settled).toFixed(1), "max", Math.max(...settled).toFixed(1), "mean", (settled.reduce((a, b) => a + b) / settled.length).toFixed(1));
console.log("per second:", r.perSec.map((v) => v.toFixed(0)).join(" "));
/* The music is a quiet bed under the page: never loud, never gone. Measured
   when it was made: peak -16.7 dBFS, settled -31 to -28 dBFS RMS. */
const peakDb = 20 * Math.log10(r.peak);
ok(peakDb < -12, `peak stays below -12 dBFS (${peakDb.toFixed(1)})`);
ok(Math.min(...settled) > -36 && Math.max(...settled) < -24, `after the fade-in it holds between -36 and -24 dBFS RMS (${Math.min(...settled).toFixed(1)} to ${Math.max(...settled).toFixed(1)})`);
ok(settled.every((v, i) => i === 0 || Math.abs(v - settled[i - 1]) < 6), "no gaps or jumps from second to second");
console.log(`\n${pass} passed, ${fail} failed`);
await b.close();
