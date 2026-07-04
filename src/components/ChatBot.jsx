'use client';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';

function ChatBotContent() {
  const params   = useSearchParams();
  const pathname = usePathname();

  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi — I\'m SafeDose AI. Ask me anything about medicines: uses, side effects, dosage, or interactions.' }
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const getContext = () => {
    if (pathname !== '/results') return '';
    try {
      const data = JSON.parse(decodeURIComponent(params.get('data') || '{}'));
      if (!data?.medicineInfo) return '';
      const m = data.medicineInfo;
      return `Current medicine: ${m.name} (${m.strength || ''}). Category: ${m.category || 'Unknown'}. Dosage: ${m.dosage || 'Unknown'}. Side effects: ${m.side_effects?.join(', ') || 'None'}. Instructions: ${m.instructions || 'None'}.`;
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
      const res  = await fetch('/api/chat', {
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
          aria-label="Open AI assistant"
          style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'var(--color-brand-primary)',
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(24,61,97,0.35)',
            transition: 'transform 150ms ease, box-shadow 150ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <MessageCircle size={22} color="white" />
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          width: '360px', maxWidth: 'calc(100vw - 32px)', height: '500px', maxHeight: 'calc(100vh - 96px)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 16px 40px rgba(28,39,51,0.15)',
          overflow: 'hidden',
          animation: 'chatSlideUp 0.25s ease-out',
        }}>

          {/* Header */}
          <div style={{
            padding: '14px 16px',
            background: 'var(--color-brand-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bot size={18} color="white" />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: 'white', fontSize: '0.9rem' }}>SafeDose AI</p>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.65)' }}>Powered by Gemini</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none',
                borderRadius: '6px', padding: '6px',
                cursor: 'pointer', display: 'flex',
              }}
            >
              <X size={16} color="white" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{
            flex: 1, overflowY: 'auto', padding: '16px',
            display: 'flex', flexDirection: 'column', gap: '12px',
            background: 'var(--bg-canvas)',
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex', gap: '8px', alignItems: 'flex-start',
                flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
              }}>
                <div style={{
                  width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                  background: m.role === 'bot' ? 'var(--color-brand-primary-tint)' : 'var(--color-brand-secondary-tint)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {m.role === 'bot'
                    ? <Bot size={13} style={{ color: 'var(--color-brand-primary)' }} />
                    : <User size={13} style={{ color: '#2D6A4F' }} />
                  }
                </div>
                <div style={{
                  maxWidth: '78%', padding: '9px 13px', borderRadius: '10px',
                  background: m.role === 'user' ? 'var(--color-brand-primary)' : 'var(--bg-surface)',
                  color: m.role === 'user' ? 'white' : 'var(--text-primary)',
                  fontSize: '0.875rem', lineHeight: 1.55, whiteSpace: 'pre-wrap',
                  border: m.role === 'bot' ? '1px solid var(--border-subtle)' : 'none',
                }}>
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--color-brand-primary-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={13} style={{ color: 'var(--color-brand-primary)' }} />
                </div>
                <div style={{ padding: '9px 13px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <span key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'dotBounce 1.4s infinite', animationDelay: `${delay}s` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div style={{ padding: '0 12px 8px', display: 'flex', gap: '6px', flexWrap: 'wrap', background: 'var(--bg-canvas)' }}>
              {['What is Paracetamol used for?', 'Side effects of Amoxicillin?', 'Is Aspirin safe during pregnancy?'].map(q => (
                <button key={q} onClick={() => setInput(q)} style={{
                  padding: '5px 10px', borderRadius: '20px', fontSize: '0.72rem',
                  background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-sans)',
                }}>{q}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: '10px 12px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex', gap: '8px',
            background: 'var(--bg-surface)',
            flexShrink: 0,
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask about any medicine..."
              style={{
                flex: 1, padding: '10px 12px', borderRadius: '8px',
                background: 'var(--bg-canvas)', border: '1px solid var(--border-default)',
                color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none',
                fontFamily: 'var(--font-sans)',
                transition: 'border-color 150ms ease',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--border-focus)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              aria-label="Send"
              style={{
                padding: '10px 12px', borderRadius: '8px', border: 'none',
                background: input.trim() && !loading ? 'var(--color-brand-primary)' : 'var(--bg-inset)',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 150ms ease',
                flexShrink: 0,
              }}
            >
              {loading
                ? <Loader2 size={16} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
                : <Send size={16} color={input.trim() ? 'white' : 'var(--text-muted)'} />
              }
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
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
