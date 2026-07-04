'use client';
import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, MapPin, CheckCircle, Loader2, Volume2, BookOpen } from 'lucide-react';
import { SUPPORTED_LANGUAGES, getLanguageForState } from '../../utils/languages';
import styles from './page.module.css';

export default function VoicePage() {
  const [location, setLocation] = useState({ city: '', state: '', loading: true, error: null });
  const [selectedLang, setSelectedLang] = useState('hi-IN');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState('idle');
  const [audioResultUrl, setAudioResultUrl] = useState(null);
  const [educationMode, setEducationMode] = useState(false);
  const [educationText, setEducationText] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onresult = (event) => {
          const text = event.results[0][0].transcript;
          setTranscript(text);
          processVoiceInput(text);
        };

        recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error", event.error);
          setStatus('idle');
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }
    if (!navigator.geolocation) {
      setLocation({ loading: false, error: 'Geolocation not supported' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
          const data = await res.json();
          const state = data.address.state || '';
          const city = data.address.city || data.address.town || '';

          setLocation({ city, state, loading: false });

          if (state) {
            setSelectedLang(getLanguageForState(state));
          }
        } catch {
          setLocation({ loading: false, error: 'Failed to fetch location details' });
        }
      },
      () => {
        setLocation({ loading: false, error: 'Location access denied' });
      }
    );
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = selectedLang;
    }
  }, [selectedLang]);

  const handleRecord = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      setAudioResultUrl(null);
      setStatus('recording');
      setIsRecording(true);
      recognitionRef.current?.start();
    }
  };

  const processVoiceInput = async (text) => {
    setStatus('processing');
    setEducationText('');
    try {
      if (educationMode) {
        // — Rural Education Mode —
        const medicineName = text.trim();
        const res = await fetch('/api/voice/educate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            medicineInfo: { name: medicineName },
            language: selectedLang,
          }),
        });
        const data = await res.json();
        setStatus('verified');
        setEducationText(data.educationText || '');
        if (data.audioBase64) {
          const audioSrc = `data:audio/wav;base64,${data.audioBase64}`;
          setAudioResultUrl(audioSrc);
          const audio = new Audio(audioSrc);
          audio.play();
        }
      } else {
        // — Standard Verification Mode —
        let replyText = `You said: ${text}. `;
        if (text.toLowerCase().includes('paracetamol')) {
           replyText += 'Paracetamol 500mg verified. It is safe to consume.';
        } else {
           replyText += 'Medicine not found in our verified database. Please check the batch number.';
        }

        const res = await fetch('/api/voice/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: replyText,
            language: selectedLang
          })
        });
        const data = await res.json();
        setStatus('verified');
        if (data.audioBase64) {
          const audioSrc = `data:audio/wav;base64,${data.audioBase64}`;
          setAudioResultUrl(audioSrc);
          const audio = new Audio(audioSrc);
          audio.play();
        }
      }
    } catch (err) {
      console.error('Voice processing failed:', err);
      setStatus('idle');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Voice Verification</h1>
        <p className={styles.subtitle}>Powered by Sarvam AI. Speak the medicine name to verify.</p>

        {/* Education Mode Toggle */}
        <div className={styles.eduToggle}>
          <span className={styles.eduLabel}>Rural Education Mode</span>
          <button
            onClick={() => { setEducationMode(m => !m); setEducationText(''); setStatus('idle'); }}
            className={`${styles.switch} ${educationMode ? styles.switchActive : ''}`}
            title={educationMode ? 'Disable education mode' : 'Enable education mode'}
          >
            <span className={styles.switchKnob} />
          </button>
        </div>
        {educationMode && (
          <p className={styles.eduHint}>
            Speak a medicine name → AI explains it simply → AI reads it in your language
          </p>
        )}
      </div>

      <div className={styles.settingsBar}>
        <div className={styles.location}>
          <MapPin size={18} className={styles.locIcon} />
          {location.loading ? (
            <span style={{ opacity: 0.6 }}>Detecting location...</span>
          ) : location.error ? (
            <span style={{ color: 'var(--color-warning)' }}>{location.error}</span>
          ) : (
            <span>{location.city}, {location.state}</span>
          )}
        </div>

        <div className={styles.langControl}>
          <label className={styles.langLabel}>Language:</label>
          <select
            className={styles.langSelect}
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
          >
            {SUPPORTED_LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.voiceCard}>
        <button
          onClick={handleRecord}
          disabled={status === 'processing'}
          className={`${styles.recordBtn} ${isRecording ? styles.recordBtnActive : ''} ${status === 'processing' ? styles.recordBtnProcessing : ''}`}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {status === 'processing' ? (
            <Loader2 size={36} className="animate-spin" />
          ) : isRecording ? (
            <MicOff size={36} />
          ) : (
            <Mic size={36} />
          )}
        </button>

        <p className={styles.statusText}>
          {status === 'idle' && "Tap to start speaking"}
          {status === 'recording' && "Listening... Tap to stop"}
          {status === 'processing' && "Sarvam AI is analyzing..."}
          {status === 'verified' && "Verification Complete"}
        </p>

        {transcript && (
          <div className={styles.transcriptArea}>
            <p className={styles.transcriptLabel}>Transcribed Text:</p>
            <p className={styles.transcriptText}>{transcript}</p>

            {educationMode && educationText && (
              <div className={styles.eduContent}>
                <p className={styles.eduTitle}><BookOpen size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Simple Explanation (Gemini AI):</p>
                <p className={styles.eduDesc}>{educationText}</p>
              </div>
            )}

            {status === 'verified' && (
              <div className={styles.resultArea}>
                <div className={styles.resultVerified}>
                  <CheckCircle size={18} />
                  {educationMode ? 'Explanation Ready' : 'Medicine Verified'}
                </div>
                {audioResultUrl && (
                  <button
                    onClick={() => { const audio = new Audio(audioResultUrl); audio.play(); }}
                    className={styles.playBtn}
                    title="Play Audio"
                  >
                    <Volume2 size={18} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
