/**
 * One minute: the rules and the words.
 *
 * What it is. Two taps to check in, then: pick what the tension is about,
 * sort three ready-made pieces of it into "in my hands" or "not in my
 * hands", and leave with one small move and a time for it. No typing.
 *
 * Why this shape, from the research it was built on (November 2026):
 *
 *   - Very short exercises ease distress there and then, and the effect
 *     does not last on its own (Elefant et al. 2017, Internet
 *     Interventions, N = 122). What makes brief digital help hold is goal
 *     setting and a follow-up; homework, self-monitoring and log-keeping
 *     went with worse results (Opie et al. 2024, Clinical Child and Family
 *     Psychology Review). So: no diary, one move, and "did it happen?"
 *     next time.
 *   - A plan with its "when" attached is far more likely to happen
 *     (d = 0.65 across 94 tests: Gollwitzer & Sheeran 2006; and in people
 *     with mental health problems, Toli et al. 2016). So every move is
 *     picked together with a cue.
 *   - Problem solving (pick a problem, pick an option, do it) is the
 *     approach tested with students in Delhi government schools
 *     (Michelson et al. 2020, Lancet Child & Adolescent Health). Doing
 *     something about a stressor helps most when it can be changed, and
 *     easing the feeling helps most when it cannot (the "goodness of fit"
 *     idea; the evidence is mixed but points this way: Park et al. 2004).
 *     So "not in my hands" never ends in "let it go": it ends in a person.
 *   - "Tension" is the word used across South Asia for stress and
 *     distress, from daily hassles to the most serious (Weaver et al.
 *     2022, 122 records, mostly India). It is the word on the screen.
 *   - Naming a feeling calms the alarm system mainly in a person's own
 *     language (Vives et al. 2021). So every line here is written twice:
 *     English, and Hinglish the way it is typed on a phone.
 *
 * What it is not. Not a treatment and not a risk tool. A minute like this
 * will not fix a home that is not safe, a debt or a loss, and the words
 * never pretend it will. Anything about being hurt by someone is kept out
 * of the cards on purpose and has its own route to help (Topic.unsafe).
 *
 * Self-contained like lib/care.ts: no runtime imports, no React, no
 * storage, so scripts/test-minute.mjs can play it in Node.
 */

export type MinuteLang = "en" | "hinglish";

/** One line, in both languages. */
export interface Words {
  en: string;
  hinglish: string;
}

export const say = (w: Words, lang: MinuteLang): string => (lang === "hinglish" ? w.hinglish : w.en);

export type TopicId = "studies" | "work" | "family" | "love" | "health" | "alone" | "self" | "unsure";

/** Where a card usually ends up. Used only to deal a mixed hand, never to
    mark an answer right or wrong: the person decides. */
export type Lean = "mine" | "not";

export interface TensionCard {
  id: string;
  text: Words;
  lean: Lean;
  /** Moves offered when this card is put "in my hands", best first. */
  moves: string[];
}

/** What a move can open, when doing it is one tap away inside Arun. */
export type MoveGo = "breathe" | "lines" | "hopebox";

export interface Move {
  id: string;
  text: Words;
  /** A smaller version, for "Make it smaller". */
  smaller?: string;
  /** Words to send, when the move is a message. Shown in full first; the
      person sends it themselves, to whoever they choose. */
  send?: Words;
  go?: MoveGo;
}

export interface Topic {
  id: TopicId;
  label: Words;
  cards: TensionCard[];
  /** Shown under the cards of topics where the real trouble may be a
      person. Being hurt is not a tension to sort. */
  unsafe?: Words;
}

export type CueId = "now" | "meal" | "sleep" | "morning";

export const CUES: { id: CueId; label: Words }[] = [
  { id: "now", label: { en: "Right now", hinglish: "Abhi" } },
  { id: "meal", label: { en: "After my next meal", hinglish: "Agle khaane ke baad" } },
  { id: "sleep", label: { en: "Tonight, before I sleep", hinglish: "Aaj raat, sone se pehle" } },
  { id: "morning", label: { en: "Tomorrow, first thing", hinglish: "Kal subah, sabse pehle" } },
];

const m = (id: string, en: string, hinglish: string, extra: Partial<Move> = {}): Move => ({ id, text: { en, hinglish }, ...extra });

/* Every move is small on purpose: something that fits in two to twenty
   minutes and needs nothing but where the person is. Written in the first
   person or as a plain instruction, never "you should". Hinglish avoids
   gendered verb endings (karta/karti), so one line fits everyone. */
const MOVE_LIST: Move[] = [
  /* studies */
  m("m-20min", "Set a 20-minute timer and do one topic only.", "20 minute ka timer lagao, sirf ek topic.", { smaller: "m-5min" }),
  m("m-5min", "Open the book and read for five minutes. Then decide.", "Book kholo, paanch minute padho. Phir dekhna.", { smaller: "m-open" }),
  m("m-open", "Put the book open on the table. That's all.", "Book khol ke table par rakh do. Bas itna."),
  m("m-onetopic", "Pick the topic that scares me least and start there.", "Jo topic sabse kam darata hai, wahin se shuru.", { smaller: "m-5min" }),
  m("m-askfriend", "Ask one person to explain one topic.", "Kisi ek se ek topic samjhane ko bolo.", {
    smaller: "m-draft",
    send: { en: "Hey, can you explain one topic to me today? Ten minutes is enough.", hinglish: "Yaar, aaj ek topic samjha sakte ho? Das minute kaafi hain." },
  }),
  m("m-draft", "Type the message. Sending can wait.", "Message type kar lo. Bhejna baad mein."),
  m("m-list3", "Write the next three topics on paper. Only three.", "Agle teen topic paper par likho. Sirf teen.", { smaller: "m-list1" }),
  m("m-list1", "Write down only the next one.", "Sirf agla ek likho."),
  m("m-phoneaway", "Phone on charge, away from the bed tonight.", "Aaj raat phone bed se door, charge par.", { smaller: "m-phone10" }),
  m("m-phone10", "Put the phone down ten minutes earlier than usual.", "Phone roz se das minute pehle rakh do."),
  m("m-mute", "Mute one group or account that makes me compare, for today.", "Jo group ya account compare karwata hai, aaj ke liye mute."),
  m("m-sentence", "Decide the one sentence I'll say if someone asks.", "Koi pooche toh kaun si ek line bolni hai, tay kar lo."),

  /* work and money */
  m("m-10task", "Do the smallest task on the list for ten minutes.", "List ka sabse chhota kaam das minute karo.", { smaller: "m-2task" }),
  m("m-2task", "Open the task and do the first two minutes of it.", "Kaam kholo aur pehle do minute karo."),
  m("m-need", "Write one line: what I need from them, in plain words.", "Ek line likho: mujhe unse kya chahiye, seedhe shabdon mein."),
  m("m-apply", "Send one application or one follow-up today.", "Aaj ek application ya ek follow-up bhejo.", { smaller: "m-find1" }),
  m("m-find1", "Find one opening and save it. Applying can wait.", "Ek opening dhoondo aur save karo. Apply baad mein."),
  m("m-note3", "Note today's three biggest spends. Only note, no judging.", "Aaj ke teen sabse bade kharche note karo. Sirf note, koi judge nahi.", { smaller: "m-note1" }),
  m("m-note1", "Note the one biggest spend of today.", "Aaj ka sabse bada ek kharcha note karo."),
  m("m-due", "Write the due date and the amount on one page.", "Due date aur amount ek page par likho."),
  m("m-askhelp", "Ask one person for help, or for a little more time.", "Kisi ek se madad ya thoda aur time maango.", {
    smaller: "m-draft",
    send: { en: "I'm stretched this week. Could I get one more day on this?", hinglish: "Is hafte load zyada hai. Kya is kaam ke liye ek din aur mil sakta hai?" },
  }),
  m("m-cv", "Spend ten minutes updating one line of my CV.", "Das minute mein CV ki ek line update karo."),
  m("m-stoptime", "Pick a stop time for today and set an alarm for it.", "Aaj kaam band karne ka time chuno aur alarm lagao."),

  /* family */
  m("m-wish", "Say, to myself, the one thing I wish they understood.", "Khud se kaho: woh ek baat jo kaash woh samajhte."),
  m("m-10talk", "Ask one person at home for ten minutes, at a calm time.", "Ghar mein kisi ek se das minute maango, shaant time par.", { smaller: "m-pickwho" }),
  m("m-pickwho", "Decide who I'd talk to first. Only decide.", "Tay karo pehle kis se baat karni hai. Sirf tay karo."),
  m("m-stepout", "When voices rise, step out for five minutes. Water, air, back.", "Awaaz badhe toh paanch minute bahar. Paani, hawa, phir wapas."),
  m("m-pause", "One slow breath before I answer. Only once today.", "Jawab dene se pehle ek lambi saans. Aaj bas ek baar."),
  m("m-onecall", "One thing I can do for them: a call, a medicine check, a visit date.", "Unke liye ek cheez: ek call, dawai check, ya milne ki date."),
  m("m-calmline", "Decide one calm sentence for the next time it comes up.", "Agli baar baat uthe toh kaun si ek shaant line bolni hai, tay kar lo."),
  m("m-10mine", "Take ten minutes alone today. Terrace, a walk, or a closed door.", "Aaj das minute akele. Chhat, walk, ya band darwaza.", { smaller: "m-3mine" }),
  m("m-3mine", "Take three minutes alone with a glass of water.", "Paani ke glass ke saath teen minute akele."),
  m("m-ownwin", "Name one thing I did this month that was mine.", "Is mahine ki ek cheez yaad karo jo maine khud ki."),

  /* love and friends */
  m("m-ownneed", "Name what I need from this, in one line, for myself.", "Is rishte se mujhe kya chahiye, ek line mein, khud ke liye."),
  m("m-honest", "Send one honest line. Short is fine.", "Ek sachchi line bhejo. Chhoti bhi chalegi.", {
    smaller: "m-draft",
    send: { en: "Hey. I've been quiet, not gone. Can we talk this week?", hinglish: "Hey. Kuch din se chup hoon, gayab nahi. Is hafte baat karein?" },
  }),
  m("m-phone30", "Put the phone in another room for thirty minutes.", "Phone tees minute ke liye doosre kamre mein.", { smaller: "m-phone10min" }),
  m("m-phone10min", "Phone face down for ten minutes.", "Phone das minute ke liye ulta rakh do."),
  m("m-kind", "Do one kind thing for myself tonight. Food, a bath, or sleep.", "Aaj raat khud ke liye ek achhi cheez. Khaana, nahana, ya neend."),
  m("m-oneno", "Say one small no today, kindly.", "Aaj ek chhota sa na bolo, pyaar se."),
  m("m-thinking", "Send one person a \"thinking of you\".", "Kisi ek ko \"yaad aayi\" wala message bhejo.", {
    smaller: "m-draft",
    send: { en: "Thinking of you today. No need to reply.", hinglish: "Aaj tumhari yaad aayi. Reply zaroori nahi." },
  }),
  m("m-ownplan", "Make one small plan of my own for this week.", "Is hafte ke liye apna ek chhota plan banao."),
  m("m-ownpart", "Decide my own part: say sorry for mine, or let today pass.", "Apna hissa tay karo: apni galti ka sorry, ya aaj jaane do."),

  /* health and body */
  m("m-questions", "Think of two questions to ask the doctor.", "Doctor se poochne ke do sawaal soch lo."),
  m("m-bodykind", "One thing my body will thank me for: water, food, or a stretch.", "Ek cheez jiske liye body thank you bole: paani, khaana, ya stretch."),
  m("m-walk10", "Walk for ten minutes. Around the block counts.", "Das minute chalo. Gali ka ek chakkar bhi chalega.", { smaller: "m-walk3" }),
  m("m-walk3", "Stand up and walk to the door and back, three times.", "Utho, darwaze tak jao aur wapas aao, teen baar."),
  m("m-appoint", "Book one appointment, or pick the day I will.", "Ek appointment book karo, ya din tay karo ki kab karna hai.", { smaller: "m-number" }),
  m("m-number", "Find the clinic's number and save it.", "Clinic ka number dhoondo aur save karo."),
  m("m-eat", "Eat something proper at the next meal, sitting down.", "Agle khaane mein theek se khao, baith kar."),

  /* feeling alone */
  m("m-callhome", "Call or voice-note one person from home today.", "Aaj ghar ke kisi ek ko call ya voice note karo.", {
    smaller: "m-draft",
    send: { en: "Missing home today. Free for a short call?", hinglish: "Aaj ghar ki yaad aa rahi hai. Thodi der call kar sakte hain?" },
  }),
  m("m-hello", "Say one real hello today. A shopkeeper, a neighbour, a classmate.", "Aaj ek sachcha hello bolo. Dukaan wale, padosi, ya classmate ko."),
  m("m-outside5", "Step outside for five minutes. Sun or evening air.", "Paanch minute bahar niklo. Dhoop ya shaam ki hawa."),
  m("m-oneplace", "Find one place or group to try this week. Only find it.", "Is hafte try karne ke liye ek jagah ya group dhoondo. Sirf dhoondo."),
  m("m-oldfriend", "Message one old friend.", "Ek purane dost ko message karo.", {
    smaller: "m-draft",
    send: { en: "Remembered you today. How are you?", hinglish: "Aaj tumhari yaad aayi. Kaise ho?" },
  }),
  m("m-nightplan", "Pick one thing for tonight: a call, a show, or an early sleep.", "Aaj raat ke liye ek cheez chuno: ek call, ek show, ya jaldi neend."),
  m("m-showup", "Say yes to one small thing this week, and show up.", "Is hafte ek chhoti cheez ko haan bolo, aur pahuncho."),

  /* myself */
  m("m-friendvoice", "Say to myself what I'd say to a friend who did the same.", "Khud se wahi kaho jo yahi karne wale dost se kehte."),
  m("m-onesmall", "Do one small useful thing in the next ten minutes.", "Agle das minute mein ek chhota kaam ka kaam karo.", { smaller: "m-water" }),
  m("m-oneyear", "Name one thing I can do now that I couldn't a year ago.", "Ek cheez yaad karo jo ab aati hai, saal bhar pehle nahi aati thi."),
  m("m-scrollstop", "Set one stop: after this video, the phone goes face down.", "Ek stop tay karo: is video ke baad phone ulta."),
  m("m-hopebox", "Open my hope box and read one thing in it.", "Apna hope box kholo aur ek cheez padho.", { go: "hopebox" }),
  m("m-promise", "Pick one tiny promise for today and keep only that.", "Aaj ke liye ek chhota vaada chuno, aur bas wahi nibhao."),

  /* can't say yet */
  m("m-loud3", "Name the three loudest things. Pick one.", "Teen sabse zyada shor wali cheezein gino. Ek chuno."),
  m("m-water", "Drink a glass of water, slowly. Then wash my face.", "Ek glass paani, dheere dheere. Phir munh dho lo."),

  /* when none of it is in your hands: the move is a person, or rest */
  m("m-tell", "Tell one person it's heavy today.", "Kisi ek ko batao ki aaj bhaari lag raha hai.", {
    smaller: "m-draft",
    send: { en: "I'm having a hard day. No need to fix anything, I only wanted someone to know.", hinglish: "Aaj din bhaari hai. Kuch fix karne ki zaroorat nahi, bas kisi ko batana tha." },
  }),
  m("m-line", "Call a free line and talk it through.", "Free helpline par call karke baat karo.", { go: "lines" }),
  m("m-breathe", "One slow minute of breathing with the sun.", "Suraj ke saath ek minute dheemi saans.", { go: "breathe" }),
  m("m-rest", "Be gentle tonight. Early to bed is allowed.", "Aaj raat khud par narmi. Jaldi sona allowed hai."),
];

export const MOVES: Record<string, Move> = Object.fromEntries(MOVE_LIST.map((x) => [x.id, x]));

/** Offered when nothing went "in my hands", and on heavy days. */
export const SUPPORT_MOVES = ["m-tell", "m-line", "m-breathe", "m-rest"];

const c = (id: string, en: string, hinglish: string, lean: Lean, ...moves: string[]): TensionCard => ({ id, text: { en, hinglish }, lean, moves });

const UNSAFE: Words = {
  en: "If someone is hurting you, or home doesn't feel safe, that is not a tension to sort.",
  hinglish: "Agar koi aapko hurt kar raha hai, ya ghar safe nahi lagta, toh yeh sort karne wali tension nahi hai.",
};

/* The cards. Each topic has at least three that usually sit in a person's
   hands and three that usually do not, drawn from ordinary life in India:
   results and "log kya kahenge", EMIs and fees, marriage talk, being far
   from home. A card is a piece of the tension, never a judgement, and it
   never names a person as the problem. */
const TOPIC_LIST: Topic[] = [
  {
    id: "studies",
    label: { en: "Studies & exams", hinglish: "Padhai aur exams" },
    cards: [
      c("s-result", "What marks I finally get", "Aakhir mein kitne marks aayenge", "not", "m-20min"),
      c("s-hour", "How I use the next hour", "Agla ek ghanta kaise use karna hai", "mine", "m-20min", "m-onetopic"),
      c("s-log", "What people will say about my result", "Result par log kya kahenge", "not", "m-sentence"),
      c("s-ask", "Asking someone to explain one topic", "Kisi se ek topic samajhna", "mine", "m-askfriend"),
      c("s-syllabus", "How much syllabus is left", "Kitna syllabus bacha hai", "not", "m-list3"),
      c("s-sleep", "When I sleep tonight", "Aaj raat kab sona hai", "mine", "m-phoneaway"),
      c("s-compare", "How far ahead everyone else seems", "Baaki sab kitne aage lagte hain", "not", "m-mute"),
      c("s-start", "Starting when I don't feel like it", "Mann na ho tab bhi shuru karna", "mine", "m-5min"),
    ],
  },
  {
    id: "work",
    label: { en: "Work & money", hinglish: "Kaam aur paisa" },
    cards: [
      c("w-boss", "How my boss or seniors behave", "Boss ya seniors ka behaviour", "not", "m-need"),
      c("w-next", "The next small task on my list", "List ka agla chhota kaam", "mine", "m-10task"),
      c("w-job", "Whether I get the job or the raise", "Job ya raise milega ya nahi", "not", "m-apply"),
      c("w-spend", "Where today's money goes", "Aaj ka paisa kahan jaata hai", "mine", "m-note3"),
      c("w-emi", "How big the EMI or the fees are", "EMI ya fees kitni badi hai", "not", "m-due"),
      c("w-ask", "Asking for help or more time", "Madad ya thoda time maangna", "mine", "m-askhelp"),
      c("w-market", "What the company or the market does", "Company ya market kya karegi", "not", "m-cv"),
      c("w-stop", "When I stop working today", "Aaj kaam kab band karna hai", "mine", "m-stoptime"),
    ],
  },
  {
    id: "family",
    label: { en: "Family", hinglish: "Ghar-parivaar" },
    unsafe: UNSAFE,
    cards: [
      c("f-expect", "What my family expects from me", "Ghar wale mujhse kya chahte hain", "not", "m-wish"),
      c("f-talk", "How I start one conversation", "Ek baat kaise shuru karni hai", "mine", "m-10talk"),
      c("f-fights", "The arguments between people at home", "Ghar mein logon ki behes", "not", "m-stepout"),
      c("f-reply", "How I answer when things heat up", "Garma-garmi mein mera jawab", "mine", "m-pause"),
      c("f-health", "A parent's or an elder's health", "Mummy-papa ya badon ki sehat", "not", "m-onecall"),
      c("f-marriage", "Marriage talk and timelines", "Shaadi ki baatein aur deadline", "not", "m-calmline"),
      c("f-time", "Ten minutes that are only mine", "Das minute jo sirf mere hain", "mine", "m-10mine"),
      c("f-compare", "Being compared with someone else's child", "Sharma ji ke bachche se tulna", "not", "m-ownwin"),
    ],
  },
  {
    id: "love",
    label: { en: "Love & friends", hinglish: "Rishte aur dost" },
    unsafe: UNSAFE,
    cards: [
      c("l-feel", "How they feel about me", "Woh mere baare mein kya feel karte hain", "not", "m-ownneed"),
      c("l-msg", "The message I haven't sent", "Jo message abhi tak nahi bheja", "mine", "m-honest"),
      c("l-reply", "When, or whether, they reply", "Woh reply kab karenge, ya karenge bhi", "not", "m-phone30"),
      c("l-ended", "What has already ended", "Jo khatam ho chuka hai", "not", "m-kind"),
      c("l-no", "What I say yes and no to", "Kis baat par haan aur kis par na", "mine", "m-oneno"),
      c("l-friend", "Reaching out to one friend", "Ek dost ko reach out karna", "mine", "m-thinking"),
      c("l-left", "Being left out of plans", "Plans mein shamil na hona", "not", "m-ownplan"),
      c("l-sorry", "Whether they say sorry", "Woh sorry bolenge ya nahi", "not", "m-ownpart"),
    ],
  },
  {
    id: "health",
    label: { en: "Health & body", hinglish: "Sehat aur body" },
    cards: [
      c("h-report", "What the test or report will say", "Test ya report mein kya aayega", "not", "m-questions"),
      c("h-phone", "When I put the phone down tonight", "Aaj raat phone kab rakhna hai", "mine", "m-phoneaway"),
      c("h-looks", "How my body looks to others", "Meri body doosron ko kaisi lagti hai", "not", "m-bodykind"),
      c("h-walk", "Ten minutes of moving today", "Aaj das minute chalna-phirna", "mine", "m-walk10"),
      c("h-pain", "An illness or a pain that stays", "Bimari ya dard jo jaata nahi", "not", "m-appoint"),
      c("h-eat", "My next meal", "Mera agla khaana", "mine", "m-eat"),
      c("h-doc", "Seeing a doctor about it", "Is baare mein doctor ko dikhana", "mine", "m-appoint"),
      c("h-age", "A body that has changed", "Body jo badal gayi hai", "not", "m-bodykind"),
    ],
  },
  {
    id: "alone",
    label: { en: "Feeling alone", hinglish: "Akelapan" },
    cards: [
      c("a-far", "Being far from home or my people", "Ghar ya apnon se door hona", "not", "m-callhome"),
      c("a-hello", "Saying hello to one person today", "Aaj ek insaan ko hello bolna", "mine", "m-hello"),
      c("a-first", "That nobody messaged first", "Kisi ne pehle message nahi kiya", "not", "m-thinking"),
      c("a-room", "Staying in my room all day", "Poora din kamre mein rehna", "mine", "m-outside5"),
      c("a-fit", "Not fitting in here", "Yahan fit na ho paana", "not", "m-oneplace"),
      c("a-old", "An old friend I miss", "Ek purana dost jo yaad aata hai", "mine", "m-oldfriend"),
      c("a-night", "The nights feeling long", "Raatein lambi lagna", "not", "m-nightplan"),
      c("a-join", "Showing up to one thing", "Kisi ek cheez mein pahunchna", "mine", "m-showup"),
    ],
  },
  {
    id: "self",
    label: { en: "Myself", hinglish: "Khud se" },
    cards: [
      c("m-past", "A mistake I already made", "Jo galti ho chuki hai", "not", "m-friendvoice"),
      c("m-next", "The next right small thing", "Agla sahi chhota kadam", "mine", "m-onesmall"),
      c("m-think", "What others think of me", "Log mere baare mein kya sochte hain", "not", "m-ownwin"),
      c("m-voice", "How I talk to myself", "Khud se kaise baat karni hai", "mine", "m-friendvoice"),
      c("m-behind", "Feeling behind in life", "Life mein peeche reh jaana", "not", "m-oneyear"),
      c("m-scroll", "How long I scroll tonight", "Aaj raat kitna scroll karna hai", "mine", "m-scrollstop"),
      c("m-enough", "Feeling like I'm not enough", "Lagna ki main kaafi nahi hoon", "not", "m-hopebox"),
      c("m-promise", "One promise to myself today", "Aaj khud se ek vaada", "mine", "m-promise"),
    ],
  },
  {
    id: "unsure",
    label: { en: "Can't say yet", hinglish: "Abhi pata nahi" },
    cards: [
      c("u-ten", "The next ten minutes", "Agle das minute", "mine", "m-onesmall"),
      c("u-all", "Everything, all at once", "Sab kuch, ek saath", "not", "m-loud3"),
      c("u-sleep", "When I sleep tonight", "Aaj raat kab sona hai", "mine", "m-phoneaway"),
      c("u-tomorrow", "What tomorrow brings", "Kal kya hoga", "not", "m-nightplan"),
      c("u-water", "Water, food, a wash", "Paani, khaana, munh dhona", "mine", "m-water"),
      c("u-moods", "Other people's moods", "Doosron ka mood", "not", "m-stepout"),
      c("u-noise", "The noise in my head", "Dimaag ka shor", "not", "m-breathe"),
      c("u-tell", "Telling one person it's heavy", "Kisi ek ko batana ki bhaari lag raha hai", "mine", "m-tell"),
    ],
  },
];

export const TOPICS: Record<TopicId, Topic> = Object.fromEntries(TOPIC_LIST.map((t) => [t.id, t])) as Record<TopicId, Topic>;
export const TOPIC_ORDER: TopicId[] = TOPIC_LIST.map((t) => t.id);

/** How many cards one minute sorts. Three is what fits in about twenty
    seconds; more turned the minute into a questionnaire. */
export const HAND = 3;

/* ── dealing ───────────────────────────────────────────────────────── */

export function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(list: T[], rnd: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Three cards for this minute: always at least one that usually sits in a
 * person's hands and one that usually does not, so both piles get used and
 * the sort never reads as "it's all on you" or "nothing can be done". Cards
 * from the last minute on this topic are left out when there are enough
 * others, which is what makes the next visit a different one.
 */
export function dealCards(topic: TopicId, seed: number, avoid: string[] = []): TensionCard[] {
  const all = TOPICS[topic].cards;
  const rnd = mulberry(seed);
  const fresh = all.filter((x) => !avoid.includes(x.id));
  const ok = (list: TensionCard[]) => list.filter((x) => x.lean === "mine").length >= 1 && list.filter((x) => x.lean === "not").length >= 1 && list.length >= HAND;
  const pool = ok(fresh) ? fresh : all;
  const mine = shuffled(pool.filter((x) => x.lean === "mine"), rnd);
  const not = shuffled(pool.filter((x) => x.lean === "not"), rnd);
  const third = (rnd() < 0.5 ? mine[1] : not[1]) ?? mine[1] ?? not[1];
  return shuffled([mine[0], not[0], third], rnd);
}

/* ── the move ──────────────────────────────────────────────────────── */

/**
 * The moves to choose from after a sort.
 *
 * From the cards put "in my hands", in the order they were sorted, three at
 * most. When nothing went in the person's hands the answer is not "then do
 * nothing": it is a person, a free line, a breath or rest (SUPPORT_MOVES),
 * because a weight that cannot be changed is the kind that is lighter
 * shared. On a gentle day a way to reach someone is always among them.
 */
export function movesFor(mineIds: string[], gentle = false): Move[] {
  const out: string[] = [];
  const add = (id: string) => {
    if (MOVES[id] && !out.includes(id)) out.push(id);
  };
  if (!mineIds.length) SUPPORT_MOVES.forEach(add);
  else {
    const cards = mineIds.map((id) => cardById(id)).filter((x): x is TensionCard => !!x);
    for (const card of cards) add(card.moves[0]);
    for (const card of cards) card.moves.slice(1).forEach(add);
    if (out.length < 2) add("m-onesmall");
    out.splice(3);
    if (gentle) add("m-tell");
  }
  return out.map((id) => MOVES[id]);
}

export function cardById(id: string): TensionCard | undefined {
  for (const t of TOPIC_LIST) {
    const hit = t.cards.find((x) => x.id === id);
    if (hit) return hit;
  }
  return undefined;
}

export function smallerMove(id: string): Move | null {
  const next = MOVES[id]?.smaller;
  return next && MOVES[next] ? MOVES[next] : null;
}

/** "Tonight, before I sleep: Phone on charge, away from the bed tonight." */
export function planLine(moveId: string, cue: CueId, lang: MinuteLang): string {
  const move = MOVES[moveId];
  const when = CUES.find((x) => x.id === cue);
  if (!move || !when) return "";
  return `${say(when.label, lang)}: ${say(move.text, lang)}`;
}

/* ── what is kept, and what it shows ───────────────────────────────── */

export type MoveStatus = "open" | "done" | "dropped";

export interface MinuteRecord {
  /** ISO timestamp. */
  at: string;
  topic: TopicId;
  /** Card ids, as sorted. */
  mine: string[];
  notMine: string[];
  move: { id: string; cue: CueId; status: MoveStatus; closedAt?: string } | null;
}

const DAY = 86_400_000;

/** How long "did it happen?" keeps being asked. After a week the move is
    simply not mentioned again: nothing lapses, nothing is counted against
    anyone. */
export const MOVE_OPEN_DAYS = 7;

/**
 * When "did it happen?" may first be asked: once the time the move was for
 * has passed.
 *
 * The first build asked the moment the minute ended, about a move chosen
 * for "tonight, before I sleep", which is a question nobody can answer and
 * reads as nagging. So: twenty minutes after "right now", three hours
 * after "my next meal", and the next morning for the two that belong to a
 * night (5 am after "before I sleep", 9 am after "tomorrow, first thing").
 * Before 5 am still counts as the night before, as it does for the reel.
 */
export function moveDueAt(at: Date, cue: CueId): Date {
  if (cue === "now") return new Date(at.getTime() + 20 * 60_000);
  if (cue === "meal") return new Date(at.getTime() + 3 * 3_600_000);
  const day = new Date(at);
  if (day.getHours() < 5) day.setDate(day.getDate() - 1);
  day.setDate(day.getDate() + 1);
  day.setHours(cue === "sleep" ? 5 : 9, 0, 0, 0);
  return day;
}

/**
 * The newest move, if it is waiting for its answer and its time has come.
 *
 * Only ever the newest. An older move that was never answered is not
 * brought back once a newer one exists: this is one question, never a
 * backlog of things not done.
 */
export function openMove(records: MinuteRecord[], now: Date = new Date()): { index: number; record: MinuteRecord } | null {
  for (let i = records.length - 1; i >= 0; i--) {
    const r = records[i];
    if (!r.move) continue;
    if (r.move.status !== "open") return null;
    const at = Date.parse(r.at);
    const age = now.getTime() - at;
    if (!Number.isFinite(age) || age > MOVE_OPEN_DAYS * DAY) return null;
    if (now.getTime() < moveDueAt(new Date(at), r.move.cue).getTime()) return null;
    return { index: i, record: r };
  }
  return null;
}

/**
 * Whether the question on Home is asked with the word "tension".
 *
 * It is the word for stress and distress across South Asia (Weaver et al.
 * 2022: 122 records, mostly India, with Pakistan, Bangladesh and Nepal),
 * and it is not that elsewhere, where "what's the tension?" sounds like a
 * question about a rope. The region is the one the helplines use; a phone
 * in a neighbouring country is "intl" there, so its time zone is read too.
 */
export function saysTension(region: string | null, timeZone = ""): boolean {
  if (!region || region === "in") return true;
  return region === "intl" && /^Asia\/(Karachi|Dhaka|Kathmandu|Katmandu|Colombo|Thimphu|Kolkata|Calcutta)$/.test(timeZone);
}

export interface Noticing {
  minutes: number;
  top: { topic: TopicId; n: number } | null;
  sorted: number;
  notMine: number;
  picked: number;
  done: number;
  lines: Words[];
}

/** Fewer minutes than this and the page says nothing: two data points are
    how an app ends up telling someone a pattern that is not there. */
export const NOTICE_MIN = 3;

/**
 * What the last thirty days of minutes show, in plain sentences made only
 * of the person's own taps. No scores, no labels, nothing about what a
 * person "is". Shown to them alone.
 */
export function noticing(records: MinuteRecord[], now: Date = new Date(), days = 30): Noticing | null {
  const from = now.getTime() - days * DAY;
  const recent = records.filter((r) => {
    const t = Date.parse(r.at);
    return Number.isFinite(t) && t >= from && t <= now.getTime() + 3_600_000;
  });
  if (recent.length < NOTICE_MIN) return null;
  const counts = new Map<TopicId, number>();
  for (const r of recent) counts.set(r.topic, (counts.get(r.topic) ?? 0) + 1);
  let top: Noticing["top"] = null;
  for (const [topic, n] of counts) if (topic !== "unsure" && (!top || n > top.n)) top = { topic, n };
  /* "Most often" needs to be more than once, and more than any other. */
  if (top && (top.n < 2 || [...counts].some(([t, n]) => t !== top!.topic && t !== "unsure" && n === top!.n))) top = null;
  const mine = recent.reduce((n, r) => n + r.mine.length, 0);
  const notMine = recent.reduce((n, r) => n + r.notMine.length, 0);
  const sorted = mine + notMine;
  const picked = recent.filter((r) => r.move).length;
  const done = recent.filter((r) => r.move?.status === "done").length;
  const lines: Words[] = [];
  if (top) {
    const t = TOPICS[top.topic].label;
    lines.push({
      en: `Most often it was ${t.en}: ${top.n} of your last ${recent.length} minutes.`,
      hinglish: `Sabse zyada ${t.hinglish}: pichhle ${recent.length} minute mein se ${top.n} baar.`,
    });
  }
  if (sorted >= 6) {
    const heavy = notMine / sorted >= 0.6;
    lines.push({
      en: `Of ${sorted} things you sorted, ${notMine} were not in your hands.${heavy ? " A lot of what is heavy is not yours to fix. That is a reason to lean on someone, not a failing." : ""}`,
      hinglish: `${sorted} cheezon mein se ${notMine} haath mein nahi thi.${heavy ? " Jo bhaari hai uska bada hissa fix karna aapke haath mein nahi. Yeh kisi ka saath lene ki wajah hai, kami nahi." : ""}`,
    });
  }
  if (picked >= 2) {
    lines.push({
      en: done ? `You did ${done} of the ${picked} moves you picked. Small ones are the ones that happen.` : `You picked ${picked} moves. None marked done yet, and that's allowed. Try the smaller version.`,
      hinglish: done ? `${picked} mein se ${done} kadam poore kiye. Chhote kadam hi hote hain.` : `${picked} kadam chune. Abhi koi done nahi, aur yeh theek hai. Chhota wala try karo.`,
    });
  }
  return { minutes: recent.length, top, sorted, notMine, picked, done, lines };
}

/* ── the words on the screen ───────────────────────────────────────── */

export interface MinuteStrings {
  title: string;
  ask: string;
  askElsewhere: string;
  askSub: string;
  start: string;
  sortTitle: string;
  up: string;
  upSub: string;
  down: string;
  downSub: string;
  hint: string;
  noRight: string;
  of: (n: number, total: number) => string;
  moveTitle: string;
  moveSub: string;
  noneTitle: string;
  noneSub: string;
  whenTitle: string;
  doneTitle: string;
  doneSub: (notMine: number, hasMove: boolean) => string;
  myMove: string;
  waiting: string;
  doneBtn: string;
  again: string;
  back: string;
  skip: string;
  send: string;
  copied: string;
  doNow: string;
  smaller: string;
  another: string;
  whyLabel: string;
  followKicker: string;
  followAsk: string;
  did: string;
  notYet: string;
  drop: string;
  didReply: string;
  notYetReply: string;
  smallerReply: string;
  unsafeGo: string;
  why: string;
  noticeTitle: string;
  noticeEmpty: string;
  noticeOnly: string;
  step: (n: number, total: number) => string;
}

export const MINUTE_STRINGS: Record<MinuteLang, MinuteStrings> = {
  en: {
    title: "One minute",
    ask: "What's the tension right now?",
    askElsewhere: "What's weighing on you right now?",
    askSub: "Pick one. In a minute, one thing is back in your hands.",
    start: "Take one minute",
    sortTitle: "Three quick ones. Whose is it?",
    up: "Not in my hands",
    upSub: "Set it down in the sky.",
    down: "In my hands",
    downSub: "It lifts the sun.",
    hint: "Drag it up or down, or use the buttons.",
    noRight: "No right answers. Your call.",
    of: (n, total) => `${n} of ${total}`,
    moveTitle: "One small move",
    moveSub: "Small enough to really happen.",
    noneTitle: "None of it is in your hands.",
    noneSub: "Then the move is not to carry it alone.",
    whenTitle: "When?",
    doneTitle: "That's your minute.",
    doneSub: (notMine, hasMove) =>
      `${notMine === 0 ? "Nothing" : notMine === 1 ? "One thing" : notMine === 2 ? "Two things" : "Three things"} set down in the sky.${hasMove ? " One thing in your hands." : ""}`,
    myMove: "My move",
    waiting: "It stays on this phone. When you open Arun after that, it will be here with one question: did it happen?",
    doneBtn: "Done. Back to my day",
    again: "One more minute",
    back: "Home",
    skip: "Skip the move",
    send: "Send it",
    copied: "Copied. Paste it into any chat.",
    doNow: "Do it now",
    smaller: "Make it smaller",
    another: "Show me others",
    whyLabel: "Why this helps",
    followKicker: "Last time you chose",
    followAsk: "Did it happen?",
    did: "Did it",
    notYet: "Not yet",
    drop: "Let it go",
    didReply: "That's one thing you did for yourself. The sky is lighter for it.",
    notYetReply: "That's fine. It's still here when you want it.",
    smallerReply: "Smaller is still a move.",
    unsafeGo: "See who can help",
    why: "A minute like this won't fix what's wrong. Studies of very short exercises find they ease distress for a while (Elefant et al. 2017), and that a small plan with its \"when\" attached is far more likely to happen (Gollwitzer & Sheeran 2006). Sorting what is and isn't in your hands is the first step of the problem-solving approach tested with students in Delhi schools (Michelson et al. 2020).",
    noticeTitle: "What your minutes show",
    noticeEmpty: "After three minutes, this shows what keeps coming up and how much of it is in your hands.",
    noticeOnly: "Made only from your own taps. It stays on this phone and only you can see it.",
    step: (n, total) => `Step ${n} of ${total}`,
  },
  hinglish: {
    title: "Ek minute",
    ask: "Abhi kis baat ki tension hai?",
    askElsewhere: "Abhi kis baat ki tension hai?",
    askSub: "Ek chuno. Ek minute mein ek cheez wapas haath mein.",
    start: "Ek minute lo",
    sortTitle: "Teen jaldi wale. Yeh kiske haath mein hai?",
    up: "Mere haath mein nahi",
    upSub: "Aasmaan mein rakh do.",
    down: "Mere haath mein",
    downSub: "Suraj thoda upar.",
    hint: "Upar ya neeche kheencho, ya button dabao.",
    noRight: "Koi sahi-galat nahi. Jo lage.",
    of: (n, total) => `${total} mein se ${n}`,
    moveTitle: "Ek chhota kadam",
    moveSub: "Itna chhota ki sach mein ho jaye.",
    noneTitle: "Isme kuch bhi haath mein nahi.",
    noneSub: "Toh kadam yeh hai ki ise akele mat uthao.",
    whenTitle: "Kab?",
    doneTitle: "Ho gaya. Yeh tha ek minute.",
    doneSub: (notMine, hasMove) =>
      `${notMine === 0 ? "Kuch nahi" : notMine === 1 ? "Ek cheez" : notMine === 2 ? "Do cheezein" : "Teen cheezein"} aasmaan mein rakh di.${hasMove ? " Ek cheez haath mein." : ""}`,
    myMove: "Mera kadam",
    waiting: "Yeh isi phone par rehta hai. Uske baad Arun kholne par yeh yahin milega, ek sawaal ke saath: hua kya?",
    doneBtn: "Ho gaya. Wapas apne din mein",
    again: "Ek aur minute",
    back: "Home",
    skip: "Kadam rehne do",
    send: "Bhej do",
    copied: "Copy ho gaya. Kisi bhi chat mein paste karo.",
    doNow: "Abhi karo",
    smaller: "Chhota kar do",
    another: "Aur dikhao",
    whyLabel: "Yeh kyun kaam aata hai",
    followKicker: "Pichhli baar chuna tha",
    followAsk: "Hua kya?",
    did: "Ho gaya",
    notYet: "Abhi nahi",
    drop: "Rehne do",
    didReply: "Yeh ek cheez khud ke liye ki. Aasmaan thoda halka hua.",
    notYetReply: "Koi baat nahi. Jab chaho, yeh yahin hai.",
    smallerReply: "Chhota bhi kadam hi hai.",
    unsafeGo: "Dekho kaun madad kar sakta hai",
    why: "Aisa ek minute jo galat hai use theek nahi karega. Research kehti hai ki bahut chhoti exercises thodi der ke liye bojh halka karti hain (Elefant et al. 2017), aur jis chhote plan ke saath \"kab\" juda ho, uske hone ke chance kaafi zyada hote hain (Gollwitzer & Sheeran 2006). Kya haath mein hai aur kya nahi, yeh alag karna us problem-solving tareeke ka pehla step hai jo Delhi ke schools mein students ke saath test hua (Michelson et al. 2020).",
    noticeTitle: "Aapke minute kya dikhate hain",
    noticeEmpty: "Teen minute ke baad yahan dikhega ki kya baar baar aata hai, aur usme kitna haath mein hai.",
    noticeOnly: "Sirf aapke apne taps se bana. Isi phone par rehta hai, sirf aap dekh sakte hain.",
    step: (n, total) => `Step ${n} / ${total}`,
  },
};

/** The app's language setting, as the language the minute speaks. Hindi in
    Devanagari is not written yet, so it gets Hinglish: the same language in
    another script is closer than English. */
export function minuteLang(appLang: string): MinuteLang {
  return appLang === "en" ? "en" : "hinglish";
}

/** Every line a person can read, for the tests. */
export function allMinuteWords(): Words[] {
  const out: Words[] = [];
  for (const t of TOPIC_LIST) {
    out.push(t.label);
    if (t.unsafe) out.push(t.unsafe);
    for (const card of t.cards) out.push(card.text);
  }
  for (const mv of MOVE_LIST) {
    out.push(mv.text);
    if (mv.send) out.push(mv.send);
  }
  for (const cue of CUES) out.push(cue.label);
  const flat = (s: MinuteStrings): string[] =>
    Object.values(s).flatMap((v) =>
      typeof v === "string" ? [v] : [v(1, 3), v(2, 3), (v as (a: number, b: boolean | number) => string)(0, true), (v as (a: number, b: boolean | number) => string)(3, false)],
    );
  const en = flat(MINUTE_STRINGS.en);
  const hi = flat(MINUTE_STRINGS.hinglish);
  en.forEach((text, i) => out.push({ en: text, hinglish: hi[i] }));
  return out;
}
