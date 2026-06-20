import React, {
  memo,
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

/* ======================================================
   🤖 AI MODES (SMART ENGINE + EXPANDABLE)
====================================================== */

const AI_MODES = {
  reply: {
    label: "AI Reply",
    prompt: "Draft a professional customer support reply.",
  },
  summarize: {
    label: "Summarize",
    prompt: "Summarize the support ticket clearly and briefly.",
  },
  diagnose: {
    label: "Diagnose",
    prompt: "Find root cause and propose technical solution steps.",
  },
  schedule: {
    label: "Book Appointment",
    prompt: "Suggest appointment scheduling with user confirmation.",
  },
  escalate: {
    label: "Escalate",
    prompt: "Determine if ticket must be escalated to technical team.",
  },
};

/* ======================================================
   🧠 UTILITIES
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

const safe = (v) => (v ?? "").toString().trim();

const getStatusStyle = (status) => {
  const map = {
    open: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    pending: { color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
    resolved: { color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
    closed: { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  };

  return map[status] || { color: "#94a3b8", bg: "rgba(148,163,184,0.12)" };
};

/* ======================================================
   🔥 DEBOUNCE HOOK
====================================================== */

const useDebounce = (value, delay = 250) => {
  const [state, setState] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setState(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return state;
};

/* ======================================================
   🤖 AI API LAYER (CLEAN + SAFE + EXTENSIBLE)
====================================================== */

const askAI = async (payload, signal) => {
  const res = await fetch("/api/ai/support", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("AI request failed");
  return await res.json();
};

/* ======================================================
   🚀 SUPPORT ROW (OPTIMIZED RENDERING)
====================================================== */

const SupportRow = memo(function SupportRow({
  ticket,
  selected,
  onSelect,
  onView,
  onAI,
  onResolve,
  onClose,
  onDelete,
}) {
  const id = ticket._id || ticket.id;
  const title = ticket.subject || "No Subject";

  const statusStyle = useMemo(
    () => getStatusStyle(ticket.status),
    [ticket.status]
  );

  const createdAt = useMemo(
    () => formatDate(ticket.createdAt),
    [ticket.createdAt]
  );

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
          {safe(ticket.email)} • {safe(ticket.priority)}
        </div>
      </td>

      <td>{safe((ticket.message || "").slice(0, 70))}</td>

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
          {ticket.status || "unknown"}
        </span>
      </td>

      <td>{createdAt}</td>

      <td>
        <button onClick={() => onView(ticket)}>View</button>
        <button onClick={() => onAI(ticket, "reply")}>AI Reply</button>
        <button onClick={() => onAI(ticket, "schedule")}>📅 Book</button>
        <button onClick={() => onResolve(id)}>Resolve</button>
        <button onClick={() => onClose(id)}>Close</button>
        <button onClick={() => onDelete(id)}>Delete</button>
      </td>
    </tr>
  );
});

/* ======================================================
   🤖 AI PANEL (FULL SMART ASSISTANT)
====================================================== */

const AIPanel = ({ ticket, response, loading, onAsk, onStop }) => {
  if (!ticket) return <div>🤖 Select a ticket</div>;

  return (
    <div style={{ padding: 10 }}>
      <h3>🤖 AI Support Assistant</h3>

      <p><b>{ticket.subject || "No Subject"}</b></p>

      {Object.entries(AI_MODES).map(([key, mode]) => (
        <button key={key} onClick={() => onAsk(ticket, key)}>
          {mode.label}
        </button>
      ))}

      <button onClick={onStop} disabled={!loading}>
        Stop AI
      </button>

      <hr />

      {loading ? (
        <p>Thinking...</p>
      ) : (
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {response}
        </pre>
      )}
    </div>
  );
};

/* ======================================================
   🚀 MAIN SYSTEM (ENTERPRISE AI SUPPORT + BOOKING READY)
====================================================== */

function AdminSupport({
  tickets = [],
  loading = false,
  onView,
  onResolve,
  onClose,
  onDelete,
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);

  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);

  const pageSize = 10;

  const abortRef = useRef(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  /* ======================================================
     🤖 AI HANDLER (ENTERPRISE SAFE + LOCKED + SCALABLE)
  ====================================================== */

  const handleAI = useCallback(async (ticket, mode) => {
    if (!ticket) return;

    abortRef.current?.abort?.();

    const controller = new AbortController();
    abortRef.current = controller;

    const requestId = ++requestIdRef.current;

    setActiveTicket(ticket);
    setAiLoading(true);
    setAiResponse("");

    try {
      const data = await askAI(
        {
          ticket,
          mode,
          prompt: AI_MODES[mode]?.prompt,
          tone: "professional",
          context: "customer_support_system",
        },
        controller.signal
      );

      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      const result =
        mode === "schedule"
          ? `📅 APPOINTMENT SUGGESTION:\n\n${data.result}\n\n✔ Ready for booking flow`
          : data.result;

      setAiResponse(result);
    } catch (err) {
      if (!controller.signal.aborted) {
        setAiResponse("❌ AI temporarily unavailable");
      }
    } finally {
      setAiLoading(false);
    }
  }, []);

  const stopAI = useCallback(() => {
    abortRef.current?.abort?.();
    setAiLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort?.();
    };
  }, []);

  /* ======================================================
     🔍 SEARCH ENGINE
  ====================================================== */

  const debounced = useDebounce(search, 250);

  const filtered = useMemo(() => {
    const q = debounced.toLowerCase().trim();
    if (!q) return tickets;

    return tickets.filter((t) =>
      `${t.subject || ""} ${t.email || ""} ${t.status || ""} ${t.priority || ""} ${t.message || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [tickets, debounced]);

  /* ======================================================
     📄 PAGINATION
  ====================================================== */

  const maxPage = Math.max(1, Math.ceil(filtered.length / pageSize));

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  /* ======================================================
     ✅ SELECTION SYSTEM
  ====================================================== */

  const toggleSelect = useCallback((id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const allSelected =
    paginated.length > 0 &&
    paginated.every((t) => selected.includes(t._id || t.id));

  const toggleAll = useCallback(() => {
    setSelected(allSelected ? [] : paginated.map((t) => t._id || t.id));
  }, [allSelected, paginated]);

  /* ======================================================
     ⏳ LOADING
  ====================================================== */

  if (loading) return <div>Loading Support System...</div>;

  /* ======================================================
     🧩 UI
  ====================================================== */

  return (
    <div style={{ display: "flex", gap: 20 }}>

      {/* TABLE */}
      <section style={{ flex: 2 }}>

        <h1>🔥 ULTRA AI SUPPORT SYSTEM</h1>

        <input
          placeholder="Search tickets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                />
              </th>
              <th>Ticket</th>
              <th>Message</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((t) => (
              <SupportRow
                key={t._id || t.id}
                ticket={t}
                selected={selected.includes(t._id || t.id)}
                onSelect={toggleSelect}
                onView={onView}
                onAI={handleAI}
                onResolve={onResolve}
                onClose={onClose}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </section>

      {/* AI PANEL */}
      <aside style={{ flex: 1 }}>
        <AIPanel
          ticket={activeTicket}
          response={aiResponse}
          loading={aiLoading}
          onAsk={handleAI}
          onStop={stopAI}
        />
      </aside>

    </div>
  );
}

export default memo(AdminSupport);