
import React from "react";
import { useNavigate } from "react-router-dom";

// ======================================================
// 🚀 JOBFAST HOME PAGE (AIRBNB / UBER POLISH FINAL)
// ======================================================

function Home() {
  const navigate = useNavigate();

  // 👉 (optional future auth hook)
  const user = null;

  const cards = [
    {
      icon: "👷",
      title: "Construction Network",
      description:
        "Boss • Mason • Carpenter • Electrician • Plumber • Engineer",
      note: "Find skilled construction workers nearby instantly.",
      button: "Find Workers",
      route: "/search",
    },
    {
      icon: "🏢",
      title: "Business Directory",
      description:
        "Restaurant • Hospital • Hotel • Lawyer • Mechanic • Company",
      note: "Explore trusted businesses near your location.",
      button: "Explore Businesses",
      route: "/search",
    },
    {
      icon: "🚀",
      title: "Services On Demand",
      description:
        "Chef • Taxi • Nurse • Delivery • Cleaning • Designer",
      note: "Book professional services in real-time.",
      button: "Request Service",
      route: "/create-post",
    },
    {
      icon: "📍",
      title: "Nearby GPS Search",
      description:
        "GPS • Nearby Discovery • Distance Search • Smart Matching",
      note: "Instantly discover nearby workers and services.",
      button: "Find Nearby",
      route: "/search",
    },
  ];

  return (
    <div style={styles.page}>

      {/* ================= NAVBAR ================= */}
      <header style={styles.navbar}>
        <div style={styles.logo}>🚀 JOBFAST</div>

        <div style={styles.navActions}>
          <button style={styles.loginBtn} onClick={() => navigate("/login")}>
            Login
          </button>

          <button
            style={styles.registerBtn}
            onClick={() => navigate("/register")}
          >
            Create Account
          </button>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section style={styles.hero}>
        <div style={styles.heroGlow}></div>

        <div style={styles.heroContent}>
          <div style={styles.badge}>
            🌍 GLOBAL MARKETPLACE PLATFORM
          </div>

          <h1 style={styles.title}>
            Connect Workers, Businesses & Services
          </h1>

          <p style={styles.subtitle}>
            Construction • Services • Businesses • GPS Discovery
          </p>

          <p style={styles.description}>
            JOBFAST helps people find workers, businesses, jobs and services nearby in real-time.
          </p>

          <div style={styles.actions}>
            <button
              style={styles.primaryButton}
              onClick={() =>
                navigate(user ? "/search" : "/register")
              }
            >
              Start Free
            </button>

            <button
              style={styles.secondaryButton}
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          </div>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section style={styles.statsSection}>
        {[
          ["10K+", "Workers"],
          ["5K+", "Businesses"],
          ["50+", "Services"],
          ["24/7", "Availability"],
        ].map(([number, text]) => (
          <div key={text} style={styles.statCard}>
            <h2 style={styles.statNumber}>{number}</h2>
            <p style={styles.statText}>{text}</p>
          </div>
        ))}
      </section>

      {/* ================= FEATURES ================= */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Marketplace Features</h2>

        <div style={styles.grid}>
          {cards.map((card, index) => (
            <div
              key={index}
              style={styles.card}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow =
                  "0 20px 40px rgba(0,0,0,0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={styles.icon}>{card.icon}</div>

              <h3 style={styles.cardTitle}>{card.title}</h3>

              <p style={styles.cardDescription}>{card.description}</p>

              <p style={styles.note}>{card.note}</p>

              <button
                style={styles.cardButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
                onClick={() => navigate(card.route)}
              >
                {card.button}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer style={styles.footer}>
        © 2026 JOBFAST. All rights reserved.
      </footer>
    </div>
  );
}

// ======================================================
// 🎨 STYLES (AIRBNB / UBER GLASS SYSTEM)
// ======================================================

const glass = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(12px)",
  transition: "all 0.35s ease",
  willChange: "transform",
};

const styles = {
  page: {
    minHeight: "100vh",
    overflowX: "hidden",
    background: "linear-gradient(to bottom, #020617, #0f172a)",
    color: "#fff",
    fontFamily: "Inter, Arial, sans-serif",
  },

  // NAVBAR (FINAL AIRBNB STYLE)
  navbar: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 24px",
    backdropFilter: "blur(18px)",
    background: "rgba(2,6,23,0.85)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },

  logo: {
    fontWeight: "800",
    fontSize: "22px",
  },

  navActions: {
    display: "flex",
    gap: "12px",
  },

  loginBtn: {
    padding: "10px 18px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.15)",
    cursor: "pointer",
    background: "transparent",
    color: "#fff",
  },

  registerBtn: {
    padding: "10px 18px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    background: "linear-gradient(to right, #2563eb, #3b82f6)",
    color: "#fff",
    fontWeight: "700",
  },

  // HERO (MOBILE PERFECT)
  hero: {
    position: "relative",
    textAlign: "center",
    padding: "120px 20px 90px",
  },

  heroGlow: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at top, rgba(59,130,246,0.25), transparent 60%)",
  },

  heroContent: {
    position: "relative",
    zIndex: 2,
    maxWidth: "900px",
    margin: "0 auto",
  },

  badge: {
    display: "inline-block",
    padding: "8px 18px",
    borderRadius: "999px",
    background: "rgba(59,130,246,0.15)",
    border: "1px solid rgba(59,130,246,0.35)",
    color: "#93c5fd",
    fontSize: "13px",
    marginBottom: "25px",
  },

  title: {
    fontSize: "clamp(42px, 8vw, 76px)",
    fontWeight: "900",
    lineHeight: 1.1,
    marginBottom: "20px",
  },

  subtitle: {
    fontSize: "clamp(18px, 3vw, 22px)",
    color: "#cbd5e1",
    marginBottom: "20px",
  },

  description: {
    fontSize: "clamp(15px, 2vw, 17px)",
    maxWidth: "700px",
    margin: "0 auto",
    color: "#94a3b8",
    lineHeight: 1.8,
  },

  actions: {
    display: "flex",
    justifyContent: "center",
    gap: "16px",
    marginTop: "40px",
    flexWrap: "wrap",
  },

  primaryButton: {
    padding: "14px 30px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(to right, #2563eb, #3b82f6)",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },

  secondaryButton: {
    padding: "14px 30px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },

  // STATS
  statsSection: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "20px",
    maxWidth: "1100px",
    margin: "0 auto 90px",
    padding: "0 20px",
  },

  statCard: {
    ...glass,
    borderRadius: "20px",
    padding: "25px",
    textAlign: "center",
  },

  statNumber: {
    fontSize: "34px",
    color: "#60a5fa",
  },

  statText: {
    color: "#cbd5e1",
  },

  // FEATURES
  section: {
    paddingBottom: "60px",
  },

  sectionTitle: {
    textAlign: "center",
    fontSize: "36px",
    fontWeight: "800",
    marginBottom: "45px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
    gap: "24px",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 20px",
  },

  card: {
    ...glass,
    borderRadius: "24px",
    padding: "28px",
    cursor: "pointer",
    transition: "all 0.35s ease",
    willChange: "transform",
  },

  icon: {
    fontSize: "42px",
    marginBottom: "18px",
  },

  cardTitle: {
    fontSize: "22px",
    marginBottom: "14px",
    fontWeight: "700",
  },

  cardDescription: {
    color: "#cbd5e1",
    lineHeight: 1.7,
    marginBottom: "12px",
  },

  note: {
    color: "#94a3b8",
    fontSize: "14px",
    marginBottom: "22px",
  },

  cardButton: {
    width: "100%",
    padding: "13px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(to right, #2563eb, #3b82f6)",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
    transition: "0.3s",
  },

  // FOOTER
  footer: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#64748b",
    fontSize: "14px",
  },
};

export default Home;