
import React, {
  memo,
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from "react";

// ======================================================
// 🌍 JOBFAST — SEARCH PAGE
// ======================================================

// ======================================================
// 📦 STATIC DATA
// ======================================================

const MOCK_RESULTS = [
  {
    id: 1,
    name: "Ronald Monfils",
    role: "Mason",
    type: "construction",
    location: "Bavaro, Punta Cana",
    distance: "2.5km",
    status: "AVAILABLE",
  },

  {
    id: 2,
    name: "Hotel Paradise",
    role: "Hotel",
    type: "business",
    location: "Punta Cana",
    distance: "3.1km",
    status: "OPEN",
  },

  {
    id: 3,
    name: "Chef Jean",
    role: "Chef Lakay",
    type: "service",
    location: "Veron",
    distance: "1.2km",
    status: "AVAILABLE",
  },
];

// ======================================================
// 🎨 STATUS CONFIG
// ======================================================

const STATUS_CONFIG = {
  AVAILABLE: {
    color: "#22c55e",
    label: "AVAILABLE",
  },

  OPEN: {
    color: "#22c55e",
    label: "OPEN",
  },

  BUSY: {
    color: "#ef4444",
    label: "BUSY",
  },

  OFFLINE: {
    color: "#64748b",
    label: "OFFLINE",
  },

  DEFAULT: {
    color: "#f59e0b",
    label: "UNKNOWN",
  },
};

// ======================================================
// 🧠 SEARCH CARD
// ======================================================

const ResultCard = memo(function ResultCard({
  item,
}) {
  const status =
    STATUS_CONFIG[item.status] ||
    STATUS_CONFIG.DEFAULT;

  return (
    <article style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={styles.name}>
          {item.name}
        </h3>

        <span
          style={{
            ...styles.status,
            background: status.color,
          }}
        >
          {status.label}
        </span>
      </div>

      <div style={styles.cardBody}>
        <p style={styles.text}>
          <strong>Role:</strong>{" "}
          {item.role}
        </p>

        <p style={styles.text}>
          <strong>Type:</strong>{" "}
          {item.type}
        </p>

        <p style={styles.text}>
          📍 {item.location} •{" "}
          {item.distance}
        </p>
      </div>
    </article>
  );
});

// ======================================================
// 🚀 MAIN COMPONENT
// ======================================================

function Search() {
  const [query, setQuery] =
    useState("");

  // ======================================================
  // ⚡ DEFERRED SEARCH
  // ======================================================

  const deferredQuery =
    useDeferredValue(query);

  // ======================================================
  // 🔎 HANDLE INPUT
  // ======================================================

  const handleChange =
    useCallback((e) => {
      setQuery(e.target.value);
    }, []);

  // ======================================================
  // 🔍 FILTER RESULTS
  // ======================================================

  const filteredResults =
    useMemo(() => {
      const search =
        deferredQuery
          .trim()
          .toLowerCase();

      if (!search) {
        return MOCK_RESULTS;
      }

      return MOCK_RESULTS.filter(
        ({
          name,
          role,
          type,
          location,
        }) =>
          name
            .toLowerCase()
            .includes(search) ||
          role
            .toLowerCase()
            .includes(search) ||
          type
            .toLowerCase()
            .includes(search) ||
          location
            .toLowerCase()
            .includes(search)
      );
    }, [deferredQuery]);

  // ======================================================
  // 📊 RESULTS COUNT
  // ======================================================

  const resultsCount =
    filteredResults.length;

  // ======================================================
  // 🎨 UI
  // ======================================================

  return (
    <main style={styles.container}>
      {/* HEADER */}

      <header style={styles.header}>
        <h1 style={styles.title}>
          Search Nearby
        </h1>

        <p style={styles.subtitle}>
          Construction • Businesses •
          Services On Demand
        </p>
      </header>

      {/* SEARCH */}

      <div style={styles.searchWrapper}>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search workers, businesses, services..."
          autoComplete="off"
          style={styles.input}
        />
      </div>

      {/* RESULTS INFO */}

      <p style={styles.resultsText}>
        {resultsCount} result
        {resultsCount !== 1 && "s"} found
      </p>

      {/* RESULTS */}

      <section style={styles.list}>
        {resultsCount === 0 ? (
          <div style={styles.emptyCard}>
            <p style={styles.empty}>
              No results found
            </p>
          </div>
        ) : (
          filteredResults.map((item) => (
            <ResultCard
              key={item.id}
              item={item}
            />
          ))
        )}
      </section>
    </main>
  );
}

// ======================================================
// 🎨 STYLES
// ======================================================

const styles = {
  container: {
    minHeight: "100vh",

    padding: "24px",

    background:
      "linear-gradient(to bottom, #020617, #0f172a)",

    color: "#ffffff",

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

  searchWrapper: {
    marginBottom: "16px",
  },

  input: {
    width: "100%",

    padding: "14px 16px",

    borderRadius: "14px",

    border:
      "1px solid rgba(255,255,255,0.08)",

    outline: "none",

    background:
      "rgba(255,255,255,0.06)",

    color: "#fff",

    fontSize: "14px",

    boxSizing: "border-box",

    backdropFilter:
      "blur(12px)",

    WebkitBackdropFilter:
      "blur(12px)",
  },

  resultsText: {
    fontSize: "13px",

    color: "#94a3b8",

    marginBottom: "16px",
  },

  list: {
    display: "grid",

    gap: "14px",
  },

  card: {
    padding: "18px",

    borderRadius: "18px",

    background:
      "rgba(255,255,255,0.05)",

    border:
      "1px solid rgba(255,255,255,0.08)",

    backdropFilter:
      "blur(16px)",

    WebkitBackdropFilter:
      "blur(16px)",

    transition:
      "transform 0.25s ease",
  },

  cardHeader: {
    display: "flex",

    justifyContent:
      "space-between",

    alignItems: "center",

    gap: "12px",

    marginBottom: "12px",
  },

  cardBody: {
    display: "grid",

    gap: "4px",
  },

  name: {
    margin: 0,

    fontSize: "18px",

    fontWeight: "700",
  },

  text: {
    margin: 0,

    color: "#cbd5e1",

    fontSize: "14px",

    lineHeight: 1.6,
  },

  status: {
    padding: "6px 12px",

    borderRadius: "999px",

    fontSize: "11px",

    fontWeight: "700",

    color: "#fff",

    whiteSpace: "nowrap",
  },

  emptyCard: {
    padding: "30px",

    borderRadius: "18px",

    textAlign: "center",

    background:
      "rgba(255,255,255,0.04)",

    border:
      "1px solid rgba(255,255,255,0.06)",
  },

  empty: {
    margin: 0,

    color: "#94a3b8",

    fontSize: "14px",
  },
};

export default memo(Search);