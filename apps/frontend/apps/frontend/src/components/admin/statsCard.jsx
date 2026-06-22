import React, { memo, useMemo } from "react";

function StatsCard({
  title = "Stat",
  value = 0,
  icon = "📊",
  trend = 0,
  color = "#38bdf8",
  loading = false,
  footer = "",
  locale = "en-US",
}) {
  /* =========================
     SAFE TREND ENGINE (OPTIMIZED)
  ========================= */
  const numericTrend = useMemo(() => {
    const n = Number(trend);
    return Number.isFinite(n) ? n : 0;
  }, [trend]);

  const hasTrend = numericTrend !== 0;
  const isPositive = numericTrend > 0;

  const trendLabel = useMemo(() => {
    if (loading || !hasTrend) return null;
    return `${isPositive ? "▲" : "▼"} ${Math.abs(numericTrend)}%`;
  }, [loading, hasTrend, isPositive, numericTrend]);

  /* =========================
     SAFE VALUE FORMATTER (ROBUST)
  ========================= */
  const formattedValue = useMemo(() => {
    if (loading) return null;

    if (value === null || value === undefined) return "0";

    const num = Number(value);

    if (!Number.isFinite(num)) return String(value);

    return new Intl.NumberFormat(locale).format(num);
  }, [value, loading, locale]);

  return (
    <div
      className="stats-card"
      style={{ "--accent": color }}
      aria-busy={loading}
      aria-live="polite"
      role="region"
      aria-label={title}
    >
      {/* HEADER */}
      <div className="stats-header">
        <div className="icon" aria-hidden="true">
          {icon}
        </div>

        {trendLabel && (
          <div className={`trend ${isPositive ? "up" : "down"}`}>
            {trendLabel}
          </div>
        )}
      </div>

      {/* VALUE */}
      <div className="stats-value">
        {loading ? (
          <div className="skeleton" aria-hidden="true" />
        ) : (
          formattedValue
        )}
      </div>

      {/* TITLE */}
      <div className="stats-title">{title}</div>

      {/* FOOTER */}
      {footer && <div className="stats-footer">{footer}</div>}

      {/* STYLES */}
      <style jsx>{`
        .stats-card {
          background: #0b1220;
          border: 1px solid #1e293b;
          border-radius: 16px;
          padding: 16px;
          color: #fff;
          position: relative;
          overflow: hidden;
          transition: 0.2s ease;
          min-height: 120px;
          will-change: transform;
        }

        .stats-card:hover {
          transform: translateY(-4px);
          border-color: var(--accent);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
        }

        .stats-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .icon {
          font-size: 22px;
        }

        .trend {
          font-size: 12px;
          font-weight: 600;
        }

        .up {
          color: #22c55e;
        }

        .down {
          color: #ef4444;
        }

        .stats-value {
          font-size: 28px;
          font-weight: 800;
          margin-top: 10px;
          letter-spacing: 0.5px;
        }

        .stats-title {
          font-size: 13px;
          color: #94a3b8;
          margin-top: 4px;
        }

        .stats-footer {
          font-size: 11px;
          color: #64748b;
          margin-top: 10px;
        }

        /* LOADING */
        .skeleton {
          width: 70%;
          height: 28px;
          border-radius: 6px;
          background: linear-gradient(
            90deg,
            #1e293b 25%,
            #334155 50%,
            #1e293b 75%
          );
          background-size: 200% 100%;
          animation: pulse 1.2s infinite ease-in-out;
        }

        @keyframes pulse {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        /* 📱 TABLET */
        @media (max-width: 1024px) {
          .stats-card {
            padding: 14px;
            min-height: 110px;
          }

          .stats-value {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
}

export default memo(StatsCard);