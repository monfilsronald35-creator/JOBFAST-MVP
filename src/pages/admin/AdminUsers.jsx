import React, {
  memo,
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

/* ======================================================
   ENTERPRISE HELPERS (PURE FUNCTIONS)
====================================================== */

const formatDate = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
};

const getStatusStyle = (status) => {
  const map = {
    active: { color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
    banned: { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    pending: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  };

  return map[status] || { color: "#94a3b8", bg: "rgba(148,163,184,0.12)" };
};

const getInitial = (name = "") =>
  name.trim().charAt(0).toUpperCase() || "?";

/* ======================================================
   USER ROW (MEMOIZED + ULTRA LIGHT)
====================================================== */

const UserRow = memo(function UserRow({
  user,
  selected,
  onSelect,
  onView,
  onBan,
  onVerify,
}) {
  const u = user ?? {};
  const id = u._id || u.id;

  const fullName = useMemo(() => {
    return (
      u.name ||
      `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
      "Unknown User"
    );
  }, [u.name, u.firstName, u.lastName]);

  const statusStyle = useMemo(() => getStatusStyle(u.status), [u.status]);
  const createdAt = useMemo(() => formatDate(u.createdAt), [u.createdAt]);
  const initial = useMemo(() => getInitial(fullName), [fullName]);

  return (
    <tr className={selected ? "row selected" : "row"}>
      <td>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect?.(id)}
          aria-label={`Select ${fullName}`}
        />
      </td>

      <td className="user">
        <div className="avatar">
          {u.avatar ? (
            <img src={u.avatar} alt={fullName} loading="lazy" />
          ) : (
            initial
          )}
        </div>

        <div>
          <div className="name">{fullName}</div>
          <div className="email">{u.email || "-"}</div>
        </div>
      </td>

      <td>{u.role || "user"}</td>

      <td>
        <span
          style={{
            color: statusStyle.color,
            background: statusStyle.bg,
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {u.status || "unknown"}
        </span>
      </td>

      <td>{createdAt}</td>

      <td>
        <button onClick={() => onView?.(u)}>View</button>
        <button onClick={() => onBan?.(id)}>Ban</button>
        <button onClick={() => onVerify?.(id)}>Verify</button>
      </td>
    </tr>
  );
});

/* ======================================================
   ENTERPRISE ADMIN PANEL CORE
====================================================== */

function AdminUsers({
  users = [],
  loading = false,
  onView,
  onBan,
  onVerify,
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);

  const pageSize = 10;
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  /* ======================================================
     FILTER ENGINE (FAST + SAFE)
  ====================================================== */

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const role = (u.role || "").toLowerCase();

      return (
        name.includes(q) ||
        email.includes(q) ||
        role.includes(q)
      );
    });
  }, [users, search]);

  /* ======================================================
     PAGINATION SAFETY
  ====================================================== */

  const maxPage = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), maxPage));
  }, [maxPage]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  /* ======================================================
     SELECTION ENGINE (ENTERPRISE SAFE)
  ====================================================== */

  const toggleSelect = useCallback((id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  }, []);

  const pageIds = useMemo(
    () => paginated.map((u) => u._id || u.id),
    [paginated]
  );

  const allSelected =
    pageIds.length > 0 &&
    pageIds.every((id) => selected.includes(id));

  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      allSelected
        ? prev.filter((id) => !pageIds.includes(id))
        : Array.from(new Set([...prev, ...pageIds]))
    );
  }, [allSelected, pageIds]);

  const clearSelection = useCallback(() => setSelected([]), []);

  /* ======================================================
     BULK ACTIONS (PRODUCTION SAFE)
  ====================================================== */

  const bulkAction = useCallback(
    async (type) => {
      if (!selected.length) return;

      const ok = window.confirm(
        `${type.toUpperCase()} ${selected.length} users?`
      );

      if (!ok) return;

      for (const id of selected) {
        if (type === "ban") await onBan?.(id);
        if (type === "verify") await onVerify?.(id);
      }

      if (isMounted.current) setSelected([]);
    },
    [selected, onBan, onVerify]
  );

  /* ======================================================
     LOADING STATE
  ====================================================== */

  if (loading) {
    return (
      <div className="page" aria-busy="true">
        Loading Admin Panel...
      </div>
    );
  }

  /* ======================================================
     UI
  ====================================================== */

  return (
    <section className="page">

      <header className="header">
        <h1>ENTERPRISE ADMIN USERS</h1>
        <p>Full Control System</p>
      </header>

      <input
        className="search"
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.length === 0 ? (
        <div className="empty">No users found</div>
      ) : (
        <>
          {/* BULK ACTIONS */}
          <div className="bulk">
            <button onClick={toggleAll}>
              {allSelected ? "Unselect Page" : "Select Page"}
            </button>

            <button onClick={clearSelection} disabled={!selected.length}>
              Clear
            </button>

            {selected.length > 0 && (
              <>
                <button onClick={() => bulkAction("ban")}>
                  Ban ({selected.length})
                </button>

                <button onClick={() => bulkAction("verify")}>
                  Verify ({selected.length})
                </button>
              </>
            )}
          </div>

          {/* TABLE */}
          <table>
            <thead>
              <tr>
                <th></th>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginated.map((u) => (
                <UserRow
                  key={u._id || u.id}
                  user={u}
                  selected={selected.includes(u._id || u.id)}
                  onSelect={toggleSelect}
                  onView={onView}
                  onBan={onBan}
                  onVerify={onVerify}
                />
              ))}
            </tbody>
          </table>

          {/* PAGINATION */}
          <div className="pagination">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>

            <span>
              {page} / {maxPage}
            </span>

            <button
              disabled={page === maxPage}
              onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default memo(AdminUsers);