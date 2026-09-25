import { mentionsCrisis } from "./journal";

/**
 * The listener: somewhere to say the heavy thing, and to get something kind
 * and true said back.
 *
 * WHAT IT IS AND IS NOT
 *
 * It is not therapy and never says it is. Several places now regulate AI
 * that presents itself as therapy (Illinois banned it outright in 2025), and
 * the APA's 2025 advisory on chatbots and wellness apps is blunt that none
 * has shown it is safe or effective as mental-health care. What the evidence
 * does support is smaller and still worth having: being heard, putting a
 * feeling into words, and one reason for hope. So that is the whole job.
 *
 * TWO WAYS IT CAN ANSWER
 *
 *   On this phone (the default). Replies are written in advance, by a
 *   person, and picked here by a few plain keyword checks. Nothing is sent
 *   anywhere and nothing is kept. The UI says so, in those words, because a
 *   canned reply pretending to be a live one is exactly the fake empathy
 *   that makes people stop trusting these apps.
 *
 *   An AI listener (opt in). Only offered when the site is built with
 *   NEXT_PUBLIC_LISTENER_ENDPOINT pointing at the relay in /listener-relay,
 *   which holds the API key; the browser never sees one. Turning it on shows
 *   exactly where the words go before anything is sent.
 *
 * WHAT HAPPENS ON EVERY MESSAGE, IN BOTH MODES
 *
 *   1. The crisis check runs first, here, before anything else. If it
 *      matches, local helplines appear at once, whatever the mode.
 *   2. If what is being described sounds long-running ("for weeks", "every
 *      day", "nothing helps"), a quiet card offers Ronak, the companion app
 *      built for a proper look. It is offered, never pushed.
 *   3. Then the reply.
 *
 * Also deliberate: no "are you sure you want to leave?", no streak, no
 * nudge to come back. A Harvard Business School study of companion apps
 * found 43% of goodbyes were answered with guilt or fear of missing out. A
 * goodbye here gets a warm goodbye.
 */

export const LISTENER_ENDPOINT = process.env.NEXT_PUBLIC_LISTENER_ENDPOINT ?? "";
export const AI_AVAILABLE = LISTENER_ENDPOINT.startsWith("https://");

const PREFS_KEY = "arun-listener-v1";
export const LISTENER_KEY = PREFS_KEY;

export interface ListenerTurn {
  role: "user" | "listener";
  text: string;
}

export function loadAiPreference(): boolean {
  if (!AI_AVAILABLE || typeof window === "undefined") return false;
  try {
    return JSON.parse(window.localStorage.getItem(PREFS_KEY) || "{}").ai === true;
  } catch {
    return false;
  }
}

export function saveAiPreference(on: boolean) {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify({ ai: on, decidedAt: new Date().toISOString() }));
  } catch {
    // Not remembered; the choice still applies to this visit.
  }
}

export function isCrisis(text: string): boolean {
  return mentionsCrisis(text);
}

/* Long-running rather than one bad day. Deliberately broad: offering Ronak
   to someone who did not need it costs one dismissable card. */
const LONG_RUNNING = [
  /\bfor (weeks|months|years|a long time|ages)\b/i,
  /\bevery (single )?day\b/i,
  /\ball the time\b/i,
  /\bnothing (helps|works|changes)\b/i,
  /\bcan'?t (cope|go on|keep going|do this anymore|stop (crying|worrying|thinking))\b/i,
  /\balways (feel|felt|sad|anxious|tired|alone)\b/i,
  /\b(panic attacks?|can'?t sleep|not sleeping|stopped eating)\b/i,
  /\b(hopeless|worthless|no point)\b/i,
];

export function suggestsRonak(text: string, turns: number): boolean {
  return LONG_RUNNING.some((re) => re.test(text)) || turns >= 4;
}

/* ── Replies written in advance ─────────────────────────────────────────── */

interface Theme {
  id: string;
  test: RegExp;
  heard: string[];
}

/* Order matters: the first theme that matches wins, so the heavier ones go
   first. Hindi and common Hinglish words are included because Hindi is the
   app's second language and people type the way they talk. */
const THEMES: Theme[] = [
  {
    id: "harm-by-others",
    test: /\b(abuse[ds]?|abusive|assault(ed)?|hits? me|hit me|beats? me|touched me|forced me|threaten(s|ed)? me|unsafe at home)\b/i,
    heard: [
      "What you are describing is not okay, and it is not your fault. Thank you for trusting me with it.",
      "Nobody should have to go through that. I am really glad you said it out loud.",
    ],
  },
  {
    id: "grief",
    test: /\b(died|passed away|death|funeral|grief|grieving|lost my|miss (him|her|them) so)\b/i,
    heard: [
      "I am so sorry. Losing someone leaves a shape in every day that nothing else fits.",
      "That is a heavy loss to carry. It makes sense that it hurts this much, and there is no right way to grieve.",
    ],
  },
  {
    id: "heartbreak",
    test: /\b(break ?up|broke up|dumped|heartbroken|heart ?break|cheated|my ex\b|left me)\b/i,
    heard: [
      "That hurts. When someone who was part of every day is suddenly not, the quiet is loud.",
      "I am sorry. A heartbreak can make the whole world feel rearranged.",
    ],
  },
  {
    id: "lonely",
    test: /\b(lonely|alone|no ?one (cares|gets|understands)|nobody|no friends|left out|isolated|akela|akeli)\b/i,
    heard: [
      "Feeling alone is one of the hardest feelings there is. You reached out just now, and that matters.",
      "That sounds really lonely. For what it is worth, you are not the only one who has felt exactly this.",
    ],
  },
  {
    id: "exams",
    test: /\b(exams?|marks|grades?|results?|failed|failing|rank|neet|jee|boards|interview|rejected|rejection)\b/i,
    heard: [
      "That kind of pressure is heavy, and it can make one result feel like the whole of you. It is not.",
      "It makes sense this is weighing on you. A result is information about one day, not a measure of what you are worth.",
    ],
  },
  {
    id: "family",
    test: /\b(parents?|mom|mum|mother|dad|father|family|ghar|mummy|papa|in-?laws)\b/i,
    heard: [
      "Family can be where the deepest hurt and the deepest love live side by side. That is a lot to hold.",
      "That sounds really hard. When it is family, you cannot just walk away from it, which makes it heavier.",
    ],
  },
  {
    id: "tired",
    test: /\b(tired|exhausted|drained|burn(ed|t)? ?out|no energy|can'?t get up|thak|thaka|thaki)\b/i,
    heard: [
      "It sounds like you have been running on empty for a while. Being this tired is information, not weakness.",
      "That is a deep kind of tired. You have been carrying a lot.",
    ],
  },
  {
    id: "worry",
    test: /\b(anxious|anxiety|worried|worry|panic|scared|afraid|nervous|overthink|stress(ed)?|tension|dar)\b/i,
    heard: [
      "That sounds like a lot of worry to carry around. Your mind is trying to protect you, even when it overdoes it.",
      "I hear how on edge you feel. Worry makes everything feel urgent at once.",
    ],
  },
  {
    id: "angry",
    test: /\b(angry|furious|hate|so annoyed|frustrated|pissed|gussa|irritated)\b/i,
    heard: [
      "That sounds really frustrating. Anger usually shows up to guard something that matters to you.",
      "It makes sense to be angry about that. You are allowed to feel it.",
    ],
  },
  {
    id: "sad",
    test: /\b(sad|down|low|cry(ing)?|cried|empty|numb|hopeless|worthless|udaas|dukhi)\b/i,
    heard: [
      "I am sorry it feels this heavy right now. You do not have to explain it perfectly for it to be real.",
      "That sounds really hard. Thank you for putting it into words. That is not a small thing.",
    ],
  },
];

const GENERAL_HEARD = [
  "Thank you for telling me. I am listening.",
  "I hear you. Take your time, there is no rush here.",
  "That sounds like a lot. I am glad you said it.",
];

/* One reason for hope, never a pep talk. Each is something that stays true
   on a bad day. */
const HOPE = [
  "Feelings this big do move, even when it does not feel like they will.",
  "You have got through hard days before, even the ones you were sure you would not.",
  "You do not have to solve all of it tonight. Just the next small thing.",
  "The fact that it hurts this much shows how much you care.",
  "Tomorrow gets a new morning, whatever today was like.",
  "Small, kind things for yourself count right now. Water, a shower, a text to someone.",
];

const INVITE = [
  "Do you want to say more about it?",
  "What has been the hardest part?",
  "Is there someone in your life you could tell a little of this to?",
  "What would help, even slightly, in the next hour?",
  "I am here if there is more.",
];

const HARM_BY_OTHERS_NEXT =
  "If you are not safe right now, the lines under Help now can talk you through what to do, any time of day. Is there an adult or friend you trust who you could tell?";

/* A stable pick, so the same message always gets the same reply and two
   turns in a row do not repeat. Not random: randomness makes a canned reply
   feel like a slot machine. */
function pick<T>(list: T[], seed: string, turn: number): T {
  let h = turn * 7919;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return list[h % list.length];
}

export function isGoodbye(text: string): boolean {
  return /^\s*(bye|goodbye|good night|gn|thanks?( you)?|thank u|ok(ay)? thanks?|that'?s all|i'?m done|dhanyavaad|shukriya)[\s.!]*$/i.test(text);
}

export function onDeviceReply(text: string, turn: number): string {
  if (isGoodbye(text)) {
    return pick(
      [
        "Thank you for sitting with me. I hope the rest of today is a little gentler.",
        "Take care of yourself. I am here whenever you want to come back, no pressure.",
      ],
      text,
      turn,
    );
  }
  if (isCrisis(text)) {
    return "I am really glad you told me. What you are feeling matters, and you deserve to talk to a person about it right now. The numbers below are free and answer at any hour. If you can, reach out to one of them or to someone near you. I am still here.";
  }
  const theme = THEMES.find((t) => t.test.test(text));
  const heard = pick(theme ? theme.heard : GENERAL_HEARD, text, turn);
  if (theme?.id === "harm-by-others") return `${heard} ${HARM_BY_OTHERS_NEXT}`;
  /* Very short messages ("idk", "yeah") get presence, not a paragraph. */
  if (text.trim().split(/\s+/).length < 4) return `${heard} ${pick(INVITE, text, turn)}`;
  return `${heard} ${pick(HOPE, text, turn)} ${pick(INVITE, text, turn + 1)}`;
}

export const OPENING = "I am here. Say as much or as little as you want. There is no right way to start.";

/* ── The AI listener, through the relay ─────────────────────────────────── */

export interface RelayResult {
  reply: string;
  /** The model declined, or the relay flagged the message. Helplines show. */
  flagged: boolean;
}

/* Only the recent turns go, trimmed. The relay enforces the same limits;
   trimming here too keeps a long conversation from being refused outright. */
const MAX_TURNS_SENT = 12;
const MAX_CHARS_PER_TURN = 2000;

export async function askRelay(history: ListenerTurn[], signal?: AbortSignal): Promise<RelayResult> {
  const messages = history.slice(-MAX_TURNS_SENT).map((t) => ({
    role: t.role === "user" ? "user" : "assistant",
    content: t.text.slice(0, MAX_CHARS_PER_TURN),
  }));
  /* The API needs the first message to be the person's, and the opening
     line is the app's own, so a leading listener turn is dropped. */
  while (messages.length && messages[0].role !== "user") messages.shift();

  const res = await fetch(LISTENER_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages }),
    signal,
  });
  if (!res.ok) throw new Error(`relay ${res.status}`);
  const data = (await res.json()) as Partial<RelayResult>;
  if (typeof data.reply !== "string" || !data.reply.trim()) throw new Error("empty reply");
  return { reply: data.reply.trim(), flagged: !!data.flagged };
}
