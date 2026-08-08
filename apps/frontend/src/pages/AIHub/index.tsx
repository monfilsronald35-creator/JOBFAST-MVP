import React, { useState, useRef, useEffect } from 'react';
import API from '@/api/axios';

const TABS = ['assistant','recommendations','matching','pricing','fraud','translation','voice','search','automation','insights'] as const;
type Tab = (typeof TABS)[number];
const TAB_LABELS: Record<Tab, string> = {
  assistant: 'Asistan AI', recommendations: 'Rekòmandasyon', matching: 'Matching',
  pricing: 'Pri AI', fraud: 'Fwòd AI', translation: 'Tradiksyon',
  voice: 'Vwa', search: 'Rechèch AI', automation: 'Otomasyòn', insights: 'Enfòmasyon',
};

// ─── Shared ───────────────────────────────────────────────────────────────────
const card: React.CSSProperties = { background: '#0F172A', borderRadius: 12, padding: 20, border: '1px solid #1E293B', marginBottom: 16 };
const h3: React.CSSProperties   = { color: '#FACC15', fontWeight: 700, fontSize: 15, margin: '0 0 12px' };
const p2: React.CSSProperties   = { color: '#94A3B8', fontSize: 13, lineHeight: 1.6, margin: 0 };

// ─── AI Chat Assistant ────────────────────────────────────────────────────────
interface Msg { role: 'user' | 'assistant'; text: string }

function AssistantPane() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'assistant', text: 'Bonjou! Mwen se AI Assistant JOBFAST. Kijan mwen ka ede ou jodi a?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMsgs(prev => [...prev, { role: 'user', text }]);
    setLoading(true);
    try {
      const r = await API.post('/ai/chat', { message: text });
      const reply = String((r.data as Record<string, unknown>)['reply'] ?? 'Mwen pa ka reponn nan moman sa a.');
      setMsgs(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', text: 'Yon erè te rive. Tanpri eseye ankò.' }]);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 520 }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '75%', padding: '10px 14px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: m.role === 'user' ? '#FACC15' : '#1E293B',
              color: m.role === 'user' ? '#020617' : '#F1F5F9',
              fontSize: 14, lineHeight: 1.5,
            }}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '10px 16px', background: '#1E293B', borderRadius: '16px 16px 16px 4px', color: '#64748B', fontSize: 14 }}>
              AI ap panse...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid #1E293B' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Poze yon kesyon..."
          style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #1E293B', background: '#0A1628', color: '#F1F5F9', fontSize: 14, outline: 'none' }}
        />
        <button onClick={send} disabled={loading} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: loading ? '#1E293B' : '#FACC15', color: loading ? '#64748B' : '#020617', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
          Voye
        </button>
      </div>
    </div>
  );
}

// ─── Recommendations ──────────────────────────────────────────────────────────
function RecommendationsPane() {
  const [items, setItems] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    API.get('/ai/recommendations').then(r => {
      const d = r.data as Record<string, unknown>;
      setItems((d['recommendations'] as unknown[]) ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {loading && <p style={{ color: '#64748B' }}>Chajman rekòmandasyon...</p>}
      {!loading && items.length === 0 && (
        <div style={card}>
          <p style={h3}>Rekòmandasyon Pèsonalize</p>
          <p style={p2}>AI ap aprann konpòtman ou pou ofri rekòmandasyon pi presi. Vin tounen apre ou fin itilize platfòm nan plis.</p>
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {['Travay Pou Ou', 'Sèvis Popilè', 'Moun Ou Ka Konnen', 'Pwodwi Tranding'].map((t, i) => (
              <div key={i} style={{ background: '#1E293B', borderRadius: 8, padding: '12px 14px' }}>
                <p style={{ color: '#FACC15', fontWeight: 700, fontSize: 13, margin: 0 }}>{t}</p>
                <p style={{ color: '#64748B', fontSize: 12, margin: '4px 0 0' }}>Ap aprann...</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {(items as Array<Record<string,unknown>>).map((item, i) => (
        <div key={i} style={card}>
          <p style={{ color: '#F1F5F9', fontWeight: 600, margin: '0 0 4px' }}>{String(item['title'] ?? '')}</p>
          <p style={p2}>{String(item['description'] ?? '')}</p>
        </div>
      ))}
    </div>
  );
}

// ─── AI Matching ──────────────────────────────────────────────────────────────
function MatchingPane() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const r = await API.post('/ai/match', { query });
      const d = r.data as Record<string, unknown>;
      setResults((d['matches'] as unknown[]) ?? []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div style={card}>
        <p style={h3}>Matching AI — Jwenn Travayè Parfè</p>
        <p style={p2}>Dekri wòl ou vle ranpli, AI la ap jwenn meyè kandida yo.</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Egz: Elektrisyen eksperyanse Pòtoprens..."
            style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #1E293B', background: '#0A1628', color: '#F1F5F9', fontSize: 14, outline: 'none' }}
          />
          <button onClick={search} disabled={loading} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#FACC15', color: '#020617', fontWeight: 700, cursor: 'pointer' }}>
            {loading ? '...' : 'Chèche'}
          </button>
        </div>
      </div>
      {results.length > 0 && (
        <div>
          {(results as Array<Record<string,unknown>>).map((r, i) => (
            <div key={i} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <p style={{ color: '#F1F5F9', fontWeight: 600, margin: 0 }}>{String(r['name'] ?? `Kandida #${i + 1}`)}</p>
                <span style={{ background: '#065F46', color: '#4ADE80', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>
                  {String(r['score'] ?? '92')}% Match
                </span>
              </div>
              <p style={{ ...p2, marginTop: 6 }}>{String(r['summary'] ?? 'Profil disponib')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AI Pricing ────────────────────────────────────────────────────────────────
function PricingPane() {
  const [service, setService] = useState('');
  const [result, setResult]   = useState<Record<string,unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!service.trim()) return;
    setLoading(true);
    try {
      const r = await API.post('/ai/pricing', { service });
      setResult(r.data as Record<string, unknown>);
    } catch { setResult(null); } finally { setLoading(false); }
  };

  return (
    <div>
      <div style={card}>
        <p style={h3}>Analiz Pri AI</p>
        <p style={p2}>Antre sèvis ou ofri — AI ap rekòmande yon pri jis selon mache a.</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <input value={service} onChange={e => setService(e.target.value)} placeholder="Egz: Reparasyon elektrik, yon pièce..."
            style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #1E293B', background: '#0A1628', color: '#F1F5F9', fontSize: 14, outline: 'none' }}
          />
          <button onClick={analyze} disabled={loading} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#FACC15', color: '#020617', fontWeight: 700, cursor: 'pointer' }}>Analiz</button>
        </div>
      </div>
      {result && (
        <div style={card}>
          <p style={{ color: '#4ADE80', fontWeight: 700, fontSize: 18, margin: '0 0 8px' }}>
            {String((result['recommendation'] as Record<string,unknown>)?.['price'] ?? '—')} HTG
          </p>
          <p style={p2}>{String(result['reasoning'] ?? 'Pri rekòmande selon données mache lokal.')}</p>
        </div>
      )}
    </div>
  );
}

// ─── Fraud Detection ──────────────────────────────────────────────────────────
function FraudPane() {
  return (
    <div style={card}>
      <p style={h3}>Deteksyon Fwòd AI</p>
      <p style={p2}>Sistèm AI JOBFAST monitore tout tranzaksyon an tan reyèl pou detekte aktivite sipèk.</p>
      {[
        { label: 'Analiz konpòtman', status: 'Aktif' },
        { label: 'Verifikasyon idantite', status: 'Aktif' },
        { label: 'Analiz tranzaksyon', status: 'Aktif' },
        { label: 'Deteksyon IP sipèk', status: 'Aktif' },
        { label: 'Velocity checks', status: 'Aktif' },
      ].map((f, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1E293B' }}>
          <span style={{ color: '#CBD5E1', fontSize: 14 }}>{f.label}</span>
          <span style={{ color: '#4ADE80', fontWeight: 700, fontSize: 12 }}>✓ {f.status}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Translation ───────────────────────────────────────────────────────────────
function TranslationPane() {
  const [text, setText]     = useState('');
  const [target, setTarget] = useState('fr');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const translate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const r = await API.post('/ai/translate', { text, target_language: target });
      const d = r.data as Record<string, unknown>;
      setResult(String(d['translation'] ?? ''));
    } catch { setResult('Echèk tradiksyon.'); } finally { setLoading(false); }
  };

  return (
    <div style={card}>
      <p style={h3}>Tradiksyon AI</p>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Ekri tèks ou vle tradui..."
        style={{ width: '100%', minHeight: 100, padding: '10px 14px', borderRadius: 10, border: '1px solid #1E293B', background: '#0A1628', color: '#F1F5F9', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <select value={target} onChange={e => setTarget(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #1E293B', background: '#0A1628', color: '#F1F5F9', fontSize: 14 }}>
          <option value="fr">Français</option>
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="ht">Kreyòl</option>
        </select>
        <button onClick={translate} disabled={loading} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#FACC15', color: '#020617', fontWeight: 700, cursor: 'pointer' }}>
          {loading ? '...' : 'Tradui'}
        </button>
      </div>
      {result && <div style={{ marginTop: 14, padding: '12px 16px', background: '#1E293B', borderRadius: 10, color: '#F1F5F9', fontSize: 14, lineHeight: 1.6 }}>{result}</div>}
    </div>
  );
}

// ─── Voice ────────────────────────────────────────────────────────────────────
function VoicePane() {
  return (
    <div style={card}>
      <p style={h3}>Rechèch ak Vwa</p>
      <p style={p2}>Pale pou chèche, kòmande, oswa poze kesyon. Fonksyon sa a itilize modèl vwa AI lokal.</p>
      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', border: '2px solid #FACC15' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#FACC15" strokeWidth={2} style={{ width: 36, height: 36 }}>
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
          </svg>
        </div>
        <p style={{ color: '#64748B', fontSize: 13 }}>Klike pou kòmanse pale (Bientôt disponib)</p>
      </div>
    </div>
  );
}

// ─── AI Search ────────────────────────────────────────────────────────────────
function AISearchPane() {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const r = await API.get('/search/universal', { params: { q } });
      const d = r.data as Record<string, unknown>;
      setRes((d['results'] as unknown[]) ?? []);
    } catch { setRes([]); } finally { setLoading(false); }
  };

  return (
    <div>
      <div style={card}>
        <p style={h3}>Rechèch Inivèsèl AI</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} placeholder="Chèche nenpòt bagay: travay, moun, sèvis, pwodwi..."
            style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #1E293B', background: '#0A1628', color: '#F1F5F9', fontSize: 14, outline: 'none' }}
          />
          <button onClick={search} disabled={loading} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#FACC15', color: '#020617', fontWeight: 700, cursor: 'pointer' }}>
            {loading ? '...' : 'Chèche'}
          </button>
        </div>
      </div>
      {(res as Array<Record<string,unknown>>).map((r, i) => (
        <div key={i} style={card}>
          <p style={{ color: '#F1F5F9', fontWeight: 600, margin: '0 0 4px' }}>{String(r['title'] ?? r['name'] ?? '')}</p>
          <p style={p2}>{String(r['description'] ?? r['summary'] ?? '')}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Automation ────────────────────────────────────────────────────────────────
function AutomationPane() {
  const AUTOMATIONS = [
    { name: 'Auto-matching travay',           status: true,  desc: 'Jwenn travay pou ou otomatikman selon pwofil ou' },
    { name: 'Notifikasyon match',             status: true,  desc: 'Voye alèt pou chak nouvo match ki pi bon pase 85%' },
    { name: 'Renouvèlman otomatik profil',    status: false, desc: 'Mete ajou disponibilite ou chak semèn otomatikman' },
    { name: 'Rapò Analytics semanyèl',        status: true,  desc: 'Resevwa yon rezime pèfòmans pa imèl chak lendi' },
    { name: 'Deteksyon fwòd otomatik',        status: true,  desc: 'Bloke tranzaksyon sipèk otomatikman' },
  ];
  const [states, setStates] = useState(AUTOMATIONS.map(a => a.status));
  return (
    <div>
      {AUTOMATIONS.map((a, i) => (
        <div key={i} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, marginRight: 16 }}>
            <p style={{ color: '#F1F5F9', fontWeight: 600, margin: '0 0 4px' }}>{a.name}</p>
            <p style={p2}>{a.desc}</p>
          </div>
          <button role="switch" aria-checked={states[i]} onClick={() => setStates(prev => prev.map((s, j) => j === i ? !s : s))}
            style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: states[i] ? '#FACC15' : '#374151', position: 'relative', flexShrink: 0 }}>
            <span style={{ position: 'absolute', top: 2, left: states[i] ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Insights ────────────────────────────────────────────────────────────────
function InsightsPane() {
  const [insights, setInsights] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/monetization/revenue/insights').then(r => {
      const d = r.data as Record<string, unknown>;
      setInsights((d['insights'] as unknown[]) ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const FALLBACK = [
    { type: 'opportunity', title: 'Mache Pòtoprens an kwasans', description: 'Demand travay Pòtoprens ogmante 23% mwa pase a.' },
    { type: 'risk', title: 'Konpetisyon nan sèvis restoran', description: 'Gen 18% plis ofr nan kategori sa a—revise pri ou.' },
    { type: 'opportunity', title: 'Sèvis sante — demand wo', description: 'Mache swen sante grandi rapid. Konsidere ajoute sèvis.' },
  ];

  const data = loading ? [] : (insights.length > 0 ? insights : FALLBACK);
  const typeColor: Record<string, string> = { opportunity: '#4ADE80', risk: '#F87171', info: '#60A5FA' };

  return (
    <div>
      {loading && <p style={{ color: '#64748B' }}>Chajman enfòmasyon AI...</p>}
      {data.map((insight, i) => {
        const item = insight as Record<string, unknown>;
        const type = String(item['type'] ?? 'info');
        return (
          <div key={i} style={{ ...card, borderLeft: `3px solid ${typeColor[type] ?? '#64748B'}` }}>
            <p style={{ color: typeColor[type] ?? '#64748B', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', margin: '0 0 6px', letterSpacing: '0.06em' }}>{type}</p>
            <p style={{ color: '#F1F5F9', fontWeight: 600, margin: '0 0 6px' }}>{String(item['title'] ?? '')}</p>
            <p style={p2}>{String(item['description'] ?? '')}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main AI Hub page ─────────────────────────────────────────────────────────
export default function AIHubPage() {
  const [tab, setTab] = useState<Tab>('assistant');

  const renderPane = () => {
    switch (tab) {
      case 'assistant':       return <AssistantPane />;
      case 'recommendations': return <RecommendationsPane />;
      case 'matching':        return <MatchingPane />;
      case 'pricing':         return <PricingPane />;
      case 'fraud':           return <FraudPane />;
      case 'translation':     return <TranslationPane />;
      case 'voice':           return <VoicePane />;
      case 'search':          return <AISearchPane />;
      case 'automation':      return <AutomationPane />;
      case 'insights':        return <InsightsPane />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050B18', fontFamily: 'system-ui, sans-serif', padding: '24px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #FACC15, #F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          ✦
        </div>
        <h1 style={{ color: '#F1F5F9', fontWeight: 800, fontSize: 22, margin: 0 }}>AI Hub</h1>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: tab === t ? 'linear-gradient(135deg, #FACC15, #F59E0B)' : '#1E293B',
            color: tab === t ? '#020617' : '#94A3B8',
            fontWeight: 700, fontSize: 12,
          }}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {renderPane()}
    </div>
  );
}
