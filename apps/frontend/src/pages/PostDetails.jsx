import React, {
  memo,
  useCallback,
} from "react";

// ======================================================
// 🌍 JOBFAST — POST DETAILS (PREMIUM OPTIMIZED)
// ======================================================

// ======================================================
// 📦 STATIC DATA
// ======================================================

const MOCK_POST = Object.freeze({
  id: 1,
  title: "Need Mason in Bavaro",
  description:
    "Looking for an experienced mason for construction work in Bavaro area.",
  type: "construction",
  category: "Mason",
  status: "OPEN",
  location: "Bavaro, Punta Cana",
  distance: "2.5 km",
  createdBy: "Ronald Monfils",
  phone: "+1 000 000 000",
  bio: "Experienced worker available for construction jobs.",
  createdAt: "2026-05-07",
});

// ======================================================
// 🎨 CONFIG
// ======================================================

const STATUS_CONFIG = Object.freeze({
  OPEN: Object.freeze({
    label: "OPEN",
    color: "#22c55e",
  }),
  CLOSED: Object.freeze({
    label: "CLOSED",
    color: "#ef4444",
  }),
  DEFAULT: Object.freeze({
    label: "UNKNOWN",
    color: "#64748b",
  }),
});

const TYPE_ICONS = Object.freeze({
  construction: "👷",
  business: "🏢",
  service: "🚀",
});

// ======================================================
// 🧠 HELPERS
// ======================================================

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const getStatusConfig = (status) =>
  STATUS_CONFIG[status] || STATUS_CONFIG.DEFAULT;

const formatDate = (date) => dateFormatter.format(new Date(date));

// ======================================================
// 🎨 INFO ROW
// ======================================================

const InfoRow = memo(function InfoRow({ label, value }) {
  return (
    <div style={styles.infoRow}>
      <span style={styles.infoLabel}>{label}</span>
      <span style={styles.infoValue}>{value}</span>
    </div>
  );
});

// ======================================================
// 🎨 EMPTY STATE
// ======================================================

const EmptyState = memo(function EmptyState() {
  return (
    <main style={styles.container}>
      <div style={styles.glow}></div>
      <section style={styles.emptyCard}>
        <h2 style={styles.emptyTitle}>Post not found</h2>
        <p style={styles.emptyText}>This post may have been removed.</p>
      </section>
    </main>
  );
});

// ======================================================
// 🚀 MAIN COMPONENT
// ======================================================

function PostDetails({ post = MOCK_POST }) {
  const handleContact = useCallback(() => {
    alert("Chat system integration coming soon.");
  }, []);

  if (!post) {
    return <EmptyState />;
  }

  const {
    title,
    description,
    type,
    category,
    status,
    location,
    distance,
    createdBy,
    phone,
    bio,
    createdAt,
  } = post;

  const statusConfig = getStatusConfig(status);

  return (
    <main style={styles.container}>
      <div style={styles.glow}></div>

      <section style={styles.card}>
        {/* HEADER */}
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>
              {TYPE_ICONS[type]} {title}
            </h1>
            <p style={styles.category}>{category}</p>
          </div>

          <span style={{ ...styles.status, background: statusConfig.color }}>
            {statusConfig.label}
          </span>
        </header>

        {/* DESCRIPTION */}
        <p style={styles.description}>{description}</p>

        {/* DETAILS GRID */}
        <section style={styles.infoBox}>
          <InfoRow label="Type" value={type} />
          <InfoRow label="Location" value={`${location} (${distance})`} />
          <InfoRow label="Posted By" value={createdBy} />
          <InfoRow label="Phone" value={phone} />
          <InfoRow label="Posted On" value={formatDate(createdAt)} />
        </section>

        {/* BIO */}
        <section style={styles.bioBox}>
          <h2 style={styles.bioLabel}>About Creator</h2>
          <p style={styles.bioText}>{bio || "No bio provided."}</p>
        </section>

        {/* ACTIONS */}
        <div style={styles.actions}>
          <button
            type="button"
            onClick={handleContact}
            style={styles.button}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
              e.currentTarget.style.transform = "scale(1.01)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            💬 Contact User
          </button>
        </div>
      </section>
    </main>
  );
}

// ======================================================
// 🎨 TOKENS & STYLES (GLASS DESIGN SYSTEM)
// ======================================================

const glass = Object.freeze({
  background: "rgba(255, 255, 255, 0.05)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
});

const styles = Object.freeze({
  container: {
    minHeight: "100vh",
    background: "linear-gradient(to bottom, #020617, #0f172a)",
    color: "#ffffff",
    fontFamily: "Inter, Arial, sans-serif",
    padding: "40px 20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflowX: "hidden",
  },

  glow: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(circle at top, rgba(59, 130, 246, 0.15), transparent 65%)",
    zIndex: 1,
  },

  card: {
    ...glass,
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: "600px",
    padding: "32px",
    borderRadius: "24px",
    boxShadow: "0 25px 60px rgba(0,0,0,0.45)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "20px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
    paddingBottom: "20px",
  },

  title: {
    margin: 0,
    fontSize: "26px",
    fontWeight: "900",
    letterSpacing: "-0.5px",
    lineHeight: 1.3,
  },

  category: {
    margin: "6px 0 0 0",
    fontSize: "14px",
    color: "#60a5fa",
    fontWeight: "600",
  },

  status: {
    padding: "6px 14px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "800",
    color: "#fff",
    whiteSpace: "nowrap",
    letterSpacing: "0.5px",
  },

  description: {
    margin: "0 0 24px 0",
    fontSize: "15px",
    color: "#cbd5e1",
    lineHeight: 1.7,
  },

  infoBox: {
    display: "grid",
    gap: "12px",
    background: "rgba(255, 255, 255, 0.02)",
    padding: "16px",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.04)",
    marginBottom: "24px",
  },

  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    fontSize: "14px",
  },

  infoLabel: {
    color: "#94a3b8",
    fontWeight: "500",
  },

  infoValue: {
    color: "#f8fafc",
    fontWeight: "600",
    textTransform: "initial",
  },

  bioBox: {
    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
    paddingTop: "20px",
    marginBottom: "28px",
  },

  bioLabel: {
    margin: "0 0 8px 0",
    fontSize: "14px",
    color: "#94a3b8",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  bioText: {
    margin: 0,
    fontSize: "14px",
    color: "#cbd5e1",
    lineHeight: 1.6,
  },

  actions: {
    display: "flex",
  },

  button: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "14px",
    background: "linear-gradient(to right, #2563eb, #3b82f6)",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  emptyCard: {
    ...glass,
    position: "relative",
    zIndex: 2,
    padding: "50px 24px",
    borderRadius: "22px",
    textAlign: "center",
    maxWidth: "400px",
    width: "100%",
  },

  emptyTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "800",
  },

  emptyText: {
    marginTop: "8px",
    color: "#94a3b8",
    fontSize: "14px",
  },
});

export default memo(PostDetails);
