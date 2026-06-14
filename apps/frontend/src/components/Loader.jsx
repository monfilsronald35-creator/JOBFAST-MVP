import React, { useEffect, useRef, useState } from "react";

function Loader({ text = "Chaje opòtinite...", showProgress = true }) {
  const [progress, setProgress] = useState(5);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!showProgress) return;

    let current = 5;

    const animate = () => {
      current += (98 - current) * 0.02;

      if (current >= 98) {
        setProgress(98);
        cancelAnimationFrame(rafRef.current);
        return;
      }

      setProgress(current);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafRef.current);
  }, [showProgress]);

  const isComplete = progress >= 98;

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-screen w-full flex-col items-center justify-center select-none bg-navy-900 p-6 text-center"
      role={showProgress ? "progressbar" : "status"}
      aria-live="polite"
      aria-busy={!isComplete}
      aria-label={text}
      aria-valuenow={showProgress ? Math.round(progress) : undefined}
      aria-valuemin={showProgress ? 0 : undefined}
      aria-valuemax={showProgress ? 100 : undefined}
    >
      <div className="pointer-events-none absolute h-[340px] w-[340px] rounded-full bg-gold-400/10 blur-[50px]" />

      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-gold-400 motion-reduce:animate-none"
        style={{ animationDuration: "0.8s" }}
        aria-hidden="true"
      />

      <p className="mt-5 text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse motion-reduce:animate-none">
        {isComplete ? "Pre" : text}
      </p>

      {showProgress && (
        <div className="mt-4 h-1 w-44 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-gold-400 transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default Loader;
