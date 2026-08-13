import React, { useEffect, useState } from 'react';
import './splash.css';

/**
 * SplashScreen
 * - Full-screen React splash that renders immediately after the OS splash.
 * - Shows brand logo centered, respects safe-area and prefers-reduced-motion.
 * - Keeps visible until app initialization signals readiness.
 *
 * Usage:
 *  - Render <SplashScreen ready={appIsReady} /> at top-level until ready === true
 *  - The component ensures a very short minimum visual duration to avoid flicker
 */

interface Props {
  ready: boolean; // app initialization completed
  minDurationMs?: number; // visual stability minimum (default 250ms)
}

export default function SplashScreen({ ready, minDurationMs = 250 }: Props) {
  const [visible, setVisible] = useState(true);
  const [start] = useState(Date.now());

  useEffect(() => {
    if (!ready) return;
    const elapsed = Date.now() - start;
    const remaining = Math.max(0, minDurationMs - elapsed);
    const t = setTimeout(() => setVisible(false), remaining);
    return () => clearTimeout(t);
  }, [ready, start, minDurationMs]);

  if (!visible) return null;

  return (
    <div className="jf-splash-root" role="status" aria-live="polite">
      <div className="jf-splash-inner">
        {/* Prefer SVG when available; fallback PNG path (preloaded) */}
        <img
          className="jf-splash-logo"
          src="/brand/logo/jobfast-logo-1024.png"
          alt="JOBFAST"
          loading="eager"
          width={512}
          height={512}
        />
      </div>
    </div>
  );
}
