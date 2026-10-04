import { UserActionType } from './schemas';

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  dir?: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '中文 (简体)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '中文 (繁體)' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'tl', name: 'Filipino / Tagalog', nativeName: 'Filipino' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', dir: 'rtl' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', dir: 'rtl' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', dir: 'rtl' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල' },
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာ' },
  { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ' },
];

export interface TranslatedSample {
  title: string;
  badge: string;
  text?: string;
}

export interface TranslatedActionOption {
  label: string;
  shortDesc: string;
}

export interface UIStrings {
  tagline: string;
  scanMessage: string;
  aiChat: string;
  voiceLive: string;
  gemmaDocs: string;
  signIn: string;
  signOut: string;
  savedHistory: string;
  messageText: string;
  screenshotOcr: string;
  modelLabel: string;
  testSpecimens: string;
  tapToLoad: string;
  messageSpecimenLabel: string;
  delimiterHint: string;
  whatHaveYouDone: string;
  tailorsChecklist: string;
  analyzeCta: string;
  analyzingCta: string;
  pastePlaceholder: string;
  pasteBtn: string;
  clearBtn: string;
  uploadTapTitle: string;
  uploadSubtitle: string;
  readyForOcr: string;
  pillar1Title: string;
  pillar1Desc: string;
  pillar2Title: string;
  pillar2Desc: string;
  pillar3Title: string;
  pillar3Desc: string;
  verifiedEvidence: string;
  actionChecklist: string;
  linkInspection: string;
  analyzeAnother: string;
  shareWarning: string;
  copiedText: string;
  readAloud: string;
  stopReading: string;
  highRiskLabel: string;
  mediumRiskLabel: string;
  lowRiskLabel: string;
  uncertainRiskLabel: string;
  quotesVerified: string;
  linksChecked: string;
  actionsCount: string;
  highlightedTextHint: string;
  noSuspiciousQuotes: string;
  noUrlsDetected: string;
  updateContextLabel: string;
  reanalyzeBtn: string;
  chatbotTitle: string;
  chatbotWelcome: string;
  chatInputPlaceholder: string;
  sendBtn: string;
  voiceTitle: string;
  voiceTapHint: string;
  voiceWelcome: string;
  tapToSpeak: string;
  liveStream: string;
  voiceInputPlaceholder: string;
  voiceQuickPrompts: string[];
  samples: Record<string, TranslatedSample>;
  actions: Record<UserActionType, TranslatedActionOption>;
}

export const DEFAULT_STRINGS: UIStrings = {
  tagline: 'Verify suspicious messages before you act',
  scanMessage: 'Scan Message',
  aiChat: 'AI Chat',
  voiceLive: 'Voice',
  gemmaDocs: 'Gemma Hub',
  signIn: 'Sign In',
  signOut: 'Sign Out',
  savedHistory: 'History',
  messageText: 'Message Text',
  screenshotOcr: 'Screenshot OCR',
  modelLabel: 'Model:',
  testSpecimens: 'Sample Scenarios',
  tapToLoad: 'Tap to load specimen',
  messageSpecimenLabel: 'Message Specimen',
  delimiterHint: 'Evaluated inside isolated untrusted delimiters',
  whatHaveYouDone: 'What have you done so far?',
  tailorsChecklist: 'Tailors action checklist',
  analyzeCta: 'Analyze Message with Gemma',
  analyzingCta: 'Analyzing with Gemma...',
  pastePlaceholder: 'Paste suspicious SMS, email, WhatsApp, or direct message in any language...',
  pasteBtn: 'Paste',
  clearBtn: 'Clear',
  uploadTapTitle: 'Tap to upload screenshot or drop image here',
  uploadSubtitle: 'Gemma 3 Multimodal OCR extracts text in any language and verifies red flags',
  readyForOcr: 'Ready for Gemma Vision OCR',
  pillar1Title: '01. Verbatim Evidence',
  pillar1Desc: 'Suspicious phrases are verified against your exact text. Unsubstantiated alerts are automatically downgraded.',
  pillar2Title: '02. Context-Aware Steps',
  pillar2Desc: 'Action steps adapt to whether you only received the message, clicked a link, shared an OTP, or sent funds.',
  pillar3Title: '03. Built with Google Gemma',
  pillar3Desc: 'Powered by Gemma 3 on the Gemini API with 50+ language support and display-only URL inspection.',
  verifiedEvidence: 'Evidence',
  actionChecklist: 'Checklist',
  linkInspection: 'Links',
  analyzeAnother: 'New Scan',
  shareWarning: 'Share Warning',
  copiedText: 'Copied!',
  readAloud: 'Listen',
  stopReading: 'Stop',
  highRiskLabel: 'High Risk Detected',
  mediumRiskLabel: 'Medium Risk Warning',
  lowRiskLabel: 'Low Risk · No Strong Warning Signs',
  uncertainRiskLabel: 'Uncertain · Inconclusive',
  quotesVerified: 'quotes verified',
  linksChecked: 'links checked',
  actionsCount: 'actions',
  highlightedTextHint: 'Highlighted text = exact verbatim quote from message',
  noSuspiciousQuotes: 'No verbatim suspicious phrases were extracted from this message.',
  noUrlsDetected: 'No external URLs were detected in the message.',
  updateContextLabel: 'Did you do something else with this message?',
  reanalyzeBtn: 'Re-analyze checklist',
  chatbotTitle: 'Gemma Fraud Defense Advisor',
  chatbotWelcome: 'Hello! I am your ScamLens AI Advisor powered by Google Gemma. Ask me anything about suspicious texts, emails, phone calls, or how to protect your accounts.',
  chatInputPlaceholder: 'Ask Gemma: "Is this message safe?" or "What if I clicked a link?"...',
  sendBtn: 'Send',
  voiceTitle: 'ScamLens Voice Advisor',
  voiceTapHint: 'Tap the microphone or pick a scenario below to hear spoken advice',
  voiceWelcome: 'Hi! I am ScamLens Voice. Tap the microphone to speak, or tap a quick question below to hear immediate fraud protection guidance.',
  tapToSpeak: 'Tap to Speak',
  liveStream: 'Live Stream',
  voiceInputPlaceholder: 'Or type your question here for spoken voice reply...',
  voiceQuickPrompts: [
    'Someone asked for my 6-digit OTP code',
    'I clicked a suspicious package delivery link',
    'A caller says my bank account is frozen',
    'How do I check if a remote job offer is a scam?',
  ],
  samples: {
    'job-offer-fee': {
      title: 'Fake job offer (fee)',
      badge: 'Job Scam',
    },
    'phishing-account-blocked': {
      title: 'Phishing account blocked',
      badge: 'Phishing',
    },
    'fake-delivery-notice': {
      title: 'Fake delivery notice',
      badge: 'Delivery Scam',
    },
    'legitimate-appointment': {
      title: 'Legitimate appointment',
      badge: 'Benign (Low Risk)',
    },
    'otp-request': {
      title: 'Bank OTP request',
      badge: 'OTP Theft',
    },
    'geek-squad-invoice': {
      title: 'Fake invoice / Refund',
      badge: 'Refund Fraud',
    },
    'tech-support-popup': {
      title: 'Tech support virus popup',
      badge: 'Malware Scam',
    },
    'prompt-injection-test': {
      title: 'Prompt injection test',
      badge: 'Injection Test',
    },
  },
  actions: {
    RECEIVED_ONLY: {
      label: 'Only received',
      shortDesc: 'No clicks or replies',
    },
    CLICKED_LINK: {
      label: 'Clicked a link',
      shortDesc: 'Opened URL or file',
    },
    REPLIED: {
      label: 'Replied to sender',
      shortDesc: 'Texted or called back',
    },
    SHARED_PERSONAL_INFO: {
      label: 'Shared personal info',
      shortDesc: 'Name, ID, address',
    },
    SHARED_CREDENTIALS_OR_OTP: {
      label: 'Shared password / OTP',
      shortDesc: 'Login or 6-digit code',
    },
    SENT_MONEY: {
      label: 'Sent money / cards',
      shortDesc: 'Bank, Zelle, crypto, gift card',
    },
    NOT_SURE: {
      label: 'Not sure / unsure',
      shortDesc: 'Uncertain of interaction',
    },
  },
};

const TRANSLATIONS: Record<string, Partial<UIStrings>> = {
  bn: {
    tagline: 'কোনো পদক্ষেপ নেওয়ার আগে সন্দেহজনক বার্তা যাচাই করুন',
    scanMessage: 'বার্তা যাচাই',
    aiChat: 'এআই চ্যাট',
    voiceLive: 'ভয়েস',
    gemmaDocs: 'Gemma হাব',
    signIn: 'সাইন ইন',
    signOut: 'সাইন আউট',
    savedHistory: 'ইতিহাস',
    messageText: 'বার্তা টেক্সট',
    screenshotOcr: 'স্ক্রিনশট OCR',
    modelLabel: 'মডেল:',
    testSpecimens: 'নমুনা বার্তা (পরীক্ষা করুন)',
    tapToLoad: 'লোড করতে ট্যাপ করুন',
    messageSpecimenLabel: 'বার্তার বিষয়বস্তু',
    delimiterHint: 'নিরাপদ ও বিচ্ছিন্ন পরিবেশে বার্তাটি যাচাই করা হয়',
    whatHaveYouDone: 'আপনি এখন পর্যন্ত কী করেছেন?',
    tailorsChecklist: 'করণীয় তালিকা কাস্টমাইজ করে',
    analyzeCta: 'Gemma দিয়ে বার্তা যাচাই করুন',
    analyzingCta: 'Gemma দিয়ে যাচাই করা হচ্ছে...',
    pastePlaceholder: 'সন্দেহজনক এসএমএস, ইমেইল বা হোয়াটসঅ্যাপ বার্তা এখানে পেস্ট করুন...',
    pasteBtn: 'পেস্ট',
    clearBtn: 'মুছুন',
    uploadTapTitle: 'স্ক্রিনশট আপলোড করতে ট্যাপ করুন বা এখানে ড্রপ করুন',
    uploadSubtitle: 'Gemma 3 মাল্টিমোডাল OCR যেকোনো ভাষার লেখা পড়ে এবং ঝুঁকি যাচাই করে',
    readyForOcr: 'Gemma ভিশন OCR-এর জন্য প্রস্তুত',
    pillar1Title: '০১. যাচাইকৃত প্রমাণ',
    pillar1Desc: 'সন্দেহজনক বাক্যাংশগুলো আপনার মূল বার্তার সাথে মিলিয়ে দেখা হয়। প্রমাণ ছাড়া কোনো ভুল সতর্কতা দেওয়া হয় না।',
    pillar2Title: '০২. পরিস্থিতি অনুযায়ী করণীয় তালিকা',
    pillar2Desc: 'আপনি শুধু বার্তা পেয়েছেন, লিংকে ক্লিক করেছেন, নাকি টাকা পাঠিয়েছেন—তার ওপর ভিত্তি করে পরবর্তী পদক্ষেপ জানানো হয়।',
    pillar3Title: '০৩. Google Gemma দিয়ে তৈরি',
    pillar3Desc: 'Gemini API-তে Gemma 3 মডেল, ৫০+ ভাষা এবং নিরাপদ লিংক যাচাই প্রযুক্তি দ্বারা চালিত।',
    verifiedEvidence: 'প্রমাণ',
    actionChecklist: 'করণীয় তালিকা',
    linkInspection: 'লিংক যাচাই',
    analyzeAnother: 'নতুন যাচাই',
    shareWarning: 'সতর্কতা কপি করুন',
    copiedText: 'কপি হয়েছে!',
    readAloud: 'শুনুন',
    stopReading: 'থামান',
    highRiskLabel: 'উচ্চ ঝুঁকি শনাক্ত হয়েছে',
    mediumRiskLabel: 'মাঝারি ঝুঁকির সতর্কতা',
    lowRiskLabel: 'কম ঝুঁকি · বড় কোনো বিপদের লক্ষণ নেই',
    uncertainRiskLabel: 'অনিশ্চিত · পর্যাপ্ত তথ্য নেই',
    quotesVerified: 'টি প্রমাণ যাচাইকৃত',
    linksChecked: 'টি লিংক পরীক্ষিত',
    actionsCount: 'টি করণীয় পদক্ষেপ',
    highlightedTextHint: 'হাইলাইট করা অংশ = বার্তার হুবহু সন্দেহজনক বাক্যাংশ',
    noSuspiciousQuotes: 'এই বার্তা থেকে কোনো সন্দেহজনক বাক্যাংশ পাওয়া যায়নি।',
    noUrlsDetected: 'এই বার্তায় কোনো বাহ্যিক লিংক বা URL পাওয়া যায়নি।',
    updateContextLabel: 'আপনি কি এই বার্তার সাথে অন্য কিছু করেছিলেন?',
    reanalyzeBtn: 'পুনরায় যাচাই করুন',
    chatbotTitle: 'Gemma প্রতারণা প্রতিরোধ উপদেষ্টা',
    chatbotWelcome: 'নমস্কার! আমি Google Gemma দ্বারা চালিত আপনার ScamLens AI উপদেষ্টা। সন্দেহজনক মেসেজ, ইমেইল, ফোন কল বা অ্যাকাউন্টের নিরাপত্তা নিয়ে যেকোনো প্রশ্ন করুন।',
    chatInputPlaceholder: 'প্রশ্ন করুন: "এই বার্তাটি কি নিরাপদ?" বা "লিংকে ক্লিক করলে কী করব?"...',
    sendBtn: 'পাঠান',
    voiceTitle: 'ScamLens ভয়েস উপদেষ্টা',
    voiceTapHint: 'কথা বলতে মাইক্রোফোনে ট্যাপ করুন অথবা নিচের যেকোনো প্রশ্ন নির্বাচন করুন',
    voiceWelcome: 'নমস্কার! আমি ScamLens ভয়েস উপদেষ্টা। কথা বলতে মাইক্রোফোনে ট্যাপ করুন অথবা নিচের একটি প্রশ্নে ট্যাপ করে পরামর্শ শুনুন।',
    tapToSpeak: 'ট্যাপ করে বলুন',
    liveStream: 'লাইভ স্ট্রিম',
    voiceInputPlaceholder: 'অথবা মুখে উত্তর শোনার জন্য এখানে আপনার প্রশ্ন লিখুন...',
    voiceQuickPrompts: [
      'কেউ আমার ৬-সংখ্যার OTP কোড চাইছে',
      'আমি একটি সন্দেহজনক ডেলিভারি লিংকে ক্লিক করেছি',
      'ফোনে বলছে আমার ব্যাংক অ্যাকাউন্ট ব্লক হয়ে গেছে',
      'চাকরির অফারটি আসল নাকি প্রতারণা কীভাবে বুঝব?',
    ],
    samples: {
      'job-offer-fee': {
        title: 'ভুয়া চাকরির অফার (ফি দাবি)',
        badge: 'চাকরির প্রতারণা',
      },
      'phishing-account-blocked': {
        title: 'অ্যাকাউন্ট ব্লক ফিশিং বার্তা',
        badge: 'ফিশিং',
      },
      'fake-delivery-notice': {
        title: 'ভুয়া পার্সেল ডেলিভারি নোটিশ',
        badge: 'ডেলিভারি স্ক্যাম',
      },
      'legitimate-appointment': {
        title: 'বৈধ অ্যাপয়েন্টমেন্ট রিমাইন্ডার',
        badge: 'নিরাপদ (কম ঝুঁকি)',
      },
      'otp-request': {
        title: 'ব্যাংক OTP চুরির বার্তা',
        badge: 'OTP চুরি',
      },
      'geek-squad-invoice': {
        title: 'ভুয়া ইনভয়েস / রিফান্ড বিল',
        badge: 'রিফান্ড প্রতারণা',
      },
      'tech-support-popup': {
        title: 'টেক সাপোর্ট ভাইরাস পপআপ',
        badge: 'ম্যালওয়্যার স্ক্যাম',
      },
      'prompt-injection-test': {
        title: 'প্রম্পট ইনজেকশন পরীক্ষা',
        badge: 'ইনজেকশন টেস্ট',
      },
    },
    actions: {
      RECEIVED_ONLY: {
        label: 'শুধু বার্তাটি পেয়েছি',
        shortDesc: 'কোনো ক্লিক বা উত্তর দেইনি',
      },
      CLICKED_LINK: {
        label: 'লিংকে ক্লিক করেছি',
        shortDesc: 'ওয়েবসাইট বা ফাইল খুলেছি',
      },
      REPLIED: {
        label: 'উত্তর দিয়েছি',
        shortDesc: 'মেসেজ বা কল করেছি',
      },
      SHARED_PERSONAL_INFO: {
        label: 'ব্যক্তিগত তথ্য দিয়েছি',
        shortDesc: 'নাম, ঠিকানা বা আইডি',
      },
      SHARED_CREDENTIALS_OR_OTP: {
        label: 'পাসওয়ার্ড বা OTP দিয়েছি',
        shortDesc: 'লগইন বা গোপন কোড শেয়ার করেছি',
      },
      SENT_MONEY: {
        label: 'টাকা বা গিফট কার্ড পাঠিয়েছি',
        shortDesc: 'ব্যাংক, বিকাশ, ক্রিপ্টো বা কার্ড',
      },
      NOT_SURE: {
        label: 'নিশ্চিত নই',
        shortDesc: 'কী হয়েছে তা স্পষ্ট নয়',
      },
    },
  },
  hi: {
    tagline: 'कोई भी कदम उठाने से पहले संदिग्ध संदेशों की जांच करें',
    scanMessage: 'संदेश जांचें',
    aiChat: 'AI चैट',
    voiceLive: 'वॉइस',
    gemmaDocs: 'Gemma हब',
    signIn: 'साइन इन',
    signOut: 'साइन आउट',
    savedHistory: 'इतिहास',
    messageText: 'संदेश टेक्स्ट',
    screenshotOcr: 'स्क्रीनशॉट OCR',
    modelLabel: 'मॉडल:',
    testSpecimens: 'उदाहरण संदेश (परीक्षण करें)',
    tapToLoad: 'लोड करने के लिए टैप करें',
    messageSpecimenLabel: 'संदेश की सामग्री',
    delimiterHint: 'सुरक्षित और पृथक वातावरण में संदेश का मूल्यांकन किया जाता है',
    whatHaveYouDone: 'आपने अब तक क्या किया है?',
    tailorsChecklist: 'सुरक्षा कदमों को अनुकूलित करता है',
    analyzeCta: 'Gemma से संदेश की जांच करें',
    analyzingCta: 'Gemma से जांच हो रही है...',
    pastePlaceholder: 'संदिग्ध एसएमएस, ईमेल या व्हाट्सएप संदेश यहाँ पेस्ट करें...',
    pasteBtn: 'पेस्ट',
    clearBtn: 'साफ़ करें',
    uploadTapTitle: 'स्क्रीनशॉट अपलोड करने के लिए टैप करें या यहाँ छोड़ें',
    uploadSubtitle: 'Gemma 3 मल्टीमॉडल OCR किसी भी भाषा के टेक्स्ट को पढ़ता और जांचता है',
    readyForOcr: 'Gemma विज़न OCR के लिए तैयार',
    pillar1Title: '01. प्रमाणित साक्ष्य',
    pillar1Desc: 'संदिग्ध वाक्यों को आपके मूल संदेश से मिलाया जाता है। बिना प्रमाण के कोई गलत चेतावनी नहीं दी जाती।',
    pillar2Title: '02. स्थिति के अनुसार सुरक्षा कदम',
    pillar2Desc: 'आपने केवल संदेश प्राप्त किया, लिंक पर क्लिक किया, या पैसे भेजे—इसके आधार पर सटीक सलाह।',
    pillar3Title: '03. Google Gemma द्वारा संचालित',
    pillar3Desc: 'Gemini API पर Gemma 3 मॉडल, 50+ भाषाओं और सुरक्षित लिंक जांच तकनीक से निर्मित।',
    verifiedEvidence: 'साक्ष्य',
    actionChecklist: 'सुरक्षा कदम',
    linkInspection: 'लिंक जांच',
    analyzeAnother: 'नई जांच',
    shareWarning: 'चेतावनी कॉपी करें',
    copiedText: 'कॉपी हो गया!',
    readAloud: 'सुनें',
    stopReading: 'रोकें',
    highRiskLabel: 'उच्च जोखिम की पहचान हुई',
    mediumRiskLabel: 'मध्यम जोखिम चेतावनी',
    lowRiskLabel: 'कम जोखिम · कोई बड़ा खतरा नहीं',
    uncertainRiskLabel: 'अनिश्चित · अपर्याप्त जानकारी',
    quotesVerified: 'प्रमाण सत्यापित',
    linksChecked: 'लिंक जांचे गए',
    actionsCount: 'सुझाव',
    highlightedTextHint: 'हाइलाइट किया गया टेक्स्ट = संदेश से सटीक संदिग्ध वाक्यांश',
    noSuspiciousQuotes: 'इस संदेश में कोई संदिग्ध वाक्यांश नहीं मिला।',
    noUrlsDetected: 'इस संदेश में कोई बाहरी लिंक नहीं मिला।',
    updateContextLabel: 'क्या आपने इस संदेश के साथ कुछ और किया है?',
    reanalyzeBtn: 'फिर से जांचें',
    chatbotTitle: 'Gemma धोखाधड़ी सुरक्षा सलाहकार',
    chatbotWelcome: 'नमस्ते! मैं Google Gemma द्वारा संचालित आपका ScamLens AI सलाहकार हूँ। संदिग्ध संदेशों, कॉल या खाता सुरक्षा के बारे में कुछ भी पूछें।',
    chatInputPlaceholder: 'पूछें: "क्या यह संदेश सुरक्षित है?" या "मैंने लिंक पर क्लिक कर दिया तो क्या करूँ?"...',
    sendBtn: 'भेजें',
    voiceTitle: 'ScamLens वॉइस सलाहकार',
    voiceTapHint: 'बोलने के लिए माइक पर टैप करें या नीचे दिए गए किसी प्रश्न को चुनें',
    voiceWelcome: 'नमस्ते! मैं ScamLens वॉइस सलाहकार हूँ। बोलने के लिए माइक दबाएं या तुरंत सलाह सुनने के लिए नीचे दिए गए विकल्प को चुनें।',
    tapToSpeak: 'बोलने के लिए टैप करें',
    liveStream: 'लाइव स्ट्रीम',
    voiceInputPlaceholder: 'या बोलकर उत्तर सुनने के लिए अपना प्रश्न यहाँ लिखें...',
    voiceQuickPrompts: [
      'कोई मेरा 6-अंकों का OTP कोड मांग रहा है',
      'मैंने एक संदिग्ध डिलीवरी लिंक पर क्लिक कर दिया',
      'कॉल करने वाला कह रहा है कि मेरा बैंक खाता बंद हो गया है',
      'मैं कैसे जांचूं कि नौकरी का प्रस्ताव असली है या धोखाधड़ी?',
    ],
    samples: {
      'job-offer-fee': {
        title: 'नकली नौकरी प्रस्ताव (फीस की मांग)',
        badge: 'जॉब स्कैम',
      },
      'phishing-account-blocked': {
        title: 'खाता बंद होने का फ़िशिंग संदेश',
        badge: 'फ़िशिंग',
      },
      'fake-delivery-notice': {
        title: 'नकली पार्सल डिलीवरी सूचना',
        badge: 'डिलीवरी स्कैम',
      },
      'legitimate-appointment': {
        title: 'वैध अपॉइंटमेंट रिमाइंडर',
        badge: 'सुरक्षित (कम जोखिम)',
      },
      'otp-request': {
        title: 'बैंक OTP चोरी का प्रयास',
        badge: 'OTP चोरी',
      },
      'geek-squad-invoice': {
        title: 'नकली बिल / रिफंड धोखाधड़ी',
        badge: 'रिफंड स्कैम',
      },
      'tech-support-popup': {
        title: 'टेक सपोर्ट वायरस पॉपअप',
        badge: 'मैलवेयर स्कैम',
      },
      'prompt-injection-test': {
        title: 'प्रॉम्प्ट इंजेक्शन परीक्षण',
        badge: 'इंजेक्शन टेस्ट',
      },
    },
    actions: {
      RECEIVED_ONLY: {
        label: 'केवल प्राप्त हुआ',
        shortDesc: 'कोई क्लिक या जवाब नहीं दिया',
      },
      CLICKED_LINK: {
        label: 'लिंक पर क्लिक किया',
        shortDesc: 'URL या फ़ाइल खोली',
      },
      REPLIED: {
        label: 'जवाब दिया',
        shortDesc: 'मैसेज या कॉल किया',
      },
      SHARED_PERSONAL_INFO: {
        label: 'निजी जानकारी साझा की',
        shortDesc: 'नाम, पता, पहचान पत्र',
      },
      SHARED_CREDENTIALS_OR_OTP: {
        label: 'पासवर्ड या OTP साझा किया',
        shortDesc: 'लॉगिन या 6-अंकों का कोड दिया',
      },
      SENT_MONEY: {
        label: 'पैसे या गिफ्ट कार्ड भेजे',
        shortDesc: 'बैंक, UPI, क्रिप्टो या कार्ड',
      },
      NOT_SURE: {
        label: 'निश्चित नहीं / अनिश्चित',
        shortDesc: 'पता नहीं क्या साझा हुआ',
      },
    },
  },
  es: {
    tagline: 'Verifica mensajes sospechosos antes de actuar',
    scanMessage: 'Escanear',
    aiChat: 'Chat IA',
    voiceLive: 'Voz',
    gemmaDocs: 'Gemma Hub',
    signIn: 'Iniciar sesión',
    signOut: 'Salir',
    savedHistory: 'Historial',
    messageText: 'Texto del mensaje',
    screenshotOcr: 'Captura OCR',
    modelLabel: 'Modelo:',
    testSpecimens: 'Ejemplos de prueba',
    tapToLoad: 'Toca para cargar ejemplo',
    messageSpecimenLabel: 'Contenido del mensaje',
    delimiterHint: 'Evaluado dentro de delimitadores aislados',
    whatHaveYouDone: '¿Qué has hecho hasta ahora?',
    tailorsChecklist: 'Adapta los pasos recomendados',
    analyzeCta: 'Analizar mensaje con Gemma',
    analyzingCta: 'Analizando con Gemma...',
    pastePlaceholder: 'Pega aquí el SMS, correo o mensaje de WhatsApp sospechoso...',
    pasteBtn: 'Pegar',
    clearBtn: 'Borrar',
    uploadTapTitle: 'Toca para subir una captura de pantalla o arrástrala aquí',
    uploadSubtitle: 'Gemma 3 Multimodal OCR extrae texto en cualquier idioma y verifica señales de fraude',
    readyForOcr: 'Listo para Gemma Vision OCR',
    pillar1Title: '01. Evidencia Verificada',
    pillar1Desc: 'Las frases sospechosas se verifican literalmente contra tu texto original.',
    pillar2Title: '02. Lista de Acciones a Medida',
    pillar2Desc: 'Los pasos se adaptan según si solo recibiste el mensaje, hiciste clic o enviaste dinero.',
    pillar3Title: '03. Creado con Google Gemma',
    pillar3Desc: 'Impulsado por Gemma 3 en Gemini API con soporte para más de 50 idiomas.',
    verifiedEvidence: 'Evidencia',
    actionChecklist: 'Pasos a seguir',
    linkInspection: 'Enlaces',
    analyzeAnother: 'Nuevo escaneo',
    shareWarning: 'Compartir alerta',
    copiedText: '¡Copiado!',
    readAloud: 'Escuchar',
    stopReading: 'Detener',
    highRiskLabel: 'Alto Riesgo Detectado',
    mediumRiskLabel: 'Advertencia de Riesgo Medio',
    lowRiskLabel: 'Riesgo Bajo · Sin Señales Graves',
    uncertainRiskLabel: 'Incierto · No Concluyente',
    quotesVerified: 'citas verificadas',
    linksChecked: 'enlaces revisados',
    actionsCount: 'acciones',
    highlightedTextHint: 'Texto resaltado = cita exacta del mensaje',
    noSuspiciousQuotes: 'No se extrajeron frases sospechosas literales de este mensaje.',
    noUrlsDetected: 'No se detectaron enlaces externos en este mensaje.',
    updateContextLabel: '¿Hiciste algo más con este mensaje?',
    reanalyzeBtn: 'Reanalizar pasos',
    chatbotTitle: 'Asesor Antifraude Gemma',
    chatbotWelcome: '¡Hola! Soy tu asesor ScamLens impulsado por Google Gemma. Pregúntame sobre mensajes sospechosos, llamadas o seguridad de cuentas.',
    chatInputPlaceholder: 'Pregunta a Gemma: "¿Es seguro este mensaje?" o "¿Qué hago si hice clic?"...',
    sendBtn: 'Enviar',
    voiceTitle: 'Asesor de Voz ScamLens',
    voiceTapHint: 'Toca el micrófono o elige una situación abajo para escuchar ayuda hablada',
    voiceWelcome: '¡Hola! Soy ScamLens Voz. Toca el micrófono para hablar o selecciona una pregunta rápida abajo.',
    voiceInputPlaceholder: 'O escribe tu pregunta aquí para escuchar la respuesta...',
    voiceQuickPrompts: [
      'Alguien me pidió mi código OTP de 6 dígitos',
      'Hice clic en un enlace falso de entrega de paquete',
      'Una llamada dice que mi cuenta bancaria está bloqueada',
      '¿Cómo saber si una oferta de trabajo remoto es estafa?',
    ],
    samples: {
      'job-offer-fee': { title: 'Oferta de empleo falsa (tarifa)', badge: 'Estafa laboral' },
      'phishing-account-blocked': { title: 'Cuenta bloqueada (Phishing)', badge: 'Phishing' },
      'fake-delivery-notice': { title: 'Aviso de entrega falso', badge: 'Estafa de envío' },
      'legitimate-appointment': { title: 'Recordatorio de cita médica', badge: 'Seguro (Riesgo bajo)' },
      'otp-request': { title: 'Solicitud de código OTP bancario', badge: 'Robo de OTP' },
      'geek-squad-invoice': { title: 'Factura falsa / Reembolso', badge: 'Fraude de reembolso' },
      'tech-support-popup': { title: 'Alerta falsa de virus / Soporte', badge: 'Malware / Estafa' },
      'prompt-injection-test': { title: 'Prueba de inyección de prompt', badge: 'Prueba adversarial' },
    },
    actions: {
      RECEIVED_ONLY: { label: 'Solo lo recibí', shortDesc: 'Sin clics ni respuestas' },
      CLICKED_LINK: { label: 'Hice clic en un enlace', shortDesc: 'Abrí URL o archivo' },
      REPLIED: { label: 'Respondí al remitente', shortDesc: 'Envié texto o llamé' },
      SHARED_PERSONAL_INFO: { label: 'Compartí datos personales', shortDesc: 'Nombre, dirección, ID' },
      SHARED_CREDENTIALS_OR_OTP: { label: 'Compartí clave u OTP', shortDesc: 'Contraseña o código' },
      SENT_MONEY: { label: 'Envié dinero o tarjetas', shortDesc: 'Transferencia, cripto, regalo' },
      NOT_SURE: { label: 'No estoy seguro', shortDesc: 'Interacción incierta' },
    },
  },
  fr: {
    tagline: 'Vérifiez les messages suspects avant d’agir',
    scanMessage: 'Analyser',
    aiChat: 'Chat IA',
    voiceLive: 'Voix',
    gemmaDocs: 'Gemma Hub',
    signIn: 'Connexion',
    signOut: 'Déconnexion',
    savedHistory: 'Historique',
    messageText: 'Texte du message',
    screenshotOcr: 'Capture OCR',
    modelLabel: 'Modèle :',
    testSpecimens: 'Exemples types',
    tapToLoad: 'Appuyez pour charger un exemple',
    messageSpecimenLabel: 'Contenu du message',
    delimiterHint: 'Évalué dans un conteneur isolé sécurisé',
    whatHaveYouDone: 'Qu’avez-vous fait jusqu’ici ?',
    tailorsChecklist: 'Personnalise la liste d’actions',
    analyzeCta: 'Analyser avec Gemma',
    analyzingCta: 'Analyse avec Gemma...',
    pastePlaceholder: 'Collez ici le SMS, e-mail ou message WhatsApp suspect...',
    pasteBtn: 'Coller',
    clearBtn: 'Effacer',
    uploadTapTitle: 'Appuyez pour importer une capture d’écran',
    uploadSubtitle: 'Gemma 3 Multimodal OCR extrait le texte dans toutes les langues',
    readyForOcr: 'Prêt pour Gemma Vision OCR',
    pillar1Title: '01. Preuves Vérifiées',
    pillar1Desc: 'Les phrases suspectes sont vérifiées mot à mot dans votre message.',
    pillar2Title: '02. Actions Personnalisées',
    pillar2Desc: 'Les étapes s’adaptent selon que vous avez cliqué, répondu ou envoyé de l’argent.',
    pillar3Title: '03. Propulsé par Google Gemma',
    pillar3Desc: 'Exécuté via Gemma 3 sur Gemini API avec prise en charge de plus de 50 langues.',
    verifiedEvidence: 'Preuves',
    actionChecklist: 'Actions',
    linkInspection: 'Liens',
    analyzeAnother: 'Nouveau scan',
    shareWarning: 'Partager l’alerte',
    copiedText: 'Copié !',
    readAloud: 'Écouter',
    stopReading: 'Arrêter',
    samples: {
      'job-offer-fee': { title: 'Fausse offre d’emploi (frais)', badge: 'Arnaque emploi' },
      'phishing-account-blocked': { title: 'Compte bloqué (Hameçonnage)', badge: 'Phishing' },
      'fake-delivery-notice': { title: 'Faux avis de livraison', badge: 'Arnaque colis' },
      'legitimate-appointment': { title: 'Rappel de rendez-vous réel', badge: 'Sûr (Risque faible)' },
      'otp-request': { title: 'Demande de code OTP bancaire', badge: 'Vol d’OTP' },
      'geek-squad-invoice': { title: 'Fausse facture / Remboursement', badge: 'Fraude facture' },
      'tech-support-popup': { title: 'Alerte virus support technique', badge: 'Arnaque support' },
      'prompt-injection-test': { title: 'Test d’injection de prompt', badge: 'Test sécurité' },
    },
    actions: {
      RECEIVED_ONLY: { label: 'Seulement reçu', shortDesc: 'Aucun clic ni réponse' },
      CLICKED_LINK: { label: 'Cliqué sur un lien', shortDesc: 'URL ou fichier ouvert' },
      REPLIED: { label: 'Répondu à l’expéditeur', shortDesc: 'SMS ou appel' },
      SHARED_PERSONAL_INFO: { label: 'Infos personnelles partagées', shortDesc: 'Nom, adresse, ID' },
      SHARED_CREDENTIALS_OR_OTP: { label: 'Mot de passe / OTP partagé', shortDesc: 'Identifiants ou code' },
      SENT_MONEY: { label: 'Argent ou cartes envoyé', shortDesc: 'Virement, crypto, carte' },
      NOT_SURE: { label: 'Pas sûr / incertain', shortDesc: 'Action incertaine' },
    },
  },
  ar: {
    tagline: 'تحقق من الرسائل المشبوهة قبل اتخاذ أي إجراء',
    scanMessage: 'فحص الرسالة',
    aiChat: 'المساعد الذكي',
    voiceLive: 'المساعد الصوتي',
    gemmaDocs: 'مركز Gemma',
    signIn: 'تسجيل الدخول',
    signOut: 'خروج',
    savedHistory: 'السجل',
    messageText: 'نص الرسالة',
    screenshotOcr: 'لقطة شاشة',
    modelLabel: 'النموذج:',
    testSpecimens: 'نماذج اختبارية',
    tapToLoad: 'اضغط لتحميل النموذج',
    messageSpecimenLabel: 'محتوى الرسالة',
    delimiterHint: 'يتم الفحص في بيئة معزولة وآمنة',
    whatHaveYouDone: 'ماذا فعلت حتى الآن؟',
    tailorsChecklist: 'يخصص خطوات الحماية لك',
    analyzeCta: 'تحليل الرسالة بواسطة Gemma',
    analyzingCta: 'جاري التحليل بواسطة Gemma...',
    pastePlaceholder: 'الصق الرسالة النصية أو البريد الإلكتروني أو رسالة واتساب المشبوهة هنا...',
    pasteBtn: 'لصق',
    clearBtn: 'مسح',
    pillar1Title: '01. أدلة موثقة حرفياً',
    pillar1Desc: 'يتم مطابقة العبارات المشبوهة حرفياً مع نص رسالتك الأصلي.',
    pillar2Title: '02. خطوات حماية مخصصة',
    pillar2Desc: 'تتكيف النصائح حسب ما إذا كنت قد استلمت الرسالة فقط أو ضغطت على رابط أو أرسلت أموالاً.',
    pillar3Title: '03. مبني بواسطة Google Gemma',
    pillar3Desc: 'مدعوم بنماذج Gemma 3 عبر واجهة Gemini API بأكثر من 50 لغة.',
    verifiedEvidence: 'الأدلة',
    actionChecklist: 'خطوات الحماية',
    linkInspection: 'فحص الروابط',
    analyzeAnother: 'فحص جديد',
    shareWarning: 'مشاركة التحذير',
    copiedText: 'تم النسخ!',
    readAloud: 'استماع',
    stopReading: 'إيقاف',
    samples: {
      'job-offer-fee': { title: 'عرض عمل وهمي (يطلب رسوماً)', badge: 'احتيال توظيف' },
      'phishing-account-blocked': { title: 'حظر الحساب (تصيد احتيالي)', badge: 'تصيد' },
      'fake-delivery-notice': { title: 'إشعار تسليم طرد مزيف', badge: 'احتيال توصيل' },
      'legitimate-appointment': { title: 'تذكير بموعد طبي حقيقي', badge: 'آمن (خطر منخفض)' },
      'otp-request': { title: 'طلب رمز التحقق OTP البنكي', badge: 'سرقة الرموز' },
      'geek-squad-invoice': { title: 'فاتورة مزيفة / استرداد أموال', badge: 'احتيال الفواتير' },
      'tech-support-popup': { title: 'تحذير فيروس مزيف للدعم الفني', badge: 'احتيال دعم فني' },
      'prompt-injection-test': { title: 'اختبار اختراق التعليمات', badge: 'اختبار أمان' },
    },
    actions: {
      RECEIVED_ONLY: { label: 'استلمت الرسالة فقط', shortDesc: 'لم أضغط أو أرد' },
      CLICKED_LINK: { label: 'ضغطت على رابط', shortDesc: 'فتحت الرابط أو الملف' },
      REPLIED: { label: 'رددت على المرسل', shortDesc: 'أرسلت رسالة أو اتصلت' },
      SHARED_PERSONAL_INFO: { label: 'شاركت بيانات شخصية', shortDesc: 'الاسم، العنوان، الهوية' },
      SHARED_CREDENTIALS_OR_OTP: { label: 'شاركت كلمة المرور أو OTP', shortDesc: 'رمز التحقق السري' },
      SENT_MONEY: { label: 'أرسلت أموالاً أو بطاقات', shortDesc: 'تحويل بنكي أو بطاقات هدايا' },
      NOT_SURE: { label: 'غير متأكد', shortDesc: 'لست متأكداً مما حدث' },
    },
  },
};

export function getUIStrings(langCode: string, dynamicOverride?: Partial<UIStrings>): UIStrings {
  const baseCode = langCode.split('-')[0];
  const exact = TRANSLATIONS[langCode];
  const base = TRANSLATIONS[baseCode];

  return {
    ...DEFAULT_STRINGS,
    ...(base || {}),
    ...(exact || {}),
    ...(dynamicOverride || {}),
    samples: {
      ...DEFAULT_STRINGS.samples,
      ...(base?.samples || {}),
      ...(exact?.samples || {}),
      ...(dynamicOverride?.samples || {}),
    },
    actions: {
      ...DEFAULT_STRINGS.actions,
      ...(base?.actions || {}),
      ...(exact?.actions || {}),
      ...(dynamicOverride?.actions || {}),
    },
  };
}

export function hasStaticTranslation(langCode: string): boolean {
  const baseCode = langCode.split('-')[0];
  return langCode === 'en' || baseCode === 'en' || Boolean(TRANSLATIONS[langCode] || TRANSLATIONS[baseCode]);
}

export function getLanguageByCode(code: string): LanguageOption {
  const found = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  if (found) return found;
  return {
    code,
    name: code,
    nativeName: code,
    dir: 'ltr',
  };
}
