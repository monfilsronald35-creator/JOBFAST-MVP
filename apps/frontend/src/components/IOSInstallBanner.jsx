import React, { useState, useEffect } from 'react';

const BG   = '#050B18';
const CARD = '#0d1526';
const GOLD = '#FACC15';

// Detekte si yo sou iOS Safari (pa deja enstale kòm PWA)
function isIOSSafari() {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isSafari = /WebKit/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
  return isIOS && isSafari;
}

function isInStandaloneMode() {
  return (
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

export default function IOSInstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Montre sèlman: sou iOS Safari + pa deja enstale + pa t fermé anvan
    const dismissed = sessionStorage.getItem('jf-ios-banner-dismissed');
    if (!dismissed && isIOSSafari() && !isInStandaloneMode()) {
      // Yon ti dèlè pou pa parèt twò vit
      const t = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  if (!show) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('jf-ios-banner-dismissed', '1');
    setShow(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Enstale JOBFAST"
      style={{
        position:   'fixed',
        bottom:     0,
        left:       0,
        right:      0,
        zIndex:     9998,
        padding:    '16px 16px calc(16px + env(safe-area-inset-bottom))',
        background: BG,
        borderTop:  `1px solid #1F2937`,
        boxShadow:  '0 -8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {/* Flèch ki montre bouton Share la */}
      <div style={{
        position: 'absolute',
        bottom: 'calc(100% + 1px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft:  '10px solid transparent',
        borderRight: '10px solid transparent',
        borderTop:   `10px solid ${BG}`,
      }} />

      {/* Bouton fèmen */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Fèmen"
        style={{
          position:  'absolute',
          top:       12,
          right:     12,
          background:'transparent',
          border:    'none',
          color:     '#64748b',
          fontSize:  18,
          cursor:    'pointer',
          lineHeight:1,
          padding:   4,
        }}
      >
        ×
      </button>

      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
        {/* Ikòn app */}
        <img
          src="/icons/icon-180x180.png"
          alt="JOBFAST"
          width={52}
          height={52}
          style={{ borderRadius:12, flexShrink:0 }}
        />

        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ color: GOLD, fontWeight:900, fontSize:13, margin:'0 0 2px' }}>
            Enstale JOBFAST sou iPhone ou
          </p>
          <p style={{ color:'#94a3b8', fontSize:11, margin:'0 0 10px', lineHeight:1.5 }}>
            Pou enstale app la, suiv etap sa yo:
          </p>

          {/* Etap 1 */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
            <div style={{
              width:22, height:22, borderRadius:'50%',
              background:`${GOLD}22`, color:GOLD,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:11, fontWeight:900, flexShrink:0,
            }}>1</div>
            <p style={{ color:'#cbd5e1', fontSize:11, margin:0, lineHeight:1.4 }}>
              Peze bouton{' '}
              <span style={{
                display:'inline-flex', alignItems:'center', gap:3,
                background:'#1e293b', borderRadius:6, padding:'2px 6px',
                fontSize:11, color:'#60a5fa',
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
                </svg>
                Pataje
              </span>
              {' '}anba navigatè a
            </p>
          </div>

          {/* Etap 2 */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{
              width:22, height:22, borderRadius:'50%',
              background:`${GOLD}22`, color:GOLD,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:11, fontWeight:900, flexShrink:0,
            }}>2</div>
            <p style={{ color:'#cbd5e1', fontSize:11, margin:0, lineHeight:1.4 }}>
              Chwazi{' '}
              <strong style={{ color:'#fff' }}>"Ajoute sou Ekran Akèy"</strong>
              {' '}
              <span style={{ color:'#64748b' }}>(Add to Home Screen)</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}