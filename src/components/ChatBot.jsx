'use client';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';

function ChatBotContent() {
  const params = useSearchParams();
  const pathname = usePathname();
  
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: '👋 Hi! I\'m SafeDose AI. Ask me anything about medicines — uses, side effects, dosage, or safety. How can I help?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);


  const getContext = () => {
    if (pathname !== '/results') return '';
    try {
      const data = JSON.parse(decodeURIComponent(params.get('data') || '{}'));
      if (!data?.medicineInfo) return '';
      const m = data.medicineInfo;
      return `Current medicine being viewed: ${m.name} (${m.strength || ''}). 
Category: ${m.category || 'Unknown'}. 
Dosage: ${m.dosage || 'Unknown'}. 
Side effects: ${m.side_effects?.join(', ') || 'None listed'}. 
Instructions: ${m.instructions || 'None'}.`;
    } catch { return ''; }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, context: getContext() }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.reply || 'Sorry, something went wrong.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Network error. Please try again.' }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          suppressHydrationWarning
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB, #7c3aed)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 8px 32px rgba(37,99,235,0.4)',
            animation: 'chatPulse 2s infinite',
          }}
        >
          <MessageCircle size={28} color="white" />
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          width: '380px', maxWidth: 'calc(100vw - 32px)', height: '520px', maxHeight: 'calc(100vh - 100px)',
          background: 'var(--bg-primary, #0f172a)', border: '1px solid var(--border-color, #1e293b)',
          borderRadius: '20px', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)', overflow: 'hidden',
          animation: 'chatSlideUp 0.3s ease-out',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px', background: 'linear-gradient(135deg, #2563EB, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bot size={22} color="white" />
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>SafeDose AI</p>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>Powered by Gemini</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}>
              <X size={18} color="white" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  background: m.role === 'bot' ? 'rgba(37,99,235,0.15)' : 'rgba(16,185,129,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {m.role === 'bot' ? <Bot size={14} style={{ color: '#2563EB' }} /> : <User size={14} style={{ color: '#10b981' }} />}
                </div>
                <div style={{
                  maxWidth: '75%', padding: '10px 14px', borderRadius: '14px',
                  background: m.role === 'user' ? '#2563EB' : 'var(--bg-surface, #1e293b)',
                  color: m.role === 'user' ? 'white' : 'var(--text-primary, #e2e8f0)',
                  fontSize: '0.875rem', lineHeight: 1.5, whiteSpace: 'pre-wrap',
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(37,99,235,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={14} style={{ color: '#2563EB' }} />
                </div>
                <div style={{ padding: '10px 14px', borderRadius: '14px', background: 'var(--bg-surface, #1e293b)', display: 'flex', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'dotBounce 1.4s infinite', animationDelay: '0s' }} />
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'dotBounce 1.4s infinite', animationDelay: '0.2s' }} />
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'dotBounce 1.4s infinite', animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div style={{ padding: '0 16px 8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['What is Paracetamol used for?', 'Side effects of Amoxicillin?', 'Is Aspirin safe during pregnancy?'].map(q => (
                <button key={q} onClick={() => { setInput(q); }} style={{
                  padding: '6px 12px', borderRadius: '16px', fontSize: '0.75rem',
                  background: 'var(--bg-surface, #1e293b)', border: '1px solid var(--border-color, #334155)',
                  color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap',
                }}>{q}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color, #1e293b)', display: 'flex', gap: '8px' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask about any medicine..."
              style={{
                flex: 1, padding: '10px 14px', borderRadius: '10px',
                background: 'var(--bg-surface, #1e293b)', border: '1px solid var(--border-color, #334155)',
                color: 'var(--text-primary, #e2e8f0)', fontSize: '0.9rem', outline: 'none',
              }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              style={{
                padding: '10px 14px', borderRadius: '10px', border: 'none',
                background: input.trim() ? '#2563EB' : 'var(--bg-surface, #1e293b)',
                cursor: input.trim() ? 'pointer' : 'default', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Send size={18} color="white" />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatPulse {
          0%, 100% { box-shadow: 0 8px 32px rgba(37,99,235,0.4); }
          50% { box-shadow: 0 8px 48px rgba(37,99,235,0.6); }
        }
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}

export default function ChatBot() {
  return (
    <Suspense fallback={null}>
      <ChatBotContent />
    </Suspense>
  );
}
