/**
 * The line the opening sunrise leaves you with: a different one every time
 * Arun is opened, as the owner asked.
 *
 * Written for someone who may be having a hard day, so the rules are the
 * same as Ooh's (scripts/test-intro-lines.mjs holds them):
 *   - short enough to read in the time the words take to rise (<= 60);
 *   - second person or plain statement, never "we": there is no one behind
 *     the app, and a line that could read as "someone is with you" is a
 *     safety bug;
 *   - no promises about how things will turn out ("it will all be okay"):
 *     encouragement that is true on any day, not a forecast;
 *   - no em dashes, no "it's not X, it's Y", no exclamation marks.
 * The sunrise never plays in the three days after a check-in that reported
 * thoughts of suicide or not feeling safe, so these never stand in front of
 * the plan on those days.
 *
 * They go round in order, so every line is seen before any comes back; a
 * new phone starts at a random place in the round.
 */
export const INTRO_LINES: string[] = [
  "Small steps still move you forward.",
  "You don't have to feel ready to begin.",
  "Resting well is part of getting through.",
  "Some days, getting through is the whole win.",
  "A slow day is still a day you showed up for.",
  "Feelings are weather. Even the loud ones move on.",
  "Be as gentle with yourself as you'd be with a friend.",
  "One breath, then the next one. That's enough for now.",
  "You're allowed to take up space today.",
  "Progress can be quiet and still be real.",
  "Asking for help is a strong thing to do.",
  "You've carried hard things before.",
  "Nothing has to be fixed in the next five minutes.",
  "The sun doesn't rush, and it still rises.",
  "Small kindnesses count, especially the ones to yourself.",
  "You're more than the hardest moment of your day.",
  "Start where you are. It's where everyone starts.",
  "It's okay not to have it figured out.",
  "Drink some water. Unclench your jaw. Breathe out slowly.",
  "Every sunrise is a small fresh start.",
  "Hope can be small and still hold you up.",
  "You matter, exactly as you are today.",
  "Doing a little is different from doing nothing.",
  "Your pace is still a pace.",
  "Hard moments are moments. They pass through.",
  "Say one kind thing to yourself before you go on.",
  "Good things can grow in a little light.",
  "You don't need to earn rest.",
  "Look for one good thing today, even a small one.",
  "Opening this again took courage. That counts.",
  "The day can start over at any hour you choose.",
  "You're learning, even on days it doesn't feel like it.",
  "Kindness to yourself counts as progress.",
  "You don't have to carry all of today at once.",
  "Let today be simple: one thing, then the next.",
  "Growth is rarely a straight line. That's normal.",
  "Being tired doesn't mean you're failing.",
  "You can put something down for a while.",
  "A new day, a little more light.",
  "You showed up for yourself just now.",
];

export const INTRO_LINE_KEY = "arun-intro-line-v1";

function read(): number | null {
  try {
    const n = Number(window.localStorage.getItem(INTRO_LINE_KEY));
    return Number.isInteger(n) && window.localStorage.getItem(INTRO_LINE_KEY) !== null ? n : null;
  } catch {
    return null;
  }
}

/**
 * The line for this sunrise. Reading it does not use it up, so asking twice
 * while the sunrise is on screen gives the same line; `introLineUsed` moves
 * the round on once it has been shown. A new phone picks its starting place
 * once and remembers it, so this stays stable for React.
 */
export function introLine(): string {
  if (typeof window === "undefined") return "";
  let i = read();
  if (i === null) {
    i = Math.floor(Math.random() * INTRO_LINES.length);
    try {
      window.localStorage.setItem(INTRO_LINE_KEY, String(i));
    } catch {
      // Private mode: a line still shows; it may repeat next time.
    }
  }
  return INTRO_LINES[((i % INTRO_LINES.length) + INTRO_LINES.length) % INTRO_LINES.length];
}

/** The sunrise has shown its line: next time, the next one. */
export function introLineUsed() {
  if (typeof window === "undefined") return;
  const i = read() ?? 0;
  try {
    window.localStorage.setItem(INTRO_LINE_KEY, String((i + 1) % INTRO_LINES.length));
  } catch {
    // Not remembered; nothing breaks.
  }
}
