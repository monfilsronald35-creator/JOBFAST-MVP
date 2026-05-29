import React, { memo, useCallback } from "react";

// ======================================================
// 🎨 STYLES (IMMUTABLE)
// ======================================================
const styles = Object.freeze({
  container: {
    width: "100%",
    minHeight: "220px",
    padding: "40px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    fontFamily: "Inter, Arial, sans-serif",
    borderRadius: "22px",
  },

  icon: {
    fontSize: "48px",
    marginBottom: "12px",
    userSelect: "none",
  },

  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "700",
    color: "#f8fafc",
  },

  text: {
    marginTop: "8px",
    marginBottom: "20px",
    fontSize: "13px",
    color: "#94a3b8",
    maxWidth: "320px",
    lineHeight: "1.6",
  },

  button: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(to right, #2563eb, #3b82f6)",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
    transition: "all 0.2s ease",
  },
});

// ======================================================
// 🚀 COMPONENT
// ======================================================
function EmptyState({
  title = "No Data Found",
  message = "Nothing is available at the moment.",
  actionLabel,
  onAction,
}) {
  const hasAction =
    typeof onAction === "function" && Boolean(actionLabel);

  const handleClick = useCallback(() => {
    onAction?.();
  }, [onAction]);

  return (
    <section
      className="glass"
      style={styles.container}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={title}
    >
      <div style={styles.icon} aria-hidden="true">
        📭
      </div>

      <h2 style={styles.title}>{title}</h2>

      <p style={styles.text}>{message}</p>

      {hasAction && (
        <button
          type="button"
          onClick={handleClick}
          style={styles.button}
          aria-label={actionLabel}
        >
          {actionLabel}
        </button>
      )}
    </section>
  );
}

export default memo(EmptyState);