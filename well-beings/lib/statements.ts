import { Lang } from "./i18n";

/**
 * The deck behind the landing page.
 *
 * Each card is a claim most people get wrong, taken from a paper already in
 * the evidence library — so the intro teaches something in ten seconds
 * instead of describing itself. Answering is the hook; the reference is the
 * payoff, and it stays folded away until asked for.
 *
 * `researchAgrees` is what the cited paper found, not an opinion. When a
 * statement is deliberately the popular-but-wrong version, that value is
 * false and `reveal` says what the paper found instead.
 */
export interface Statement {
  id: string;
  /** The claim, per language. Keep it to one breath — it's set in 40px display type. */
  text: Record<Lang, string>;
  /** What the evidence actually says. */
  researchAgrees: boolean;
  /** Shown after answering: the finding, in plain words. */
  reveal: Record<Lang, string>;
  cite: string;
  url: string;
}

export const STATEMENTS: Statement[] = [
  {
    id: "sleep-regularity",
    text: {
      en: "Getting the right number of hours matters more than sleeping at the same time each night.",
      hi: "हर रात एक ही समय सोने से ज़्यादा ज़रूरी है पूरे घंटे की नींद लेना।",
    },
    researchAgrees: false,
    reveal: {
      en: "Other way round. Across 79,666 people tracked for seven years, regular sleep timing meant 38% lower risk of depression — and hitting the recommended hours did not rescue an all-over-the-place schedule. Fix the window first, the hours second.",
      hi: "इसका उल्टा। सात साल तक 79,666 लोगों पर नज़र रखी गई: नियमित समय पर सोने वालों में अवसाद का ख़तरा 38% कम था — और बेतरतीब दिनचर्या को पूरे घंटे की नींद भी नहीं बचा पाई। पहले समय ठीक करें, घंटे बाद में।",
    },
    cite: "Li et al., 2025, Psychological Medicine",
    url: "https://consensus.app/papers/details/7ab87f554d8854c4bb416480de802a17/",
  },
  {
    id: "21-days",
    text: {
      en: "It takes about 21 days to build a habit.",
      hi: "कोई आदत बनाने में लगभग 21 दिन लगते हैं।",
    },
    researchAgrees: false,
    reveal: {
      en: "The 21-day rule is a myth. When researchers actually tracked people daily, habits took between 18 and 254 days to feel automatic — median around two months. Plans built on three weeks set you up to quit at week four.",
      hi: "21 दिन वाला नियम एक भ्रम है। जब शोधकर्ताओं ने रोज़ाना नज़र रखी, तो आदत अपने-आप होने में 18 से 254 दिन लगे — औसतन लगभग दो महीने। तीन हफ़्ते के भरोसे बनी योजना चौथे हफ़्ते तक छूट जाती है।",
    },
    cite: "Lally et al., 2010, EJSP · Keller et al., 2021",
    url: "https://consensus.app/papers/details/c8c012abb9895e38bfd6d92c34b47a3e/",
  },
  {
    id: "missed-day",
    text: {
      en: "Missing a single day undoes a habit you're building.",
      hi: "एक दिन चूक जाने से बनती हुई आदत बिगड़ जाती है।",
    },
    researchAgrees: false,
    reveal: {
      en: "It doesn't. In the same daily-tracking studies, missing one day made no measurable difference to whether the habit formed. That's why streaks here forgive a miss instead of resetting to zero.",
      hi: "नहीं बिगड़ती। उन्हीं अध्ययनों में, एक दिन चूकने से आदत बनने पर कोई मापने योग्य फ़र्क़ नहीं पड़ा। इसीलिए यहाँ की स्ट्रीक एक चूक माफ़ कर देती है, शून्य पर नहीं भेजती।",
    },
    cite: "Lally et al., 2010, EJSP · Keller et al., 2021",
    url: "https://consensus.app/papers/details/c8c012abb9895e38bfd6d92c34b47a3e/",
  },
  {
    id: "gamification",
    text: {
      en: "Points, badges and streaks keep people using a mental-health app.",
      hi: "अंक, बैज और स्ट्रीक लोगों को मानसिक-स्वास्थ्य ऐप से जोड़े रखते हैं।",
    },
    researchAgrees: false,
    reveal: {
      en: "Across 79 randomised trials of depression and anxiety apps, people left sooner when the app was gamified. Reminders and human contact kept them; badges didn't. It's why there are no points anywhere in this app.",
      hi: "अवसाद और चिंता संबंधी ऐप्स के 79 यादृच्छिक परीक्षणों में, गेम जैसे ऐप को लोगों ने जल्दी छोड़ा। रिमाइंडर और इंसानी संपर्क ने उन्हें रोका; बैज ने नहीं। इसीलिए इस ऐप में कहीं अंक नहीं हैं।",
    },
    cite: "Liu et al., 2025, JAMA Psychiatry",
    url: "https://consensus.app/papers/details/3493cacd60695a7a8a9109ba87fb7825/",
  },
  {
    id: "planning-when-low",
    text: {
      en: "Making detailed plans works less well when your mental health is poor.",
      hi: "जब मानसिक स्वास्थ्य ख़राब हो, तब विस्तृत योजना बनाना कम काम आता है।",
    },
    researchAgrees: false,
    reveal: {
      en: "It works better. Across 29 experiments with clinical samples, “if it's 9am, then I open the document” planning had a larger effect for people with mental-health difficulties than for everyone else — external structure does the work a tired brain can't.",
      hi: "उल्टे, ज़्यादा काम आता है। नैदानिक समूहों पर 29 प्रयोगों में, “अगर 9 बजे हैं, तो मैं फ़ाइल खोलूँगा” जैसी योजना का असर मानसिक कठिनाई वाले लोगों पर बाक़ी सबसे ज़्यादा था — बाहरी ढाँचा वह काम करता है जो थका दिमाग़ नहीं कर पाता।",
    },
    cite: "Toli et al., 2016, Brit. J. Clinical Psychology",
    url: "https://consensus.app/papers/details/d8ccca83d3525ab09af97d4c7f3a3830/",
  },
  {
    id: "exercise-mood",
    text: {
      en: "For young people, exercise shifts depression about as much as front-line treatments do.",
      hi: "युवाओं में व्यायाम अवसाद को लगभग उतना ही घटाता है जितना प्राथमिक इलाज।",
    },
    researchAgrees: true,
    reveal: {
      en: "Yes — and it surprises most people. Across 16 randomised trials in 12–25 year olds, physical activity had a large effect on depressive symptoms, big enough that head-to-head reviews put it in the same conversation as front-line treatment.",
      hi: "हाँ — और यह ज़्यादातर लोगों को चौंकाता है। 12–25 वर्ष के लोगों पर 16 यादृच्छिक परीक्षणों में शारीरिक गतिविधि का अवसाद के लक्षणों पर बड़ा असर दिखा, इतना कि सीधी तुलनाओं में इसे प्राथमिक इलाज के बराबर रखा जाता है।",
    },
    cite: "Bailey et al., 2017, Psych. Medicine",
    url: "https://consensus.app/papers/details/3ee0b6c765075a05b08fbf5f9938dfcc/",
  },
  {
    id: "two-questions",
    text: {
      en: "Two questions can catch most young people with real depressive symptoms.",
      hi: "दो सवाल ही अवसाद के असली लक्षणों वाले ज़्यादातर युवाओं को पहचान सकते हैं।",
    },
    researchAgrees: true,
    reveal: {
      en: "They can. In 2,183 visits by 12–25 year olds, answering “yes, more than a few days” to either of the first two mood questions caught 89% of those who turned out to have moderate-or-worse depression. It's why this check-in starts short.",
      hi: "हाँ, पहचान सकते हैं। 12–25 वर्ष के लोगों की 2,183 मुलाक़ातों में, पहले दो सवालों में से किसी एक पर “हाँ, कुछ दिनों से ज़्यादा” कहने से मध्यम या उससे गंभीर अवसाद वाले 89% लोग पकड़ में आए। इसीलिए यह जाँच छोटी शुरू होती है।",
    },
    cite: "Pitts et al., 2023, J. Adolescent Health",
    url: "https://consensus.app/papers/details/d1249c895e1d5747b54ccb24654945fa/",
  },
  {
    id: "rest-channels",
    text: {
      en: "A weekend of doing nothing gives you every kind of rest you need.",
      hi: "कुछ न करते हुए बिताया गया सप्ताहांत हर तरह का आराम दे देता है।",
    },
    researchAgrees: false,
    reveal: {
      en: "It doesn't. Pooling 316 samples, researchers found four distinct recovery channels — switching off, relaxation, mastery and control — and they don't substitute for each other. Doing nothing never delivers what learning something does.",
      hi: "नहीं देता। 316 नमूनों को जोड़कर शोधकर्ताओं ने आराम के चार अलग-अलग रास्ते पाए — मन हटाना, विश्राम, कुछ नया सीखना, और अपने समय पर नियंत्रण — और ये एक-दूसरे की जगह नहीं ले सकते। कुछ न करना वह नहीं देता जो कुछ सीखना देता है।",
    },
    cite: "Headrick et al., 2022, J. Business & Psychology",
    url: "https://consensus.app/papers/details/b4b32af90fcd550d93e987eff3b59f43/",
  },
  {
    id: "translation",
    text: {
      en: "Translating a mental-health tool is enough to make it work in another culture.",
      hi: "किसी मानसिक-स्वास्थ्य साधन का अनुवाद कर देना ही उसे दूसरी संस्कृति में कारगर बनाने को काफ़ी है।",
    },
    researchAgrees: false,
    reveal: {
      en: "Not close. Across 23 randomised trials, deep adaptation — language plus genuinely local content — held dropout under 11%. Translation alone left it as high as 56%. It's the reason this page offers Hindi but won't machine-translate a validated screener.",
      hi: "बिल्कुल नहीं। 23 यादृच्छिक परीक्षणों में, गहरे अनुकूलन — भाषा के साथ सचमुच स्थानीय सामग्री — ने छोड़ने की दर 11% से नीचे रखी। सिर्फ़ अनुवाद से यह 56% तक पहुँच गई। इसीलिए यह पन्ना हिन्दी में है, पर प्रमाणित स्क्रीनर का मशीनी अनुवाद नहीं करता।",
    },
    cite: "Tandon et al., 2025, JMIR Mental Health",
    url: "https://consensus.app/papers/details/0ae37e9270f05c45a01c25fc635e7f9b/",
  },
];
