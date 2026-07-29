import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle2, Send } from 'lucide-react';

const BG   = '#050B18';
const GOLD = '#FACC15';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;
    setLoading(true);
    setError('');
    try {
      // TODO: call POST /api/v1/auth/forgot-password
      await new Promise(r => setTimeout(r, 1400));
      setSent(true);
    } catch {
      setError('Yon erè te rive. Eseye ankò.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{ background: BG }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}.fp-card{animation:fadeUp .45s ease both}`}</style>

      <div className="pointer-events-none fixed inset-0">
        <div style={{ position:'absolute', top:'-15%', left:'50%', transform:'translateX(-50%)',
          width:'500px', height:'500px', borderRadius:'50%',
          background:'radial-gradient(circle,rgba(250,204,21,.08),transparent 70%)' }} />
      </div>

      <div className="w-full max-w-sm fp-card">
        <button type="button" onClick={() => navigate('/login')}
          className="flex items-center gap-2 mb-8 text-sm font-bold transition"
          style={{ color:'#475569' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
          <ArrowLeft size={16} /> Retounen nan Login
        </button>

        {sent ? (
          <div className="text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-[20px] flex items-center justify-center"
              style={{ background:`${GOLD}15`, border:`1.5px solid ${GOLD}30` }}>
              <CheckCircle2 size={28} style={{ color: GOLD }} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Tcheke imèl ou!</h2>
              <p className="mt-2 text-sm leading-6" style={{ color:'#64748b' }}>
                Nou voye yon lyen pou reyinisyalize modpas ou nan<br />
                <span className="font-bold text-white">{email}</span>
              </p>
            </div>
            <p className="text-xs" style={{ color:'#334155' }}>
              Pa resevwa imèl la? Tcheke spam ou oswa
              <button onClick={() => setSent(false)} className="underline ml-1 transition hover:text-slate-400">
                eseye ankò
              </button>.
            </p>
            <button type="button" onClick={() => navigate('/login')}
              className="mt-4 w-full rounded-[14px] py-3.5 text-sm font-black transition active:scale-[.98]"
              style={{ background: GOLD, color: BG, boxShadow:'0 8px 32px rgba(250,204,21,.2)' }}>
              Retounen nan Login
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-[18px] mx-auto mb-5 flex items-center justify-center"
                style={{ background:'rgba(250,204,21,.08)', border:'1.5px solid rgba(250,204,21,.2)' }}>
                <Mail size={22} style={{ color: GOLD }} />
              </div>
              <h2 className="text-2xl font-black text-white">Modpas bliye?</h2>
              <p className="mt-2 text-sm leading-6" style={{ color:'#64748b' }}>
                Antre imèl ou a. N ap voye yon lyen<br />pou reyinisyalize modpas ou.
              </p>
            </div>

            <div className="rounded-[28px] overflow-hidden"
              style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)',
                boxShadow:'0 32px 80px rgba(0,0,0,.5)', backdropFilter:'blur(24px)' }}>
              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                {error && (
                  <div className="rounded-[12px] p-3 text-xs text-center font-bold"
                    style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', color:'#f87171' }}>
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color:'#475569' }}>
                    Imèl ou
                  </label>
                  <div className="relative">
                    <Mail size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color:'#475569' }} />
                    <input
                      ref={inputRef}
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      placeholder="imèl@ou.com"
                      autoComplete="email"
                      disabled={loading}
                      className="w-full rounded-[14px] pl-10 pr-4 py-3.5 text-sm font-medium text-white placeholder:text-slate-600 outline-none transition-all"
                      style={{ background:'rgba(255,255,255,.05)', border:'1.5px solid rgba(255,255,255,.08)' }}
                      onFocus={e => (e.target.style.borderColor = `${GOLD}60`)}
                      onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,.08)')}
                    />
                  </div>
                </div>

                <button type="submit" disabled={!isValid || loading}
                  className="relative flex items-center justify-center gap-2 w-full rounded-[14px] py-3.5 text-sm font-black transition-all active:scale-[.98] mt-1"
                  style={{
                    background: isValid && !loading ? GOLD : 'rgba(250,204,21,.35)',
                    color: BG,
                    boxShadow: isValid && !loading ? '0 8px 32px rgba(250,204,21,.22)' : 'none',
                  }}>
                  {loading ? <><Loader2 size={15} className="animate-spin" /> Antrèn voye…</> : <><Send size={15} /> Voye lyen a</>}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}