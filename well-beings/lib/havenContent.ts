/**
 * Everything the safe place says, shows and links to, in one place.
 *
 * Kept out of the components so it can be read and argued with as writing.
 * Three rules for anything added here:
 *
 *  1. No toxic positivity. "Everything happens for a reason" and "just think
 *     positive" tell someone in pain that the pain is their fault. The lines
 *     below say something true and small instead.
 *  2. Nothing about methods, ever, anywhere. Safe-messaging guidance for
 *     suicide is unambiguous on this (#chatsafe 2.0, Robinson et al. 2023,
 *     PLOS ONE, doi:10.1371/journal.pone.0289494).
 *  3. Every video is a real upload whose ID and title were checked against
 *     YouTube's own listing before it went in. None is embedded until the
 *     person taps it, because an embed is a Google request and this app
 *     otherwise makes none.
 */
import type { CareLevel, Score } from "./care";
import type { HopeKind } from "./haven";

/* ── check-in wording ─────────────────────────────────────────── */

export const MOOD_OPTIONS: { v: Score; label: string }[] = [
  { v: 1, label: "Really heavy" },
  { v: 2, label: "Low" },
  { v: 3, label: "Getting through" },
  { v: 4, label: "Okay" },
  { v: 5, label: "Good" },
];

export const HOPE_OPTIONS: { v: Score; label: string }[] = [
  { v: 1, label: "I can't see a way forward" },
  { v: 2, label: "Hard to picture" },
  { v: 3, label: "Not sure" },
  { v: 4, label: "Some light" },
  { v: 5, label: "Hopeful" },
];

/* ── what the app says back, by level ─────────────────────────── */

export const RESPONSES: Record<CareLevel, { title: string; body: string }> = {
  steady: {
    title: "Good to have you here.",
    body: "Days like this are worth keeping a little of. Bank one good thing, or leave a note for a harder day.",
  },
  low: {
    title: "Thank you for telling me.",
    body: "Heavy days are real, and you don't have to fix this one. Let's just make the next ten minutes a little easier.",
  },
  heavy: {
    title: "It's been heavy for a while now.",
    body: "That's worth saying out loud to someone. Not because you're failing, but because nobody should carry a stretch like this on their own.",
  },
  thoughts: {
    title: "Thank you for telling me. That took something.",
    body: "Thoughts like these can feel permanent, and they do pass. Let's get you through the next few hours. Your plan and people you can call are right here.",
  },
  urgent: {
    title: "You don't have to get through this moment alone.",
    body: "Please talk to someone now. These lines are free, and they are there for exactly this.",
  },
};

/** Mood 3 without anything worrying: not "steady", not "low". */
export const GETTING_THROUGH = {
  title: "Getting through counts.",
  body: "Here's something small for the next few minutes, if you want it.",
};

/* ── one small thing ──────────────────────────────────────────── */

/**
 * Behavioural activation, shrunk to the size of a bad hour.
 *
 * The idea behind it is that action often comes before motivation rather
 * than after it, which is why these are physical and immediate instead of
 * goals. Each is under five minutes and needs nothing but where you are.
 */
export const TINY_STEPS: string[] = [
  "Drink a glass of water, slowly.",
  "Open a window, or step outside for two minutes. Notice the air.",
  "Wash your face with cool water.",
  "Put on one song you love and just listen to it.",
  "Send one person a short message. \"Thinking of you\" is enough.",
  "Eat something small. Anything counts.",
  "Stretch your arms over your head and hold it for three breaths.",
  "Tidy one small thing. One cup, one corner of a table.",
  "Find three colours outside a window.",
  "Change into something soft and comfortable.",
  "Sit somewhere with light on your face for a minute.",
  "Make a warm drink and hold the cup with both hands.",
];

/* ── words for right now ──────────────────────────────────────── */

export const WORDS: string[] = [
  "You don't have to feel better before you do the next small thing.",
  "Hopelessness is a symptom. It feels like a fact about the future, and it isn't one.",
  "Every hard night you've had so far, you got through. You don't have to do this one alone.",
  "Rest is allowed. So is asking for help. Neither one is giving up.",
  "Someone would be glad to hear from you today, probably more than you'd guess.",
  "Small still counts. A glass of water counts.",
  "You're allowed to take this one hour at a time. Or one minute.",
  "Feelings this loud are not always right, especially about what comes next.",
  "Being here, reading this, is a way of looking after yourself.",
];

/* ── the hope box ─────────────────────────────────────────────── */

export const HOPE_KINDS: { kind: HopeKind; title: string; prompt: string; placeholder: string }[] = [
  {
    kind: "people",
    title: "People who matter to me",
    prompt: "Someone who'd want you here. A friend, a sibling, a teacher, a pet counts too.",
    placeholder: "e.g. Didi, who always calls on Sundays",
  },
  {
    kind: "ahead",
    title: "Things I'm looking forward to",
    prompt: "Big or tiny. A trip, a show's next season, mango season, a friend's wedding.",
    placeholder: "e.g. The new season in December",
  },
  {
    kind: "moments",
    title: "Moments that felt good",
    prompt: "A memory you can step back into for a minute.",
    placeholder: "e.g. Chai on the terrace after the exams ended",
  },
  {
    kind: "through",
    title: "Things I've got through",
    prompt: "Proof, from your own life, that hard stretches end.",
    placeholder: "e.g. The year I moved cities alone",
  },
  {
    kind: "sounds",
    title: "Songs and videos that help",
    prompt: "Paste a link to something that lifts you, and give it a name.",
    placeholder: "e.g. The song from the road trip",
  },
];

/* ── videos ───────────────────────────────────────────────────── */

export interface Video {
  id: string;
  title: string;
  by: string;
  length: string;
  /** When to reach for it. One line, in the app's voice. */
  when: string;
  group: "comfort" | "understand" | "gratitude";
  lang?: "en" | "hi";
  /** Two stops from the dawn palette for the thumbnail. We draw our own
      thumbnails rather than load YouTube's, because loading theirs is a
      Google request before anyone has chosen to watch anything. */
  tint: [string, string];
}

/**
 * Chosen for someone who is struggling, not for someone browsing.
 *
 * The first group leans on what the research calls the Papageno effect:
 * stories of getting through a hard time were associated with a small
 * reduction in suicidal ideation among vulnerable viewers, across six
 * randomised trials (Niederkrotenthaler et al. 2022, Lancet Public Health,
 * doi:10.1016/S2468-2667(21)00274-7). Those are stories of coping and
 * recovery, never of crisis, and none of these describes a method.
 *
 * Talks that tell a survival story in detail were considered and left out:
 * this list was checked by title and channel, not watched frame by frame
 * from here, and a survival story is exactly the kind of video where one
 * minute can carry method detail the rest of it does not.
 *
 * Lengths are approximate on purpose.
 */
export const VIDEOS: Video[] = [
  {
    id: "Upm9LnuCBUM",
    title: "Fred Rogers' acceptance speech, 1997",
    by: "Fred Rogers, Daytime Emmys",
    length: "A few minutes",
    when: "When you feel alone. He asks a room full of people to spend ten seconds thinking of someone who loved them into being.",
    group: "comfort",
    tint: ["#FFC857", "#FF8DBA"],
  },
  {
    id: "XiCrniLQGYc",
    title: "I had a black dog, his name was depression",
    by: "World Health Organization",
    length: "About 4 min",
    when: "When it's hard to explain what this feels like. A drawn story of living with depression and getting it to heel.",
    group: "comfort",
    tint: ["#2E1956", "#7A4AA8"],
  },
  {
    id: "Ify95C3_Hs8",
    title: "I had a black dog, his name was depression (Hindi)",
    by: "Hindi version of the WHO film",
    length: "About 4 min",
    when: "वही कहानी, हिन्दी में।",
    group: "comfort",
    tint: ["#3B1D63", "#C4A8FF"],
    lang: "hi",
  },
  {
    id: "n3Xv_g3g-mA",
    title: "Loneliness",
    by: "Kurzgesagt – In a Nutshell",
    length: "About 10 min",
    when: "When you feel cut off. Why loneliness is a signal your body sends, not a verdict about you.",
    group: "understand",
    tint: ["#1D1142", "#9A6BC6"],
  },
  {
    id: "z-IR48Mb3W0",
    title: "What is depression?",
    by: "Helen M. Farrell, TED-Ed",
    length: "About 4 min",
    when: "When you want to understand what's going on. Depression is an illness, and it's treatable.",
    group: "understand",
    tint: ["#7A2E7E", "#FF9F80"],
  },
  {
    id: "aKIqn719DGE",
    title: "#DobaraPoocho",
    by: "The Live Love Laugh Foundation",
    length: "A few minutes",
    when: "About asking again when someone says \"I'm fine\". Worth watching, and worth sending to someone.",
    group: "understand",
    tint: ["#E8677E", "#FFC857"],
  },
  {
    id: "UtBsl3j0YRQ",
    title: "Want to be happy? Be grateful",
    by: "David Steindl-Rast, TED",
    length: "About 15 min",
    when: "When you want something slow and gentle. It ends in a quiet few minutes of looking at the world.",
    group: "gratitude",
    tint: ["#FF9F80", "#FFE3A1"],
  },
  {
    id: "fLJsdqxnZb0",
    title: "The happy secret to better work",
    by: "Shawn Achor, TED",
    length: "About 12 min",
    when: "When you've got a bit of room. Funny, and it's where the three-good-things habit comes from.",
    group: "gratitude",
    tint: ["#C4A8FF", "#FF8DBA"],
  },
];

export const VIDEO_GROUPS: { id: Video["group"]; title: string }[] = [
  { id: "comfort", title: "For when it's heavy" },
  { id: "understand", title: "Making sense of it" },
  { id: "gratitude", title: "When there's a bit of room" },
];

/* ── asking someone for help ──────────────────────────────────── */

/**
 * Words for the hardest message to write.
 *
 * People consistently underestimate how much others appreciate being reached
 * out to (Liu et al. 2022, Journal of Personality and Social Psychology,
 * doi:10.1037/pspi0000402), and how warmly support is received (Dungan et
 * al. 2021, Psychological Science). The first sentence is the barrier, so
 * here are some to borrow.
 */
export const REACH_OUT_MESSAGES: string[] = [
  "Hey, I'm having a really hard day. Could you check in on me later?",
  "I'm not doing great right now. Can we talk tonight?",
  "Could you stay on the phone with me for a bit? I don't want to be alone right now.",
  "No need to fix anything, I just wanted someone to know I'm struggling.",
];

/* ── why each part is here ────────────────────────────────────── */

export const WHY: Record<"hopebox" | "plan" | "gratitude" | "breathe" | "watch" | "reach", string> = {
  hopebox:
    "A hope box is a tool clinicians use with people who are struggling: reminders of reasons to keep going, kept somewhere you can reach in a bad moment. In a trial with 118 veterans who had recently had suicidal thoughts, a phone version helped people feel more able to cope with painful thoughts and feelings (Bush et al. 2017, Psychiatric Services).",
  plan:
    "This follows the Stanley–Brown Safety Planning Intervention. In a study of 1,640 people seen in emergency departments for suicidal crises, a safety plan with follow-up calls was linked to 45% fewer suicidal behaviours over six months and twice the odds of getting to a mental-health appointment (Stanley et al. 2018, JAMA Psychiatry).",
  gratitude:
    "Across 27 studies, gratitude practices produced a small reduction in symptoms of depression and anxiety (Cregg & Cheavens 2021, Journal of Happiness Studies, doi:10.1007/s10902-020-00236-6). Small is the honest word. It's a gentle habit, not a treatment, and it works best alongside other support.",
  breathe:
    "Breathing out for longer than you breathe in, at about six breaths a minute, calms the body's alarm response. It won't fix what's wrong. It buys a few steadier minutes to decide what to do next.",
  watch:
    "Stories of people getting through hard times were linked to a small drop in suicidal thoughts among people who were struggling, across six randomised trials (Niederkrotenthaler et al. 2022, Lancet Public Health).",
  reach:
    "People reliably underestimate how glad others are to hear from them (Liu et al. 2022). The message you're worried about sending is probably welcome.",
};
