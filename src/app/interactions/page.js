'use client';
import { useState, useRef } from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle, Loader2, Info, Volume2, VolumeX } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/utils/languages';
import styles from './page.module.css';

const DEMO_MEDICINES = [
  "Paracetamol 500mg",
  "Amoxicillin 250mg",
  "Metformin 500mg",
  "Insulin Novolin R",
  "Cough Syrup",
  "Warfarin",
  "Methotrexate",
  "Contrast dye",
  "Sedatives",
  "Beta-blockers"
];

function buildInteractionAudioText(result, drugA, drugB, langCode) {
  if (result.safety_status === 'safe') {
    const templates = {
      'hi-IN': `${drugA} और ${drugB} के बीच कोई खतरनाक इंटरैक्शन नहीं पाया गया। आप इन्हें एक साथ ले सकते हैं।`,
      'bn-IN': `${drugA} এবং ${drugB} এর মধ্যে কোন বিপজ্জনক মিথস্ক্রিয়া পাওয়া যায়নি। আপনি এগুলি একসাথে নিতে পারেন।`,
      'ta-IN': `${drugA} மற்றும் ${drugB} இடையே ஆபத்தான தொடர்பு எதுவும் கண்டறியப்படவில்லை। நீங்கள் இவற்றை ஒன்றாக எடுத்துக்கொள்ளலாம்.`,
      'te-IN': `${drugA} మరియు ${drugB} మధ్య ప్రమాదకరమైన పరస్పర చర్య కనుగొనబడలేదు. మీరు వీటిని కలిపి తీసుకోవచ్చు.`,
      'mr-IN': `${drugA} आणि ${drugB} यांच्यात कोणतीही धोकादायक परस्परक्रिया आढळली नाही. तुम्ही हे एकत्र घेऊ शकता.`,
      'gu-IN': `${drugA} અને ${drugB} વચ્ચે કોઈ ખતરનાક ક્રિયાપ્રતિક્રિયા મળી નથી. તમે આ બંને સાથે લઈ શકો છો.`,
      'kn-IN': `${drugA} ಮತ್ತು ${drugB} ನಡುವೆ ಯಾವುದೇ ಅಪಾಯಕಾರಿ ಪರಸ್ಪರ ಕ್ರಿಯೆ ಕಂಡುಬಂದಿಲ್ಲ. ನೀವು ಇವುಗಳನ್ನು ಒಟ್ಟಿಗೆ ತೆಗೆದುಕೊಳ್ಳಬಹುದು.`,
      'ml-IN': `${drugA} ഉം ${drugB} ഉം തമ്മിൽ അപകടകരമായ ഇടപെടൽ കണ്ടെത്തിയില്ല. നിങ്ങൾക്ക് ഇവ ഒരുമിച്ച് കഴിക്കാം.`,
      'pa-IN': `${drugA} ਅਤੇ ${drugB} ਵਿਚਕਾਰ ਕੋਈ ਖ਼ਤਰਨਾਕ ਇੰਟਰੈਕਸ਼ਨ ਨਹੀਂ ਮਿਲੀ। ਤੁਸੀਂ ਇਨ੍ਹਾਂ ਨੂੰ ਇਕੱਠੇ ਲੈ ਸਕਦੇ ਹੋ।`,
      'or-IN': `${drugA} ଏବଂ ${drugB} ମଧ୍ୟରେ କୌଣସି ବିପଜ୍ଜନକ ପାରସ୍ପରିକ କ୍ରିୟା ମିଳିଲା ନାହିଁ। ଆପଣ ଏଗୁଡ଼ିକୁ ଏକାଠି ନେଇପାରିବେ।`,
    };
    return templates[langCode] || `No dangerous interaction found between ${drugA} and ${drugB}. You can take them together safely.`;
  }

  // Has interactions
  const interaction = result.interactions[0];
  const severity = interaction?.severity || 'moderate';
  const desc = interaction?.description || '';
  const rec = interaction?.recommendation || '';

  const templates = {
    'hi-IN': `चेतावनी! ${drugA} और ${drugB} के बीच ${severity === 'severe' ? 'गंभीर' : 'मध्यम'} इंटरैक्शन पाया गया। ${desc} सलाह: ${rec}`,
    'bn-IN': `সতর্কতা! ${drugA} এবং ${drugB} এর মধ্যে ${severity === 'severe' ? 'গুরুতর' : 'মাঝারি'} মিথস্ক্রিয়া পাওয়া গেছে। ${desc} পরামর্শ: ${rec}`,
    'ta-IN': `எச்சரிக்கை! ${drugA} மற்றும் ${drugB} இடையே ${severity === 'severe' ? 'கடுமையான' : 'மிதமான'} தொடர்பு கண்டறியப்பட்டது. ${desc} பரிந்துரை: ${rec}`,
    'te-IN': `హెచ్చరిక! ${drugA} మరియు ${drugB} మధ్య ${severity === 'severe' ? 'తీవ్రమైన' : 'మధ్యస్థ'} పరస్పర చర్య కనుగొనబడింది. ${desc} సలహా: ${rec}`,
    'mr-IN': `चेतावणी! ${drugA} आणि ${drugB} यांच्यात ${severity === 'severe' ? 'गंभीर' : 'मध्यम'} परस्परक्रिया आढळली. ${desc} सल्ला: ${rec}`,
    'gu-IN': `ચેતવણી! ${drugA} અને ${drugB} વચ્ચે ${severity === 'severe' ? 'ગંભીર' : 'મધ્યમ'} ક્રિયાપ્રતિક્રિયા મળી. ${desc} સલાહ: ${rec}`,
    'kn-IN': `ಎಚ್ಚರಿಕೆ! ${drugA} ಮತ್ತು ${drugB} ನಡುವೆ ${severity === 'severe' ? 'ತೀವ್ರ' : 'ಮಧ್ಯಮ'} ಪರಸ್ಪರ ಕ್ರಿಯೆ ಕಂಡುಬಂದಿದೆ. ${desc} ಸಲಹೆ: ${rec}`,
    'ml-IN': `മുന്നറിയിപ്പ്! ${drugA} ഉം ${drugB} ഉം തമ്മിൽ ${severity === 'severe' ? 'ഗുരുതരമായ' : 'മിതമായ'} ഇടപെടൽ കണ്ടെത്തി. ${desc} ശുപാർശ: ${rec}`,
    'pa-IN': `ਚੇਤਾਵਨੀ! ${drugA} ਅਤੇ ${drugB} ਵਿਚਕਾਰ ${severity === 'severe' ? 'ਗੰਭੀਰ' : 'ਦਰਮਿਆਨੀ'} ਇੰਟਰੈਕਸ਼ਨ ਮਿਲੀ. ${desc} ਸਲਾਹ: ${rec}`,
    'or-IN': `ସତର୍କତା! ${drugA} ଏବଂ ${drugB} ମଧ୍ୟରେ ${severity === 'severe' ? 'ଗୁରୁତର' : 'ମଧ୍ୟମ'} ପାରସ୍ପରିକ କ୍ରିୟା ମିଳିଲା। ${desc} ପରାମର୍ଶ: ${rec}`,
  };
  return templates[langCode] || `Warning! A ${severity} interaction was found between ${drugA} and ${drugB}. ${desc} Recommendation: ${rec}`;
}

export default function InteractionsPage() {
  const [drugA, setDrugA] = useState('');
  const [drugB, setDrugB] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Voice state
  const [lang, setLang] = useState('hi-IN');
  const [audioState, setAudioState] = useState('idle'); // idle | loading | ready | playing | error
  const audioRef = useRef(null);

  const checkInteractions = async () => {
    if (!drugA || !drugB || drugA === drugB) return;
    setLoading(true);
    setAudioState('idle');
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    try {
      const res = await fetch('/api/interactions/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicines: [drugA, drugB] })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const speakResult = async () => {
    if (!result) return;

    // If already playing, toggle pause
    if (audioState === 'playing' && audioRef.current) {
      audioRef.current.pause();
      setAudioState('ready');
      return;
    }

    // If audio is already loaded, replay
    if (audioState === 'ready' && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => setAudioState('playing')).catch(() => {});
      return;
    }

    setAudioState('loading');
    const text = buildInteractionAudioText(result, drugA, drugB, lang);

    try {
      const res = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: lang }),
      });
      const data = await res.json();
      if (!data.audioBase64) throw new Error('No audio');

      const src = `data:audio/wav;base64,${data.audioBase64}`;
      const audio = new Audio(src);
      audioRef.current = audio;

      audio.addEventListener('ended', () => setAudioState('ready'));
      audio.addEventListener('error', () => setAudioState('error'));

      audio.addEventListener('canplaythrough', () => {
        setAudioState('playing');
        audio.play().catch(() => setAudioState('ready'));
      }, { once: true });

      audio.load();
    } catch {
      setAudioState('error');
    }
  };

  // Reset audio when language changes
  const handleLangChange = (e) => {
    setLang(e.target.value);
    setAudioState('idle');
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Drug Interaction Checker</h1>
        <p className={styles.subtitle}>
          Cross-reference multiple medicines to identify potentially dangerous interactions before consumption.
        </p>
      </div>

      <div className={styles.formCard}>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.label}>Medicine 1</label>
            <select 
              value={drugA} 
              onChange={e => setDrugA(e.target.value)}
              className={styles.select}
            >
              <option value="">Select a medicine...</option>
              {DEMO_MEDICINES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Medicine 2</label>
            <select 
              value={drugB} 
              onChange={e => setDrugB(e.target.value)}
              className={styles.select}
            >
              <option value="">Select a medicine...</option>
              {DEMO_MEDICINES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        
        <button 
          onClick={checkInteractions}
          disabled={!drugA || !drugB || drugA === drugB || loading}
          className={styles.checkBtn}
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : 'Check Safety'}
        </button>
      </div>

      {result && (
        <div className={styles.resultsContainer}>
          {result.safety_status === 'safe' ? (
            <div className={styles.safeCard}>
              <CheckCircle size={48} style={{ color: 'var(--color-verified)', margin: '0 auto var(--sp-4)' }} />
              <h2 className={styles.safeTitle}>No Known Interactions</h2>
              <p className={styles.safeDesc}>Based on our database, there are no known dangerous interactions between {drugA} and {drugB}.</p>
            </div>
          ) : (
            <div>
              <div className={styles.interactionsHeader}>
                <h2 className={styles.interactionsTitle}>Found {result.total_interactions} Interaction(s)</h2>
              </div>
              
              {result.interactions.map((interaction, idx) => {
                const isSevere = interaction.severity === 'severe' || interaction.severity === 'contraindicated';
                const severityClass = isSevere ? styles.interactionSevere : styles.interactionWarning;
                const badgeClass = isSevere ? styles.badgeSevere : styles.badgeWarning;
                
                return (
                  <div key={idx} className={`${styles.interactionCard} ${severityClass}`}>
                    <div style={{ marginTop: '2px' }}>
                      {isSevere ? <ShieldAlert size={24} style={{ color: 'var(--color-danger)' }} /> : <AlertTriangle size={24} style={{ color: 'var(--color-suspicious)' }} />}
                    </div>
                    <div className={styles.interactionContent}>
                      <div className={styles.interactionHeader}>
                        <h3 className={styles.interactionDrugs}>
                          {interaction.drug_a} + {interaction.drug_b}
                        </h3>
                        <span className={`${styles.severityBadge} ${badgeClass}`}>
                          {interaction.severity}
                        </span>
                      </div>
                      <p className={styles.interactionDesc}>
                        {interaction.description}
                      </p>
                      <div className={styles.recommendation}>
                        <Info size={16} style={{ color: 'var(--color-brand-primary)', flexShrink: 0, marginTop: '2px' }} />
                        <p className={styles.recText}>
                          <span style={{ color: 'var(--text-secondary)' }}>Recommendation:</span> {interaction.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Voice Result Section */}
          <div className={styles.voiceCard}>
            <div className={styles.voiceLabel}>
              <Volume2 size={24} style={{ color: 'var(--color-brand-primary)' }} />
              <span className={styles.voiceLabelText}>Listen in your language</span>
            </div>

            <div className={styles.voiceActions}>
              <select
                value={lang}
                onChange={handleLangChange}
                className={styles.langSelect}
              >
                {SUPPORTED_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>

              <button
                onClick={speakResult}
                disabled={audioState === 'loading'}
                className={`${styles.speakBtn} ${result.safety_status === 'safe' ? styles.speakBtnSafe : styles.speakBtnDanger} ${audioState === 'playing' ? styles.playing : ''}`}
              >
                {audioState === 'loading' && <><Loader2 size={16} className="animate-spin" /> Loading...</>}
                {audioState === 'idle' && <><Volume2 size={16} /> Speak Result</>}
                {audioState === 'ready' && <><Volume2 size={16} /> Play Again</>}
                {audioState === 'playing' && <><Volume2 size={16} /> Playing...</>}
                {audioState === 'error' && <><VolumeX size={16} /> Retry</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
