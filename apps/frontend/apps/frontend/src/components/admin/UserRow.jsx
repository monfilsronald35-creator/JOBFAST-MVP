import React, { memo, useMemo, useCallback } from "react";

/* =========================
   PURE HELPERS
========================= */
const formatDate = (date, locale = "en-US") => {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
};

const getStatusStyle = (status) => {
  switch (status) {
    case "active":
      return { color: "#22c55e", bg: "rgba(34,197,94,0.12)" };
    case "inactive":
      return { color: "#ef4444", bg: "rgba(239,68,68,0.12)" };
    case "pending":
      return { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
    default:
      return { color: "#94a3b8", bg: "rgba(148,163,184,0.12)" };
  }
};

const getInitial = (name = "") =>
  name.trim().charAt(0).toUpperCase() || "?";

/* =========================
   COMPONENT
========================= */
function UserRow({
  user,
  index,
  onView,
  onEdit,
  onDelete,
  loading = false,
  locale = "en-US",
}) {
  const u = user ?? {};

  const userId = u.id || u._id || index;

  /* =========================
     DERIVED DATA
  ========================= */
  const fullName = useMemo(() => {
    return (
      u.name ||
      `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() ||
      "Unknown User"
    );
  }, [u.name, u.firstName, u.lastName]);

  const email = u.email || "-";
  const role = u.role || "user";
  const status = u.status || "inactive";

  const createdAt = useMemo(
    () => formatDate(u.createdAt, locale),
    [u.createdAt, locale]
  );

  const statusStyle = useMemo(
    () => getStatusStyle(status),
    [status]
  );

  const avatarFallback = useMemo(
    () => getInitial(fullName),
    [fullName]
  );

  /* =========================
     STABLE HANDLERS (FIXED PRO)
  ========================= */
  const handleView = useCallback(() => {
    onView?.(u);
  }, [onView, userId, u]);

  const handleEdit = useCallback(() => {
    onEdit?.(u);
  }, [onEdit, userId, u]);

  const handleDelete = useCallback(() => {
    onDelete?.(u);
  }, [onDelete, userId, u]);

  /* =========================
     RENDER
  ========================= */
  return (
    <tr
      className={`user-row ${loading ? "loading" : ""}`}
      data-user-id={userId}
      aria-busy={loading}
    >
      <td className="index">{index + 1}</td>

      <td className="user">
        <div className="avatar">
          {u.avatar ? (
            <img src={u.avatar} alt={fullName} loading="lazy" />
          ) : (
            avatarFallback
          )}
        </div>

        <div className="info">
          <div className="name">{fullName}</div>
          <div className="email">{email}</div>
        </div>
      </td>

      <td><span className="role">{role}</span></td>

      <td>
        <span
          className="status"
          style={{
            color: statusStyle.color,
            background: statusStyle.bg,
          }}
        >
          {status}
        </span>
      </td>

      <td className="date">{createdAt}</td>

      <td className="actions">
        <button onClick={handleView} className="btn view">View</button>
        <button onClick={handleEdit} className="btn edit">Edit</button>
        <button onClick={handleDelete} className="btn delete">Delete</button>
      </td>

      <style jsx>{`
        .user-row {
          transition: 0.2s ease;
        }

        .user-row:hover {
          background: #0b1220;
        }

        td {
          padding: 14px 12px;
          border-bottom: 1px solid #1e293b;
          color: #e2e8f0;
          font-size: 14px;
        }

        .user {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #1e293b;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          overflow: hidden;
        }

        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .role,
        .status {
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 12px;
          text-transform: capitalize;
        }

        .actions {
          display: flex;
          gap: 6px;
        }

        .btn {
          padding: 6px 10px;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          background: #1e293b;
          transition: 0.2s ease;
        }

        .btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.25);
        }

        .view { color: #60a5fa; }
        .edit { color: #fbbf24; }
        .delete { color: #ef4444; }

        .loading {
          opacity: 0.5;
          pointer-events: none;
        }

        @media (max-width: 768px) {
          td {
            font-size: 12px;
            padding: 10px;
          }

          .actions {
            flex-direction: column;
          }
        }
      `}</style>
    </tr>
  );
}

/* =========================
   ULTRA SAFE MEMO (FINAL LEVEL)
========================= */
export default memo(UserRow, (prev, next) => {
  const p = prev.user || {};
  const n = next.user || {};

  return (
    p.id === n.id &&
    p._id === n._id &&
    p.updatedAt === n.updatedAt &&
    p.email === n.email &&
    p.status === n.status &&
    p.role === n.role &&
    p.avatar === n.avatar &&
    prev.loading === next.loading &&
    prev.locale === next.locale
  );
});