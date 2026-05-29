import React, {
  memo,
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

// ===============================
// 🚀 STATIC DATA
// ===============================

const CATEGORY_CARDS = [
  {
    icon: "👷",
    title: "Construction",
    text:
      "Mason • Carpenter • Electrician • Plumber • Engineer",
  },

  {
    icon: "🏢",
    title: "Business",
    text:
      "Restaurants • Hotels • Clinics • Companies • Offices",
  },

  {
    icon: "🚀",
    title: "Services",
    text:
      "Delivery • Taxi • Cleaning • Nurse • Designer • Chef",
  },
];

// ===============================
// 🚀 REUSABLE COMPONENTS
// ===============================

const HoverCard = memo(
  ({
    children,
    style,
    hoverHandlers,
  }) => (
    <div
      style={style}
      {...hoverHandlers}
    >
      {children}
    </div>
  )
);

const ActionButton = memo(
  ({
    children,
    onClick,
    hoverHandlers,
    style,
  }) => (
    <button
      type="button"
      style={style}
      onClick={onClick}
      {...hoverHandlers}
    >
      {children}
    </button>
  )
);

// ===============================
// 🚀 PROFILE PAGE
// ===============================

function Profile() {
  const navigate = useNavigate();

  // ===============================
  // 👤 STATE
  // ===============================

  const [isAvailable, setIsAvailable] =
    useState(true);

  // ===============================
  // 🧠 USER DATA
  // ===============================

  const user = useMemo(
    () => ({
      fullName: "User Name",

      role: "Construction Worker",

      constructionRole: "Mason",

      businessType: "",

      serviceCategory: "",

      bio:
        "Experienced worker available for nearby jobs and services.",

      location: "Punta Cana",

      distance: "2.5km",

      joined: "2026",

      rating: "4.9",

      jobsCompleted: "124",
    }),
    []
  );

  // ===============================
  // 📊 STATS
  // ===============================

  const stats = useMemo(
    () => [
      {
        value: user.rating,
        label: "Rating",
      },

      {
        value: user.jobsCompleted,
        label: "Jobs Done",
      },

      {
        value: user.joined,
        label: "Joined",
      },
    ],
    [user]
  );

  // ===============================
  // 🔄 TOGGLE STATUS
  // ===============================

  const toggleAvailability =
    useCallback(() => {
      setIsAvailable((prev) => !prev);
    }, []);

  // ===============================
  // ✨ HOVER EFFECTS
  // ===============================

  const handleCardHover = useCallback(
    (e, active) => {
      e.currentTarget.style.transform =
        active
          ? "translateY(-6px)"
          : "translateY(0)";

      e.currentTarget.style.boxShadow =
        active
          ? "0 20px 40px rgba(0,0,0,0.35)"
          : "0 0 0 rgba(0,0,0,0)";
    },
    []
  );

  const handleButtonHover =
    useCallback((e, active) => {
      e.currentTarget.style.opacity =
        active ? "0.92" : "1";
    }, []);

  // ===============================
  // 🧠 REUSABLE HOVER PROPS
  // ===============================

  const cardHoverHandlers =
    useMemo(
      () => ({
        onMouseEnter: (e) =>
          handleCardHover(e, true),

        onMouseLeave: (e) =>
          handleCardHover(e, false),
      }),
      [handleCardHover]
    );

  const buttonHoverHandlers =
    useMemo(
      () => ({
        onMouseEnter: (e) =>
          handleButtonHover(e, true),

        onMouseLeave: (e) =>
          handleButtonHover(e, false),
      }),
      [handleButtonHover]
    );

  // ===============================
  // 🎨 UI
  // ===============================

  return (
    <div style={styles.page}>
      {/* NAVBAR */}

      <header style={styles.navbar}>
        <div
          role="button"
          tabIndex={0}
          style={styles.logo}
          onClick={() => navigate("/")}
        >
          🚀 JOBFAST
        </div>

        <div style={styles.navActions}>
          <Link
            to="/search"
            style={styles.navLink}
          >
            Search
          </Link>

          <Link
            to="/create-post"
            style={styles.navButton}
          >
            Create Post
          </Link>
        </div>
      </header>

      {/* HERO */}

      <section style={styles.hero}>
        <div style={styles.heroGlow}></div>

        <div style={styles.profileCard}>
          <div style={styles.profileTop}>
            <div style={styles.avatar}>
              {user.fullName.charAt(0)}
            </div>

            <div>
              <h1 style={styles.title}>
                {user.fullName}
              </h1>

              <p style={styles.role}>
                👷 {user.role}
              </p>

              <p style={styles.location}>
                📍 {user.location} •{" "}
                {user.distance}
              </p>
            </div>
          </div>

          {/* BIO */}

          <p style={styles.bio}>
            {user.bio}
          </p>

          {/* TAGS */}

          <div style={styles.tags}>
            {!!user.constructionRole && (
              <div style={styles.tag}>
                🔨{" "}
                {user.constructionRole}
              </div>
            )}

            {!!user.businessType && (
              <div style={styles.tag}>
                🏢 {user.businessType}
              </div>
            )}

            {!!user.serviceCategory && (
              <div style={styles.tag}>
                🚀{" "}
                {user.serviceCategory}
              </div>
            )}
          </div>

          {/* ACTIONS */}

          <div style={styles.profileActions}>
            <ActionButton
              style={styles.primaryButton}
              hoverHandlers={
                buttonHoverHandlers
              }
              onClick={() =>
                navigate(
                  "/edit-profile"
                )
              }
            >
              Edit Profile
            </ActionButton>
          </div>

          {/* STATS */}

          <div style={styles.statsGrid}>
            {stats.map((stat) => (
              <HoverCard
                key={stat.label}
                style={styles.statCard}
                hoverHandlers={
                  cardHoverHandlers
                }
              >
                <h2
                  style={
                    styles.statNumber
                  }
                >
                  {stat.value}
                </h2>

                <p
                  style={
                    styles.statText
                  }
                >
                  {stat.label}
                </p>
              </HoverCard>
            ))}
          </div>
        </div>
      </section>

      {/* STATUS */}

      <section style={styles.section}>
        <HoverCard
          style={styles.card}
          hoverHandlers={
            cardHoverHandlers
          }
        >
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>
              Availability Status
            </h2>

            <span
              style={{
                ...styles.statusBadge,

                background:
                  isAvailable
                    ? "rgba(34,197,94,0.18)"
                    : "rgba(239,68,68,0.18)",

                color:
                  isAvailable
                    ? "#4ade80"
                    : "#f87171",
              }}
            >
              {isAvailable
                ? "AVAILABLE"
                : "BUSY"}
            </span>
          </div>

          <p style={styles.cardText}>
            When available, your
            profile appears in nearby
            search results.
          </p>

          <ActionButton
            style={styles.primaryButton}
            hoverHandlers={
              buttonHoverHandlers
            }
            onClick={
              toggleAvailability
            }
          >
            {isAvailable
              ? "Set as Busy"
              : "Set as Available"}
          </ActionButton>
        </HoverCard>
      </section>

      {/* CATEGORIES */}

      <section
        style={styles.sectionBottom}
      >
        <div style={styles.grid}>
          {CATEGORY_CARDS.map(
            (item) => (
              <HoverCard
                key={item.title}
                style={styles.card}
                hoverHandlers={
                  cardHoverHandlers
                }
              >
                <div
                  style={
                    styles.cardIcon
                  }
                >
                  {item.icon}
                </div>

                <h3
                  style={
                    styles.cardTitle
                  }
                >
                  {item.title}
                </h3>

                <p
                  style={
                    styles.cardText
                  }
                >
                  {item.text}
                </p>
              </HoverCard>
            )
          )}
        </div>
      </section>
    </div>
  );
}

// ===============================
// 🎨 GLASS SYSTEM
// ===============================

const glass = {
  background:
    "rgba(255,255,255,0.05)",

  border:
    "1px solid rgba(255,255,255,0.08)",

  backdropFilter: "blur(18px)",

  WebkitBackdropFilter:
    "blur(18px)",

  transition:
    "all 0.35s ease",
};

// ===============================
// 🎨 STYLES
// ===============================

const styles = {
  page: {
    minHeight: "100vh",

    background:
      "linear-gradient(to bottom, #020617, #0f172a)",

    color: "#fff",

    fontFamily:
      "Inter, Arial, sans-serif",

    overflowX: "hidden",
  },

  navbar: {
    position: "sticky",

    top: 0,

    zIndex: 100,

    display: "flex",

    justifyContent:
      "space-between",

    alignItems: "center",

    flexWrap: "wrap",

    gap: "14px",

    padding: "18px 24px",

    backdropFilter:
      "blur(18px)",

    background:
      "rgba(2,6,23,0.85)",

    borderBottom:
      "1px solid rgba(255,255,255,0.08)",
  },

  logo: {
    fontSize: "22px",

    fontWeight: "900",

    cursor: "pointer",
  },

  navActions: {
    display: "flex",

    alignItems: "center",

    flexWrap: "wrap",

    gap: "14px",
  },

  navLink: {
    color: "#cbd5e1",

    textDecoration: "none",

    fontWeight: "600",
  },

  navButton: {
    padding: "10px 18px",

    borderRadius: "12px",

    background:
      "linear-gradient(to right, #2563eb, #3b82f6)",

    color: "#fff",

    textDecoration: "none",

    fontWeight: "700",

    transition: "0.3s",
  },

  hero: {
    position: "relative",

    padding:
      "110px 20px 40px",
  },

  heroGlow: {
    position: "absolute",

    inset: 0,

    background:
      "radial-gradient(circle at top, rgba(59,130,246,0.25), transparent 60%)",
  },

  profileCard: {
    ...glass,

    position: "relative",

    zIndex: 2,

    maxWidth: "1000px",

    margin: "0 auto",

    borderRadius: "28px",

    padding: "32px",

    boxShadow:
      "0 25px 60px rgba(0,0,0,0.45)",
  },

  profileTop: {
    display: "flex",

    gap: "22px",

    alignItems: "center",

    flexWrap: "wrap",
  },

  avatar: {
    width: "88px",

    height: "88px",

    borderRadius: "50%",

    display: "flex",

    justifyContent: "center",

    alignItems: "center",

    fontSize: "34px",

    fontWeight: "900",

    background:
      "linear-gradient(to right, #2563eb, #3b82f6)",
  },

  title: {
    fontSize: "36px",

    fontWeight: "900",

    marginBottom: "6px",
  },

  role: {
    color: "#cbd5e1",

    marginBottom: "5px",
  },

  location: {
    color: "#94a3b8",

    fontSize: "14px",
  },

  bio: {
    marginTop: "24px",

    color: "#cbd5e1",

    lineHeight: 1.8,
  },

  tags: {
    display: "flex",

    flexWrap: "wrap",

    gap: "12px",

    marginTop: "20px",
  },

  tag: {
    padding: "9px 14px",

    borderRadius: "999px",

    background:
      "rgba(59,130,246,0.15)",

    border:
      "1px solid rgba(59,130,246,0.3)",

    color: "#93c5fd",

    fontSize: "13px",

    fontWeight: "700",
  },

  profileActions: {
    marginTop: "24px",
  },

  statsGrid: {
    display: "grid",

    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",

    gap: "18px",

    marginTop: "30px",
  },

  statCard: {
    ...glass,

    borderRadius: "20px",

    padding: "22px",

    textAlign: "center",

    cursor: "pointer",

    willChange:
      "transform",
  },

  section: {
    maxWidth: "1000px",

    margin: "0 auto",

    padding:
      "0 20px 24px",
  },

  sectionBottom: {
    maxWidth: "1200px",

    margin: "0 auto",

    padding:
      "0 20px 80px",
  },

  grid: {
    display: "grid",

    gridTemplateColumns:
      "repeat(auto-fit, minmax(260px, 1fr))",

    gap: "24px",
  },

  card: {
    ...glass,

    borderRadius: "24px",

    padding: "26px",

    cursor: "pointer",

    willChange:
      "transform",
  },

  cardHeader: {
    display: "flex",

    justifyContent:
      "space-between",

    alignItems: "center",

    flexWrap: "wrap",

    gap: "12px",

    marginBottom: "16px",
  },

  cardTitle: {
    fontSize: "22px",

    fontWeight: "800",
  },

  cardText: {
    color: "#cbd5e1",

    lineHeight: 1.7,

    marginTop: "10px",
  },

  cardIcon: {
    fontSize: "42px",

    marginBottom: "16px",
  },

  statusBadge: {
    padding: "8px 14px",

    borderRadius: "999px",

    fontWeight: "800",

    fontSize: "12px",
  },

  primaryButton: {
    width: "100%",

    marginTop: "22px",

    padding: "13px",

    borderRadius: "14px",

    border: "none",

    background:
      "linear-gradient(to right, #2563eb, #3b82f6)",

    color: "#fff",

    fontWeight: "700",

    fontSize: "14px",

    cursor: "pointer",

    transition: "0.3s",
  },

  statNumber: {
    fontSize: "32px",

    color: "#60a5fa",

    marginBottom: "6px",
  },

  statText: {
    color: "#cbd5e1",
  },
};

export default memo(Profile);