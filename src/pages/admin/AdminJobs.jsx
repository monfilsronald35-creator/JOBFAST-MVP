

import React, {
  memo,
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

/* ======================================================
   🧠 PURE UTILITIES (NO SIDE EFFECTS)
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

const formatMoney = (value, currency = "USD") => {
  const n = Number(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
};

const getStatusStyle = (status) => {
  const map = {
    active: { color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
    pending: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    rejected: { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    completed: { color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  };
  return map[status] || { color: "#94a3b8", bg: "rgba(148,163,184,0.12)" };
};

const safe = (v) => (v ?? "").toString();

/* ======================================================
   🔥 DEBOUNCE HOOK (ENTERPRISE SEARCH OPTIMIZATION)
====================================================== */

const useDebounce = (value, delay = 300) => {
  const [state, setState] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setState(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return state;
};

/* ======================================================
   🚀 JOB ROW (MEMO + LIGHT RENDER)
====================================================== */

const JobRow = memo(function JobRow({
  job,
  selected,
  onSelect,
  onView,
  onApprove,
  onReject,
  onDelete,
}) {
  const id = job._id || job.id;
  const title = job.title || "Untitled Job";

  const statusStyle = useMemo(() => getStatusStyle(job.status), [job.status]);
  const createdAt = useMemo(() => formatDate(job.createdAt), [job.createdAt]);

  return (
    <tr className={selected ? "row selected" : "row"}>
      <td>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(id)}
        />
      </td>

      <td>
        <div className="title">{safe(title)}</div>
        <div className="sub">
          {safe(job.company)} • {safe(job.location)}
        </div>
      </td>

      <td>{formatMoney(job.budget)}</td>

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
          {job.status || "unknown"}
        </span>
      </td>

      <td>{createdAt}</td>

      <td>
        <button onClick={() => onView?.(job)}>View</button>
        <button onClick={() => onApprove?.(id)}>Approve</button>
        <button onClick={() => onReject?.(id)}>Reject</button>
        <button onClick={() => onDelete?.(id)}>Delete</button>
      </td>
    </tr>
  );
});

/* ======================================================
   🚀 MAIN ENTERPRISE ENGINE
====================================================== */

function AdminJobs({
  jobs = [],
  loading = false,
  onView,
  onApprove,
  onReject,
  onDelete,
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

  /* ================= SEARCH ================= */

  const debounced = useDebounce(search, 250);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return jobs;

    return jobs.filter((j) =>
      `${j.title} ${j.company} ${j.location} ${j.status}`
        .toLowerCase()
        .includes(q)
    );
  }, [jobs, debounced]);

  /* ================= PAGINATION ================= */

  const maxPage = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), maxPage));
  }, [maxPage]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  /* ================= SELECTION (SET POWER) ================= */

  const toggleSelect = useCallback((id) => {
    setSelected((prev) => {
      const set = new Set(prev);
      set.has(id) ? set.delete(id) : set.add(id);
      return [...set];
    });
  }, []);

  const pageIds = useMemo(
    () => paginated.map((j) => j._id || j.id),
    [paginated]
  );

  const allSelected = useMemo(() => {
    return pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  }, [pageIds, selected]);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const set = new Set(prev);

      if (allSelected) {
        pageIds.forEach((id) => set.delete(id));
      } else {
        pageIds.forEach((id) => set.add(id));
      }

      return [...set];
    });
  }, [allSelected, pageIds]);

  const clearSelection = useCallback(() => setSelected([]), []);

  /* ================= BULK ACTIONS (SAFE + PARALLEL) ================= */

  const bulkAction = useCallback(
    async (type) => {
      if (!selected.length) return;

      const ok = window.confirm(
        `${type.toUpperCase()} ${selected.length} jobs?`
      );
      if (!ok) return;

      try {
        await Promise.all(
          selected.map((id) => {
            if (type === "approve") return onApprove?.(id);
            if (type === "reject") return onReject?.(id);
            if (type === "delete") return onDelete?.(id);
          })
        );

        if (isMounted.current) setSelected([]);
      } catch (e) {
        console.error("Bulk action failed:", e);
      }
    },
    [selected, onApprove, onReject, onDelete]
  );

  /* ================= LOADING ================= */

  if (loading) {
    return <div className="page">Loading Admin Jobs...</div>;
  }

  /* ================= UI ================= */

  return (
    <section className="page">

      <h1>⚡ ULTRA ENTERPRISE JOBS PANEL</h1>

      <input
        placeholder="Search jobs..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.length === 0 ? (
        <div>No jobs found</div>
      ) : (
        <>
          <div>
            <button onClick={toggleAll}>
              {allSelected ? "Unselect Page" : "Select Page"}
            </button>

            <button onClick={clearSelection} disabled={!selected.length}>
              Clear
            </button>

            {selected.length > 0 && (
              <>
                <button onClick={() => bulkAction("approve")}>
                  Approve ({selected.length})
                </button>
                <button onClick={() => bulkAction("reject")}>
                  Reject ({selected.length})
                </button>
                <button onClick={() => bulkAction("delete")}>
                  Delete ({selected.length})
                </button>
              </>
            )}
          </div>

          <table>
            <thead>
              <tr>
                <th></th>
                <th>Job</th>
                <th>Budget</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginated.map((j) => (
                <JobRow
                  key={j._id || j.id}
                  job={j}
                  selected={selected.includes(j._id || j.id)}
                  onSelect={toggleSelect}
                  onView={onView}
                  onApprove={onApprove}
                  onReject={onReject}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </table>

          <div>
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Prev
            </button>

            <span>{page} / {maxPage}</span>

            <button disabled={page === maxPage} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default memo(AdminJobs);