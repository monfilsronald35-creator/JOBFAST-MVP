import React, { memo, useCallback } from "react";

// ======================================================
const STATUS_COLORS = Object.freeze({
  OPEN: "#22c55e",
  BUSY: "#f59e0b",
  DEFAULT: "#ef4444",
});

const TYPE_LABELS = Object.freeze({
  construction: "👷 Construction",
  business: "🏢 Business",
  service: "🚀 Service",
  default: "📦 General",
});

// ======================================================
function PostCard({ post, onClick }) {
  if (!post?.id || !post?.title) return null;

  const {
    id,
    title,
    role,
    category,
    type,
    status,
    location,
    distance,
    name,
    bio,
    available,
  } = post;

  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.DEFAULT;
  const typeLabel = TYPE_LABELS[type] || TYPE_LABELS.default;

  // ⚡ ultra-stable handler (NO re-create unless id or callback changes)
  const handleClick = useCallback(() => {
    onClick?.(id);
  }, [onClick, id]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick?.(id);
      }
    },
    [onClick, id]
  );

  return (
    <article
      style={styles.card}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`Open post ${title}`}
    >
      <h3 style={styles.title}>{title}</h3>

      <p style={styles.text}>{role || category || "General"}</p>

      <p style={styles.type}>{typeLabel}</p>

      <p style={styles.text}>
        📍 {location || "Unknown"}
        {distance ? ` • ${distance}` : ""}
      </p>

      {name && <p style={styles.user}>👤 {name}</p>}
      {bio && <p style={styles.bio}>{bio}</p>}

      <span style={{ ...styles.status, background: statusColor }}>
        {status || "UNKNOWN"}
      </span>

      {type === "construction" && (
        <div style={styles.availability}>
          {available === false
            ? "🔴 Busy (Not Available)"
            : "🟢 Available for Work"}
        </div>
      )}
    </article>
  );
}

// ======================================================
// 🧠 HIGH-LEVEL MEMO STRATEGY (best balance performance + correctness)
function areEqual(prev, next) {
  const p = prev.post;
  const n = next.post;

  return (
    p?.id === n?.id &&
    p?.status === n?.status &&
    p?.available === n?.available &&
    p?.title === n?.title &&
    p?.distance === n?.distance &&
    prev.onClick === next.onClick
  );
}

export default memo(PostCard, areEqual);

// ======================================================
// 🎨 STYLES (minor UX polish upgrade)
const styles = Object.freeze({
  card: {
    background: "#1e293b",
    borderRadius: "12px",
    padding: "18px",
    color: "#fff",
    fontFamily: "system-ui, -apple-system, sans-serif",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
    cursor: "pointer",
    transition: "transform 0.18s ease, box-shadow 0.18s ease",
    willChange: "transform",
    outline: "none",
  },

  title: {
    margin: "0 0 6px 0",
    fontSize: "18px",
    fontWeight: "700",
    color: "#f8fafc",
  },

  text: {
    margin: "4px 0",
    fontSize: "14px",
    color: "#94a3b8",
  },

  type: {
    margin: "6px 0",
    fontSize: "13px",
    fontWeight: "600",
    color: "#60a5fa",
  },

  user: {
    margin: "8px 0 4px 0",
    fontSize: "14px",
    color: "#cbd5e1",
    borderTop: "1px solid #334155",
    paddingTop: "8px",
  },

  bio: {
    margin: "4px 0",
    fontSize: "13px",
    fontStyle: "italic",
    color: "#64748b",
  },

  status: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "700",
    marginTop: "12px",
    color: "#fff",
  },

  availability: {
    marginTop: "12px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#cbd5e1",
  },
});