import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, Loader2, ArrowLeft, RefreshCw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getRoleDefaultPath } from "../../config/roleConfig";

const BG   = "#050B18";
const GOLD = "#FACC15";
const LEN  = 6;

export default function VerifyLogin() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login: authLogin } = useAuth();

  const { pendingUser, token } = location.state || {};

  const [digits,   setDigits]   = useState(Array(LEN).fill(""));
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [resent,   setResent]   = useState(false);
  const [countdown, setCountdown] = useState(0);
  const refs = useRef([]);

  useEffect(() => {
    if (!pendingUser || !token) { navigate("/login", { replace: true }); }
  }, [pendingUser, token, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleDigit = (i, val) => {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    setError("");
    if (d && i < LEN - 1) refs.current[i + 1]?.focus();
    if (next.every(Boolean)) handleVerify(next.join(""));
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = e => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LEN);
    if (pasted.length === LEN) {
      setDigits(pasted.split(""));
      handleVerify(pasted);
    }
  };

  const handleVerify = async (code) => {
    if (loading || code.length < LEN) return;
    setLoading(true);
    setError("");
    try {
      // TODO: call POST /api/v1/auth/verify-login { code, token }
      await new Promise(r => setTimeout(r, 1000));
      if (code === "000000") { setError("Kòd la pa kòrèk. Eseye ankò."); setLoading(false); return; }
      authLogin({ ...pendingUser, token });
      navigate(getRoleDefaultPath(pendingUser?.role), { replace: true });
    } catch {
      setError("Verifikasyon echwe. Eseye ankò.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResent(true);
    setCountdown(60);
    // TODO: call POST /api/v1/auth/resend-otp
    setTimeout(() => setResent(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{ background: BG }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}.vl-card{animation:fadeUp .45s ease both}`}</style>

      <div className="w-full max-w-sm vl-card">
        <button type="button" onClick={() => navigate("/login")}
          className="flex items-center gap-2 mb-8 text-sm font-bold transition"
          style={{ color:"#475569" }}>
          <ArrowLeft size={16} /> Retounen
        </button>

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-[18px] mx-auto mb-5 flex items-center justify-center"
            style={{ background:"rgba(52,211,153,.08)", border:"1.5px solid rgba(52,211,153,.2)" }}>
            <ShieldCheck size={22} style={{ color:"#34d399" }} />
          </div>
          <h2 className="text-2xl font-black text-white">Verifikasyon Login</h2>
          <p className="mt-2 text-sm leading-6" style={{ color:"#64748b" }}>
            Nou detekte yon nouvo aparèy oswa kote.<br />
            Antre kòd 6-chif nou voye nan<br />
            <span className="font-bold text-white">{pendingUser?.email || "imèl ou"}</span>
          </p>
        </div>

        <div className="rounded-[28px] overflow-hidden"
          style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)",
            boxShadow:"0 32px 80px rgba(0,0,0,.5)", backdropFilter:"blur(24px)" }}>
          <div className="p-6 flex flex-col gap-5">
            {error && (
              <div className="rounded-[12px] p-3 text-xs text-center font-bold"
                style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.2)", color:"#f87171" }}>
                {error}
              </div>
            )}

            {/* OTP digits */}
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input key={i}
                  ref={el => refs.current[i] = el}
                  type="text" inputMode="numeric" maxLength={1}
                  value={d}
                  onChange={e => handleDigit(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className="w-11 h-14 text-center text-xl font-black text-white rounded-[12px] outline-none transition-all"
                  style={{
                    background:"rgba(255,255,255,.06)",
                    border: d ? `2px solid ${GOLD}` : "1.5px solid rgba(255,255,255,.12)",
                    boxShadow: d ? `0 0 0 3px ${GOLD}15` : "none",
                  }}
                  onFocus={e => e.target.style.borderColor = `${GOLD}80`}
                  onBlur={e  => e.target.style.borderColor = d ? GOLD : "rgba(255,255,255,.12)"}
                />
              ))}
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 text-sm font-bold" style={{ color: GOLD }}>
                <Loader2 size={16} className="animate-spin" /> Verifikasyon…
              </div>
            )}

            {/* Resend */}
            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-xs" style={{ color:"#475569" }}>
                  Voye ankò nan <span style={{ color: GOLD }} className="font-bold">{countdown}s</span>
                </p>
              ) : (
                <button type="button" onClick={handleResend}
                  className="flex items-center justify-center gap-1.5 mx-auto text-xs font-bold transition"
                  style={{ color:"#64748b" }}
                  onMouseEnter={e => e.currentTarget.style.color="#94a3b8"}
                  onMouseLeave={e => e.currentTarget.style.color="#64748b"}>
                  <RefreshCw size={12} />
                  {resent ? "Voye ✓" : "Voye kòd ankò"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
