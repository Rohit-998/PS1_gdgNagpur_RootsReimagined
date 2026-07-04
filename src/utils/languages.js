// Mapping of Sarvam AI supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'hi-IN', name: 'Hindi (हिंदी)',       states: ['Delhi', 'Uttar Pradesh', 'Madhya Pradesh', 'Bihar', 'Rajasthan', 'Haryana'] },
  { code: 'bn-IN', name: 'Bengali (বাংলা)',      states: ['West Bengal', 'Tripura'] },
  { code: 'ta-IN', name: 'Tamil (தமிழ்)',         states: ['Tamil Nadu'] },
  { code: 'te-IN', name: 'Telugu (తెలుగు)',       states: ['Andhra Pradesh', 'Telangana'] },
  { code: 'mr-IN', name: 'Marathi (मराठी)',      states: ['Maharashtra'] },
  { code: 'gu-IN', name: 'Gujarati (ગુજરાતી)',   states: ['Gujarat'] },
  { code: 'kn-IN', name: 'Kannada (ಕನ್ನಡ)',      states: ['Karnataka'] },
  { code: 'ml-IN', name: 'Malayalam (മലയാളം)',    states: ['Kerala'] },
  { code: 'pa-IN', name: 'Punjabi (ਪੰਜਾਬੀ)',     states: ['Punjab'] },
  { code: 'or-IN', name: 'Odia (ଓଡ଼ିଆ)',          states: ['Odisha'] }
];

export function getLanguageForState(stateName) {
  if (!stateName) return 'hi-IN';
  const match = SUPPORTED_LANGUAGES.find(lang =>
    lang.states.some(s => s.toLowerCase() === stateName.toLowerCase())
  );
  return match ? match.code : 'hi-IN';
}

// ── Reason templates per language ──────────────────────────────────────────
// {reason} will be replaced with the translated reason at runtime
const TEMPLATES = {
  'hi-IN': {
    safe:        (name) => `${name ? name + ' — ' : ''}यह दवा बिल्कुल सुरक्षित है। सभी सत्यापन परतें पास हो गई हैं। आप इसे सुरक्षित रूप से खरीद सकते हैं।`,
    suspicious:  (name, reason) => `चेतावनी! ${name ? name + ' — ' : ''}यह दवा संदिग्ध है। कारण: ${reason} कृपया इसे न खरीदें।`,
    counterfeit: (name, reason) => `खतरा! ${name ? name + ' — ' : ''}यह दवा नकली है। कारण: ${reason} इसे तुरंत वापस करें और दुकानदार की सूचना दें।`,
  },
  'ta-IN': {
    safe:        (name) => `${name ? name + ' — ' : ''}இந்த மருந்து முற்றிலும் பாதுகாப்பானது. அனைத்து சோதனை அடுக்குகளும் தேர்ச்சி பெற்றன. இதை வாங்கலாம்.`,
    suspicious:  (name, reason) => `எச்சரிக்கை! ${name ? name + ' — ' : ''}இந்த மருந்து சந்தேகத்திற்குரியது. காரணம்: ${reason} தயவுசெய்து இதை வாங்காதீர்கள்.`,
    counterfeit: (name, reason) => `ஆபத்து! ${name ? name + ' — ' : ''}இது போலி மருந்து. காரணம்: ${reason} உடனே திரும்பவும்.`,
  },
  'mr-IN': {
    safe:        (name) => `${name ? name + ' — ' : ''}हे औषध पूर्णपणे सुरक्षित आहे. सर्व सत्यापन स्तर उत्तीर्ण झाले. तुम्ही ते विकत घेऊ शकता.`,
    suspicious:  (name, reason) => `इशारा! ${name ? name + ' — ' : ''}हे औषध संशयास्पद आहे. कारण: ${reason} कृपया हे विकत घेऊ नका.`,
    counterfeit: (name, reason) => `धोका! ${name ? name + ' — ' : ''}हे औषध बनावट आहे. कारण: ${reason} ताबडतोब परत करा.`,
  },
  'bn-IN': {
    safe:        (name) => `${name ? name + ' — ' : ''}এই ওষুধটি সম্পূর্ণ নিরাপদ। সব যাচাইকরণ স্তর পাস হয়েছে। আপনি এটি কিনতে পারেন।`,
    suspicious:  (name, reason) => `সতর্কতা! ${name ? name + ' — ' : ''}এই ওষুধটি সন্দেহজনক। কারণ: ${reason} এটি কিনবেন না।`,
    counterfeit: (name, reason) => `বিপদ! ${name ? name + ' — ' : ''}এটি নকল ওষুধ। কারণ: ${reason} এখনই ফেরত দিন।`,
  },
  'gu-IN': {
    safe:        (name) => `${name ? name + ' — ' : ''}આ દવા સંપૂર્ણ સુરક્ષિત છે. બધા ચકાસણી સ્તરો પાસ થઈ ગયા. તમે આ ખરીદી શકો છો.`,
    suspicious:  (name, reason) => `ચેતવણી! ${name ? name + ' — ' : ''}આ દવા શંકાસ્પદ છે. કારણ: ${reason} કૃપા કરીને તેને ખરીદો નહીં.`,
    counterfeit: (name, reason) => `ખતરો! ${name ? name + ' — ' : ''}આ નકલી દવા છે. કારણ: ${reason} તાત્કાલિક પાછી આપો.`,
  },
  'te-IN': {
    safe:        (name) => `${name ? name + ' — ' : ''}ఈ మందు పూర్తిగా సురక్షితం. అన్ని ధృవీకరణ పొరలు పాస్ అయ్యాయి. మీరు దీన్ని కొనవచ్చు.`,
    suspicious:  (name, reason) => `హెచ్చరిక! ${name ? name + ' — ' : ''}ఈ మందు అనుమానాస్పదంగా ఉంది. కారణం: ${reason} దయచేసి కొనకండి.`,
    counterfeit: (name, reason) => `ప్రమాదం! ${name ? name + ' — ' : ''}ఇది నకిలీ మందు. కారణం: ${reason} వెంటనే తిరిగి ఇవ్వండి.`,
  },
  'default': {
    safe:        (name) => `${name ? name + ': ' : ''}Verified. This medicine is genuine and safe to consume. All security layers passed.`,
    suspicious:  (name, reason) => `Warning! ${name ? name + ': ' : ''}This medicine is suspicious. Reason: ${reason} Do not purchase it.`,
    counterfeit: (name, reason) => `Danger! ${name ? name + ': ' : ''}This medicine is counterfeit. Reason: ${reason} Return it immediately and report the pharmacy.`,
  },
};

// ── Reason mapping — human-readable reasons from API layer messages ─────────
// We extract the most important failed layer and convert its message to a short human reason
const REASON_TRANSLATIONS = {
  'hi-IN': {
    batchCheck:    'यह बैच नंबर निर्माता के डेटाबेस में नहीं मिला — यह दवा कभी बनाई ही नहीं गई।',
    hashCheck:     'QR कोड का डिजिटल हस्ताक्षर गलत है — इसे नकली QR से बदला गया है।',
    scanFrequency: 'यह QR कोड सैकड़ों बार स्कैन हो चुका है — यह फोटोकॉपी किया गया नकली QR है।',
    geoCheck:      'यह दवा किसी दूसरे देश के लिए भेजी गई थी — यह चोरी का या मोड़ा गया माल है।',
    temporalCheck: 'इस दवा की एक्सपायरी डेट निकल चुकी है — इसे नए लेबल से दोबारा बेचा जा रहा है।',
    supplyChain:   'सप्लाई चेन में कड़ियाँ गायब हैं — यह दवा अवैध रूप से बाज़ार में लाई गई है।',
  },
  'ta-IN': {
    batchCheck:    'இந்த தொகுதி எண் உற்பத்தியாளர் தரவுத்தளத்தில் இல்லை — இந்த மருந்து உற்பத்தி செய்யப்படவில்லை.',
    hashCheck:     'QR குறியீட்டின் டிஜிட்டல் கையெழுத்து தவறானது — போலி QR மாற்றப்பட்டது.',
    scanFrequency: 'இந்த QR குறியீடு நூற்றுக்கணக்கான முறை ஸ்கேன் செய்யப்பட்டுள்ளது — நகலெடுக்கப்பட்ட போலி QR.',
    geoCheck:      'இந்த மருந்து வேறு நாட்டிற்கு அனுப்பப்பட்டது — திருடப்பட்ட அல்லது திசைதிருப்பப்பட்ட பொருள்.',
    temporalCheck: 'இந்த மருந்தின் காலாவதி தேதி கடந்துவிட்டது — மறுபட்டை ஒட்டி விற்கப்படுகிறது.',
    supplyChain:   'விநியோகச் சங்கிலியில் இணைப்புகள் காணவில்லை — சட்டவிரோதமாக சந்தையில் கொண்டுவரப்பட்டது.',
  },
  'mr-IN': {
    batchCheck:    'हा बॅच नंबर निर्मात्याच्या डेटाबेसमध्ये आढळला नाही — हे औषध कधीच बनवले गेले नाही.',
    hashCheck:     'QR कोडचा डिजिटल स्वाक्षरी चुकीचा आहे — बनावट QR बदलला गेला आहे.',
    scanFrequency: 'हा QR कोड शेकडो वेळा स्कॅन झाला आहे — हा फोटोकॉपी केलेला बनावट QR आहे.',
    geoCheck:      'हे औषध दुसऱ्या देशासाठी पाठवले होते — चोरलेला किंवा वळवलेला माल आहे.',
    temporalCheck: 'या औषधाची एक्सपायरी डेट निघून गेली आहे — नव्या लेबलसह पुन्हा विकले जात आहे.',
    supplyChain:   'पुरवठा साखळीत दुवे गायब आहेत — हे औषध बेकायदेशीरपणे बाजारात आणले गेले आहे.',
  },
  'default': {
    batchCheck:    'This batch number does not exist in the manufacturer database — the medicine was never produced.',
    hashCheck:     'The QR digital signature is invalid — the QR code has been tampered with or forged.',
    scanFrequency: 'This QR code has been scanned hundreds of times — it is a photocopied counterfeit QR.',
    geoCheck:      'This medicine was shipped to a different country — it is stolen or diverted stock.',
    temporalCheck: 'The expiry date on this medicine has passed — it is being re-sold with a new label.',
    supplyChain:   'The supply chain has missing links — this medicine was introduced illegally into the market.',
  },
};

/**
 * Build the full spoken verdict message with the specific reason.
 * @param {string} verdict - 'verified' | 'suspicious' | 'counterfeit'
 * @param {string} langCode - e.g. 'hi-IN'
 * @param {object} results - the results object from the verify API
 * @param {string|null} medicineName - optional medicine name
 */
export function buildVerdictAudioText(verdict, langCode, results = {}, medicineName = null) {
  const templates  = TEMPLATES[langCode]  || TEMPLATES['default'];
  const reasonMap  = REASON_TRANSLATIONS[langCode] || REASON_TRANSLATIONS['default'];

  if (verdict === 'verified') {
    return templates.safe(medicineName);
  }

  // Find the primary reason: the most impactful failed layer
  const PRIORITY = ['batchCheck', 'hashCheck', 'scanFrequency', 'geoCheck', 'temporalCheck', 'supplyChain'];
  const failedKey = PRIORITY.find(k => results[k] && !results[k].passed);
  const reason    = failedKey ? reasonMap[failedKey] : (langCode === 'hi-IN' ? 'अज्ञात कारण' : 'Unknown reason');

  return verdict === 'counterfeit'
    ? templates.counterfeit(medicineName, reason)
    : templates.suspicious(medicineName, reason);
}

// Keep old simple function for backward compatibility (voice page uses it)
export function getVerdictMessage(verdict, langCode) {
  const key      = verdict === 'verified' ? 'safe' : verdict;
  const templates = TEMPLATES[langCode] || TEMPLATES['default'];
  return templates[key]('', '');
}

// ── Voice Agent Prompts ───────────────────────────────────────────────────
export const REPORT_PROMPTS = {
  'hi-IN': {
    welcome: 'सेफडोज़ में आपका स्वागत है। कृपया फार्मेसी का नाम बताएं।',
    issue: 'धन्यवाद। दवाई में क्या समस्या है?',
    success: 'आपकी रिपोर्ट दर्ज कर ली गई है। हम इस घटना की जानकारी अधिकारियों को देंगे। धन्यवाद।',
    retry: 'हम आपकी आवाज़ नहीं सुन पाए। कृपया दोबारा बताएं।'
  },
  'ta-IN': {
    welcome: 'சேஃப்டோஸுக்கு உங்களை வரவேற்கிறோம். தயவுசெய்து மருந்தகத்தின் பெயரைக் கூறுங்கள்.',
    issue: 'நன்றி. மருந்தில் என்ன பிரச்சனை?',
    success: 'உங்கள் அறிக்கை பதிவு செய்யப்பட்டுள்ளது. இந்தச் சம்பவத்தை அதிகாரிகளிடம் தெரிவிப்போம். நன்றி.',
    retry: 'எங்களால் உங்கள் குரலைக் கேட்க முடியவில்லை. தயவுசெய்து மீண்டும் கூறுங்கள்.'
  },
  'te-IN': {
    welcome: 'సేఫ్‌డోస్‌కు స్వాగతం. దయచేసి ఫార్మసీ పేరు చెప్పండి.',
    issue: 'ధన్యవాదాలు. మందులో సమస్య ఏమిటి?',
    success: 'మీ నివేదిక నమోదు చేయబడింది. ఈ ఘటన గురించి అధికారులకు తెలియజేస్తాము. ధన్యవాదాలు.',
    retry: 'మేము మీ మాట వినలేకపోయాము. దయచేసి మళ్ళీ చెప్పండి.'
  },
  'bn-IN': {
    welcome: 'সেফডোজে আপনাকে স্বাগত। অনুগ্রহ করে ফার্মেসির নাম বলুন।',
    issue: 'ধন্যবাদ। ওষুধে কী সমস্যা আছে?',
    success: 'আপনার রিপোর্ট দায়ের করা হয়েছে। আমরা এই ঘটনা সম্পর্কে কর্তৃপক্ষকে জানাব। ধন্যবাদ।',
    retry: 'আমরা আপনার কথা শুনতে পাইনি। অনুগ্রহ করে আবার বলুন।'
  },
  'mr-IN': {
    welcome: 'सेफडोजमध्ये आपले स्वागत आहे. कृपया फार्मसीचे नाव सांगा.',
    issue: 'धन्यवाद. औषधात काय समस्या आहे?',
    success: 'तुमचा अहवाल नोंदवला गेला आहे. आम्ही या घटनेची माहिती अधिकाऱ्यांना देऊ. धन्यवाद.',
    retry: 'आम्हाला तुमचा आवाज ऐकू आला नाही. कृपया पुन्हा सांगा.'
  },
  'gu-IN': {
    welcome: 'સેફડોઝમાં તમારું સ્વાગત છે. કૃપા કરીને ફાર્મસીનું નામ જણાવો.',
    issue: 'આભાર. દવામાં શું સમસ્યા છે?',
    success: 'તમારો રિપોર્ટ નોંધવામાં આવ્યો છે. અમે આ ઘટના અંગે સત્તાવાળાઓને જાણ કરીશું. આભાર.',
    retry: 'અમે તમારો અવાજ સાંભળી શક્યા નથી. કૃપા કરીને ફરીથી જણાવો.'
  },
  'kn-IN': {
    welcome: 'ಸೇಫ್‌ಡೋಸ್‌ಗೆ ಸುಸ್ವಾಗತ. ದಯವಿಟ್ಟು ಫಾರ್ಮಸಿಯ ಹೆಸರನ್ನು ತಿಳಿಸಿ.',
    issue: 'ಧನ್ಯವಾದಗಳು. ಔಷಧದಲ್ಲಿ ಏನು ಸಮಸ್ಯೆಯಿದೆ?',
    success: 'ನಿಮ್ಮ ವರದಿಯನ್ನು ಸಲ್ಲಿಸಲಾಗಿದೆ. ನಾವು ಈ ಘಟನೆಯ ಬಗ್ಗೆ ಅಧಿಕಾರಿಗಳಿಗೆ ತಿಳಿಸುತ್ತೇವೆ. ಧನ್ಯವಾದಗಳು.',
    retry: 'ನಮಗೆ ನಿಮ್ಮ ಧ್ವನಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಹೇಳಿ.'
  },
  'ml-IN': {
    welcome: 'സേഫ്‌ഡോസിലേക്ക് സ്വാഗതം. ഫാർമസിയുടെ പേര് പറയുക.',
    issue: 'നന്ദി. മരുന്നിന് എന്ത് പ്രശ്നമാണ് ഉള്ളത്?',
    success: 'നിങ്ങളുടെ റിപ്പോർട്ട് സമർപ്പിച്ചു. ഈ സംഭവത്തെക്കുറിച്ച് ഞങ്ങൾ അധികാരികളെ അറിയിക്കും. നന്ദി.',
    retry: 'നിങ്ങൾ പറഞ്ഞത് കേൾക്കാൻ കഴിഞ്ഞില്ല. ദയവായി വീണ്ടും പറയുക.'
  },
  'pa-IN': {
    welcome: 'ਸੇਫਡੋਜ਼ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਫਾਰਮੇਸੀ ਦਾ ਨਾਮ ਦੱਸੋ।',
    issue: 'ਧੰਨਵਾਦ। ਦਵਾਈ ਵਿੱਚ ਕੀ ਸਮੱਸਿਆ ਹੈ?',
    success: 'ਤੁਹਾਡੀ ਰਿਪੋਰਟ ਦਰਜ ਕਰ ਲਈ ਗਈ ਹੈ। ਅਸੀਂ ਇਸ ਘਟਨਾ ਬਾਰੇ ਅਧਿਕਾਰੀਆਂ ਨੂੰ ਸੂਚਿਤ ਕਰਾਂਗੇ। ਧੰਨਵਾਦ।',
    retry: 'ਅਸੀਂ ਤੁਹਾਡੀ ਆਵਾਜ਼ ਨਹੀਂ ਸੁਣ ਸਕੇ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਦੱਸੋ।'
  },
  'or-IN': {
    welcome: 'ସେଫଡୋଜକୁ ସ୍ଵାଗତ। ଦୟାକରି ଫାର୍ମାସୀର ନାମ କୁହନ୍ତୁ।',
    issue: 'ଧନ୍ୟବାଦ। ଔଷଧରେ କଣ ସମସ୍ୟା ଅଛି?',
    success: 'ଆପଣଙ୍କର ରିପୋର୍ଟ ଦାଖଲ ହୋଇଛି। ଆମେ ଏହି ଘଟଣା ବିଷୟରେ ଅଧିକାରୀମାନଙ୍କୁ ଜଣାଇବୁ। ଧନ୍ୟବାଦ।',
    retry: 'ଆମେ ଆପଣଙ୍କ ସ୍ୱର ଶୁଣିପାରିଲୁ ନାହିଁ। ଦୟାକରି ପୁଣି କୁହନ୍ତୁ।'
  },
  'default': {
    welcome: 'Welcome to SafeDose. Please tell me the name of the pharmacy.',
    issue: 'Thank you. What is the issue with the medicine?',
    success: 'Your report has been submitted. We will report the authorities about the incident. Thank you.',
    retry: 'We could not hear you. Please try again.'
  }
};
