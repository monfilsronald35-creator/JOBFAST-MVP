import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.jsx';

const NAV = [
  { path: '/admin',            icon: '📊', label: 'Dashboard'   },
  { path: '/admin/users',      icon: '👥', label: 'Users'       },
  { path: '/admin/jobs',       icon: '💼', label: 'Jobs'        },
  { path: '/admin/support',    icon: '🎫', label: 'Support'     },
  { path: '/admin/settings',   icon: '⚙️', label: 'Settings'    },
  { path: '/admin/governance', icon: '🛡', label: 'Governance'  },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <div className="min-h-screen flex bg-[#050B18] text-white font-sans">

      {/* ── Sidebar ─────────────────────────────────────────── */}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-56 flex flex-col bg-[#0d1526] border-r border-slate-800/60 transition-transform duration-200
        lg:translate-x-0 lg:static lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Logo */}
        <div className="h-14 flex items-center gap-2 px-4 border-b border-slate-800/60">
          <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center">
            <span className="text-slate-950 text-xs font-black">JF</span>
          </div>
          <div>
            <p className="text-sm font-black leading-none">JOBFAST</p>
            <p className="text-[9px] text-amber-400 font-bold tracking-widest">ADMIN</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map(item => (
            <NavLink key={item.path} to={item.path} end={item.path === '/admin'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all
                 ${isActive
                   ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                   : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`
              }>
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800/60 space-y-1">
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition">
            ← Back to App
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10 transition">
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="h-14 flex items-center gap-3 px-4 border-b border-slate-800/60 bg-[#0d1526]/80 backdrop-blur-sm sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            ☰
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
              {user?.role?.toUpperCase() || 'ADMIN'}
            </span>
            <span className="text-xs text-slate-400 font-semibold">{user?.name || 'Admin'}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
