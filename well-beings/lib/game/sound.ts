"use client";

/**
 * The game's sounds: splats, chimes, a honk, a woof and a mew. Made on the
 * spot from a few oscillators and a burst of noise, through the interface
 * sounds' own low-latency player (lib/sfx.ts), so they follow the same
 * rules: off with "Sounds" in Settings, silent while the urgent screen is
 * open, nothing before the first tap. No files to download.
 *
 * Soft on purpose. Every level here is a little under the interface clicks
 * (0.16 to 0.38 in sfx.ts), because a game makes a lot of them, and the
 * ones that repeat fastest (throws) are the quietest.
 */
import { sfxContext } from "../sfx";

export type GameSound =
  | "ready"
  | "go"
  | "throw"
  | "scoop"
  | "snow"
  | "mega"
  | "wall"
  | "gotHit"
  | "pickup"
  | "woof"
  | "mew"
  | "special"
  | "block"
  | "honk"
  | "out"
  | "hands"
  | "pop";

let noise: AudioBuffer | null = null;
const last = new Map<GameSound, number>();

function noiseBuf(ctx: AudioContext): AudioBuffer {
  if (noise && noise.sampleRate === ctx.sampleRate) return noise;
  const len = Math.floor(ctx.sampleRate * 0.5);
  noise = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noise.getChannelData(0);
  let s = 12345;
  for (let i = 0; i < len; i++) {
    s = (s * 16807) % 2147483647;
    d[i] = (s / 2147483647) * 2 - 1;
  }
  return noise;
}

function tone(ctx: AudioContext, out: AudioNode, t: number, type: OscillatorType, f0: number, f1: number, dur: number, gain: number) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function whoosh(ctx: AudioContext, out: AudioNode, t: number, type: BiquadFilterType, f0: number, f1: number, q: number, dur: number, gain: number) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf(ctx);
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(f0, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(out);
  src.start(t, Math.random() * 0.3, dur + 0.05);
}

/* D major pentatonic, so every chime sits inside the music. */
const BELLS = [587.33, 659.25, 739.99, 880, 987.77, 1174.66, 1318.51, 1479.98];

function chime(ctx: AudioContext, out: AudioNode, t: number, f: number, gain: number, dur = 1.1) {
  tone(ctx, out, t, "sine", f, f, dur, gain);
  tone(ctx, out, t, "sine", f * 2.76, f * 2.76, dur * 0.4, gain * 0.18);
}

/** Play one of the game's sounds. `pitch` nudges it (1 is as written). */
export function play(kind: GameSound, pitch = 1) {
  const ctx = sfxContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  /* The same sound twice within 45 ms is one sound. */
  if (now - (last.get(kind) ?? -1) < 0.045) return;
  last.set(kind, now);
  const t = now + 0.004;
  const out = ctx.createGain();
  out.gain.value = 1;
  out.connect(ctx.destination);
  const p = pitch;
  switch (kind) {
    case "ready":
      tone(ctx, out, t, "triangle", 660 * p, 660 * p, 0.12, 0.08);
      break;
    case "go":
      chime(ctx, out, t, 880, 0.1, 0.6);
      chime(ctx, out, t + 0.08, 1318.51, 0.08, 0.7);
      break;
    case "throw":
      whoosh(ctx, out, t, "bandpass", 700 * p, 2400 * p, 1.4, 0.13, 0.07);
      break;
    case "scoop":
      tone(ctx, out, t, "sine", 320 * p, 85 * p, 0.17, 0.2);
      whoosh(ctx, out, t, "lowpass", 1400, 380, 0.7, 0.1, 0.12);
      break;
    case "snow":
      whoosh(ctx, out, t, "highpass", 2600, 1400, 0.7, 0.14, 0.13);
      tone(ctx, out, t, "triangle", 640 * p, 300 * p, 0.09, 0.05);
      break;
    case "mega":
      whoosh(ctx, out, t, "highpass", 2200, 900, 0.7, 0.26, 0.18);
      tone(ctx, out, t, "sine", 140, 55, 0.24, 0.24);
      break;
    case "wall":
      tone(ctx, out, t, "sine", 260 * p, 90 * p, 0.12, 0.07);
      whoosh(ctx, out, t, "lowpass", 1000, 300, 0.7, 0.07, 0.05);
      break;
    case "gotHit":
      tone(ctx, out, t, "sine", 240 * p, 70 * p, 0.2, 0.2);
      whoosh(ctx, out, t, "lowpass", 900, 260, 0.7, 0.12, 0.12);
      break;
    case "pickup":
      chime(ctx, out, t, 880, 0.1, 0.5);
      chime(ctx, out, t + 0.07, 1318.51, 0.09, 0.6);
      chime(ctx, out, t + 0.14, 1760, 0.05, 0.5);
      break;
    case "woof":
      /* A small, friendly woof: a falling tone with breath in it. */
      tone(ctx, out, t, "sawtooth", 330, 190, 0.13, 0.05);
      tone(ctx, out, t, "sine", 260, 160, 0.14, 0.14);
      whoosh(ctx, out, t, "bandpass", 900, 500, 2, 0.1, 0.05);
      [587.33, 739.99, 880].forEach((f, i) => chime(ctx, out, t + 0.16 + i * 0.07, f, 0.06, 0.5));
      break;
    case "mew": {
      /* A rising-then-falling mew. */
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.setValueAtTime(700, t);
      o.frequency.linearRampToValueAtTime(1050, t + 0.12);
      o.frequency.linearRampToValueAtTime(620, t + 0.3);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.07, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + 0.34);
      [587.33, 739.99, 880].forEach((f, i) => chime(ctx, out, t + 0.3 + i * 0.07, f, 0.06, 0.5));
      break;
    }
    case "special": {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(220, t);
      o.frequency.exponentialRampToValueAtTime(880, t + 0.5);
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 1400;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.06, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      o.connect(f).connect(g).connect(out);
      o.start(t);
      o.stop(t + 0.6);
      BELLS.slice(3).forEach((fr, i) => chime(ctx, out, t + 0.35 + i * 0.05, fr, 0.05, 0.4));
      break;
    }
    case "block": {
      /* Boing. */
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(300, t);
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 18;
      const depth = ctx.createGain();
      depth.gain.setValueAtTime(70, t);
      depth.gain.exponentialRampToValueAtTime(1, t + 0.32);
      lfo.connect(depth).connect(o.frequency);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.1, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
      o.connect(g).connect(out);
      o.start(t);
      lfo.start(t);
      o.stop(t + 0.36);
      lfo.stop(t + 0.36);
      break;
    }
    case "honk": {
      for (const [f, at] of [[392, 0], [466.16, 0.15]] as [number, number][]) {
        const o = ctx.createOscillator();
        o.type = "square";
        o.frequency.value = f;
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 1300;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t + at);
        g.gain.linearRampToValueAtTime(0.025 * p, t + at + 0.01);
        g.gain.setValueAtTime(0.025 * p, t + at + 0.09);
        g.gain.exponentialRampToValueAtTime(0.0001, t + at + 0.12);
        o.connect(lp).connect(g).connect(out);
        o.start(t + at);
        o.stop(t + at + 0.14);
      }
      break;
    }
    case "out":
      /* Not a sad sound: a slide and a giggle. */
      tone(ctx, out, t, "triangle", 880, 440, 0.32, 0.09);
      [0, 0.09, 0.18].forEach((d, i) => tone(ctx, out, t + 0.34 + d, "sine", 1046 - i * 60, 900 - i * 60, 0.07, 0.06));
      break;
    case "hands":
      [587.33, 739.99, 880, 1174.66, 1479.98].forEach((f, i) => chime(ctx, out, t + i * 0.12, f, 0.085, 1.5));
      break;
    case "pop":
      tone(ctx, out, t, "sine", 500 * p, 1200 * p, 0.08, 0.08);
      break;
  }
}
