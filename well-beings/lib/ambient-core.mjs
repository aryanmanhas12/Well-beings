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

const mtof = (m) => 440 * 2 ** ((m - 69) / 12);

/** A few seconds of stereo noise, decaying: the room. */
function room(ctx, seconds, decay) {
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = ctx.createBuffer(2, len, rate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let seed = c ? 22222 : 11111;
    for (let i = 0; i < len; i++) {
      /* A small fixed PRNG, so every render of the room is the same. */
      seed = (seed * 16807) % 2147483647;
      d[i] = ((seed / 2147483647) * 2 - 1) * (1 - i / len) ** decay;
    }
  }
  return buf;
}

/**
 * Builds the graph on `ctx` and returns the controls.
 * `out` starts silent; the caller fades it in.
 */
export function createAmbient(ctx, destination = ctx.destination) {
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
  reverb.buffer = room(ctx, 5.2, 2.4);
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

  /** One chord starting at `t`, lasting CHORD_SECONDS plus its fade. */
  function chord(t, index) {
    const notes = CHORDS[index % CHORDS.length];
    notes.forEach((m, i) => voice(t + i * 0.35, m, CHORD_SECONDS, i === 0 ? 0.05 : 0.036, (i % 2 ? 1 : -1) * (0.15 + i * 0.07)));
    /* A quiet sub an octave under the root, for warmth on headphones. */
    voice(t, notes[0] - 12, CHORD_SECONDS, 0.045, 0);
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

  return { out, chord, bell };
}
