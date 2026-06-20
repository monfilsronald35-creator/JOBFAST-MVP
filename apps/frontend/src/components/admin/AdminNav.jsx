

import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useDeferredValue,
  memo,
} from "react";
import { NavLink, useLocation } from "react-router-dom";

/* =========================
   NAV CONFIG (RBAC READY)
========================= */
const NAV_ITEMS = [
  { label: "Dashboard", path: "/admin", icon: "📊", roles: ["admin", "manager"] },
  { label: "Users", path: "/admin/users", icon: "👤", roles: ["admin"] },
  { label: "Jobs", path: "/admin/jobs", icon: "💼", roles: ["admin", "manager"] },
  { label: "Businesses", path: "/admin/businesses", icon: "🏢", roles: ["admin"] },
  { label: "Payments", path: "/admin/payments", icon: "💰", roles: ["admin"] },
  { label: "Reports", path: "/admin/reports", icon: "🚨", roles: ["admin", "moderator"] },
  { label: "Analytics", path: "/admin/analytics", icon: "📈", roles: ["admin"] },
  { label: "Logs", path: "/admin/logs", icon: "🧾", roles: ["admin"] },
  { label: "Settings", path: "/admin/settings", icon: "⚙️", roles: ["admin"] },
];

/* =========================
   SAFE INIT
========================= */
const getInitialCollapsed = () => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("admin_nav_collapsed") === "true";
};

/* =========================
   ACTIVE ROUTE CHECK
========================= */
const isActiveRoute = (current, path) =>
  current === path || current.startsWith(path + "/");

/* =========================
   COMPONENT
========================= */
function AdminNav({
  userRole = "admin",
  notifications = {},
  onNavigate,
}) {
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(getInitialCollapsed);
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = userRole || "admin";
  const deferredSearch = useDeferredValue(search);

  /* =========================
     PERSIST STATE
  ========================= */
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("admin_nav_collapsed", String(collapsed));
  }, [collapsed]);

  /* =========================
     FILTER ENGINE
  ========================= */
  const filteredItems = useMemo(() => {
    const q = deferredSearch.toLowerCase();

    return NAV_ITEMS.filter(
      (item) =>
        item.roles.includes(role) &&
        item.label.toLowerCase().includes(q)
    );
  }, [role, deferredSearch]);

  /* =========================
     HANDLERS
  ========================= */
  const toggleNav = useCallback(() => setCollapsed((p) => !p), []);
  const toggleMobile = useCallback(() => setMobileOpen((p) => !p), []);

  const handleNavigate = useCallback(() => {
    onNavigate?.();
    setMobileOpen(false);
  }, [onNavigate]);

  /* =========================
     BADGE ENGINE
  ========================= */
  const getBadge = useCallback((path) => {
    const val = notifications?.[path];
    const num = Number(val);
    return Number.isFinite(num) ? num : 0;
  }, [notifications]);

  return (
    <>
      {mobileOpen && (
        <div className="overlay" onClick={toggleMobile} />
      )}

      <aside
        className={`admin-nav ${collapsed ? "collapsed" : ""} ${
          mobileOpen ? "mobile-open" : ""
        }`}
      >
        {/* HEADER */}
        <div className="admin-nav-header">
          {!collapsed && <h2 className="logo">JOBFAST ADMIN</h2>}

          <div className="actions">
            <button className="mobile-btn" onClick={toggleMobile}>☰</button>
            <button className="toggle-btn" onClick={toggleNav}>
              {collapsed ? "➡️" : "⬅️"}
            </button>
          </div>
        </div>

        {/* SEARCH */}
        {!collapsed && (
          <div className="nav-search">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu..."
            />
          </div>
        )}

        {/* NAV */}
        <nav className="admin-nav-links">
          {filteredItems.map((item) => {
            const active = isActiveRoute(location.pathname, item.path);
            const badge = getBadge(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavigate}
                className={`nav-item ${active ? "active" : ""}`}
              >
                <span className="icon">{item.icon}</span>

                {!collapsed && (
                  <>
                    <span className="label">{item.label}</span>
                    {badge > 0 && <span className="badge">{badge}</span>}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* FOOTER */}
        {!collapsed && (
          <div className="admin-nav-footer">
            <small>© {new Date().getFullYear()} JobFast Admin</small>
          </div>
        )}
      </aside>

      <style jsx>{`
        .admin-nav {
          width: 260px;
          height: 100vh;
          background: #0a0f1c;
          color: #fff;
          display: flex;
          flex-direction: column;
          border-right: 1px solid #1e293b;
          transition: 0.25s ease;
          position: sticky;
          top: 0;
        }

        .collapsed {
          width: 80px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          min-height: 52px;
          color: #cbd5e1;
          text-decoration: none;
          border-left: 3px solid transparent;
        }

        .nav-item:hover {
          background: #111827;
        }

        .active {
          background: #111827;
          color: #38bdf8;
          border-left-color: #38bdf8;
        }

        .badge {
          margin-left: auto;
          background: #ef4444;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
        }

        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
        }
      `}</style>
    </>
  );
}

export default memo(AdminNav);