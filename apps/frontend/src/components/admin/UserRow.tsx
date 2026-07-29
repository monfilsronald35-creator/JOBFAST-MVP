import React, { memo, useMemo, useCallback } from "react";

const formatDate = (date: unknown, locale = "en-US"): string => {
  if (!date) return "-";
  const d = new Date(String(date));
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "2-digit" }).format(d);
};

interface StatusStyle { color: string; bg: string; }
const getStatusStyle = (status: string): StatusStyle => {
  switch (status) {
    case "active":   return { color: "#22c55e", bg: "rgba(34,197,94,0.12)"   };
    case "inactive": return { color: "#ef4444", bg: "rgba(239,68,68,0.12)"   };
    case "pending":  return { color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  };
    default:         return { color: "#94a3b8", bg: "rgba(148,163,184,0.12)" };
  }
};

const getInitial = (name = ""): string => name.trim().charAt(0).toUpperCase() || "?";

interface UserData {
  id?:         string | number;
  _id?:        string | number;
  name?:       string;
  firstName?:  string;
  lastName?:   string;
  email?:      string;
  role?:       string;
  status?:     string;
  createdAt?:  string | number;
  updatedAt?:  string | number;
  avatar?:     string;
}

interface UserRowProps {
  user?:     UserData;
  index:     number;
  onView?:   (user: UserData) => void;
  onEdit?:   (user: UserData) => void;
  onDelete?: (user: UserData) => void;
  loading?:  boolean;
  locale?:   string;
}

function UserRow({ user, index, onView, onEdit, onDelete, loading = false, locale = "en-US" }: UserRowProps) {
  const u = user ?? {} as UserData;
  const userId = u.id ?? u._id ?? index;

  const fullName = useMemo(() =>
    u.name || `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Unknown User",
    [u.name, u.firstName, u.lastName]
  );

  const email       = u.email  || "-";
  const role        = u.role   || "user";
  const status      = u.status || "inactive";
  const createdAt   = useMemo(() => formatDate(u.createdAt, locale), [u.createdAt, locale]);
  const statusStyle = useMemo(() => getStatusStyle(status), [status]);
  const avatarFallback = useMemo(() => getInitial(fullName), [fullName]);

  const handleView   = useCallback(() => onView?.(u),   [onView,   u]);
  const handleEdit   = useCallback(() => onEdit?.(u),   [onEdit,   u]);
  const handleDelete = useCallback(() => onDelete?.(u), [onDelete, u]);

  const styles = `
    .user-row { transition:0.2s ease; }
    .user-row:hover { background:#0b1220; }
    td { padding:14px 12px; border-bottom:1px solid #1e293b; color:#e2e8f0; font-size:14px; }
    .user { display:flex; align-items:center; gap:10px; }
    .avatar { width:36px; height:36px; border-radius:50%; background:#1e293b; display:flex; align-items:center; justify-content:center; font-weight:700; overflow:hidden; }
    .avatar img { width:100%; height:100%; object-fit:cover; }
    .role,.status { padding:4px 10px; border-radius:999px; font-size:12px; text-transform:capitalize; }
    .actions { display:flex; gap:6px; }
    .btn { padding:6px 10px; border:none; border-radius:6px; font-size:12px; cursor:pointer; background:#1e293b; transition:0.2s ease; }
    .btn:hover { transform:translateY(-1px); filter:brightness(1.25); }
    .view { color:#60a5fa; } .edit { color:#fbbf24; } .delete { color:#ef4444; }
    .loading { opacity:0.5; pointer-events:none; }
    @media (max-width:768px) { td { font-size:12px; padding:10px; } .actions { flex-direction:column; } }
  `;

  return (
    <tr className={`user-row ${loading ? "loading" : ""}`} data-user-id={String(userId)} aria-busy={loading}>
      <style>{styles}</style>
      <td className="index">{index + 1}</td>

      <td className="user">
        <div className="avatar">
          {u.avatar ? <img src={u.avatar} alt={fullName} loading="lazy" /> : avatarFallback}
        </div>
        <div className="info">
          <div className="name">{fullName}</div>
          <div className="email">{email}</div>
        </div>
      </td>

      <td><span className="role">{role}</span></td>

      <td>
        <span className="status" style={{ color: statusStyle.color, background: statusStyle.bg }}>
          {status}
        </span>
      </td>

      <td className="date">{createdAt}</td>

      <td className="actions">
        <button onClick={handleView}   className="btn view">View</button>
        <button onClick={handleEdit}   className="btn edit">Edit</button>
        <button onClick={handleDelete} className="btn delete">Delete</button>
      </td>
    </tr>
  );
}

export default memo(UserRow, (prev, next) => {
  const p = prev.user ?? {} as UserData;
  const n = next.user ?? {} as UserData;
  return (
    p.id        === n.id        &&
    p._id       === n._id       &&
    p.updatedAt === n.updatedAt &&
    p.email     === n.email     &&
    p.status    === n.status    &&
    p.role      === n.role      &&
    p.avatar    === n.avatar    &&
    prev.loading === next.loading &&
    prev.locale  === next.locale
  );
});