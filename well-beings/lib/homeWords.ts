/**
 * What Home says, in English and in Hinglish.
 *
 * Home is the first screen and, for most people, the only one they see on
 * a visit: the check-in, what the sky says back, and the doors. When the
 * minute and the reel learned Hinglish (November 2026) it would have been
 * a strange welcome to ask "How are you arriving?" in English first, so
 * these are written in both.
 *
 * The check-in's wording is this app's own, not a validated instrument, so
 * it can be put in another language without breaking a score (the reason
 * the long wellbeing check stays in English: lib/i18n.ts). The one direct
 * question is translated as plainly as it is asked in English: it names
 * thoughts of ending one's life and nothing else, and its three answers
 * mean exactly what the English ones do, because lib/care.ts acts on them.
 *
 * The English here is the same wording the app has always used
 * (lib/havenContent.ts keeps the originals for the rooms that still read
 * them); a test holds the two together.
 *
 * Self-contained, so scripts/test-minute.mjs can read every line in Node.
 */
import type { CareLevel, Score } from "./care";

export type HomeLang = "en" | "hinglish";

export interface HomeStrings {
  arriving: string;
  arrivingBack: string;
  days: string;
  notNow: string;
  back: string;
  mood: Record<Score, string>;
  hope: Record<Score, string>;
  safetyQ: string;
  safetyNo: string;
  safetyThoughts: string;
  safetyUnsafe: string;
  safetyNote: string;
  /** The sky, before a check-in. */
  quietTitle: string;
  quietSub: string;
  backTitle: string;
  backSub: string;
  /** The sky, after one. */
  replies: Record<CareLevel, { title: string; body: string }>;
  gettingThrough: { title: string; body: string };
  dawnNone: string;
  dawnSome: (n: number) => string;
  dawnFull: string;
  opening: string;
  doors: string;
  breathe: string;
  breatheSub: string;
  watch: string;
  watchSub: string;
  sit: string;
  sitSub: string;
  play: string;
  playSub: string;
  again: string;
  tell: string;
  langLabel: string;
}

export const HOME_STRINGS: Record<HomeLang, HomeStrings> = {
  en: {
    arriving: "How are you arriving?",
    arrivingBack: "How are you arriving today?",
    days: "And the days ahead. How do they look from here?",
    notNow: "Not right now",
    back: "Back",
    mood: { 1: "Really heavy", 2: "Low", 3: "Getting through", 4: "Okay", 5: "Good" },
    hope: { 1: "I can't see a way forward", 2: "Hard to picture", 3: "Not sure", 4: "Some light", 5: "Hopeful" },
    safetyQ: "When things feel like this, some people have thoughts of ending their life. Has that been on your mind?",
    safetyNo: "No",
    safetyThoughts: "Yes, but I'm safe right now",
    safetyUnsafe: "Yes, and I don't feel safe",
    safetyNote: "Asking doesn't put the idea there; the research on this is consistent. Your answer stays on this phone and is only used to decide what to show you next.",
    quietTitle: "This is a quiet place. Take your time.",
    quietSub: "Nothing here is a test. Tap how you're arriving, or just look around.",
    backTitle: "I'm glad you came back.",
    backSub: "Last time was a hard one. How is it now?",
    replies: {
      steady: { title: "Good to have you here.", body: "Days like this are worth keeping a little of. If something is still nagging, give it one minute." },
      low: { title: "Thank you for telling me.", body: "Heavy days are real, and you don't have to fix this one. Let's just make the next ten minutes a little easier." },
      heavy: { title: "It's been heavy for a while now.", body: "That's worth saying out loud to someone. Not because you're failing, but because nobody should carry a stretch like this on their own." },
      thoughts: {
        title: "Thank you for telling me. That took something.",
        body: "Thoughts like these can feel permanent, and they do pass. Let's get you through the next few hours. Your plan and people you can call are right here.",
      },
      urgent: { title: "You don't have to get through this moment alone.", body: "Please talk to someone now. These lines are free, and they are there for exactly this." },
    },
    gettingThrough: { title: "Getting through counts.", body: "Here's something small for the next few minutes, if you want it." },
    dawnNone: "Each small thing you do lifts the sun",
    dawnSome: (n) => `${n} small thing${n === 1 ? "" : "s"} today`,
    dawnFull: "Full sunrise today",
    opening: "Watch the opening",
    doors: "Or one of these",
    breathe: "Breathe",
    breatheSub: "One minute with the sun",
    watch: "Watch",
    watchSub: "Talks and stories for hard days",
    sit: "Sit with me",
    sitSub: "Say the heavy thing. Nobody reads it",
    play: "Play",
    playSub: "Dogs vs cats. Everyone makes up",
    again: "Check in again",
    tell: "Tell me how you're arriving",
    langLabel: "Language for this page",
  },
  hinglish: {
    arriving: "Abhi kaisa lag raha hai?",
    arrivingBack: "Aaj kaisa lag raha hai?",
    days: "Aur aane wale din. Yahan se kaise dikhte hain?",
    notNow: "Abhi nahi",
    back: "Peeche",
    mood: { 1: "Bahut bhaari", 2: "Low", 3: "Bas din nikal raha hai", 4: "Theek-thaak", 5: "Achha" },
    hope: { 1: "Aage koi raasta nahi dikh raha", 2: "Sochna mushkil hai", 3: "Pata nahi", 4: "Thodi roshni hai", 5: "Ummeed hai" },
    safetyQ: "Jab sab aisa lagta hai, toh kuch logon ko apni zindagi khatam karne ke khayal aate hain. Kya aapke mann mein bhi aisa kuch aaya hai?",
    safetyNo: "Nahi",
    safetyThoughts: "Haan, par abhi main safe hoon",
    safetyUnsafe: "Haan, aur mujhe safe nahi lag raha",
    safetyNote: "Poochne se yeh khayal paida nahi hota; research is par ek jaisi hai. Aapka jawab isi phone par rehta hai, aur sirf yeh tay karne ke kaam aata hai ki aage kya dikhana hai.",
    quietTitle: "Yeh ek shaant jagah hai. Aaram se.",
    quietSub: "Yahan kuch bhi test nahi hai. Batao kaisa lag raha hai, ya bas dekh lo.",
    backTitle: "Achha laga ki aap wapas aaye.",
    backSub: "Pichhli baar mushkil thi. Ab kaisa hai?",
    replies: {
      steady: { title: "Achha laga ki aap aaye.", body: "Aise din thode sambhal kar rakhne layak hote hain. Agar kuch ab bhi khatak raha hai, use ek minute do." },
      low: { title: "Batane ke liye shukriya.", body: "Bhaari din sach mein hote hain, aur ise aaj fix karna zaroori nahi. Bas agle das minute thode aasan karte hain." },
      heavy: { title: "Kaafi time se bhaari chal raha hai.", body: "Yeh kisi se zor se kehne layak baat hai. Isliye nahi ki aap fail ho rahe hain, balki isliye ki itna lamba bojh kisi ko akele nahi uthana chahiye." },
      thoughts: {
        title: "Batane ke liye shukriya. Yeh aasan nahi tha.",
        body: "Aise khayal hamesha ke liye lagte hain, par yeh guzar jaate hain. Chalo agle kuch ghante nikalte hain. Aapka plan aur jinhe call kar sakte hain, sab yahin hai.",
      },
      urgent: { title: "Is pal se akele nahi guzarna hai.", body: "Please abhi kisi se baat karo. Yeh lines free hain, aur isi ke liye hain." },
    },
    gettingThrough: { title: "Din nikalna bhi gina jaata hai.", body: "Agle kuch minute ke liye yahan kuch chhota sa hai, agar chaho." },
    dawnNone: "Har chhoti cheez suraj ko thoda upar laati hai",
    dawnSome: (n) => `Aaj ${n} chhoti cheez${n === 1 ? "" : "ein"}`,
    dawnFull: "Aaj poora sunrise",
    opening: "Opening dekho",
    doors: "Ya inme se ek",
    breathe: "Saans lo",
    breatheSub: "Suraj ke saath ek minute",
    watch: "Dekho",
    watchSub: "Mushkil dinon ke liye talks aur kahaniyan",
    sit: "Mere saath baitho",
    sitSub: "Bhaari baat keh do. Koi nahi padhta",
    play: "Khelo",
    playSub: "Dogs vs cats. Aakhir mein sab dost",
    again: "Phir se check in",
    tell: "Batao kaisa lag raha hai",
    langLabel: "Is page ki bhasha",
  },
};

/** The app's language setting, as the language Home speaks. Hindi in
    Devanagari is not written for Home yet, so it gets Hinglish. */
export function homeLang(appLang: string): HomeLang {
  return appLang === "en" ? "en" : "hinglish";
}

/** Every line, for the tests. */
export function allHomeWords(): { en: string; hinglish: string }[] {
  const flat = (s: HomeStrings): string[] => [
    s.arriving,
    s.arrivingBack,
    s.days,
    s.notNow,
    s.back,
    ...Object.values(s.mood),
    ...Object.values(s.hope),
    s.safetyQ,
    s.safetyNo,
    s.safetyThoughts,
    s.safetyUnsafe,
    s.safetyNote,
    s.quietTitle,
    s.quietSub,
    s.backTitle,
    s.backSub,
    ...Object.values(s.replies).flatMap((r) => [r.title, r.body]),
    s.gettingThrough.title,
    s.gettingThrough.body,
    s.dawnNone,
    s.dawnSome(1),
    s.dawnSome(3),
    s.dawnFull,
    s.opening,
    s.doors,
    s.breathe,
    s.breatheSub,
    s.watch,
    s.watchSub,
    s.sit,
    s.sitSub,
    s.play,
    s.playSub,
    s.again,
    s.tell,
    s.langLabel,
  ];
  const en = flat(HOME_STRINGS.en);
  const hi = flat(HOME_STRINGS.hinglish);
  return en.map((text, i) => ({ en: text, hinglish: hi[i] }));
}
