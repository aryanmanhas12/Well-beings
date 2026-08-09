export type Language = "en" | "hi" | "mr" | "bn" | "ta" | "te";

interface I18nStrings {
  introQuestion: string;
  introStatements: string[];
  introYes: string;
  introNo: string;
  introSkip: string;
  sheetNudge: string;
  journalWelcome: string;
  journalStart: string;
  deepLink: string;
}

const i18n: Record<Language, I18nStrings> = {
  en: {
    introQuestion: "Do you want a personalized system based on your wellbeing?",
    introStatements: [
      "This starts with three simple questions about your sleep, mood, and stress—so the system knows what matters most to you.",
      "Your answers stay private: everything is kept on this device and never shared.",
      "This takes about 5 minutes, and you'll get a personalized daily practice tailored to your wellbeing.",
    ],
    introYes: "Yes, let's start",
    introNo: "Skip for now",
    introSkip: "Skip",
    sheetNudge:
      "Based on your answers, here are some personalized templates to try this week—or skip straight to building your own.",
    journalWelcome: "Welcome to your weekly wellbeing journal",
    journalStart: "Start this week's check-in",
    deepLink:
      "Deep link detected: opening questions skipped. Use the Help menu to retake the intro questions if needed.",
  },
  hi: {
    introQuestion: "क्या आप अपने कल्याण के आधार पर एक व्यक्तिगत प्रणाली चाहते हैं?",
    introStatements: [
      "यह आपकी नींद, मानसिकता और तनाव के बारे में तीन सरल प्रश्नों से शुरू होता है—ताकि सिस्टम जान सके कि आपके लिए क्या सबसे महत्वपूर्ण है।",
      "आपके उत्तर निजी रहते हैं: सब कुछ इस डिवाइस पर रहता है और कभी साझा नहीं किया जाता।",
      "यह लगभग 5 मिनट लेता है, और आप अपने कल्याण के अनुसार तैयार किए गए एक व्यक्तिगत दैनिक अभ्यास प्राप्त करेंगे।",
    ],
    introYes: "हाँ, शुरुआत करें",
    introNo: "अभी के लिए छोड़ें",
    introSkip: "छोड़ें",
    sheetNudge:
      "आपके उत्तरों के आधार पर, यहाँ कुछ व्यक्तिगत टेम्पलेट दिए गए हैं जो इस सप्ताह आजमाएँ—या सीधे अपना स्वयं का निर्माण करें।",
    journalWelcome: "आपकी साप्ताहिक कल्याण पत्रिका में आपका स्वागत है",
    journalStart: "इस सप्ताह की जांच शुरू करें",
    deepLink:
      "गहरी लिंक पाई गई: प्रश्नों को छोड़ दिया गया। यदि आवश्यक हो तो सहायता मेनू का उपयोग करके परिचय प्रश्नों को फिर से लें।",
  },
  mr: {
    introQuestion: "तुम्हाला तुमच्या कल्याणावर आधारित व्यक्तिगत प्रणाली हवी का?",
    introStatements: [
      "हे तुमच्या झोपडी, मानसिकता आणि तणावाबद्दल तीन सोप्या प्रश्नांपासून सुरू होते—जेणेकरून प्रणाली समजू शकेल की तुमच्यासाठी काय सर्वात महत्वाचे आहे।",
      "तुमचे उत्तर खाजगी राहतात: सर्वकाही या उपकरणावर राहते आणि कधीही शेअर केले जात नाही।",
      "यास सुमारे ५ मिनिटे लागतात, आणि तुम्हाला तुमच्या कल्याणासाठी तुम्हाला माहीत असलेल्या व्यक्तिगत दैनंदिन सरावांची व्यक्तिगत प्रणाली मिळेल।",
    ],
    introYes: "होय, सुरुवात करा",
    introNo: "आता सोडा",
    introSkip: "सोडा",
    sheetNudge:
      "तुमच्या उत्तरांवर आधारित, येथे हे सप्ताह आजमावण्यासाठी काही व्यक्तिगत टेम्पलेट आहेत—किंवा सरळ तुमचा स्वतःचा बनवा।",
    journalWelcome: "तुमच्या साप्ताहिक कल्याण पत्रिकेमध्ये तुमचे स्वागत आहे",
    journalStart: "या आठवड्याची तपासणी सुरू करा",
    deepLink:
      "गहरी लिंक आढळली: परिचय प्रश्न वगळले गेले. आवश्यक असल्यास, परिचय प्रश्न पुन्हा घेण्यासाठी मदत मेनू वापरा।",
  },
  bn: {
    introQuestion: "আপনি কি আপনার সুস্থতার উপর ভিত্তি করে একটি ব্যক্তিগত সিস্টেম চান?",
    introStatements: [
      "এটি আপনার ঘুম, মানসিকতা এবং চাপ সম্পর্কে তিনটি সাধারণ প্রশ্ন দিয়ে শুরু হয়—যাতে সিস্টেম জানতে পারে কী আপনার জন্য সবচেয়ে গুরুত্বপূর্ণ।",
      "আপনার উত্তরগুলি ব্যক্তিগত রাখা হয়: সবকিছু এই ডিভাইসে থাকে এবং কখনই শেয়ার করা হয় না।",
      "এটি প্রায় 5 মিনিট সময় নেয়, এবং আপনি আপনার সুস্থতার জন্য তৈরি একটি ব্যক্তিগত দৈনিক অনুশীলন পাবেন।",
    ],
    introYes: "হ্যাঁ, শুরু করুন",
    introNo: "এখন এড়িয়ে যান",
    introSkip: "এড়িয়ে যান",
    sheetNudge:
      "আপনার উত্তরের উপর ভিত্তি করে, এখানে এই সপ্তাহে চেষ্টা করার জন্য কিছু ব্যক্তিগত টেম্পলেট রয়েছে—অথবা সরাসরি নিজের তৈরি করুন।",
    journalWelcome: "আপনার সাপ্তাহিক সুস্থতা জার্নালে স্বাগতম",
    journalStart: "এই সপ্তাহের চেক-ইন শুরু করুন",
    deepLink:
      "গভীর লিংক সনাক্ত: প্রশ্নগুলি এড়িয়ে গেছে। প্রয়োজনে সহায়তা মেনু ব্যবহার করে পুনরায় প্রশ্নগুলি নিন।",
  },
  ta: {
    introQuestion: "உங்கள் நல்வாழ்வின் அடிப்படையில் ஒரு ব்যক்তিগত அமைப்பு வேண்டுமா?",
    introStatements: [
      "இது உங்கள் தூக்கம், மனநிலை மற்றும் அழுத்தம் பற்றிய மூன்று எளிய கேள்விகளுடன் தொடங்குகிறது—இதன் மூலம் உங்களுக்கு முக்கியமான விஷயங்கள் என்ன என்பதை இந்த அமைப்பு அறிந்துகொள்ளும்.",
      "உங்கள் பதிலுகள் தனிப்பட்டதாக இருக்கும்: எல்லாவும் இந்த சாதனத்தில் இருக்கும் மற்றும் ஒருபோதும் பகிரப்படாது.",
      "இதற்கு சுமார் 5 நிமிடங்கள் ஆகும், மேலும் உங்கள் நல்வாழ்வுக்கு ஏற்றவாறு தயாரிக்கப்பட்ட ஒரு ব்যক்তிगத தினசரி பயிற்சியைப் பெறுவீர்கள்.",
    ],
    introYes: "ஆம், தொடங்குக",
    introNo: "இப்போது தவிர்க்கவும்",
    introSkip: "தவிர்க்கவும்",
    sheetNudge:
      "உங்கள் பதிலின் அடிப்படையில், இந்த வாரம் முயற்சி செய்ய சில ব்যக்திப்ப வார்ப்புருக்கள் உள்ளன—அல்லது நேரடியாக உங்களுடையதை உருவாக்குக.",
    journalWelcome: "உங்கள் வாரமொழுகு நல்வாழ்வு பத்திரிகைக்கு வரவேற்கிறோம்",
    journalStart: "இந்த வாரத்தின் சரிபார்ப்பு தொடங்குக",
    deepLink:
      "ஆழமான இணைப்பு கண்டறியப்பட்டுள்ளது: தொடக்க கேள்விகள் தவிர்க்கப்பட்டுள்ளன. தேவைப்பட்டால் உதவி மெனு பயன்படுத்தி மீண்டும் கேள்விகளை எடுக்கவும்.",
  },
  te: {
    introQuestion: "మీ సుఖస్థితి ఆధారంగా ఒక వ్యక్తిగత వ్యవస్థ కావాలా?",
    introStatements: [
      "ఇది మీ నిద్ర, మానసిక స్థితి మరియు ఒత్తిడి గురించి మూడు సాధారణ ప్రశ్నలతో ప్రారంభమవుతుంది—తద్వారా సిస్టమ్ మీకు ఏ విషయాలు చాలా ముఖ్యమైనవని తెలుసుకోవచ్చు.",
      "మీ సమాధానాలు ఉంగరానికి పరిమితమైనవి: ప్రతిదీ ఈ పరికరంపై ఉంటుంది మరియు ఎప్పటికీ పంచుకోబడదు.",
      "దీనికి సుమారు 5 నిమిషాలు పడుతుంది, మరియు మీరు మీ సుఖస్థితి కోసం సర్దుబాటు చేయబడిన ఒక వ్యక్తిగత దైనిక అభ్యాసం పొందుతారు.",
    ],
    introYes: "అవును, ఆరంభించండి",
    introNo: "ఇప్పుడు దాటవేసుకోండి",
    introSkip: "దాటవేసుకోండి",
    sheetNudge:
      "మీ సమాధానాల ఆధారంగా, ఈ వారం ప్రయత్నించటానికి కొన్ని వ్యక్తిగత టెంప్లేట్‌లు ఉన్నాయి—లేదా నేరుగా మీ స్వంతమైన ఒకటి సృష్టించండి.",
    journalWelcome: "మీ సాప్తాహిక సుఖస్థితి జర్నల్‌కు స్వాగతం",
    journalStart: "ఈ వారం యొక్క చెక్-ఇన్‌ను ప్రారంభించండి",
    deepLink:
      "ఆధారమైన లింక్ కనుగొనబడింది: ప్రారంభ ప్రశ్నలు దాటవేయబడ్డాయి. అవసరమైతే, సహాయ మెనూని ఉపయోగించి మళ్లీ ప్రశ్నలను తీసుకోండి.",
  },
};

export function getLanguage(): Language {
  if (typeof window === "undefined") return "en";
  const lang = navigator.language.split("-")[0];
  return (lang as Language) in i18n ? (lang as Language) : "en";
}

export function getString(key: keyof I18nStrings, lang?: Language): string | string[] {
  const targetLang = lang || getLanguage();
  return i18n[targetLang][key];
}

export default {
  i18n,
  getLanguage,
  getString,
};
