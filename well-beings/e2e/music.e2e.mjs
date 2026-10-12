import { chromium, LAB, LAUNCH } from "./lib.mjs";
import { writeFileSync } from "fs";
const b = await chromium.launch({ executablePath: LAUNCH.executablePath, args: ["--no-sandbox"] });
const p = await b.newPage();
await p.goto(LAB);

/* Each of the three versions (morning, day, night) rendered offline for 44
   seconds exactly as lib/ambient.ts schedules it: the chords at that
   version's level, its piano, water and birds, and a bowl now and then.
   A seeded random, so a failing render can be repeated. Pass a folder as
   the first argument to also write each one as a WAV to listen to. */
async function render(mood) {
  return p.evaluate(async (mood) => {
    const { createAmbient, BELL_NOTES, CHORD_SECONDS, PAD_LEVEL } = await import("/lab/ambient-core.mjs");
    const SR = 44100, SEC = 44;
    const ctx = new OfflineAudioContext(2, SR * SEC, SR);
    const a = createAmbient(ctx);
    a.out.gain.setValueAtTime(0, 0);
    a.out.gain.linearRampToValueAtTime(0.55, 5);
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i * CHORD_SECONDS < SEC; i++) {
      a.chord(0.1 + i * CHORD_SECONDS, i, PAD_LEVEL[mood]);
      a.scene(0.1 + i * CHORD_SECONDS, i, mood, rnd);
      if (rnd() < 0.4) a.bell(0.1 + i * CHORD_SECONDS + 3 + rnd() * 9, BELL_NOTES[Math.floor(rnd() * BELL_NOTES.length)]);
    }
    const buf = await ctx.startRendering();
    const L = buf.getChannelData(0), R = buf.getChannelData(1);
    let peak = 0; const perSec = [];
    for (let s = 0; s < SEC; s++) { let sum = 0; for (let i = s * SR; i < (s + 1) * SR; i++) { const v = (L[i] + R[i]) / 2; sum += v * v; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); } perSec.push(10 * Math.log10(sum / SR + 1e-12)); }
    /* How much of it is above 1.5 kHz: birds and the piano's top. */
    let hi = 0, all = 0, prev = 0;
    for (let i = 5 * SR; i < SEC * SR; i++) { const v = L[i]; const d = v - prev; prev = v; hi += d * d; all += v * v; }
    // 16-bit WAV at 22050 Hz for listening
    const step = 2, n = Math.floor(L.length / step), data = new DataView(new ArrayBuffer(44 + n * 4));
    const w = (o, s) => [...s].forEach((c, i) => data.setUint8(o + i, c.charCodeAt(0)));
    w(0, "RIFF"); data.setUint32(4, 36 + n * 4, true); w(8, "WAVE"); w(12, "fmt "); data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, 2, true); data.setUint32(24, SR / step, true); data.setUint32(28, (SR / step) * 4, true); data.setUint16(32, 4, true); data.setUint16(34, 16, true); w(36, "data"); data.setUint32(40, n * 4, true);
    for (let i = 0; i < n; i++) { data.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i * step])) * 32767, true); data.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i * step])) * 32767, true); }
    let bin = ""; const u8 = new Uint8Array(data.buffer); for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode(...u8.subarray(i, i + 0x8000));
    return { peak, perSec, bright: hi / (all + 1e-12), wav: btoa(bin) };
  }, mood);
}

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else fail++; console.log(`  ${c ? "✓" : "✗"} ${m}`); };
const bright = {};
for (const mood of ["morning", "day", "night"]) {
  const r = await render(mood);
  if (process.argv[2]) writeFileSync(`${process.argv[2]}/music-${mood}.wav`, Buffer.from(r.wav, "base64"));
  const settled = r.perSec.slice(6);
  const peakDb = 20 * Math.log10(r.peak);
  bright[mood] = r.bright;
  console.log(`${mood}: peak ${peakDb.toFixed(1)} dBFS; RMS ${Math.min(...settled).toFixed(1)} to ${Math.max(...settled).toFixed(1)} dBFS; brightness ${r.bright.toFixed(4)}`);
  console.log("  per second:", r.perSec.map((v) => v.toFixed(0)).join(" "));
  /* The music is a quiet bed under the page: never loud, never gone. Measured
     when the drone alone was made: peak -16.7 dBFS, settled -31 to -28 dBFS
     RMS. The three versions with piano, water and birds keep to the same
     bounds. */
  ok(peakDb < -12, `${mood}: peak stays below -12 dBFS (${peakDb.toFixed(1)})`);
  ok(Math.min(...settled) > -36 && Math.max(...settled) < -24, `${mood}: after the fade-in it holds between -36 and -24 dBFS RMS (${Math.min(...settled).toFixed(1)} to ${Math.max(...settled).toFixed(1)})`);
  ok(settled.every((v, i) => i === 0 || Math.abs(v - settled[i - 1]) < 6), `${mood}: no gaps or jumps from second to second`);
}
/* Night is the softest version: no birds, and the piano low. */
ok(bright.night < bright.morning, `night is darker than morning (${bright.night.toFixed(4)} < ${bright.morning.toFixed(4)})`);
console.log(`\n${pass} passed, ${fail} failed`);
await b.close();
