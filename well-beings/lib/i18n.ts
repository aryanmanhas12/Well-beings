/**
 * A deliberately small translation layer.
 *
 * The honest scope: the surfaces someone in distress reaches for — the
 * landing page, the header, the crisis dialog, the crisis card in chat, and
 * the support tab — are fully translated. The 60-question check-in is not,
 * because a half-translated screener is worse than an English one: the PHQ-9
 * and GAD-7 wordings are validated instruments, and paraphrasing them in
 * another language quietly invalidates the scores they produce.
 *
 * So `checkinEnglishOnly` exists and is shown, rather than letting someone
 * switch to Hindi and discover the mismatch three questions in. The companion
 * Psych Screener ships properly localised instruments; we link to it.
 *
 * Adding a language is a data change: extend `Lang`, add one object to
 * `STRINGS`, and the type checker names every string still missing.
 */

export type Lang = "en" | "hi";

export const LANGS: { value: Lang; label: string; native: string }[] = [
  { value: "en", label: "English", native: "English" },
  { value: "hi", label: "Hindi", native: "हिन्दी" },
];

export interface Strings {
  /* chrome */
  brandTag: string;
  helpNow: string;
  language: string;
  footerDisclaimer: string;
  footerPrivacy: string;

  /* landing */
  heroKicker: string;
  heroPrompt: string;
  agree: string;
  disagree: string;
  showSource: string;
  hideSource: string;
  startCheckin: string;
  previewProfile: string;
  statementNext: string;
  statementPrev: string;
  pauseDeck: string;
  playDeck: string;
  heroLead: string;

  /* landing feature blurbs */
  featPrivateTitle: string;
  featPrivateBody: string;
  featAdaptiveTitle: string;
  featAdaptiveBody: string;
  featEvidenceTitle: string;
  featEvidenceBody: string;
  notMedical: string;

  /* landing pull-figures */
  researchKicker: string;
  statSleepBody: string;
  statPlanBody: string;

  /* help */
  helpTitle: string;
  helpSub: string;
  helpClose: string;
  helpElsewhere: string;
  emergencyNote: string;
  moreResources: string;
  hoursLabel: string;
  callAction: string;
  textAction: string;
  visitAction: string;

  /* crisis */
  crisisTitle: string;
  crisisBody: string;
  crisisFooter: string;

  /* honesty */
  checkinEnglishOnly: string;
}

const en: Strings = {
  brandTag: "On-device · no third parties",
  helpNow: "Help now",
  language: "Language",
  footerDisclaimer:
    "Well-Beings — a self-guidance prototype. Not a medical device; screeners signal, they don’t diagnose.",
  footerPrivacy: "All data stays on this device.",

  heroKicker: "Evidence-based · built on 15+ peer-reviewed studies",
  heroPrompt: "Do you agree with the statement?",
  agree: "Yes",
  disagree: "No",
  showSource: "Where’s this from?",
  hideSource: "Hide the source",
  startCheckin: "Start the check-in · ~5 min",
  previewProfile: "Preview a sample profile",
  statementNext: "Next statement",
  statementPrev: "Previous statement",
  pauseDeck: "Pause",
  playDeck: "Play",
  heroLead:
    "A 5-minute check-in about your sleep, mood, stress and goals — using the same short screeners clinicians use — then a personalised daily system designed to raise output and keep you clear of burnout.",

  featPrivateTitle: "Private by design",
  featPrivateBody:
    "Everything stays in your browser. Nothing is uploaded, shared or sold. Delete it anytime.",
  featAdaptiveTitle: "Adaptive, not exhausting",
  featAdaptiveBody:
    "Short screeners first; deeper questions only if something flags — the approach validated in JAMA.",
  featEvidenceTitle: "Research-backed only",
  featEvidenceBody:
    "Every practice cites its meta-analysis or trial — and says so when evidence is young.",
  notMedical:
    "Well-Beings is a self-guidance tool, not a medical device. Its screeners signal — they don’t diagnose.",

  researchKicker: "From the research inside",
  statSleepBody:
    "depression risk for people with a regular sleep window — independent of hours slept. Cohort of 79,666 (Psychological Medicine, 2025).",
  statPlanBody:
    "do better at reaching a goal with an “if-then” plan than without one — across 94 tests (Gollwitzer & Sheeran meta-analysis).",

  helpTitle: "Help, right now",
  helpSub: "Free, confidential, 24/7 — for any level of “not okay”.",
  helpClose: "Close",
  helpElsewhere: "Somewhere else in the world?",
  emergencyNote: "In immediate danger → your local emergency number.",
  moreResources: "More places to look",
  hoursLabel: "Open",
  callAction: "Call",
  textAction: "Text",
  visitAction: "Visit",

  crisisTitle: "You matter — and support exists right now.",
  crisisBody:
    "Thanks for being honest. That answer isn’t stored anywhere but this device — and it deserves a human, not an app. If these thoughts get heavy, please reach out:",
  crisisFooter: "Free · confidential · 24/7. If you’re in immediate danger, call your local emergency number.",

  checkinEnglishOnly:
    "The check-in itself stays in English: PHQ-9 and GAD-7 are validated word-for-word, and a loose translation would quietly break the scores. For properly localised instruments, use the Psych Screener.",
};

const hi: Strings = {
  brandTag: "इसी डिवाइस पर · कोई तीसरा पक्ष नहीं",
  helpNow: "अभी मदद",
  language: "भाषा",
  footerDisclaimer:
    "वेल-बीइंग्स — एक स्व-मार्गदर्शन प्रोटोटाइप। यह कोई चिकित्सा उपकरण नहीं है; स्क्रीनर संकेत देते हैं, निदान नहीं करते।",
  footerPrivacy: "सारा डेटा इसी डिवाइस पर रहता है।",

  heroKicker: "प्रमाण-आधारित · 15+ सहकर्मी-समीक्षित अध्ययनों पर आधारित",
  heroPrompt: "क्या आप इस कथन से सहमत हैं?",
  agree: "हाँ",
  disagree: "नहीं",
  showSource: "यह कहाँ से आया?",
  hideSource: "स्रोत छिपाएँ",
  startCheckin: "जाँच शुरू करें · ~5 मिनट",
  previewProfile: "एक नमूना प्रोफ़ाइल देखें",
  statementNext: "अगला कथन",
  statementPrev: "पिछला कथन",
  pauseDeck: "रोकें",
  playDeck: "चलाएँ",
  heroLead:
    "आपकी नींद, मनोदशा, तनाव और लक्ष्यों पर 5 मिनट की जाँच — उन्हीं छोटे स्क्रीनरों से जो चिकित्सक इस्तेमाल करते हैं — और फिर एक निजी दैनिक व्यवस्था, जो आपका काम बढ़ाए और बर्नआउट से बचाए।",

  featPrivateTitle: "निजता, बनावट से ही",
  featPrivateBody:
    "सब कुछ आपके ब्राउज़र में रहता है। कुछ भी अपलोड, साझा या बेचा नहीं जाता। जब चाहें मिटा दें।",
  featAdaptiveTitle: "अनुकूल, थकाऊ नहीं",
  featAdaptiveBody:
    "पहले छोटे स्क्रीनर; गहरे सवाल तभी जब कुछ संकेत मिले — यही तरीका JAMA में प्रमाणित हुआ है।",
  featEvidenceTitle: "केवल शोध-समर्थित",
  featEvidenceBody:
    "हर अभ्यास अपने मेटा-विश्लेषण या परीक्षण का हवाला देता है — और जहाँ प्रमाण नए हैं, वहाँ यह साफ़ कहता है।",
  notMedical:
    "वेल-बीइंग्स एक स्व-मार्गदर्शन साधन है, चिकित्सा उपकरण नहीं। इसके स्क्रीनर संकेत देते हैं — निदान नहीं करते।",

  researchKicker: "इसमें शामिल शोध से",
  statSleepBody:
    "नियमित समय पर सोने वालों में अवसाद का कम ख़तरा — चाहे नींद के घंटे कितने भी हों। 79,666 लोगों का समूह (Psychological Medicine, 2025)।",
  statPlanBody:
    "लोग “अगर-तो” योजना के साथ अपना लक्ष्य बेहतर ढंग से पाते हैं, बिना योजना के मुक़ाबले — 94 परीक्षणों में (Gollwitzer और Sheeran का मेटा-विश्लेषण)।",

  helpTitle: "मदद, अभी",
  helpSub: "नि:शुल्क, गोपनीय, चौबीसों घंटे — “ठीक नहीं लग रहा” के हर स्तर के लिए।",
  helpClose: "बंद करें",
  helpElsewhere: "दुनिया में कहीं और हैं?",
  emergencyNote: "तत्काल ख़तरे में हों → अपने स्थानीय आपातकालीन नंबर पर कॉल करें।",
  moreResources: "और जगहें जहाँ देख सकते हैं",
  hoursLabel: "खुला",
  callAction: "कॉल",
  textAction: "संदेश",
  visitAction: "वेबसाइट",

  crisisTitle: "आप मायने रखते हैं — और मदद अभी मौजूद है।",
  crisisBody:
    "सच बताने के लिए धन्यवाद। वह उत्तर इस डिवाइस के अलावा कहीं संग्रहीत नहीं होता — और उसके लिए एक ऐप नहीं, एक इंसान चाहिए। अगर ये विचार भारी पड़ने लगें, तो कृपया संपर्क करें:",
  crisisFooter:
    "नि:शुल्क · गोपनीय · चौबीसों घंटे। अगर आप तत्काल ख़तरे में हैं, तो अपने स्थानीय आपातकालीन नंबर पर कॉल करें।",

  checkinEnglishOnly:
    "जाँच स्वयं अंग्रेज़ी में ही रहती है: PHQ-9 और GAD-7 शब्द-दर-शब्द प्रमाणित हैं, और ढीला अनुवाद चुपचाप उनके स्कोर बिगाड़ देगा। सही ढंग से अनूदित प्रश्नावली के लिए Psych Screener इस्तेमाल करें।",
};

export const STRINGS: Record<Lang, Strings> = { en, hi };

export function t(lang: Lang): Strings {
  return STRINGS[lang] ?? STRINGS.en;
}

/** Devanagari needs a different type stack; components ask rather than guess. */
export function isDevanagari(lang: Lang): boolean {
  return lang === "hi";
}
