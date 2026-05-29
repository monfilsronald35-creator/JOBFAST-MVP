
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";

// ======================================================
// 🌍 DATA LAYER
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

const STATUS_CONFIG = Object.freeze({
  OPEN: { label: "OPEN", color: "#22c55e" },
  CLOSED: { label: "CLOSED", color: "#ef4444" },
  DEFAULT: { label: "UNKNOWN", color: "#64748b" },
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
  STATUS_CONFIG[status] || STATUS_CONFIG.DEFAULT;

const sortPosts = (posts) =>
  [...posts].sort((a, b) => b.timestamp - a.timestamp);

// ======================================================
// 🎨 EMPTY STATE
// ======================================================

const EmptyState = memo(({ onCreate }) => (
  <div style={styles.emptyCard}>
    <h3 style={styles.emptyTitle}>No posts found</h3>
    <p style={styles.emptyText}>
      Create your first JOBFAST post to start getting opportunities.
    </p>

    <button style={styles.createBtn} onClick={onCreate}>
      Create Post
    </button>
  </div>
));

// ======================================================
// 🎨 POST CARD
// ======================================================

const PostCard = memo(function PostCard({ post, onDelete }) {
  const status = getStatusConfig(post.status);

  const handleDelete = useCallback(() => {
    onDelete(post.id);
  }, [onDelete, post.id]);

  return (
    <article style={styles.card}>
      <div style={styles.cardHeader}>
        <div>
          <h3 style={styles.cardTitle}>
            {TYPE_ICONS[post.type]} {post.title}
          </h3>
          <p style={styles.cardMeta}>{post.category}</p>
        </div>

        <span style={{ ...styles.status, background: status.color }}>
          {status.label}
        </span>
      </div>

      <div style={styles.cardBody}>
        <p style={styles.text}>📍 {post.location}</p>
        <p style={styles.date}>Posted: {post.createdAt}</p>
      </div>

      <button style={styles.deleteBtn} onClick={handleDelete}>
        Delete
      </button>
    </article>
  );
});

// ======================================================
// 🚀 DELETE MODAL (SAFE)
// ======================================================

const DeleteModal = memo(({ open, onCancel, onConfirm }) => {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div style={styles.modalOverlay} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.modalTitle}>Delete this post?</h3>

        <p style={styles.modalText}>
          This action is permanent and cannot be undone.
        </p>

        <div style={styles.modalActions}>
          <button style={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>

          <button style={styles.confirmBtn} onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
});

// ======================================================
// 🚀 MAIN COMPONENT (FULL SAFE ARCHITECTURE)
// ======================================================

function MyPosts() {
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [pendingDelete, setPendingDelete] = useState(null);

  const sortedPosts = useMemo(() => sortPosts(posts), [posts]);
  const totalPosts = sortedPosts.length;

  // ✅ SAFE delete request
  const requestDelete = useCallback((id) => {
    setPendingDelete(id);
  }, []);

  // 🔥 FIX: NO STALE STATE RISK ANYMORE
  const confirmDelete = useCallback(() => {
    setPosts((prev) => {
      if (pendingDelete == null) return prev;
      return prev.filter((p) => p.id !== pendingDelete);
    });

    setPendingDelete(null);
  }, [pendingDelete]);

  const cancelDelete = useCallback(() => {
    setPendingDelete(null);
  }, []);

  const handleCreate = useCallback(() => {
    console.log("navigate:/create-post");
  }, []);

  return (
    <main style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>My Posts</h1>

        <p style={styles.subtitle}>
          Manage your construction, business and service posts
        </p>

        <p style={styles.count}>
          {totalPosts} post{totalPosts !== 1 ? "s" : ""}
        </p>
      </header>

      <section style={styles.list}>
        {totalPosts === 0 ? (
          <EmptyState onCreate={handleCreate} />
        ) : (
          sortedPosts.map((post) => (
            <PostCard key={post.id} post={post} onDelete={requestDelete} />
          ))
        )}
      </section>

      <DeleteModal
        open={Boolean(pendingDelete)}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />
    </main>
  );
}

// ======================================================
// 🎨 STYLES (UNCHANGED)
// ======================================================

const styles = {
  container: {
    minHeight: "100vh",
    padding: "24px",
    background: "linear-gradient(to bottom, #020617, #0f172a)",
    color: "#fff",
    fontFamily: "Inter, Arial, sans-serif",
  },
  header: { marginBottom: "24px" },
  title: { fontSize: "32px", fontWeight: "800" },
  subtitle: { color: "#94a3b8", fontSize: "14px", marginTop: "8px" },
  count: { marginTop: "10px", color: "#cbd5e1", fontSize: "13px" },
  list: { display: "grid", gap: "14px" },
  card: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "22px",
    padding: "18px",
  },
  cardHeader: { display: "flex", justifyContent: "space-between" },
  cardTitle: { fontSize: "18px", fontWeight: "700" },
  cardMeta: { fontSize: "12px", color: "#94a3b8" },
  cardBody: { marginTop: "10px" },
  text: { color: "#cbd5e1", fontSize: "14px" },
  date: { fontSize: "12px", color: "#94a3b8" },
  status: {
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#fff",
  },
  deleteBtn: {
    marginTop: "12px",
    background: "#ef4444",
    border: "none",
    padding: "10px 14px",
    borderRadius: "10px",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },
  emptyCard: {
    padding: "40px",
    textAlign: "center",
    borderRadius: "22px",
    background: "rgba(255,255,255,0.04)",
  },
  emptyTitle: { fontSize: "16px", fontWeight: "700" },
  emptyText: { marginTop: "8px", color: "#94a3b8", fontSize: "13px" },
  createBtn: {
    marginTop: "15px",
    background: "#3b82f6",
    border: "none",
    padding: "10px 14px",
    borderRadius: "10px",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.65)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  modal: {
    background: "#0f172a",
    padding: "22px",
    borderRadius: "16px",
    width: "92%",
    maxWidth: "380px",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  modalTitle: { fontSize: "18px", fontWeight: "800" },
  modalText: { marginTop: "8px", color: "#94a3b8", fontSize: "13px" },
  modalActions: {
    display: "flex",
    gap: "10px",
    marginTop: "16px",
  },
  cancelBtn: {
    flex: 1,
    background: "#334155",
    border: "none",
    padding: "10px",
    borderRadius: "10px",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },
  confirmBtn: {
    flex: 1,
    background: "#ef4444",
    border: "none",
    padding: "10px",
    borderRadius: "10px",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },
};

export default memo(MyPosts);