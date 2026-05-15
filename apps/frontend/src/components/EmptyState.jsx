import React from "react";

// ===============================
// 🚀 EMPTY STATE (MVP SAFE)
// ===============================

function EmptyState({ title, message, actionLabel, onAction }) {
  return (
    <div style={styles.container}>

      <div style={styles.icon}>📭</div>

      <h2 style={styles.title}>
        {title || "No Data Found"}
      </h2>

      <p style={styles.text}>
        {message || "Nothing is available at the moment."}
      </p>

      {actionLabel && (
        <button
          style={{
            ...styles.button,
            cursor: onAction ? "pointer" : "default",
            opacity: onAction ? 1 : 0.6,
          }}
          onClick={() => onAction && onAction()}
        >
          {actionLabel}
        </button>
      )}

    </div>
  );
}

// ===============================
// 🎨 STYLES
// ===============================
const styles = {
  container: {
    width: "100%",
    padding: "30px 15px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "white",
    fontFamily: "Arial",
    background: "#0f172a",
    borderRadius: "10px",
  },

  icon: {
    fontSize: "40px",
    marginBottom: "10px",
  },

  title: {
    fontSize: "18px",
    marginBottom: "5px",
    color: "#e2e8f0",
  },

  text: {
    fontSize: "13px",
    color: "#94a3b8",
    marginBottom: "15px",
  },

  button: {
    padding: "8px 12px",
    border: "none",
    borderRadius: "6px",
    background: "#3b82f6",
    color: "white",
  },
};

export default EmptyState;