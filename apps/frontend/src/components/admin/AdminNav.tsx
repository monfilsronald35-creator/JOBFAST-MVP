import React, {
  useState, useMemo, useEffect, useCallback, useDeferredValue, memo,
} from "react";
import { NavLink, useLocation } from "react-router-dom";

interface NavItem {
  label: string;
  path:  string;
  icon:  string;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",  path: "/admin",             icon: "📊", roles: ["admin", "manager"]   },
  { label: "Users",      path: "/admin/users",        icon: "👤", roles: ["admin"]              },
  { label: "Jobs",       path: "/admin/jobs",         icon: "💼", roles: ["admin", "manager"]   },
  { label: "Businesses", path: "/admin/businesses",   icon: "🏢", roles: ["admin"]              },
  { label: "Payments",   path: "/admin/payments",     icon: "💰", roles: ["admin"]              },
  { label: "Reports",    path: "/admin/reports",      icon: "🚨", roles: ["admin", "moderator"] },
  { label: "Analytics",  path: "/admin/analytics",    icon: "📈", roles: ["admin"]              },
  { label: "Logs",       path: "/admin/logs",         icon: "🧾", roles: ["admin"]              },
  { label: "Settings",   path: "/admin/settings",     icon: "⚙️", roles: ["admin"]              },
];

const getInitialCollapsed = (): boolean => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("admin_nav_collapsed") === "true";
};

const isActiveRoute = (current: string, path: string): boolean =>
  current === path || current.startsWith(path + "/");

interface AdminNavProps {
  userRole?:      string;
  notifications?: Record<string, number | string>;
  onNavigate?:    () => void;
}

function AdminNav({ userRole = "admin", notifications = {}, onNavigate }: AdminNavProps) {
  const location = useLocation();
  const [collapsed,   setCollapsed]   = useState<boolean>(getInitialCollapsed);
  const [search,      setSearch]      = useState("");
  const [mobileOpen,  setMobileOpen]  = useState(false);

  const role         = userRole || "admin";
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("admin_nav_collapsed", String(collapsed));
  }, [collapsed]);

  const filteredItems = useMemo(() => {
    const q = deferredSearch.toLowerCase();
    return NAV_ITEMS.filter(
      (item) => item.roles.includes(role) && item.label.toLowerCase().includes(q)
    );
  }, [role, deferredSearch]);

  const toggleNav    = useCallback(() => setCollapsed((p) => !p),    []);
  const toggleMobile = useCallback(() => setMobileOpen((p) => !p),  []);

  const handleNavigate = useCallback(() => {
    onNavigate?.();
    setMobileOpen(false);
  }, [onNavigate]);

  const getBadge = useCallback((path: string): number => {
    const val = notifications[path];
    const num = Number(val);
    return Number.isFinite(num) ? num : 0;
  }, [notifications]);

  const styles = `
    .admin-nav {
      width: 260px; height: 100vh; background: #0a0f1c; color: #fff;
      display: flex; flex-direction: column; border-right: 1px solid #1e293b;
      transition: 0.25s ease; position: sticky; top: 0;
    }
    .collapsed { width: 80px; }
    .nav-item {
      display: flex; align-items: center; gap: 12px; padding: 14px 16px;
      min-height: 52px; color: #cbd5e1; text-decoration: none;
      border-left: 3px solid transparent;
    }
    .nav-item:hover { background: #111827; }
    .active { background: #111827; color: #38bdf8; border-left-color: #38bdf8; }
    .badge { margin-left: auto; background: #ef4444; padding: 4px 10px; border-radius: 999px; font-size: 11px; }
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); }
  `;

  return (
    <>
      {mobileOpen && <div className="overlay" onClick={toggleMobile} />}
      <style>{styles}</style>

      <aside className={`admin-nav ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="admin-nav-header">
          {!collapsed && <h2 className="logo">JOBFAST ADMIN</h2>}
          <div className="actions">
            <button className="mobile-btn" onClick={toggleMobile}>☰</button>
            <button className="toggle-btn" onClick={toggleNav}>{collapsed ? "➡️" : "⬅️"}</button>
          </div>
        </div>

        {!collapsed && (
          <div className="nav-search">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search menu..." />
          </div>
        )}

        <nav className="admin-nav-links">
          {filteredItems.map((item) => {
            const active = isActiveRoute(location.pathname, item.path);
            const badge  = getBadge(item.path);
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

        {!collapsed && (
          <div className="admin-nav-footer">
            <small>© {new Date().getFullYear()} JobFast Admin</small>
          </div>
        )}
      </aside>
    </>
  );
}

export default memo(AdminNav);