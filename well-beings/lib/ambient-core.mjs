/**
 * The music: a slow, warm, resonant drone generated on the phone.
 *
 * No audio files. A recording would have to be downloaded (a few MB on a
 * patchy connection, for someone who may be on their last bit of data),
 * would loop audibly after a few minutes, and would need a licence. This is
 * a handful of oscillators and a synthetic room, it never repeats exactly,
 * and it costs nothing to load.
 *
 * WHAT IT PLAYS
 *
 *   Four chords in D major, fourteen seconds each, each fading in over
 *   five seconds and out over seven, so they overlap and there is never a
 *   gap or an edge: Dmaj9, Bm11, Gmaj9, Asus2. Every chord is built only
 *   from notes the others share, so nothing ever clashes.
 *
 *   Over them, now and then, a soft singing-bowl tone: a sine with the
 *   inharmonic partials of a struck bowl (2.76x and 5.4x), from the D major
 *   pentatonic, which sits consonantly on all four chords.
 *
 *   A synthetic room (a convolution with decaying noise, about five
 *   seconds) gives it the resonance. A slow filter swell, one cycle every
 *   twenty-two seconds, keeps it breathing.
 *
 * THREE VERSIONS, BY THE TIME OF DAY (October 2026, at the owner's request
 * for something "more soothing, like piano and water waves, birds")
 *
 *   Over the same chords, a soft piano plays a slow phrase in each one,
 *   and the world outside changes with the clock:
 *
 *     morning (5 am to noon): a brighter, higher piano; birdsong; a lake
 *       lapping at the shore.
 *     day (noon to 6 pm): a mid-register piano, unhurried; slow sea waves
 *       on a beach; now and then one bird.
 *     night (6 pm to 5 am): the piano low and sparse; deep, slow waves;
 *       sometimes an owl, far off.
 *
 *   The piano is additive synthesis: six slightly stretched partials (a
 *   real string's overtones run a little sharp, which is most of what
 *   makes it sound like a piano rather than an organ), a soft hammer
 *   tap, and a tone that darkens as the note dies away. Its melody walks
 *   the D major pentatonic, so it can never clash with the chords or the
 *   bowls, and leans on chord tones on the strong beats.
 *
 *   The waves are one looping noise source through a filter whose level and
 *   brightness swell and fall like water reaching the shore. The birds
 *   are short sine whistles with pitch sweeps, kept quiet: a real bird
 *   outside a window, not one in the room.
 *
 * Plain JavaScript taking any BaseAudioContext, so the same code renders
 * offline in the loudness test (scripts: qa-music) and could play in Ronak.
 */

export const CHORDS = [
  [50, 57, 61, 64, 66], // Dmaj9: D3 A3 C#4 E4 F#4
  [47, 54, 57, 62, 64], // Bm11: B2 F#3 A3 D4 E4
  [43, 50, 54, 57, 59], // Gmaj9: G2 D3 F#3 A3 B3
  [45, 52, 57, 59, 64], // Asus2: A2 E3 A3 B3 E4
];
/* D major pentatonic, D5 to D6. */
export const BELL_NOTES = [74, 76, 78, 81, 83, 86];
export const CHORD_SECONDS = 14;

/** The three versions of the music. */
export const MOODS = ["morning", "day", "night"];

/** Which version plays at this hour of the local day. */
export function moodForHour(h) {
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "day";
  return "night";
}

/* D major pentatonic over four octaves: the piano's notes. */
const PENTA = [];
for (let o = 0; o < 5; o++) for (const p of [2, 4, 6, 9, 11]) PENTA.push(38 + o * 12 + (p - 2));

/* How each version plays. `pad` scales the chords under the piano;
   `beat` is seconds per beat; `notes` the melody's range in the phrase;
   `lo`/`hi` its register; `vel` its touch. Levels were set by rendering
   each version offline, one layer at a time and then together
   (e2e/music.e2e.mjs). The first balance left the chords 8 to 12 dB over
   everything else, so the piano was barely there; then, with the chords
   stepped back, the end of each phrase fell to -39.6 dBFS, under the
   floor. As set, 44 s each, seeded: morning -34.0 to -28.7 dBFS RMS,
   peak -14.9; day -33.9 to -28.3, peak -13.9; night -33.6 to -30.1,
   peak -16.6. Alone, the piano peaks 4 dB above the chords in each. */
const MOOD = {
  morning: { pad: 0.48, beat: 0.8, notes: [6, 9], lo: 69, hi: 88, vel: [0.42, 0.62], left: 0, birds: [3, 6], waves: [3.6, 5.2], wave: { peak: 0.1, base: 0.045, crest: 950, trough: 380 } },
  day: { pad: 0.45, beat: 0.92, notes: [5, 7], lo: 64, hi: 83, vel: [0.42, 0.6], left: 0, birds: [0, 2], waves: [7, 10], wave: { peak: 0.16, base: 0.045, crest: 1500, trough: 330 } },
  night: { pad: 0.52, beat: 1.12, notes: [3, 5], lo: 57, hi: 76, vel: [0.4, 0.56], left: -12, birds: [0, 0], waves: [9, 12.5], wave: { peak: 0.16, base: 0.05, crest: 820, trough: 260 } },
};
export const PAD_LEVEL = { morning: MOOD.morning.pad, day: MOOD.day.pad, night: MOOD.night.pad };

const ALL_PARTS = { piano: true, water: true, birds: true };

const mtof = (m) => 440 * 2 ** ((m - 69) / 12);

/**
 * Six seconds of soft (pink-ish) stereo noise: the water. Paul Kellet's
 * economy filter over white noise, which takes the hiss out of it.
 */
function waterNoise(ctx, seconds) {
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * seconds);
  const fade = Math.floor(rate * 0.25);
  const buf = ctx.createBuffer(2, len, rate);
  const tmp = new Float32Array(len + fade);
  for (let c = 0; c < 2; c++) {
    let seed = c ? 4242 : 1717;
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < len + fade; i++) {
      seed = (seed * 16807) % 2147483647;
      const w = (seed / 2147483647) * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099046;
      b1 = 0.963 * b1 + w * 0.2965164;
      b2 = 0.57 * b2 + w * 1.0526913;
      tmp[i] = (b0 + b1 + b2 + w * 0.1848) * 0.18;
    }
    /* The loop's seam: the first quarter second fades from what would have
       come after the end into the start, so the wrap is continuous. */
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = tmp[i];
    for (let i = 0; i < fade; i++) {
      const k = i / fade;
      d[i] = tmp[i] * k + tmp[len + i] * (1 - k);
    }
  }
  return buf;
}

/**
 * A few seconds of stereo noise, decaying: the room.
 *
 * The decay curve is computed once every 64 samples and drawn straight
 * between: the power function per sample (half a million of them) made
 * the room take 149ms on a phone slowed 4x, inside the first tap. This
 * takes 57ms, and differs from the exact curve by less than 1e-7.
 */
function room(ctx, seconds, decay) {
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = ctx.createBuffer(2, len, rate);
  const STEP = 64;
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    /* A small fixed PRNG, so every render of the room is the same. */
    let seed = c ? 22222 : 11111;
    let e0 = 1;
    for (let i = 0; i < len; i += STEP) {
      const j = Math.min(len, i + STEP);
      const e1 = (1 - j / len) ** decay;
      const de = (e1 - e0) / STEP;
      let e = e0;
      for (let k = i; k < j; k++) {
        seed = (seed * 16807) % 2147483647;
        d[k] = ((seed / 2147483647) * 2 - 1) * e;
        e += de;
      }
      e0 = e1;
    }
  }
  return buf;
}

/**
 * Builds the graph on `ctx` and returns the controls.
 * `out` starts silent; the caller fades it in.
 */
export function createAmbient(ctx, destination = ctx.destination, { deferRoom = false } = {}) {
  const out = ctx.createGain();
  out.gain.value = 0;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -22;
  comp.knee.value = 12;
  comp.ratio.value = 3;
  comp.attack.value = 0.08;
  comp.release.value = 0.9;

  const dry = ctx.createGain();
  dry.gain.value = 0.65;
  const reverb = ctx.createConvolver();
  /* Live, the room is built just after the tap that starts the music, not
     inside it, so the screen answers the tap first (building it and handing
     it to the convolver took ~150ms on a slowed phone), when the phone is
     next idle and within 1.5s. The music starts silent and fades in, so
     the room is in place long before it is heard.
     An offline render (the loudness test) builds it at once. */
  /* The water's noise is built at the same moment as the room, for the
     same reason (about 20ms on a slowed phone, never inside a tap). */
  let waterBuf = null;
  const build = () => {
    reverb.buffer = room(ctx, 5.2, 2.4);
    waterBuf = waterNoise(ctx, 6);
  };
  if (!deferRoom) build();
  else if (typeof requestIdleCallback === "function") requestIdleCallback(build, { timeout: 1500 });
  else setTimeout(build, 60);
  const wet = ctx.createGain();
  wet.gain.value = 0.6;

  const pads = ctx.createGain();
  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 1300;
  tone.Q.value = 0.5;
  const swell = ctx.createOscillator();
  swell.frequency.value = 1 / 22;
  const swellDepth = ctx.createGain();
  swellDepth.gain.value = 420;
  swell.connect(swellDepth).connect(tone.frequency);
  swell.start();

  const bells = ctx.createGain();
  const bellSend = ctx.createGain();
  bellSend.gain.value = 1.4;

  pads.connect(tone);
  tone.connect(dry);
  tone.connect(reverb);
  bells.connect(dry);
  bells.connect(bellSend).connect(reverb);
  reverb.connect(wet);
  dry.connect(comp);
  wet.connect(comp);
  comp.connect(out);
  out.connect(destination);

  /* The piano, in the same room as the pads, a little softer on top. */
  const piano = ctx.createGain();
  const pianoTone = ctx.createBiquadFilter();
  pianoTone.type = "lowpass";
  pianoTone.frequency.value = 4200;
  pianoTone.Q.value = 0.3;
  const pianoSend = ctx.createGain();
  pianoSend.gain.value = 0.85;
  piano.connect(pianoTone);
  pianoTone.connect(dry);
  pianoTone.connect(pianoSend).connect(reverb);

  /* Outside the window: water and birds. Past the compressor, straight to
     the output, so a wave reaching the shore never ducks the piano; a
     little of it goes into the room for distance. */
  const nature = ctx.createGain();
  nature.connect(out);
  const natureSend = ctx.createGain();
  natureSend.gain.value = 0.22;
  nature.connect(natureSend).connect(reverb);
  const waterLP = ctx.createBiquadFilter();
  waterLP.type = "lowpass";
  waterLP.frequency.value = 300;
  waterLP.Q.value = 0.4;
  const waterGain = ctx.createGain();
  waterGain.gain.value = 0;
  const foam = ctx.createBiquadFilter();
  foam.type = "bandpass";
  foam.frequency.value = 2600;
  foam.Q.value = 0.6;
  const foamGain = ctx.createGain();
  foamGain.gain.value = 0;
  waterLP.connect(waterGain).connect(nature);
  foam.connect(foamGain).connect(nature);
  const birdHP = ctx.createBiquadFilter();
  birdHP.type = "highpass";
  birdHP.frequency.value = 1400;
  birdHP.connect(nature);
  let water = null;

  const pan = (v) => {
    if (!ctx.createStereoPanner) return null;
    const p = ctx.createStereoPanner();
    p.pan.value = v;
    return p;
  };

  function voice(t, midi, dur, level, spread) {
    const f = mtof(midi);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.setTargetAtTime(level, t, 1.7);
    g.gain.setTargetAtTime(0, t + dur, 2.3);
    const p = pan(spread);
    if (p) g.connect(p).connect(pads);
    else g.connect(pads);
    const end = t + dur + 12;
    for (const [type, detune, amt] of [
      ["sine", -4, 1],
      ["triangle", 5, 0.32],
    ]) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      o.detune.value = detune;
      const a = ctx.createGain();
      a.gain.value = amt;
      o.connect(a).connect(g);
      o.start(t);
      o.stop(end);
    }
  }

  /** One chord starting at `t`, lasting CHORD_SECONDS plus its fade.
      `level` scales it: under the piano the chords step back. */
  function chord(t, index, level = 1) {
    const notes = CHORDS[index % CHORDS.length];
    notes.forEach((m, i) => voice(t + i * 0.35, m, CHORD_SECONDS, (i === 0 ? 0.05 : 0.036) * level, (i % 2 ? 1 : -1) * (0.15 + i * 0.07)));
    /* A quiet sub an octave under the root, for warmth on headphones. */
    voice(t, notes[0] - 12, CHORD_SECONDS, 0.045 * level, 0);
  }

  /* ── the piano ─────────────────────────────────────────────────── */

  const KEY_LEVEL = 0.11;
  /* Overtone strengths of a softly played middle-register note. */
  const PARTIALS = [1, 0.45, 0.22, 0.12, 0.07, 0.04];

  /** One piano note: `vel` 0 to 1, held for `dur` seconds, panned `p`. */
  function key(t, midi, vel, dur, p = 0, rnd = Math.random) {
    const f = mtof(midi);
    const bus = ctx.createGain();
    const pn = pan(p);
    if (pn) bus.connect(pn).connect(piano);
    else bus.connect(piano);
    /* The tone darkens as the note dies away, as a real string's does. */
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.Q.value = 0.2;
    const tau = Math.max(0.9, Math.min(3.4, 3.4 - (midi - 50) * 0.055));
    lp.frequency.setValueAtTime(Math.min(11000, f * (5 + 9 * vel)), t);
    lp.frequency.setTargetAtTime(Math.max(f * 1.6, 350), t + 0.02, tau * 0.55);
    lp.connect(bus);
    const parts = midi > 76 ? 4 : 6;
    const end = t + Math.min(dur + 1.4, tau * 4.5);
    for (let n = 1; n <= parts; n++) {
      const o = ctx.createOscillator();
      /* Stretched partials: a real string's overtones run a little sharp. */
      o.frequency.value = f * n * Math.sqrt(1 + 0.00035 * n * n);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(PARTIALS[n - 1] * vel * KEY_LEVEL, t + 0.005);
      g.gain.setTargetAtTime(0, t + 0.006, tau / n ** 0.6);
      /* The damper, when the key is let go. */
      g.gain.setTargetAtTime(0, t + dur, 0.2);
      o.connect(g).connect(lp);
      o.start(t);
      o.stop(end);
    }
    /* The felt hammer: a breath of noise, a few milliseconds long. */
    if (waterBuf) {
      const h = ctx.createBufferSource();
      h.buffer = waterBuf;
      const hb = ctx.createBiquadFilter();
      hb.type = "bandpass";
      hb.frequency.value = Math.min(6000, f * 3);
      hb.Q.value = 1.2;
      const hg = ctx.createGain();
      hg.gain.setValueAtTime(0, t);
      hg.gain.linearRampToValueAtTime(0.06 * vel * KEY_LEVEL, t + 0.002);
      hg.gain.exponentialRampToValueAtTime(0.00001, t + 0.035);
      h.connect(hb).connect(hg).connect(lp);
      h.start(t, rnd() * 5, 0.05);
    }
  }

  /* Where the melody is, so each chord's phrase picks up from the last. */
  let melody = -1;

  /** The piano's phrase over one chord. */
  function phrase(t, index, mood, rnd) {
    const m = MOOD[mood] ?? MOOD.day;
    const notes = CHORDS[index % CHORDS.length];
    const chordPc = new Set(notes.map((n) => n % 12));
    /* Left hand: the chord's root, fifth and tenth, broken slowly. */
    const root = notes[0] + 12 + m.left;
    const halves = mood === "night" ? [0] : [0, CHORD_SECONDS / 2];
    for (const h of halves) {
      key(t + h + 0.08, root, m.vel[0] * 0.8, m.beat * 3.2, -0.2, rnd);
      key(t + h + 0.08 + m.beat, root + 7, m.vel[0] * 0.62, m.beat * 2.4, -0.12, rnd);
      key(t + h + 0.08 + m.beat * 2, notes[2] + 12 + m.left, m.vel[0] * 0.56, m.beat * 2.2, -0.05, rnd);
    }
    /* Right hand: a few notes of the pentatonic, stepping more than
       leaping, landing on the chord's own notes on the strong beats. */
    const lo = PENTA.findIndex((n) => n >= m.lo);
    let hi = PENTA.findIndex((n) => n > m.hi) - 1;
    if (hi < 0) hi = PENTA.length - 1;
    if (melody < lo || melody > hi) melody = Math.round((lo + hi) / 2);
    const beats = Math.floor(CHORD_SECONDS / m.beat) - 2;
    const count = m.notes[0] + Math.floor(rnd() * (m.notes[1] - m.notes[0] + 1));
    const slots = new Set();
    let guard = 0;
    while (slots.size < Math.min(count, beats - 2) && guard++ < 100) slots.add(2 + Math.floor(rnd() * (beats - 2)));
    const order = [...slots].sort((a, b) => a - b);
    order.forEach((slot, i) => {
      const steps = [-2, -1, -1, 0, 1, 1, 2];
      let next = Math.max(lo, Math.min(hi, melody + steps[Math.floor(rnd() * steps.length)]));
      if (slot % 2 === 0 && !chordPc.has(PENTA[next] % 12)) {
        if (next + 1 <= hi && chordPc.has(PENTA[next + 1] % 12)) next += 1;
        else if (next - 1 >= lo && chordPc.has(PENTA[next - 1] % 12)) next -= 1;
      }
      melody = next;
      const at = t + slot * m.beat;
      const until = i + 1 < order.length ? (order[i + 1] - slot) * m.beat + m.beat * 0.5 : m.beat * 3;
      /* A phrase swells a little in the middle and settles at the end. */
      const arch = Math.sin(((i + 0.5) / order.length) * Math.PI);
      const vel = m.vel[0] + (m.vel[1] - m.vel[0]) * (0.4 * rnd() + 0.6 * arch);
      key(at, PENTA[next], vel, until, 0.18, rnd);
    });
    /* A soft chord tone near the end, held over into the next chord, so a
       phrase never stops dead at the change (the quietest seconds of the
       first version fell exactly there). */
    key(t + CHORD_SECONDS - m.beat * 1.5, notes[1] + 12 + m.left, m.vel[0] * 0.6, m.beat * 3, -0.15, rnd);
  }

  /* ── the water ─────────────────────────────────────────────────── */

  function startWater(t) {
    if (water || !waterBuf) return;
    water = ctx.createBufferSource();
    water.buffer = waterBuf;
    water.loop = true;
    water.connect(waterLP);
    water.connect(foam);
    water.start(t);
  }

  /** One wave reaching the shore at `t` and drawing back. */
  function wave(t, mood, rnd) {
    const m = MOOD[mood] ?? MOOD.day;
    const w = m.wave;
    const rise = mood === "morning" ? 1.1 + rnd() * 0.7 : 1.8 + rnd() * 1.3;
    const fall = mood === "morning" ? 1.8 + rnd() * 1 : 3.2 + rnd() * 2;
    const peak = w.peak * (0.75 + rnd() * 0.4);
    waterGain.gain.setTargetAtTime(peak, t, rise / 3);
    waterLP.frequency.setTargetAtTime(w.crest * (0.85 + rnd() * 0.3), t, rise / 2.5);
    foamGain.gain.setTargetAtTime(peak * 0.3, t + rise * 0.7, rise / 4);
    waterGain.gain.setTargetAtTime(w.base, t + rise, fall / 3);
    waterLP.frequency.setTargetAtTime(w.trough, t + rise, fall / 2.5);
    foamGain.gain.setTargetAtTime(0, t + rise + 0.3, fall / 5);
  }

  /* ── the birds ─────────────────────────────────────────────────── */

  function whistle(t, f0, f1, dur, level, p, through = birdHP) {
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(level, t + Math.min(0.012, dur / 4));
    g.gain.exponentialRampToValueAtTime(0.00001, t + dur);
    const pn = pan(p);
    o.connect(g);
    if (pn) g.connect(pn).connect(through);
    else g.connect(through);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  /** One bird: a few chirps, a little song, a two-note call, or an owl. */
  function bird(t, kind, rnd) {
    const p = rnd() * 1.6 - 0.8;
    const lv = 0.019 + rnd() * 0.01;
    if (kind === "chirps") {
      const n = 2 + Math.floor(rnd() * 3);
      const base = 2600 + rnd() * 1000;
      const gap = 0.11 + rnd() * 0.05;
      for (let i = 0; i < n; i++) whistle(t + i * gap, base, base * 1.45, 0.07, lv, p);
    } else if (kind === "song") {
      const tones = [2900, 3300, 3700, 4100, 3500, 3100];
      let at = t;
      const n = 4 + Math.floor(rnd() * 3);
      for (let i = 0; i < n; i++) {
        const f = tones[Math.floor(rnd() * tones.length)];
        const d = 0.09 + rnd() * 0.07;
        whistle(at, f, f * (0.85 + rnd() * 0.35), d, lv * 0.9, p);
        at += d + 0.03 + rnd() * 0.05;
      }
    } else if (kind === "call") {
      whistle(t, 3200, 3120, 0.28, lv, p);
      whistle(t + 0.36, 2700, 2560, 0.32, lv, p);
    } else {
      /* The owl is low, so it skips the birds' high-pass. */
      whistle(t, 410, 380, 0.42, 0.02, p, nature);
      whistle(t + 0.62, 400, 365, 0.55, 0.02, p, nature);
    }
  }

  /**
   * Everything over one chord but the chord itself: the piano's phrase,
   * the waves and the birds of this time of day. `rnd` and `parts` are
   * for the tests: a seeded random so a render can be repeated, and one
   * layer at a time so the balance between them can be measured.
   */
  function scene(t, index, mood, rnd = Math.random, parts = ALL_PARTS) {
    const m = MOOD[mood] ?? MOOD.day;
    if (parts.piano) phrase(t, index, mood, rnd);
    if (parts.water) startWater(t);
    if (water && parts.water) {
      let w = t + rnd() * 2;
      while (w < t + CHORD_SECONDS) {
        wave(w, mood, rnd);
        w += m.waves[0] + rnd() * (m.waves[1] - m.waves[0]);
      }
    }
    if (!parts.birds) return;
    const birds = m.birds[0] + Math.floor(rnd() * (m.birds[1] - m.birds[0] + 1));
    const kinds = mood === "morning" ? ["chirps", "song", "song", "call"] : ["call", "chirps"];
    for (let i = 0; i < birds; i++) bird(t + 0.5 + rnd() * (CHORD_SECONDS - 2), kinds[Math.floor(rnd() * kinds.length)], rnd);
    if (mood === "night" && rnd() < 0.3) bird(t + 3 + rnd() * 8, "owl", rnd);
  }

  /** A struck-bowl tone at `t`. */
  function bell(t, midi, level = 0.03) {
    const f = mtof(midi);
    const p = pan((midi % 5) / 5 - 0.4);
    const bus = ctx.createGain();
    if (p) bus.connect(p).connect(bells);
    else bus.connect(bells);
    for (const [ratio, amp, decay] of [
      [1, 1, 7],
      [2, 0.14, 3.5],
      [2.76, 0.26, 2.6],
      [5.4, 0.07, 1.3],
    ]) {
      const o = ctx.createOscillator();
      o.frequency.value = f * ratio;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(level * amp, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.00001, t + decay);
      o.connect(g).connect(bus);
      o.start(t);
      o.stop(t + decay + 0.1);
    }
  }

  return { out, chord, bell, scene, key };
}
