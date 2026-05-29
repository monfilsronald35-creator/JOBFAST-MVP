import React, { memo, useEffect, useRef, useState } from "react";

// ===============================
// 🎨 GLOBAL KEYFRAME (SAFE ONCE)
// ===============================
const KEYFRAME_STYLE = `
@keyframes productionLoaderSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;

let injected = false;

function injectKeyframes() {
  if (injected || typeof document === "undefined") return;

  const style = document.createElement("style");
  style.textContent = KEYFRAME_STYLE;
  document.head.appendChild(style);

  injected = true;
}

// ===============================
// 🚀 LOADER
// ===============================
function Loader({ text = "Loading...", showProgress = true }) {
  const [progress, setProgress] = useState(5);

  const rafRef = useRef(null);
  const progressRef = useRef(5);
  const lastUpdateRef = useRef(0); // Tracks time to normalize refresh rates

  // Inject CSS once (StrictMode safe)
  useEffect(() => {
    injectKeyframes();
  }, []);

  // Progress animation engine
  useEffect(() => {
    if (!showProgress) return;

    progressRef.current = 5;
    setProgress(5);
    lastUpdateRef.current = performance.now();

    const animate = (timestamp) => {
      // Calculate time passed since the last step
      const delta = timestamp - lastUpdateRef.current;

      // Only update roughly every 30ms (gives a smooth look without melting the CPU)
      if (delta >= 30) {
        const nextValue =
          progressRef.current + (98 - progressRef.current) * 0.015; // Adjusted multiplier for time-throttling

        progressRef.current = nextValue >= 98 ? 98 : nextValue;
        lastUpdateRef.current = timestamp;

        // Micro-optimization check
        setProgress((prev) =>
          Math.abs(prev - progressRef.current) < 0.01
            ? prev
            : progressRef.current
        );
      }

      if (progressRef.current < 98) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [showProgress]);

  const isComplete = progress >= 98 || !showProgress;

  return (
    <div
      style={styles.container}
      role="status"
      aria-live="polite"
      aria-busy={!isComplete}
    >
      <div style={styles.glow} />
      <div style={styles.spinner} />
      <p style={styles.text}>{isComplete ? "Ready" : text}</p>

      {showProgress && (
        <div style={styles.progressBar} aria-hidden="true">
          <div
            style={{
              ...styles.progressFill,
              width: `${progress}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}

export default memo(Loader);

// ===============================
// 🎨 STYLES
// ===============================
const styles = Object.freeze({
  container: {
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f172a",
    color: "#fff",
    fontFamily: "system-ui, -apple-system, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    width: "340px",
    height: "340px",
    background: "radial-gradient(circle, rgba(59,130,246,0.18), transparent 60%)",
    filter: "blur(45px)",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
  },
  spinner: {
    width: "44px",
    height: "44px",
    border: "4px solid #1e293b",
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    animation: "productionLoaderSpin 0.85s linear infinite",
    willChange: "transform",
  },
  text: {
    marginTop: "16px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#94a3b8",
    letterSpacing: "0.5px",
  },
  progressBar: {
    width: "200px",
    height: "4px",
    background: "#1e293b",
    borderRadius: "999px",
    marginTop: "14px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(to right, #2563eb, #3b82f6)",
    // Adjusted transition time to match the ~30ms frame-throttling cadence perfectly
    transition: "width 0.1s linear", 
  },
});
