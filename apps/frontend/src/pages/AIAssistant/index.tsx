import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Loader2, Bot, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../../core/api/client';

const BG = '#050B18'; const GOLD = '#FACC15';

interface Message { role: 'user' | 'assistant'; text: string; ts: number; suggestions?: string[]; }

const SUGGESTIONS = [
  'Jwenn yon elektrisyen pre mwen',
  'Kijan pou poste yon travay?',
  'Wè balans pòtfèy mwen',
  'Ki travayè ki pi disponib?',
];

const INIT_MESSAGE: Message = { role: 'assistant', text: 'Bonjou! Mwen se Asistan AI JOBFAST. Kijan mwen ka ede ou jodi a? 🤖', ts: Date.now() };

export default function AIAssistant() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([INIT_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg, ts: Date.now() }]);
    setLoading(true);
    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.text }));
      const res = await api.post<{ reply?: string; suggestions?: string[] }>('/ai/chat', { message: msg, history });
      setMessages(prev => [...prev, { role: 'assistant', text: res.data?.reply ?? 'Mwen pa konprann.', ts: Date.now(), suggestions: res.data?.suggestions }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Eskize mwen, yon erè te rive. Eseye ankò.', ts: Date.now() }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString('fr-HT', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col h-screen" style={{ background: BG }}>
      <div className="flex items-center gap-3 px-4 pt-10 pb-4 flex-shrink-0"
        style={{ background: 'rgba(255,255,255,.02)', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <button onClick={() => navigate(-1)} className="mr-1" style={{ color: '#64748b' }}>←</button>
        <div className="w-10 h-10 rounded-[14px] flex items-center justify-center"
          style={{ background: `${GOLD}15`, border: `1.5px solid ${GOLD}30` }}>
          <Bot size={18} style={{ color: GOLD }} />
        </div>
        <div>
          <h2 className="text-sm font-black text-white">Asistan JOBFAST</h2>
          <p className="text-[10px] flex items-center gap-1" style={{ color: '#34d399' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Aktif kounye a
          </p>
        </div>
        <button onClick={() => setMessages([{ role: 'assistant', text: 'Bonjou! Nouvo konvèsasyon an kòmanse. 🤖', ts: Date.now() }])}
          className="ml-auto p-2 rounded-full" style={{ color: '#475569' }}>
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0"
                style={{ background: `${GOLD}15` }}>
                <Sparkles size={12} style={{ color: GOLD }} />
              </div>
            )}
            <div className="max-w-[78%]">
              <div className="rounded-[18px] px-4 py-3 text-sm leading-relaxed"
                style={{
                  background: m.role === 'user' ? GOLD : 'rgba(255,255,255,.06)',
                  color: m.role === 'user' ? BG : 'white',
                  borderBottomRightRadius: m.role === 'user' ? 4 : 18,
                  borderBottomLeftRadius:  m.role === 'assistant' ? 4 : 18,
                }}>
                {m.text}
              </div>
              {m.suggestions && m.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {m.suggestions.map((s, j) => (
                    <button key={j} onClick={() => send(s)}
                      className="text-[10px] font-bold px-3 py-1.5 rounded-full transition-all"
                      style={{ background: 'rgba(250,204,21,.1)', color: GOLD, border: `1px solid ${GOLD}25` }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[10px] mt-1 px-1" style={{ color: '#334155' }}>{formatTime(m.ts)}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2" style={{ background: `${GOLD}15` }}>
              <Sparkles size={12} style={{ color: GOLD }} />
            </div>
            <div className="rounded-[18px] px-4 py-3" style={{ background: 'rgba(255,255,255,.06)' }}>
              <Loader2 size={14} className="animate-spin" style={{ color: '#64748b' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 2 && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-2 no-scrollbar flex-shrink-0">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => send(s)}
              className="whitespace-nowrap text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0"
              style={{ background: 'rgba(255,255,255,.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,.08)' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="px-4 pb-8 pt-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div className="flex gap-2">
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) send(); }}
            placeholder="Ekri yon mesaj…" maxLength={500}
            className="flex-1 rounded-[16px] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none"
            style={{ background: 'rgba(255,255,255,.06)', border: '1.5px solid rgba(255,255,255,.1)' }} />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-[14px] flex items-center justify-center transition-all active:scale-[.93]"
            style={{ background: input.trim() && !loading ? GOLD : 'rgba(250,204,21,.3)', color: BG }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}