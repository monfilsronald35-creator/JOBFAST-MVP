import React, { useEffect, useState, useRef } from "react";

function Loader({ text = "Chaje opòtinite...", showProgress = true }) {
  const [progress, setProgress] = useState(5);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!showProgress) return;

    setProgress(5);
    let current = 5;

    const animate = () => {
      current += (98 - current) * 0.02;
      
      if (current >= 98) {
        setProgress(98);
        return;
      }

      setProgress(current);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [showProgress]);

  const isComplete = progress >= 98 || !showProgress;

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-screen w-full flex-col items-center justify-center select-none bg-navy-900 p-6 text-center"
      role="status"
      aria-live="polite"
      aria-busy={!isComplete}
      aria-label={isComplete ? "Chajman fini" : text}
    >
      <div className="pointer-events-none absolute h-[340px] w-[340px] rounded-full bg-radial-gradient from-gold-400/10 to-transparent blur-[50px]" />
      
      <div 
        className="h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-gold-400 will-change-transform" 
        style={{ animationDuration: "0.8s" }}
      />

      <p className="mt-5 text-xs font-black uppercase tracking-widest text-slate-400">
        {isComplete ? "Pre" : text}
      </p>

      {showProgress && (
        <div
          className="mt-4 h-1 w-44 overflow-hidden rounded-full bg-slate-800"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Pwogrè chajman"
        >
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-gold-400 transition-all duration-100 ease-out shadow-[0_0_12px_rgba(251,191,36,0.3)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default Loader;
