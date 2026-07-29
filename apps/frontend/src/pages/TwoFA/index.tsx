import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Loader2, ArrowLeft, Smartphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRoleDefaultPath } from '../../config/roleConfig';

const BG   = '#050B18';
const LEN  = 6;

interface TwoFAState { pendingUser?: Record<string, unknown> & { role?: string }; token?: string; }

export default function TwoFA() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: authLogin } = useAuth();

  const { pendingUser, token } = ((location.state as TwoFAState | null) ?? {});

  const [digits,  setDigits]  = useState<string[]>(Array(LEN).fill(''));
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const refs = useRef<(HTMLInputElement | null)[]>(Array(LEN).fill(null));

  useEffect(() => {
    if (!pendingUser || !token) navigate('/login', { replace: true });
    refs.current[0]?.focus();
  }, [pendingUser, token, navigate]);

  const handleDigit = (i: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    setError('');
    if (d && i < LEN - 1) refs.current[i + 1]?.focus();
    if (next.every(Boolean)) handleVerify(next.join(''));
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LEN);
    if (pasted.length === LEN) { setDigits(pasted.split('')); handleVerify(pasted); }
  };

  const handleVerify = async (code: string) => {
    if (loading || code.length < LEN) return;
    setLoading(true);
    setError('');
    try {
      // TODO: call POST /api/v1/auth/verify-2fa { code, token }
      await new Promise(r => setTimeout(r, 1000));
      authLogin({ ...pendingUser, token } as Parameters<typeof authLogin>[0]);
      navigate(getRoleDefaultPath(pendingUser?.role as string), { replace: true });
    } catch {
      setError('Kòd 2FA a pa kòrèk. Eseye ankò.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{ background: BG }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}.tfa-card{animation:fadeUp .45s ease both}`}</style>

      <div className="w-full max-w-sm tfa-card">
        <button type="button" onClick={() => navigate('/login')}
          className="flex items-center gap-2 mb-8 text-sm font-bold transition"
          style={{ color:'#475569' }}>
          <ArrowLeft size={16} /> Retounen
        </button>

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-[18px] mx-auto mb-5 flex items-center justify-center"
            style={{ background:'rgba(99,102,241,.1)', border:'1.5px solid rgba(99,102,241,.25)' }}>
            <Lock size={22} style={{ color:'#a78bfa' }} />
          </div>
          <h2 className="text-2xl font-black text-white">Otantifikasyon 2 Etap</h2>
          <p className="mt-2 text-sm leading-6" style={{ color:'#64748b' }}>
            Ouvri aplikasyon otantifikatè ou<br />
            <span style={{ color:'#a78bfa' }} className="flex items-center justify-center gap-1 mt-1 text-xs font-bold">
              <Smartphone size={11} /> Google Authenticator / Authy
            </span>
          </p>
        </div>

        <div className="rounded-[28px] overflow-hidden"
          style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)',
            boxShadow:'0 32px 80px rgba(0,0,0,.5)', backdropFilter:'blur(24px)' }}>
          <div className="p-6 flex flex-col gap-5">
            {error && (
              <div className="rounded-[12px] p-3 text-xs text-center font-bold"
                style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', color:'#f87171' }}>
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input key={i}
                  ref={el => { refs.current[i] = el; }}
                  type="text" inputMode="numeric" maxLength={1}
                  value={d}
                  onChange={e => handleDigit(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className="w-11 h-14 text-center text-xl font-black text-white rounded-[12px] outline-none transition-all"
                  style={{
                    background:'rgba(255,255,255,.06)',
                    border: d ? '2px solid #a78bfa' : '1.5px solid rgba(255,255,255,.12)',
                    boxShadow: d ? '0 0 0 3px rgba(167,139,250,.15)' : 'none',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#a78bfa80')}
                  onBlur={e  => (e.target.style.borderColor = d ? '#a78bfa' : 'rgba(255,255,255,.12)')}
                />
              ))}
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 text-sm font-bold" style={{ color:'#a78bfa' }}>
                <Loader2 size={16} className="animate-spin" /> Verifikasyon…
              </div>
            )}

            <p className="text-center text-xs" style={{ color:'#334155' }}>
              Pa ka jwenn kòd la?{' '}
              <button type="button" onClick={() => navigate('/login')}
                className="underline transition hover:text-slate-400">
                Kontakte sipò
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}