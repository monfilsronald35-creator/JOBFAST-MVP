import React, { memo, useMemo } from "react";

/* =========================
   FORMATTERS (PURE + SAFE)
========================= */
const formatNumber = (value, locale = "en-US") => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat(locale).format(n);
};

const formatCurrency = (value, currency = "USD", locale = "en-US") => {
  const n = Number(value);
  const safe = Number.isFinite(n) ? n : 0;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(safe);
};

const formatPercent = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0%";
  return `${n > 0 ? "+" : ""}${n}%`;
};

/* =========================
   SINGLE CARD COMPONENT
========================= */
const MetricCard = memo(({ icon, label, value, highlight }) => {
  return (
    <div className={`card ${highlight ? "highlight" : ""}`}>
      <div className="top">
        <span className="icon">{icon}</span>
        <span className="label">{label}</span>
      </div>
      <div className="value">{value}</div>
    </div>
  );
});

/* =========================
   MAIN DASHBOARD
========================= */
function AdminDashboard({
  stats = {},
  loading = false,
  locale = "en-US",
  currency = "USD",
}) {
  const safe = stats ?? {};

  const {
    users = 0,
    activeUsers = 0,
    jobs = 0,
    revenue = 0,
    growth = 0,
  } = safe;

  /* =========================
     METRICS (OPTIMIZED + STABLE)
  ========================= */
  const metrics = useMemo(() => {
    return [
      {
        key: "users",
        icon: "👤",
        label: "Users",
        value: formatNumber(users, locale),
      },
      {
        key: "activeUsers",
        icon: "🟢",
        label: "Active Users",
        value: formatNumber(activeUsers, locale),
      },
      {
        key: "jobs",
        icon: "💼",
        label: "Jobs",
        value: formatNumber(jobs, locale),
      },
      {
        key: "revenue",
        icon: "💰",
        label: "Revenue",
        value: formatCurrency(revenue, currency, locale),
      },
      {
        key: "growth",
        icon: "📈",
        label: "Growth",
        value: formatPercent(growth),
        highlight: true,
      },
    ];
  }, [users, activeUsers, jobs, revenue, growth, locale, currency]);

  /* =========================
     LOADING STATE (FAST PATH)
  ========================= */
  if (loading) {
    return (
      <section className="dashboard" aria-busy="true">
        <Header loading />
        <SkeletonGrid />
        <style jsx>{styles}</style>
      </section>
    );
  }

  /* =========================
     EMPTY STATE CHECK
  ========================= */
  const isEmpty = metrics.every((m) => m.value === "0" || m.value === "$0");

  return (
    <section className="dashboard" aria-label="Admin Dashboard">
      <Header />

      {isEmpty ? (
        <div className="empty">No data available</div>
      ) : (
        <div className="grid">
          {metrics.map((m) => (
            <MetricCard
              key={m.key}
              icon={m.icon}
              label={m.label}
              value={m.value}
              highlight={m.highlight}
            />
          ))}
        </div>
      )}

      <style jsx>{styles}</style>
    </section>
  );
}

/* =========================
   HEADER (MEMOIZED)
========================= */
const Header = memo(({ loading }) => (
  <div className="header">
    <h1>Admin Dashboard</h1>
    <p>
      {loading
        ? "Loading analytics..."
        : "Overview of your platform performance"}
    </p>
  </div>
));

/* =========================
   SKELETON GRID
========================= */
const SkeletonGrid = memo(() => (
  <div className="grid">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="card skeleton" />
    ))}
  </div>
));

/* =========================
   STYLES (PRO UI SYSTEM)
========================= */
const styles = `
.dashboard {
  padding: 22px;
  min-height: 100vh;
  background: #0a0f1c;
  color: #fff;
}

.header h1 {
  font-size: 26px;
  margin: 0;
}

.header p {
  color: #94a3b8;
  font-size: 13px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
}

/* CARD */
.card {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 14px;
  padding: 16px;
  transition: 0.2s ease;
}

.card:hover {
  transform: translateY(-3px);
  border-color: #38bdf8;
}

.highlight {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.08);
}

.top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.icon {
  font-size: 18px;
}

.label {
  font-size: 12px;
  color: #94a3b8;
}

.value {
  font-size: 22px;
  font-weight: 700;
}

/* EMPTY */
.empty {
  padding: 40px;
  text-align: center;
  color: #64748b;
}

/* SKELETON */
.skeleton {
  height: 80px;
  border-radius: 14px;
  background: linear-gradient(90deg,#1f2937,#374151,#1f2937);
  background-size: 200% 100%;
  animation: pulse 1.2s infinite;
}

@keyframes pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* RESPONSIVE */
@media (max-width: 1024px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 600px) {
  .grid { grid-template-columns: 1fr; }
}
`;

export default memo(AdminDashboard);