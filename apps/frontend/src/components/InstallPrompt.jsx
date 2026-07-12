import React, { useEffect, useState } from 'react';

// Captures the browser's beforeinstallprompt event so we can trigger it ourselves
let deferredPrompt = null;

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Already installed as standalone?
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) return;

    // Dismissed before?
    try { if (localStorage.getItem('jf_pwa_dismissed')) return; } catch {}

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    if (ios) {
      // iOS doesn't fire beforeinstallprompt — show manual instructions
      const t = setTimeout(() => setShow(true), 8000);
      return () => clearTimeout(t);
    }

    const onPrompt = (e) => {
      e.preventDefault();
      deferredPrompt = e;
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', () => { setInstalled(true); setShow(false); });

    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const dismiss = () => {
    setShow(false);
    try { localStorage.setItem('jf_pwa_dismissed', '1'); } catch {}
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (outcome === 'accepted') { setInstalled(true); setShow(false); }
  };

  if (!show || installed) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 z-[300] animate-slide-up">
      <div
        className="rounded-2xl p-4 flex items-start gap-3 shadow-2xl"
        style={{ background: '#0d1526', border: '1px solid #1F2937' }}
      >
        {/* Icon */}
        <div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden border" style={{ borderColor: '#2a3548' }}>
          <img src="/icons/icon-192x192.png" alt="JobFast" className="w-full h-full object-cover" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-black text-white leading-tight">Enstale JobFast</p>
          {isIOS ? (
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              Tape <span className="text-amber-400 font-bold">⎙ Pataje</span> epi chwazi{' '}
              <span className="text-amber-400 font-bold">"Ajoute sou Ekran Dakèy"</span>
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              Enstale app la sou telefònn ou — li louvri menm jan ak WhatsApp, san Chrome
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 shrink-0">
          {!isIOS && (
            <button
              type="button"
              onClick={install}
              className="px-3 py-1.5 rounded-xl text-[11px] font-black text-slate-950 active:scale-95 transition"
              style={{ background: '#FACC15' }}
            >
              Enstale
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-500 border transition active:opacity-70"
            style={{ borderColor: '#1F2937' }}
          >
            {isIOS ? 'OK' : 'Pita'}
          </button>
        </div>
      </div>
    </div>
  );
}
