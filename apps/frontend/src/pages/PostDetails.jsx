
import React, { useState, useMemo, memo, useCallback, Component, useLayoutEffect, useEffect } from "react";
import PropTypes from "prop-types";

// ======================================================
// 🌍 JOBFAST UTILITIES, CONSTANTS & CONFIG
// ======================================================

const IS_SERVER = typeof window === "undefined";

const useSafeLayoutEffect = IS_SERVER ? useEffect : useLayoutEffect;

const DEFAULT_POST = Object.freeze({
  id: "0000",
  title: "Tit travay la manke",
  description: "Pa gen okenn deskripsyon ki disponib pou pòs sa a.",
  type: "default",
  category: "Jeneral",
  status: "CLOSED",
  distance: "0 km",
  createdBy: "Itilizatè JobFast",
  phone: "",
  bio: "Pa gen bio.",
  avatar: "",
  isVerified: false,
  isFeatured: false,
  viewsCount: 0,
  applicantsCount: 0,
  timeAgo: "Kounye a",
  lastUpdated: "Jodi a"
});

const FALLBACK_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' fill='%231e293b'/><text x='50%' y='55%' font-family='sans-serif' font-size='32' fill='%2364748b' text-anchor='middle'>JF</text></svg>";

const formatCurrency = (value) => {
  return Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

const sanitizePhone = (phone) => {
  if (!phone) return "";
  return String(phone).replace(/[^\d]/g, "");
};

const safeWindowOpen = (url) => {
  if (IS_SERVER || !url) return;
  try {
    window.open(url, "_blank", "noopener,noreferrer");
  } catch (e) {
    console.error("Window open failed:", e);
  }
};

const safeCopyToClipboard = async (text) => {
  if (IS_SERVER) return false;
  
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.warn("Modern clipboard failed, trying fallback:", e);
    }
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    const successful = document.execCommand("copy");
    return successful;
  } catch (err) {
    console.error("Fallback clipboard failed:", err);
    return false;
  } finally {
    if (document.body.contains(textArea)) {
      document.body.removeChild(textArea);
    }
  }
};

const CATEGORY_ICONS = Object.freeze({
  construction: "👷",
  business: "🏢",
  service: "🚀",
  default: "📌"
});

const GLOBAL_STYLES = `
@keyframes jf-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.jf-skeleton {
  background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%);
  background-size: 200% 100%;
  animation: jf-shimmer 1.5s infinite;
  border-radius: 8px;
}
.jf-btn-interactive {
  transition: all 0.2s ease-in-out !important;
}
.jf-btn-interactive:hover {
  opacity: 0.95 !important;
  transform: translateY(-1px) !important;
}
.jf-btn-interactive:active {
  transform: translateY(0px) !important;
}
.jobfast-slider {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  outline: none;
  margin: 8px 0;
}
.jobfast-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
  transition: transform 0.1s;
}
.jobfast-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}
`;

const useGlobalStyles = () => {
  useSafeLayoutEffect(() => {
    if (IS_SERVER) return;
    const id = "jobfast-global-styles";
    
    let styleElement = document.getElementById(id);
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = id;
      styleElement.innerHTML = GLOBAL_STYLES;
      document.head.appendChild(styleElement);
    }
  }, []);
};
// ======================================================
// 🧱 REUSABLE BUTTON COMPONENT
// ======================================================
const JfButton = memo(function JfButton({ onClick, children, variant = "secondary", ariaLabel = "", style = {} }) {
  const baseStyle = {
    padding: "10px 16px",
    border: "none",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    color: "#ffffff",
    ...style
  };

  const variants = {
    primary: { background: "linear-gradient(90deg, #1d4ed8, #2563eb)" },
    whatsapp: { background: "#22c55e" },
    secondary: { background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.08)" },
    danger: { background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)" }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="jf-btn-interactive"
      style={{ ...baseStyle, ...variants[variant] }}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
});

JfButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(["primary", "whatsapp", "secondary", "danger"]),
  ariaLabel: PropTypes.string,
  style: PropTypes.object,
};

// ======================================================
// 🛡️ ERROR BOUNDARY
// ======================================================
class ImageErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ ...this.props.fallbackStyle, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#64748b" }}>
          ⚠️ Error
        </div>
      );
    }
    return this.props.children;
  }
}

ImageErrorBoundary.propTypes = {
  fallbackStyle: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
};

// ======================================================
// 💀 SKELETON LOADING COMPONENT
// ======================================================
const SkeletonLoading = memo(function SkeletonLoading() {
  return (
    <main style={styles.container}>
      <div style={styles.card}>
        <div className="jf-skeleton" style={{ height: "32px", width: "70%", marginBottom: "16px" }} />
        <div className="jf-skeleton" style={{ height: "18px", width: "40%", marginBottom: "24px" }} />
        <div className="jf-skeleton" style={{ height: "80px", width: "100%", marginBottom: "20px" }} />
        <div className="jf-skeleton" style={{ height: "120px", width: "100%" }} />
      </div>
    </main>
  );
});

// ======================================================
// 📊 SUB-COMPONENT: ISOLATED SIMULATOR CALCULATOR
// ======================================================
const RevenueCalculator = memo(function RevenueCalculator({ defaultCommission, lastUpdated }) {
  const [totalJobs, setTotalJobs] = useState(60);
  const [avgJobValue, setAvgJobValue] = useState(150);
  const [operatingCost, setOperatingCost] = useState(1500);

  const metrics = useMemo(() => {
    const jobs = Math.max(0, Number(totalJobs) || 0);
    const val = Math.max(0, Number(avgJobValue) || 0);
    const cost = Math.max(0, Number(operatingCost) || 0);
    const commPct = Math.max(0, Number(defaultCommission) || 0);

    const monthlyGross = jobs * val;
    const platformCommission = monthlyGross * (commPct / 100);
    const annualPlatformCommission = platformCommission * 12;
    const annualNetProfit = annualPlatformCommission - (cost * 12);
    const annualOpEx = cost * 12;
    const roiPercent = annualOpEx > 0 ? (annualNetProfit / annualOpEx) * 100 : 0;

    return {
      platformCommission: formatCurrency(platformCommission),
      annualPlatformCommission: formatCurrency(annualPlatformCommission),
      monthlyNetProfit: formatCurrency(annualNetProfit / 12),
      roi: `${roiPercent.toFixed(1)}%`,
    };
  }, [totalJobs, avgJobValue, operatingCost, defaultCommission]);

  return (
    <div style={styles.calcBox}>
      <h2 style={styles.calcLabel}>📊 Platform Revenue & ROI Simulator</h2>
      <p style={styles.calcDesc}>Ajiste paramèt yo pou wè pwojeksyon anyèl ak ROI an dirèk.</p>

      <div style={styles.formGrid}>
        <div style={styles.inputGroup}>
          <label style={styles.inputLabel}>Monthly Completed Jobs ({totalJobs})</label>
          <input type="range" min="5" max="300" value={totalJobs} className="jobfast-slider" onChange={(e) => setTotalJobs(Number(e.target.value))} />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.inputLabel}>Avg Job Value (${avgJobValue})</label>
          <input type="range" min="20" max="1000" step="10" value={avgJobValue} className="jobfast-slider" onChange={(e) => setAvgJobValue(Number(e.target.value))} />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.inputLabel}>Est. Monthly OpEx (${operatingCost})</label>
          <input type="range" min="100" max="5000" step="100" value={operatingCost} className="jobfast-slider" onChange={(e) => setOperatingCost(Number(e.target.value))} />
        </div>
      </div>

      <div style={styles.resultsContainer}>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>MONTHLY COMMISSION ({defaultCommission}%)</span>
          <strong style={styles.metricValue}>{metrics.platformCommission}</strong>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>EST. MONTHLY NET PROFIT</span>
          <strong style={styles.metricValue}>{metrics.monthlyNetProfit}</strong>
        </div>
        <div style={{ ...styles.metricCard, ...styles.highlightCard }}>
          <span style={styles.metricLabel}>ANNUAL COMMISSION PROJECTION</span>
          <strong style={{ ...styles.metricValue, color: "#60a5fa" }}>{metrics.annualPlatformCommission}</strong>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>ESTIMATED ANNUAL ROI</span>
          <strong style={styles.metricValue}>{metrics.roi}</strong>
        </div>
      </div>
      <p style={styles.lastUpdated}>Last updated: {lastUpdated || "Today"}</p>
    </div>
  );
});

RevenueCalculator.propTypes = {
  defaultCommission: PropTypes.number.isRequired,
  lastUpdated: PropTypes.string,
};

// ======================================================
// 🚀 MAIN COMPONENT: POST DETAILS & REVENUE METRICS
// ======================================================
function PostDetails({ 
  post: userPost = null, 
  loading = false, 
  defaultCommission = 10, 
  siteUrl = "https://jobfast.rd" 
}) {
  useGlobalStyles();
  
  const post = userPost || DEFAULT_POST;
  const [isBookmarked, setIsBookmarked] = useState(false);

  const toggleBookmark = useCallback(() => setIsBookmarked(p => !p), []);
  
  const handleShare = useCallback(async (e) => {
    e?.stopPropagation();
    if (IS_SERVER) return;
    const currentUrl = `${siteUrl}/post/${post.id}`;
    
    if (navigator?.share) {
      try { 
        await navigator.share({ title: post.title, text: post.description, url: currentUrl }); 
        return;
      } catch {
        // share dismissed or failed — fall through to clipboard
      }
    }
    
    const copied = await safeCopyToClipboard(currentUrl);
    if (copied) alert("Link copied to clipboard! 🚀");
  }, [post.id, post.title, post.description, siteUrl]);

  const copyPhone = useCallback(async (e) => {
    e?.stopPropagation();
    if (!post.phone) return;
    const copied = await safeCopyToClipboard(post.phone);
    if (copied) alert("Phone number copied! 📋");
  }, [post.phone]);

  const reportPost = useCallback((e) => {
    e?.stopPropagation();
    alert(`Post #${post.id} has been reported to administrators.`);
  }, [post.id]);

  const handleCall = useCallback((e) => {
    e?.stopPropagation();
    const cleanPhone = sanitizePhone(post.phone);
    if (cleanPhone) safeWindowOpen(`tel:${cleanPhone}`);
  }, [post.phone]);

  const handleWhatsApp = useCallback((e) => {
    e?.stopPropagation();
    const cleanPhone = sanitizePhone(post.phone);
    if (cleanPhone) safeWindowOpen(`https://wa.me/${cleanPhone}`);
  }, [post.phone]);

  if (loading) return <SkeletonLoading />;

  const isExpired = post.status === "CLOSED";
  const avatarUrl = post.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.createdBy || "User")}`;

  return (
    <main style={styles.container} role="main" aria-labelledby="post-title">
      <div style={styles.glow} />

      <section style={styles.card}>
        {/* TOP BADGES */}
        <div style={styles.badgeRow}>
          {post.isFeatured && <span style={styles.featuredBadge}>⭐ FEATURED</span>}
          <span style={styles.distanceBadge}>📍 {post.distance || "0 km"} away</span>
          <span style={styles.postId}>ID: #{post.id}</span>
        </div>

        {/* HEADER */}
        <header style={styles.header}>
          <div style={{ flex: 1, minWidth: "0" }}>
            <h1 style={styles.title} id="post-title">
              {CATEGORY_ICONS[post.type] || CATEGORY_ICONS.default} {post.title}
            </h1>
            <p style={styles.category}>{post.category}</p>
          </div>

          <span 
            role="status" 
            aria-live="polite" 
            style={{ ...styles.status, ...(isExpired ? styles.statusExpired : styles.statusOpen) }}
          >
            {isExpired ? "EXPIRED" : "OPEN"}
          </span>
        </header>

        {/* STATS COUNTER BAR */}
        <div style={styles.counterBar}>
          <div style={styles.counterItem}>👁️ <strong>{post.viewsCount || 0}</strong> Views</div>
          <div style={styles.counterItem}>💼 <strong>{post.applicantsCount || 0}</strong> Applicants</div>
          <div style={styles.counterItem}>🕒 {post.timeAgo || "Just now"}</div>
        </div>

        {/* DESCRIPTION */}
        <p style={styles.description}>{post.description}</p>

        {/* CREATOR PROFILE */}
        <div style={styles.bioBox}>
          <div style={styles.creatorContainer}>
            <ImageErrorBoundary fallbackStyle={styles.avatar}>
              <img
                src={avatarUrl}
                alt={post.createdBy || "Avatar"}
                style={styles.avatar}
                loading="lazy"
                onError={(e) => { e.target.src = FALLBACK_AVATAR; }}
              />
            </ImageErrorBoundary>
            <div style={styles.creatorMeta}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <strong style={styles.creatorName}>{post.createdBy}</strong>
                {post.isVerified && <span style={styles.verifiedBadge} title="Verified Account">✔</span>}
              </div>
              <p style={styles.bioText}>{post.bio || "No bio provided."}</p>
            </div>
          </div>
        </div>

        {/* 📊 INTERACTIVE REVENUE & ROI CALCULATOR */}
        <RevenueCalculator defaultCommission={defaultCommission} lastUpdated={post.lastUpdated} />

        {/* 🛠️ ACTIONS & TOOLBAR BUTTONS */}
        <div style={styles.actionGrid}>
          <JfButton variant="primary" style={{ flex: 1 }} onClick={handleCall} ariaLabel="Call User">
            📞 Call Now
          </JfButton>
          <JfButton 
            variant="whatsapp" 
            style={{ flex: 1 }} 
            onClick={handleWhatsApp} 
            ariaLabel="Contact via WhatsApp"
          >
            💬 WhatsApp
          </JfButton>
        </div>

        <div style={{ ...styles.actionGrid, marginTop: "12px" }}>
          <JfButton variant="secondary" onClick={copyPhone} ariaLabel="Copy Phone Number">📋 Copy Phone</JfButton>
          <JfButton variant="secondary" onClick={toggleBookmark} ariaLabel="Bookmark Post">
            {isBookmarked ? "❤️ Bookmarked" : "🔖 Bookmark"}
          </JfButton>
          <JfButton variant="secondary" onClick={handleShare} ariaLabel="Share Post Link">🔗 Share URL</JfButton>
          <JfButton variant="danger" onClick={reportPost} ariaLabel="Report Post">🚩 Report</JfButton>
        </div>
      </section>
    </main>
  );
}

PostDetails.propTypes = {
  loading: PropTypes.bool,
  defaultCommission: PropTypes.number,
  siteUrl: PropTypes.string,
  post: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    title: PropTypes.string,
    description: PropTypes.string,
    type: PropTypes.string,
    category: PropTypes.string,
    status: PropTypes.string,
    location: PropTypes.string,
    distance: PropTypes.string,
    createdBy: PropTypes.string,
    phone: PropTypes.string,
    bio: PropTypes.string,
    avatar: PropTypes.string,
    isVerified: PropTypes.bool,
    isFeatured: PropTypes.bool,
    viewsCount: PropTypes.number,
    applicantsCount: PropTypes.number,
    timeAgo: PropTypes.string,
    lastUpdated: PropTypes.string,
  }),
};

const glass = Object.freeze({
  background: "rgba(255, 255, 255, 0.03)",
  border: "1px solid rgba(255, 255, 255, 0.06)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
});

const styles = Object.freeze({
  container: {
    minHeight: "100vh",
    background: "linear-gradient(to bottom, #040815, #090d1a)",
    color: "#ffffff",
    fontFamily: "Inter, sans-serif",
    padding: "calc(40px + env(safe-area-inset-top, 0px)) 20px calc(40px + env(safe-area-inset-bottom, 0px)) 20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  glow: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(circle at top, rgba(37, 99, 235, 0.1), transparent 60%)",
    zIndex: 1,
  },
  card: {
    ...glass,
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: "580px",
    padding: "clamp(20px, 5vw, 32px)",
    borderRadius: "24px",
    boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
  },
  badgeRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    marginBottom: "14px",
    flexWrap: "wrap",
  },
  featuredBadge: {
    background: "rgba(234, 179, 8, 0.15)",
    color: "#eab308",
    fontSize: "10px",
    fontWeight: "800",
    padding: "4px 8px",
    borderRadius: "6px",
  },
  distanceBadge: {
    background: "rgba(255,255,255,0.05)",
    fontSize: "11px",
    color: "#cbd5e1",
    padding: "4px 8px",
    borderRadius: "6px",
  },
  postId: {
    marginLeft: "auto",
    fontSize: "11px",
    color: "#64748b",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "12px",
    paddingBottom: "16px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  title: { 
    margin: 0, 
    fontSize: "22px", 
    fontWeight: "800", 
    lineHeight: 1.3,
    overflowWrap: "break-word",
    wordBreak: "break-word"
  },
  category: { margin: "4px 0 0 0", fontSize: "12px", color: "#60a5fa", fontWeight: "600" },
  status: { padding: "4px 12px", borderRadius: "999px", fontSize: "11px", fontWeight: "800", flexShrink: 0 },
  statusOpen: { color: "#22c55e", background: "rgba(34, 197, 94, 0.15)" },
  statusExpired: { color: "#ef4444", background: "rgba(239, 68, 68, 0.15)" },
  counterBar: {
    display: "flex",
    gap: "16px",
    padding: "10px 0",
    fontSize: "12px",
    color: "#94a3b8",
    flexWrap: "wrap",
  },
  counterItem: { display: "flex", alignItems: "center", gap: "4px" },
  description: { 
    fontSize: "14.5px", 
    color: "#cbd5e1", 
    lineHeight: 1.6, 
    margin: "16px 0",
    overflowWrap: "break-word"
  },
  bioBox: {
    background: "rgba(255,255,255,0.01)",
    padding: "14px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.04)",
    marginBottom: "24px",
  },
  creatorContainer: { display: "flex", gap: "12px", alignItems: "center" },
  avatar: { width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover" },
  creatorMeta: { flex: 1, minWidth: "0" },
  creatorName: { fontSize: "14px", color: "#ffffff", overflowWrap: "break-word" },
  verifiedBadge: { color: "#3b82f6", fontWeight: "bold", fontSize: "12px", flexShrink: 0 },
  bioText: { margin: 0, fontSize: "12px", color: "#94a3b8", overflowWrap: "break-word" },
  calcBox: {
    background: "rgba(59, 130, 246, 0.03)",
    border: "1px solid rgba(59, 130, 246, 0.1)",
    padding: "16px",
    borderRadius: "18px",
    marginBottom: "24px",
  },
  calcLabel: { margin: 0, fontSize: "14px", fontWeight: "700" },
  calcDesc: { margin: "4px 0 14px 0", fontSize: "12px", color: "#94a3b8" },
  formGrid: { display: "flex", flexDirection: "column", gap: "12px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "4px" },
  inputLabel: { fontSize: "11px", color: "#cbd5e1" },
  resultsContainer: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginTop: "16px" },
  metricCard: { background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: "12px", display: "flex", flexDirection: "column" },
  highlightCard: { background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.15)" },
  metricLabel: { fontSize: "10px", color: "#64748b", fontWeight: "700" },
  metricValue: { fontSize: "18px", fontWeight: "800", marginTop: "2px" },
  lastUpdated: { fontSize: "10px", color: "#64748b", marginTop: "10px", textAlign: "right" },
  actionGrid: { display: "flex", gap: "10px", flexWrap: "wrap" },
});

export default memo(PostDetails);
