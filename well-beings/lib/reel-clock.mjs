/**
 * Which reel it is, and the few words on its door.
 *
 * Its own small file, in plain JavaScript, for one reason: Home shows the
 * door ("Today's five", or "Seen. The next five come this evening.") and
 * must not carry every card of every reel to do it. lib/reel.ts holds the
 * cards and loads with the reel itself; this is what the first screen
 * needs. Plain .mjs like lib/ooh.mjs, so the Node tests and the app import
 * the same file.
 */

/** The same hours as the music (lib/ambient-core.mjs): 5 am to noon, noon
    to 6 pm, 6 pm to 5 am. */
export function reelPart(now) {
  const h = now.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "day";
  return "night";
}

const pad = (n) => String(n).padStart(2, "0");

/** The date a reel belongs to. Before 5 am it is still last night's. */
function reelDate(now) {
  const d = new Date(now);
  if (d.getHours() < 5) d.setDate(d.getDate() - 1);
  return d;
}

/** "2026-11-12-night": which reel this is. Kept so a reel already seen
    can say so. */
export function reelKey(now) {
  const d = reelDate(now);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${reelPart(now)}`;
}

/** A count that goes up by one with every reel: three a day. */
export function reelNumber(now) {
  const d = reelDate(now);
  const days = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
  return days * 3 + ["morning", "day", "night"].indexOf(reelPart(now));
}

export const REEL_DOOR = {
  en: {
    door: "Today's five",
    doorSub: "Five cards. About a minute. Then it stops.",
    doorOpen: "Open",
    doorSeen: "Seen.",
    next: {
      morning: "The next five come this afternoon.",
      day: "The next five come this evening.",
      night: "The next five come in the morning.",
    },
    again: "See them again",
  },
  hinglish: {
    door: "Aaj ke paanch",
    doorSub: "Paanch cards. Kareeb ek minute. Phir khatam.",
    doorOpen: "Kholo",
    doorSeen: "Dekh liye.",
    next: {
      morning: "Agle paanch dopahar mein aayenge.",
      day: "Agle paanch shaam ko aayenge.",
      night: "Agle paanch subah aayenge.",
    },
    again: "Phir se dekho",
  },
};
