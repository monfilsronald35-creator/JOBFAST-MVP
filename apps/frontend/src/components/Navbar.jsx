import React, { memo, useCallback } from "react";

// ======================================================
// 🌍 JOBFAST — GLOBAL NAVBAR (PRODUCTION FINAL)
// ======================================================

const NAV_ITEMS = Object.freeze([
  { label: "👷 Construction", key: "construction" },
  { label: "🏢 Business", key: "business" },
  { label: "🚀 Services", key: "services" },
  { label: "📍 Nearby", key: "nearby" },
]);

// ======================================================
// 🎯 NAV ITEM
// ======================================================
const NavItem = memo(function NavItem({ item, onNavigate }) {
  const handleClick = useCallback(() => {
    onNavigate(item.key);
  }, [onNavigate, item.key]);

  return (
    <button type="button" onClick={handleClick} style={styles.link}>
      {item.label}
    </button>
  );
});

// ======================================================
// 🔐 AUTH BUTTON
// ======================================================
const AuthButton = memo(function AuthButton({ id, label, onClick, primary }) {
  const handleClick = useCallback(() => {
    onClick(id);
  }, [onClick, id]);

  return (
    <button
      type="button"
      onClick={handleClick}
      style={primary ? styles.buttonPrimary : styles.button}
    >
      {label}
    </button>
  );
});

// ======================================================
// 🚀 NAVBAR
// ======================================================
function Navbar() {
  const handleAuthClick = useCallback((type) => {
    console.log("🚀 AUTH:", type);
  }, []);

  const handleNavClick = useCallback((key) => {
    console.log("🧭 NAV:", key);
  }, []);

  return (
    <nav style={styles.navbar} aria-label="Primary navigation">
      <div style={styles.container}>
        
        {/* BRAND */}
        <div style={styles.brand}>
          ⚡ JOBFAST<span style={styles.logoDot}>.RD</span>
        </div>

        {/* LINKS */}
        <div style={styles.links}>
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.key}
              item={item}
              onNavigate={handleNavClick}
            />
          ))}
        </div>

        {/* ACTIONS */}
        <div style={styles.actions}>
          <AuthButton
            id="login"
            label="Login"
            onClick={handleAuthClick}
          />

          <AuthButton
            id="register"
            label="Register"
            primary
            onClick={handleAuthClick}
          />
        </div>
      </div>
    </nav>
  );
}

// ======================================================
// 🎨 STYLES
// ======================================================
const styles = Object.freeze({
  navbar: {
    width: "100%",
    position: "sticky",
    top: 0,
    zIndex: 1000,
    padding: "14px 0",
  },

  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    padding: "0 16px",
  },

  brand: {
    fontSize: "20px",
    fontWeight: "900",
    color: "#fff",
    whiteSpace: "nowrap",
  },

  logoDot: {
    color: "#3b82f6",
  },

  links: {
    display: "flex",
    flex: 1,
    justifyContent: "center",
    gap: "8px",
  },

  link: {
    background: "transparent",
    border: "none",
    color: "var(--color-text-soft)",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "8px 12px",
    borderRadius: "10px",
  },

  actions: {
    display: "flex",
    gap: "10px",
  },

  button: {
    padding: "8px 14px",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.03)",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },

  buttonPrimary: {
    padding: "8px 14px",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(to right, #2563eb, #3b82f6)",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },
});

export default memo(Navbar);