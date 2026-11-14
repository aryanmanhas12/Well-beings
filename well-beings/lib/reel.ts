/**
 * The reel that ends: the rules and the words.
 *
 * What it is. Five full-screen cards to swipe through, about a minute, and
 * then it stops. One reel for the morning, one for the day, one for the
 * night. Opening it again shows the same five, never a sixth.
 *
 * Why it exists. Many people reach for a phone when they feel bad, and what
 * the phone has ready is a feed that does not end. Across 71 studies and
 * 98,299 people, heavier short-video use went along with poorer attention
 * (r = -.38) and with more stress and anxiety (Nguyen et al. 2025,
 * Psychological Bulletin); the studies are mostly cross-sectional, so they
 * cannot say which causes which, and the card that mentions it says so.
 * This takes the shape that hand already knows (a thumb, a card, the next
 * card) and gives it an arc and an end: a line worth reading, one thing
 * known about the mind with its source, one question answered in a tap, one
 * thing to do before the phone goes down, one person.
 *
 * What makes it worth opening again is that it is different each time and
 * short every time. Nothing here counts days, keeps a streak or says
 * "come back": trials of mental health apps with points and streaks had
 * more dropout, not less (Liu et al. 2025, JAMA Psychiatry, in
 * lib/evidence.ts), and persuasive design features were not associated with
 * engagement or with benefit across 92 trials (Valentine et al. 2025).
 *
 * The answers to the questions are not kept. Self-monitoring and log-keeping
 * went with worse results in brief digital help for young people (Opie et
 * al. 2024); a tap here gets a reply and is gone.
 *
 * Every figure on a fact card is from a paper already checked for this app
 * (lib/evidence.ts) or read for this feature in November 2026, with the
 * source printed on the card. No figure is rounded up, and none is a
 * promise about the person reading it.
 *
 * Like lib/care.ts and lib/minute.ts it runs in Node as it is, so
 * scripts/test-minute.mjs can read every line. Its one import is the small
 * clock in lib/reel-clock.mjs, which Home also uses for the door.
 */
import type { Words } from "./minute";
import { REEL_DOOR, reelKey, reelNumber, reelPart, type ReelPart } from "./reel-clock.mjs";

/** The level names of lib/care.ts, repeated as a type so this file imports
    nothing at run time. */
export type ReelLevel = "steady" | "low" | "heavy" | "thoughts" | "urgent" | null;

export { reelKey, reelNumber, reelPart };
export type { ReelPart };

export const REEL_LENGTH = 5;

export interface SparkCard {
  kind: "spark";
  id: string;
  text: Words;
}
export interface FactCard {
  kind: "fact";
  id: string;
  /** The one figure, set large. */
  figure: Words;
  text: Words;
  /** Authors, year, journal: printed on the card. */
  cite: string;
  /** Names an Indian service; shown only where the region is India. */
  india?: boolean;
  gentle?: boolean;
}
export interface AskCard {
  kind: "ask";
  id: string;
  q: Words;
  options: { id: string; label: Words; reply: Words }[];
}
export interface NowCard {
  kind: "now";
  id: string;
  text: Words;
  gentle?: boolean;
}
export interface PersonCard {
  kind: "person";
  id: string;
  text: Words;
  /** Shown in full; the person sends it themselves, to whoever they choose. */
  send: Words;
  gentle?: boolean;
}
export interface BreathCard {
  kind: "breath";
  id: string;
  text: Words;
}

export type ReelCard = SparkCard | FactCard | AskCard | NowCard | PersonCard | BreathCard;

const w = (en: string, hinglish: string): Words => ({ en, hinglish });

/* ── a line worth reading ──────────────────────────────────────────── */

/* True on a bad day too, or it is not here. Nothing that tells anyone to
   cheer up, and nothing that makes a hard life a matter of attitude. */
export const SPARKS: SparkCard[] = [
  ["k-ten", "You don't need a new life by tonight. You need the next ten minutes.", "Aaj raat tak nayi life nahi chahiye. Bas agle das minute chahiye."],
  ["k-name", "A tension with a name is easier to carry than one without.", "Jis tension ka naam ho, use uthana thoda aasan hota hai."],
  ["k-start", "Motivation shows up after you start, not before.", "Motivation shuru karne ke baad aata hai, pehle nahi."],
  ["k-small", "Small is not a consolation prize. Small is how it gets done.", "Chhota kadam consolation prize nahi hai. Kaam aise hi hota hai."],
  ["k-carry", "Not everything that is heavy is yours to carry.", "Jo bhi bhaari hai, woh sab aapko nahi uthana."],
  ["k-hour", "The result is not in your hands. The next hour is.", "Result haath mein nahi. Agla ghanta haath mein hai."],
  ["k-log", "\"Log kya kahenge\" is one question. \"What do I need\" is another.", "\"Log kya kahenge\" ek sawaal hai. \"Mujhe kya chahiye\" doosra."],
  ["k-day", "A bad day is a day. It is not a forecast.", "Bura din ek din hai. Forecast nahi."],
  ["k-skill", "Asking for help is a skill. It gets easier with practice.", "Madad maangna ek skill hai. Practice se aasan hota hai."],
  ["k-info", "Feelings are information. They are not instructions.", "Feelings information hain. Order nahi."],
  ["k-compare", "Comparing shows you their highlights next to your behind-the-scenes.", "Compare karo toh unki highlights dikhti hain, aur apna behind-the-scenes."],
  ["k-earn", "Water, a meal and sleep do not have to be earned.", "Paani, khaana aur neend kamaani nahi padti."],
  ["k-badly", "One thing done badly beats ten things planned perfectly.", "Ek kaam jaise-taise ho jaye, das perfect plan se behtar hai."],
  ["k-rest", "Rest is part of the work, not time off from it.", "Aaram kaam ka hissa hai, kaam se chhutti nahi."],
  ["k-record", "Every hard day so far, you got through. That is your record.", "Ab tak ka har mushkil din nikal gaya. Yeh aapka record hai."],
  ["k-begin", "You're allowed to be a beginner at looking after yourself.", "Khud ka khayal rakhna seekhne mein beginner hona allowed hai."],
  ["k-scroll", "One breath before the scroll. Then decide.", "Scroll se pehle ek saans. Phir decide karo."],
  ["k-sun", "Whatever today was, the sun comes up without asking how it went.", "Aaj jaisa bhi tha, suraj bina kuch pooche phir niklega."],
].map(([id, en, hinglish]) => ({ kind: "spark" as const, id, text: w(en, hinglish) }));

/* For low and heavy days. Quieter, and none of them asks for effort. */
export const GENTLE_LINES: SparkCard[] = [
  ["g-next", "You don't have to feel better before you do the next small thing.", "Agla chhota kaam karne ke liye pehle achha feel karna zaroori nahi."],
  ["g-symptom", "Hopelessness is a symptom. It feels like a fact about the future, and it isn't one.", "Na-ummeedi ek symptom hai. Future ka sach lagti hai, par hai nahi."],
  ["g-through", "Today only has to be got through. That is enough.", "Aaj ka din bas nikalna hai. Itna kaafi hai."],
  ["g-allowed", "Rest is allowed. So is asking for help. Neither one is giving up.", "Aaram allowed hai. Madad maangna bhi. Dono mein haar nahi hai."],
  ["g-loud", "Feelings this loud are not always right about what comes next.", "Itni tez feelings aage ke baare mein hamesha sahi nahi hoti."],
  ["g-counts", "Small still counts. A glass of water counts.", "Chhota bhi gina jaata hai. Ek glass paani bhi."],
  ["g-hourly", "One hour at a time is allowed. So is one minute.", "Ek baar mein ek ghanta. Ya ek minute. Dono allowed hain."],
  ["g-verdict", "A heavy day is not a verdict on you.", "Bhaari din aapke baare mein koi faisla nahi hai."],
].map(([id, en, hinglish]) => ({ kind: "spark" as const, id, text: w(en, hinglish) }));

/* ── one thing known about the mind ────────────────────────────────── */

const f = (id: string, figure: Words, text: Words, cite: string, extra: Partial<FactCard> = {}): FactCard => ({ kind: "fact", id, figure, text, cite, ...extra });

export const FACTS: FactCard[] = [
  f(
    "f-name",
    w("Name it", "Naam do"),
    w(
      "In brain scans, putting a feeling into words quietened the brain's alarm centre. Saying \"I'm tense about the exam\" is already doing something.",
      "Brain scans mein dekha gaya ki feeling ko shabd dene se dimaag ka alarm centre shaant hota hai. \"Mujhe exam ki tension hai\" bolna bhi ek kaam hai.",
    ),
    "Lieberman et al., 2007, Psychological Science",
    { gentle: true },
  ),
  f(
    "f-when",
    w("7 in 10", "10 mein 7"),
    w(
      "People who decide when they will do a thing do better than about 7 in 10 of those who only decide what. That held across 94 tests.",
      "Jo log tay karte hain ki kaam kab karna hai, woh un 10 mein se kareeb 7 se behtar karte hain jo sirf kaam tay karte hain. Yeh 94 tests mein dikha.",
    ),
    "Gollwitzer & Sheeran, 2006, Advances in Experimental Social Psychology",
  ),
  f(
    "f-breath",
    w("5 minutes", "5 minute"),
    w(
      "Five minutes a day of slow breathing with long exhales lifted mood more than meditation did, in a month-long trial.",
      "Ek mahine ke trial mein, roz paanch minute lambi saans chhodne wali breathing ne mood ko meditation se zyada behtar kiya.",
    ),
    "Balban et al., 2023, Cell Reports Medicine",
    { gentle: true },
  ),
  f(
    "f-reels",
    w("71 studies", "71 studies"),
    w(
      "Across 71 studies and 98,299 people, more short-video scrolling went along with weaker attention and more stress. The studies can't say which causes which. Notice how you feel after a scroll.",
      "71 studies aur 98,299 logon mein, zyada short-video scroll ke saath kamzor attention aur zyada stress dikha. Kaun kiski wajah hai, yeh studies nahi bata sakti. Scroll ke baad kaisa lagta hai, notice karo.",
    ),
    "Nguyen et al., 2025, Psychological Bulletin",
  ),
  f(
    "f-gap",
    w("1 in 10", "10 mein 1"),
    w(
      "About one adult in ten in India is living with a mental health condition, and most have had no care for it. If that's you, you are far from the only one.",
      "India mein kareeb har 10 mein se 1 adult kisi mental health condition ke saath jee raha hai, aur zyadatar ko koi care nahi mili. Agar yeh aap hain, toh aap akele bilkul nahi hain.",
    ),
    "National Mental Health Survey of India, 2016 (Gautham et al., 2020)",
    { india: true, gentle: true },
  ),
  f(
    "f-line",
    w("14416", "14416"),
    w(
      "Tele-MANAS is the government's free mental health line. It answers day and night, in 20 languages. Calling is for tension too, not only for emergencies.",
      "Tele-MANAS sarkar ki free mental health helpline hai. Din-raat chalti hai, 20 bhashaon mein. Call tension ke liye bhi kar sakte hain, sirf emergency ke liye nahi.",
    ),
    "Tele-MANAS, Ministry of Health and Family Welfare, Government of India",
    { india: true, gentle: true },
  ),
  f(
    "f-sleep",
    w("38%", "38%"),
    w(
      "People who slept and woke at regular times were 38% less likely to develop depression over seven years. Regular timing mattered on its own, apart from the hours.",
      "Jo log roz ek hi time par sote aur uthte the, unme saat saal mein depression hone ke chance 38% kam the. Hours ke alawa, sirf regular timing ka bhi asar tha.",
    ),
    "Li et al., 2025, Psychological Medicine",
  ),
  f(
    "f-move",
    w("17%", "17%"),
    w(
      "In studies that followed people for years, active people had 17% lower odds of developing depression. Walking counts.",
      "Jin studies ne logon ko saalon tak follow kiya, unme active logon mein depression hone ke odds 17% kam the. Chalna bhi gina jaata hai.",
    ),
    "Schuch et al., 2018, American Journal of Psychiatry",
  ),
  f(
    "f-habit",
    w("2 months", "2 mahine"),
    w(
      "A new habit took a median of about two months to feel automatic, not 21 days. Missing one day made no measurable difference.",
      "Nayi aadat ko automatic lagne mein median kareeb do mahine lage, 21 din nahi. Ek din miss hone se koi farq nahi pada.",
    ),
    "Lally et al., 2010, European Journal of Social Psychology",
  ),
  f(
    "f-break",
    w("2-10 minutes", "2-10 minute"),
    w(
      "Breaks of two to ten minutes reliably lifted energy and cut tiredness, across 22 samples. After very heavy work, ten minutes is not enough.",
      "Do se das minute ke break ne energy badhayi aur thakaan kam ki, 22 samples mein. Bahut bhaari kaam ke baad das minute kaafi nahi hote.",
    ),
    "Albulescu et al., 2022, PLoS ONE",
  ),
  f(
    "f-single",
    w("One session", "Ek session"),
    w(
      "One online session, done alone, lowered hopelessness and raised the sense of being in control among 2,452 teenagers.",
      "Akele kiya gaya ek online session: 2,452 teenagers mein na-ummeedi kam hui aur control ka ehsaas badha.",
    ),
    "Schleider et al., 2022, Nature Human Behaviour",
  ),
  f(
    "f-delhi",
    w("Delhi", "Delhi"),
    w(
      "In Delhi government schools, students who took their problems one step at a time with a counsellor felt their main problems ease within six weeks.",
      "Delhi ke sarkari schools mein, jin students ne counsellor ke saath apni problems ek-ek step mein li, unki main problems chhe hafte mein halki hui.",
    ),
    "Michelson et al., 2020, Lancet Child & Adolescent Health",
    { india: true },
  ),
  f(
    "f-tension",
    w("Tension", "Tension"),
    w(
      "\"Tension\" is how much of South Asia says it. A review found the word in 122 research records, for everything from daily hassles to serious distress.",
      "South Asia mein zyadatar log ise \"tension\" hi kehte hain. Ek review ko yeh shabd 122 research records mein mila, roz ki pareshani se lekar gehri takleef tak.",
    ),
    "Weaver et al., 2022",
  ),
];

/* ── one question, answered in a tap ───────────────────────────────── */

const o = (id: string, label: Words, reply: Words) => ({ id, label, reply });
const q = (id: string, question: Words, ...options: AskCard["options"]): AskCard => ({ kind: "ask", id, q: question, options });

/* The reply reflects the answer back with one thing to notice or do. It
   never scores the answer and never tells anyone what they are. */
export const ASKS: AskCard[] = [
  q(
    "a-drain",
    w("What took the most out of you today?", "Aaj sabse zyada energy kis cheez ne li?"),
    o("people", w("People", "Log"), w("People take energy even when they're loved. Ten minutes alone is a fair thing to want.", "Log energy lete hain, chahe apne hi hon. Das minute akele chahna bilkul theek hai.")),
    o("work", w("Work or studies", "Kaam ya padhai"), w("Then the day asked a lot. What's left tonight can be smaller than the list.", "Matlab din ne bahut maanga. Aaj raat jo bacha hai, woh list se chhota ho sakta hai.")),
    o("thoughts", w("My own thoughts", "Apne hi khayal"), w("Thoughts get louder when they stay inside. Say one out loud, even to an empty room.", "Khayal andar rahein toh aur tez ho jaate hain. Ek ko zor se bolo, khaali kamre mein bhi.")),
    o("phone", w("The phone", "Phone"), w("Noticing that is the hard part, and you just did it. One stop for tonight is enough.", "Yeh notice karna hi mushkil hissa hai, aur abhi ho gaya. Aaj raat ke liye ek stop kaafi hai.")),
  ),
  q(
    "a-helped",
    w("What helped, even a little, this week?", "Is hafte kis cheez ne thodi si bhi madad ki?"),
    o("person", w("A person", "Ek insaan"), w("Then that person is on your side of the scale. They'd probably like to know.", "Toh woh insaan aapki taraf hai. Unhe shayad yeh jaan kar achha lagega.")),
    o("sleep", w("Sleep", "Neend"), w("Sleep does more for mood than almost anything else here. Guard tonight's.", "Mood ke liye neend yahan lagbhag har cheez se zyada karti hai. Aaj raat ki neend bachao.")),
    o("outside", w("Getting outside", "Bahar nikalna"), w("Then the door works. It will work again tomorrow.", "Matlab darwaza kaam karta hai. Kal bhi karega.")),
    o("nothing", w("Nothing yet", "Abhi kuch nahi"), w("Then it was a hard week. That is a fact about the week, not about you.", "Toh hafta mushkil tha. Yeh hafte ke baare mein sach hai, aapke baare mein nahi.")),
  ),
  q(
    "a-body",
    w("Where is the tension sitting right now?", "Abhi tension body mein kahan baithi hai?"),
    o("head", w("Head", "Sir"), w("Unclench your jaw. Look at something far away for five breaths.", "Jabda dheela chhodo. Paanch saans tak kisi door ki cheez ko dekho.")),
    o("chest", w("Chest", "Seena"), w("Hand on your chest. Breathe out slower than you breathe in, three times.", "Seene par haath rakho. Saans lene se dheere saans chhodo, teen baar.")),
    o("stomach", w("Stomach", "Pet"), w("Let your belly go soft and move with the breath. Three slow ones.", "Pet ko dheela chhodo, saans ke saath hilne do. Teen dheemi saansein.")),
    o("shoulders", w("Shoulders", "Kandhe"), w("Lift them to your ears, hold for three, and drop them. Twice.", "Kandhe kaan tak uthao, teen tak roko, phir chhod do. Do baar.")),
  ),
  q(
    "a-need",
    w("What do you need most right now?", "Abhi sabse zyada kya chahiye?"),
    o("rest", w("Rest", "Aaram"), w("Then rest is the job. Ten minutes with your eyes closed counts.", "Toh aaram hi kaam hai. Das minute aankhein band karna bhi gina jaata hai.")),
    o("talk", w("To talk", "Baat karna"), w("Then one message is the move. \"Free for five minutes?\" is enough.", "Toh ek message hi kadam hai. \"Paanch minute free ho?\" kaafi hai.")),
    o("move", w("To move", "Hilna-dulna"), w("Then stand up now. To the door and back counts.", "Toh abhi khade ho jao. Darwaze tak jaana aur aana bhi gina jaata hai.")),
    o("alone", w("To be left alone", "Akele rehna"), w("That's allowed. Say \"I need twenty minutes\" and take them.", "Yeh allowed hai. Bolo \"mujhe bees minute chahiye\" aur le lo.")),
  ),
  q(
    "a-phone",
    w("After a scroll, how do you usually feel?", "Scroll ke baad aksar kaisa lagta hai?"),
    o("lighter", w("Lighter", "Halka"), w("Good. Then it's doing its job. Notice which accounts do that.", "Achha hai. Matlab woh apna kaam kar raha hai. Dekho kaun se accounts aisa karte hain.")),
    o("same", w("The same", "Waisa hi"), w("Then it passes time and gives none back. Fine sometimes. Worth knowing.", "Toh time nikal jaata hai, wapas kuch nahi milta. Kabhi kabhi theek hai. Pata hona achha hai.")),
    o("heavier", w("Heavier", "Bhaari"), w("Then your feed is costing you. Mute one account today. Only one.", "Matlab feed aapse kuch le rahi hai. Aaj ek account mute karo. Sirf ek.")),
    o("never", w("Never noticed", "Kabhi notice nahi kiya"), w("Next time, check for two seconds when you put the phone down. That's all.", "Agli baar phone rakhte waqt do second ruk kar dekho. Bas itna.")),
  ),
  q(
    "a-voice",
    w("When something goes wrong, who do you sound like to yourself?", "Kuch galat ho jaye, toh khud se kiski tarah baat karte ho?"),
    o("friend", w("A friend", "Dost"), w("That is worth a lot. Keep that voice.", "Yeh bahut keemti hai. Yeh awaaz sambhal kar rakho.")),
    o("teacher", w("A strict teacher", "Strict teacher"), w("Strict gets things done and wears you out. Try one sentence a friend would say.", "Strict se kaam ho jaata hai, par thakaan bhi hoti hai. Ek line woh bolo jo dost bolta.")),
    o("bully", w("A bully", "Bully"), w("You wouldn't let anyone talk to a friend like that. You're allowed the same rule.", "Dost se koi aise baat kare, yeh aap nahi sehte. Apne liye bhi wahi rule chalega.")),
    o("depends", w("Depends on the day", "Din par depend karta hai"), w("Then you already have the kinder voice. It only needs to show up more often.", "Matlab naram awaaz pehle se hai. Bas use thoda zyada aana hai.")),
  ),
  q(
    "a-hands",
    w("How much of today's tension is in your hands?", "Aaj ki tension mein se kitna haath mein hai?"),
    o("most", w("Most of it", "Zyadatar"), w("Then there's something to do. Pick the smallest piece and start there.", "Toh kuch kiya ja sakta hai. Sabse chhota hissa chuno aur wahin se shuru karo.")),
    o("half", w("About half", "Kareeb aadha"), w("Then half can be set down. Which half were you carrying today?", "Toh aadha neeche rakha ja sakta hai. Aaj kaun sa aadha utha rakha tha?")),
    o("little", w("A little", "Thoda sa"), w("Then do the little, and let the rest be heavy without it being your job.", "Toh thoda sa karo, aur baaki ko bhaari rehne do. Woh aapka kaam nahi.")),
    o("none", w("None of it", "Kuch bhi nahi"), w("Then it's a day for support, not for effort. Who could you tell?", "Toh aaj mehnat ka nahi, saath lene ka din hai. Kise bata sakte ho?")),
  ),
  q(
    "a-sleep",
    w("How was last night's sleep?", "Kal raat neend kaisi thi?"),
    o("good", w("Good", "Achhi"), w("That's a head start. The day leans on it more than it shows.", "Yeh ek head start hai. Din is par jitna dikhta hai usse zyada tikta hai.")),
    o("broken", w("Broken", "Tooti-tooti"), w("Broken nights make everything louder. Go easy on today's verdicts.", "Tooti neend sab kuch tez kar deti hai. Aaj ke faislon par narmi rakho.")),
    o("short", w("Too short", "Bahut kam"), w("Short sleep makes small things feel large. Part of today is the sleep talking.", "Kam neend chhoti cheezon ko bada bana deti hai. Aaj ka kuch hissa neend bol rahi hai.")),
    o("late", w("Too late", "Bahut late"), w("The same time tonight and tomorrow matters more than the hours. Pick a time.", "Aaj aur kal ek hi time par sona hours se zyada matter karta hai. Ek time chuno.")),
  ),
  q(
    "a-yours",
    w("One thing from today that was yours?", "Aaj ki ek cheez jo aapki apni thi?"),
    o("showed", w("I showed up", "Maine show up kiya"), w("Showing up is most of it. The rest is built on that.", "Show up karna hi zyadatar kaam hai. Baaki usi par banta hai.")),
    o("kind", w("I was kind to someone", "Kisi ke saath achha kiya"), w("That landed somewhere, whether or not they said so.", "Woh kahin pahuncha hai, chahe unhone kaha ho ya nahi.")),
    o("finished", w("I finished something", "Kuch poora kiya"), w("Finished is rare. Let it count before the next thing.", "Poora karna kam hi hota hai. Agle kaam se pehle ise ginne do.")),
    o("through", w("I got through it", "Din nikal liya"), w("Getting through is a thing done. Some days it is the whole list.", "Din nikalna bhi ek kaam hai. Kuch din poori list wahi hoti hai.")),
  ),
  q(
    "a-easier",
    w("What would make tomorrow a little easier?", "Kal ko thoda aasan kya banayega?"),
    o("sleep", w("Sleeping earlier", "Jaldi sona"), w("Then set the time now, while you still mean it.", "Toh time abhi set karo, jab tak mann hai.")),
    o("ready", w("Clothes or bag ready", "Kapde ya bag ready"), w("Two minutes tonight saves ten in the morning.", "Aaj raat ke do minute subah ke das bachate hain.")),
    o("message", w("One message sent", "Ek message bhejna"), w("Send it before the phone goes down. Short is fine.", "Phone rakhne se pehle bhej do. Chhota bhi chalega.")),
    o("nothing", w("Nothing comes to mind", "Kuch yaad nahi aa raha"), w("Then leave tomorrow alone. It will have its own minute.", "Toh kal ko rehne do. Uska apna minute aayega.")),
  ),
];

/* ── one thing to do before the phone goes down ────────────────────── */

const n = (id: string, en: string, hinglish: string, gentle = false): NowCard => ({ kind: "now", id, text: w(en, hinglish), gentle });

/* Each fits inside a minute and needs nothing but where the person is. */
export const NOWS: NowCard[] = [
  n("n-water", "Drink a glass of water, slowly.", "Ek glass paani piyo, dheere dheere.", true),
  n("n-shoulders", "Lift your shoulders to your ears, hold for three, and drop them. Twice.", "Kandhe kaan tak uthao, teen tak roko, phir chhod do. Do baar."),
  n("n-window", "Look out of a window. Find three colours.", "Khidki se bahar dekho. Teen rang dhoondo.", true),
  n("n-stand", "Stand up and stretch your arms over your head for three breaths.", "Khade ho jao aur teen saans tak haath upar kheencho."),
  n("n-face", "Wash your face with cool water.", "Thande paani se munh dho lo.", true),
  n("n-feet", "Press both feet into the floor. Name five things you can see.", "Dono pair zameen par dabao. Paanch cheezein gino jo dikh rahi hain.", true),
  n("n-tidy", "Tidy one small thing. One cup, one corner.", "Ek chhoti cheez theek karo. Ek cup, ek kona."),
  n("n-jaw", "Unclench your jaw. Let your shoulders fall. Breathe out slowly, once.", "Jabda dheela chhodo. Kandhe girne do. Ek baar dheere saans chhodo.", true),
  n("n-song", "Put on one song you love. Only listen.", "Apna ek pasandeeda gaana lagao. Sirf suno."),
  n("n-light", "Sit where there is light on your face for one minute.", "Ek minute wahan baitho jahan chehre par roshni pade.", true),
  n("n-down", "After this, put the phone face down for one full minute.", "Iske baad phone ko poore ek minute ke liye ulta rakh do."),
  n("n-palms", "Rub your palms together until they're warm. Rest them over your eyes.", "Hatheliyan ragdo jab tak garam na ho jayein. Phir aankhon par rakho.", true),
];

/* ── one person ────────────────────────────────────────────────────── */

const p = (id: string, text: Words, send: Words, gentle = false): PersonCard => ({ kind: "person", id, text, send, gentle });

export const PEOPLE: PersonCard[] = [
  p("p-thinking", w("Someone came to mind just now. Send them this.", "Abhi kisi ka khayal aaya. Unhe yeh bhej do."), w("Thinking of you today. No need to reply.", "Aaj tumhari yaad aayi. Reply zaroori nahi.")),
  p("p-thanks", w("Thank someone for something small.", "Kisi ko chhoti si baat ke liye thank you bolo."), w("I never said thanks for what you did. Thank you.", "Jo tumne kiya uske liye kabhi thank you nahi bola. Thank you.")),
  p("p-call", w("Who haven't you spoken to in a while?", "Kis se kaafi time se baat nahi hui?"), w("It's been a while. Free for a call this week?", "Bahut din ho gaye. Is hafte call par baat karein?")),
  p("p-honest", w("Tell one person how today really was.", "Kisi ek ko batao ki aaj asal mein kaisa tha."), w("Today was a lot. Can I tell you about it?", "Aaj bahut kuch tha. Tumhe bataun?")),
  p("p-chai", w("Make one small plan with a person.", "Kisi ke saath ek chhota plan banao."), w("Chai this week? You pick the place.", "Is hafte chai? Jagah tum batao.")),
  p(
    "p-tell",
    w("Tell one person it's heavy today.", "Kisi ek ko batao ki aaj bhaari lag raha hai."),
    w("I'm having a hard day. No need to fix anything, I only wanted someone to know.", "Aaj din bhaari hai. Kuch fix karne ki zaroorat nahi, bas kisi ko batana tha."),
    true,
  ),
  p(
    "p-stay",
    w("Ask someone to stay with you for a while, on a call or in the room.", "Kisi se bolo ki thodi der saath rahe, call par ya kamre mein."),
    w("Could you stay on the phone with me for a bit? I don't want to be alone right now.", "Thodi der mere saath phone par reh sakte ho? Abhi akele nahi rehna."),
    true,
  ),
];

export const BREATH: BreathCard = {
  kind: "breath",
  id: "b-three",
  text: w("Before anything else, three slow breaths. In for four. Out for six.", "Sabse pehle, teen dheemi saansein. Chaar tak andar. Chhe tak bahar."),
};

/* ── building a reel ───────────────────────────────────────────────── */

const at = <T>(list: T[], i: number): T => list[((i % list.length) + list.length) % list.length];

/**
 * The five cards for this part of this day.
 *
 * The same five every time it is opened within that part of the day, and a
 * different five next time: each pool is walked in order, one step per
 * reel, so nothing repeats until its pool has gone round.
 *
 *   an okay day   a line, a fact, a question, something to do, a person
 *   a low day     three breaths, a gentle line, a question, something
 *                 gentle to do, a person
 *   a heavy day   three breaths, a gentle line, a fact about help or the
 *                 body, something gentle to do, a way to tell one person
 *
 * After a recent report of thoughts of suicide, or of not feeling safe,
 * there is no reel: the plan, the people and the numbers have the screen,
 * and a row of cards to swipe must not be the thing in front of them.
 */
export function buildReel(now: Date, level: ReelLevel, india = true): ReelCard[] {
  if (level === "thoughts" || level === "urgent") return [];
  const k = reelNumber(now);
  const facts = FACTS.filter((x) => india || !x.india);
  if (level === "heavy") {
    return [BREATH, at(GENTLE_LINES, k), at(facts.filter((x) => x.gentle), k), at(NOWS.filter((x) => x.gentle), k), at(PEOPLE.filter((x) => x.gentle), k)];
  }
  if (level === "low") {
    return [BREATH, at(GENTLE_LINES, k), at(ASKS, k), at(NOWS.filter((x) => x.gentle), k), at(PEOPLE, k)];
  }
  return [at(SPARKS, k), at(facts, k), at(ASKS, k), at(NOWS, k), at(PEOPLE.filter((x) => !x.gentle), k)];
}

/* ── the words on the screen ───────────────────────────────────────── */

export interface ReelStrings {
  door: string;
  doorSub: string;
  doorOpen: string;
  doorSeen: string;
  next: Record<ReelPart, string>;
  again: string;
  swipe: string;
  nextBtn: string;
  prevBtn: string;
  card: (n: number, total: number) => string;
  factKicker: string;
  askKicker: string;
  nowKicker: string;
  personKicker: string;
  didIt: string;
  didItReply: string;
  send: string;
  copied: string;
  keep: string;
  kept: string;
  breathIn: string;
  breathOut: string;
  breathStart: string;
  breathDone: string;
  endTitle: string;
  endSub: string;
  endMinute: string;
  endDone: string;
  close: string;
  why: string;
}

export const REEL_STRINGS: Record<"en" | "hinglish", ReelStrings> = {
  en: {
    ...REEL_DOOR.en,
    swipe: "Swipe up, or tap Next.",
    nextBtn: "Next",
    prevBtn: "Back",
    card: (i, total) => `Card ${i} of ${total}`,
    factKicker: "Worth knowing",
    askKicker: "One tap",
    nowKicker: "Do this now",
    personKicker: "One person",
    didIt: "Did it",
    didItReply: "Done. That one was for you.",
    send: "Send it",
    copied: "Copied. Paste it into any chat.",
    keep: "Keep this line",
    kept: "Kept in your hope box.",
    breathIn: "Breathe in",
    breathOut: "Breathe out",
    breathStart: "Start",
    breathDone: "Three breaths done.",
    endTitle: "That's all five.",
    endSub: "This reel ends here, on purpose. Nothing more is loading.",
    endMinute: "Take one minute",
    endDone: "Phone down. Back to my day",
    close: "Close",
    why: "A feed that never ends is built to keep a thumb moving. This one is five cards and a stop. Heavier short-video use goes along with weaker attention and more stress across 71 studies (Nguyen et al. 2025), though those studies can't say which causes which. Nothing you tap here is kept.",
  },
  hinglish: {
    ...REEL_DOOR.hinglish,
    swipe: "Upar swipe karo, ya Next dabao.",
    nextBtn: "Next",
    prevBtn: "Peeche",
    card: (i, total) => `Card ${i} / ${total}`,
    factKicker: "Jaanne layak",
    askKicker: "Ek tap",
    nowKicker: "Yeh abhi karo",
    personKicker: "Ek insaan",
    didIt: "Kar liya",
    didItReply: "Ho gaya. Yeh aapke apne liye tha.",
    send: "Bhej do",
    copied: "Copy ho gaya. Kisi bhi chat mein paste karo.",
    keep: "Yeh line rakh lo",
    kept: "Hope box mein rakh di.",
    breathIn: "Saans andar",
    breathOut: "Saans bahar",
    breathStart: "Shuru",
    breathDone: "Teen saansein ho gayi.",
    endTitle: "Paanchon ho gaye.",
    endSub: "Yeh reel yahin khatam hoti hai, jaan-boojh kar. Aage kuch load nahi ho raha.",
    endMinute: "Ek minute lo",
    endDone: "Phone neeche. Wapas apne din mein",
    close: "Band karo",
    why: "Jo feed kabhi khatam nahi hoti, woh angootha chalate rehne ke liye bani hai. Yeh paanch cards hain, phir stop. 71 studies mein zyada short-video ke saath kamzor attention aur zyada stress dikha (Nguyen et al. 2025), par woh studies yeh nahi bata sakti ki kaun kiski wajah hai. Yahan jo bhi tap karte ho, kuch rakha nahi jaata.",
  },
};

/** Every line a person can read, for the tests. */
export function allReelWords(): Words[] {
  const out: Words[] = [];
  for (const s of [...SPARKS, ...GENTLE_LINES]) out.push(s.text);
  for (const x of FACTS) out.push(x.figure, x.text);
  for (const a of ASKS) {
    out.push(a.q);
    for (const opt of a.options) out.push(opt.label, opt.reply);
  }
  for (const x of NOWS) out.push(x.text);
  for (const x of PEOPLE) out.push(x.text, x.send);
  out.push(BREATH.text);
  const flat = (s: ReelStrings): string[] =>
    Object.values(s).flatMap((v) => (typeof v === "string" ? [v] : typeof v === "function" ? [v(1, 5), v(5, 5)] : Object.values(v as Record<string, string>)));
  const en = flat(REEL_STRINGS.en);
  const hi = flat(REEL_STRINGS.hinglish);
  en.forEach((text, i) => out.push({ en: text, hinglish: hi[i] }));
  return out;
}
