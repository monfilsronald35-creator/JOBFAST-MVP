import React, {
  memo,
  useCallback,
  useMemo,
  useState,
} from "react";

// ======================================================
// 🌍 JOBFAST — MY POSTS
// ======================================================

// ======================================================
// 📦 STATIC DATA
// ======================================================

const INITIAL_POSTS = Object.freeze([
  {
    id: 1,
    title: "Need Mason in Bavaro",
    type: "construction",
    category: "Mason",
    status: "OPEN",
    location: "Bavaro, Punta Cana",
    createdAt: "2026-05-07",
    timestamp: new Date("2026-05-07").getTime(),
  },

  {
    id: 2,
    title: "Hotel Reception Job",
    type: "business",
    category: "Hotel",
    status: "OPEN",
    location: "Punta Cana",
    createdAt: "2026-05-06",
    timestamp: new Date("2026-05-06").getTime(),
  },

  {
    id: 3,
    title: "Chef Lakay Needed",
    type: "service",
    category: "Chef",
    status: "CLOSED",
    location: "Veron",
    createdAt: "2026-05-05",
    timestamp: new Date("2026-05-05").getTime(),
  },
]);

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

const getStatusConfig = (status) =>
  STATUS_CONFIG[status] ||
  STATUS_CONFIG.DEFAULT;

const formatCount = (count) =>
  `${count} post${
    count !== 1 ? "s" : ""
  }`;

const formatDate = (date) =>
  new Intl.DateTimeFormat(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  ).format(new Date(date));

const sortPosts = (posts) =>
  [...posts].sort(
    (a, b) =>
      b.timestamp - a.timestamp
  );

// ======================================================
// 🎨 EMPTY STATE
// ======================================================

const EmptyState = memo(
  function EmptyState() {
    return (
      <div style={styles.emptyCard}>
        <p style={styles.emptyTitle}>
          No posts available
        </p>

        <p style={styles.emptyText}>
          Create your first JOBFAST
          post.
        </p>
      </div>
    );
  }
);

// ======================================================
// 🎨 BUTTON
// ======================================================

const Button = memo(function Button({
  children,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={styles.deleteBtn}
    >
      {children}
    </button>
  );
});

// ======================================================
// 🎨 POST CARD
// ======================================================

const PostCard = memo(function PostCard({
  post,
  onDelete,
}) {
  const status =
    getStatusConfig(post.status);

  const handleDelete =
    useCallback(() => {
      onDelete(post.id);
    }, [onDelete, post.id]);

  return (
    <article style={styles.card}>
      {/* HEADER */}

      <div style={styles.cardHeader}>
        <div>
          <h3 style={styles.cardTitle}>
            {
              TYPE_ICONS[
                post.type
              ]
            }{" "}
            {post.title}
          </h3>

          <p style={styles.cardMeta}>
            {post.category}
          </p>
        </div>

        <span
          style={{
            ...styles.status,
            background:
              status.color,
          }}
        >
          {status.label}
        </span>
      </div>

      {/* BODY */}

      <div style={styles.cardBody}>
        <p style={styles.text}>
          📍 {post.location}
        </p>

        <p style={styles.date}>
          Posted:{" "}
          {formatDate(
            post.createdAt
          )}
        </p>
      </div>

      {/* ACTIONS */}

      <div style={styles.actions}>
        <Button
          onClick={handleDelete}
        >
          Delete
        </Button>
      </div>
    </article>
  );
});

// ======================================================
// 🚀 MAIN COMPONENT
// ======================================================

function MyPosts() {
  const [posts, setPosts] =
    useState(INITIAL_POSTS);

  // ======================================================
  // 🧠 SORTED POSTS
  // ======================================================

  const sortedPosts =
    useMemo(() => {
      return sortPosts(posts);
    }, [posts]);

  // ======================================================
  // 🗑 DELETE POST
  // ======================================================

  const handleDelete =
    useCallback((id) => {
      setPosts((prev) =>
        prev.filter(
          (post) =>
            post.id !== id
        )
      );
    }, []);

  // ======================================================
  // 📊 TOTAL POSTS
  // ======================================================

  const totalPosts =
    sortedPosts.length;

  // ======================================================
  // 🎨 UI
  // ======================================================

  return (
    <main style={styles.container}>
      {/* HEADER */}

      <header style={styles.header}>
        <h1 style={styles.title}>
          My Posts
        </h1>

        <p style={styles.subtitle}>
          Manage your
          construction,
          business, and
          service posts
        </p>

        <p style={styles.count}>
          {formatCount(
            totalPosts
          )}
        </p>
      </header>

      {/* POSTS */}

      <section style={styles.list}>
        {totalPosts === 0 ? (
          <EmptyState />
        ) : (
          sortedPosts.map(
            (post) => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={
                  handleDelete
                }
              />
            )
          )
        )}
      </section>
    </main>
  );
}

// ======================================================
// 🎨 TOKENS
// ======================================================

const glass = Object.freeze({
  background:
    "rgba(255,255,255,0.05)",

  border:
    "1px solid rgba(255,255,255,0.08)",

  backdropFilter:
    "blur(14px)",

  WebkitBackdropFilter:
    "blur(14px)",
});

// ======================================================
// 🎨 STYLES
// ======================================================

const styles = Object.freeze({
  container: {
    minHeight: "100vh",

    padding: "24px",

    background:
      "linear-gradient(to bottom, #020617, #0f172a)",

    color: "#fff",

    fontFamily:
      "Inter, Arial, sans-serif",
  },

  header: {
    marginBottom: "24px",
  },

  title: {
    margin: 0,

    fontSize: "32px",

    fontWeight: "800",
  },

  subtitle: {
    marginTop: "8px",

    color: "#94a3b8",

    fontSize: "14px",

    lineHeight: 1.6,
  },

  count: {
    marginTop: "10px",

    color: "#cbd5e1",

    fontSize: "13px",
  },

  list: {
    display: "grid",

    gap: "14px",
  },

  card: {
    ...glass,

    padding: "18px",

    borderRadius: "22px",
  },

  cardHeader: {
    display: "flex",

    justifyContent:
      "space-between",

    alignItems: "flex-start",

    gap: "12px",

    marginBottom: "14px",
  },

  cardTitle: {
    margin: 0,

    fontSize: "18px",

    fontWeight: "700",
  },

  cardMeta: {
    marginTop: "6px",

    fontSize: "12px",

    color: "#94a3b8",
  },

  cardBody: {
    display: "grid",

    gap: "6px",
  },

  text: {
    margin: 0,

    color: "#cbd5e1",

    fontSize: "14px",

    lineHeight: 1.6,
  },

  date: {
    margin: 0,

    color: "#94a3b8",

    fontSize: "12px",
  },

  status: {
    padding: "6px 12px",

    borderRadius: "999px",

    fontSize: "11px",

    fontWeight: "700",

    color: "#fff",

    whiteSpace: "nowrap",
  },

  actions: {
    marginTop: "16px",
  },

  deleteBtn: {
    border: "none",

    borderRadius: "12px",

    padding: "10px 14px",

    background:
      "linear-gradient(to right, #dc2626, #ef4444)",

    color: "#fff",

    fontSize: "13px",

    fontWeight: "700",

    cursor: "pointer",
  },

  emptyCard: {
    ...glass,

    padding: "40px 20px",

    borderRadius: "22px",

    textAlign: "center",
  },

  emptyTitle: {
    margin: 0,

    fontSize: "16px",

    fontWeight: "700",
  },

  emptyText: {
    marginTop: "8px",

    color: "#94a3b8",

    fontSize: "13px",
  },
});

export default memo(MyPosts);