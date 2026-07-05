/**
 * HomeMarketplace.jsx
 *
 * Role-aware marketplace home.
 *
 * BROWSER roles (worker, user): see all marketplace categories + search bar.
 * PROVIDER roles (restaurant, hotel, etc.): see their own manage view + browse button.
 * GUEST (not logged in): original marketing shell (unchanged behavior).
 *
 * Shares MarketplaceCore for the listing browse experience.
 * Does NOT duplicate any search logic from SearchScreen.jsx.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getAllCategoryConfigs,
  isMarketplaceProvider,
  isMarketplaceBrowser,
  getMarketplaceConfig,
} from '../config/marketplaceConfig';

// ── Category card used in the browser home grid ───────────────
function CategoryCard({ config, onClick }) {
  const COLOR_ACCENTS = {
    amber:   'hover:border-amber-500/40',
    cyan:    'hover:border-cyan-500/40',
    emerald: 'hover:border-emerald-500/40',
    slate:   'hover:border-slate-500/40',
    purple:  'hover:border-purple-500/40',
    red:     'hover:border-red-500/40',
    teal:    'hover:border-teal-500/40',
    yellow:  'hover:border-yellow-500/40',
  };
  const accent = COLOR_ACCENTS[config.accentColor] || 'hover:border-indigo-500/40';

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-4 bg-[#0f172a] rounded-2xl border border-slate-800 ${accent} transition text-left w-full`}
    >
      <span className="text-3xl shrink-0">{config.icon}</span>
      <div className="min-w-0">
        <h3 className="font-bold text-sm text-white">{config.label}</h3>
        <p className="text-[10px] text-slate-400 truncate">{config.browsePlaceholder}</p>
      </div>
    </button>
  );
}

// ── Provider quick-stats strip ────────────────────────────────
function ProviderHomeStrip({ config, user, onManage }) {
  const md = user?.marketplaceData || {};
  const bookings   = (md.bookings  || []).filter(b => b.status === 'pending').length;
  const reviews    = (md.reviews   || []).length;
  const availability = md.availability || 'available';

  return (
    <div className="space-y-4">

      {/* Welcome */}
      <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{config.icon}</span>
          <div>
            <h2 className="text-base font-bold text-white">
              {config.manageLabel}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{user?.name || config.label}</p>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { val: bookings,                label: 'Demann Annatant', color: 'text-yellow-400' },
          { val: reviews,                 label: 'Evalyasyon',       color: 'text-amber-500'  },
          { val: availability === 'available' ? '🟢' : '🔴', label: 'Eta', color: 'text-white' },
        ].map(({ val, label, color }) => (
          <div key={label} className="bg-[#0f172a] rounded-xl border border-slate-800 p-3 text-center">
            <div className={`text-xl font-bold ${color}`}>{val}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={onManage}
          className="py-3 rounded-xl bg-indigo-500 text-white font-bold text-sm">
          ⚙️ Jere Lis Ou
        </button>
        <button onClick={() => window.location.href = '/marketplace?browse=1'}
          className="py-3 rounded-xl bg-slate-800 text-slate-200 font-bold text-sm">
          🔍 Jwenn Sèvis
        </button>
      </div>

      {/* Manage tabs hint */}
      <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
        <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Manage</p>
        <div className="flex flex-wrap gap-2">
          {(config.manageTabs || []).map(tab => (
            <span key={tab}
              className="text-[10px] px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg capitalize">
              {tab}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Guest marketing shell (original HomeMarketplace content) ──
function GuestMarketplaceHome({ navigate }) {
  const categories = getAllCategoryConfigs();

  return (
    <main className="min-h-screen bg-[#0B1528] text-white">

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 px-6 pt-10 pb-8 border-b border-slate-800">
        <h1 className="text-2xl font-black mb-1">JOBFAST</h1>
        <p className="text-slate-400 text-sm">Platfòm entènasyonal pou biznis, sèvis, ak opòtinite</p>

        <div className="flex gap-3 mt-6">
          <button onClick={() => navigate('/register')}
            className="flex-1 py-3 bg-indigo-500 text-white font-bold rounded-xl text-sm">
            Kreye Kont
          </button>
          <button onClick={() => navigate('/login')}
            className="flex-1 py-3 bg-slate-800 text-white font-bold rounded-xl text-sm">
            Login
          </button>
        </div>
      </div>

      {/* Category grid */}
      <div className="px-5 py-6">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-4">
          Kategori yo
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {categories.map(cat => (
            <CategoryCard
              key={cat.role}
              config={cat}
              onClick={() => navigate(`/marketplace/${cat.role}`)}
            />
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="px-5 pb-10">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-4">
          Kijan Li Travay
        </h2>
        {[
          { icon: '👷', title: 'Pou Travayè',  steps: ['Kreye pwofil', 'Chèche sèvis', 'Fè rezèvasyon'] },
          { icon: '🏢', title: 'Pou Biznis',   steps: ['Enrejistre', 'Kreye lis', 'Resevwa kliyan'] },
          { icon: '✈️', title: 'Pou Touris',   steps: ['Chèche Hotel', 'Rezève Tou', 'Jwenn Gid'] },
        ].map(({ icon, title, steps }) => (
          <div key={title} className="bg-[#0f172a] rounded-2xl border border-slate-800 p-4 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{icon}</span>
              <h3 className="text-sm font-bold text-white">{title}</h3>
            </div>
            {steps.map(s => (
              <p key={s} className="text-xs text-slate-400 flex items-center gap-1">
                <span className="text-indigo-400">✓</span> {s}
              </p>
            ))}
          </div>
        ))}
      </div>

    </main>
  );
}

// ── Browser marketplace home (worker/user) ────────────────────
function BrowserMarketplaceHome({ navigate }) {
  const categories = getAllCategoryConfigs();
  const [search, setSearch] = useState('');

  const filtered = search
    ? categories.filter(c =>
        c.label.toLowerCase().includes(search.toLowerCase()) ||
        c.browsePlaceholder.toLowerCase().includes(search.toLowerCase())
      )
    : categories;

  return (
    <div className="min-h-screen bg-[#0B1528] text-white pb-28">

      <div className="px-5 pt-6 pb-3">
        <h1 className="text-base font-bold text-white mb-1">Marketplace</h1>
        <p className="text-[10px] text-slate-400 mb-4">Chèche tout kategori sèvis ak biznis</p>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Chèche kategori, sèvis..."
          className="w-full px-4 py-3 bg-[#162238] rounded-xl text-sm text-white placeholder-slate-400 outline-none focus:ring-1 focus:ring-indigo-400/40"
        />
      </div>

      <div className="px-5 space-y-2">
        {filtered.map(cat => (
          <CategoryCard
            key={cat.role}
            config={cat}
            onClick={() => navigate(`/marketplace/${cat.role}`)}
          />
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-500">
            <p>Pa gen kategori ki matche</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function HomeMarketplace() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const role = user?.role;

  // Guest (not authenticated)
  if (!isAuthenticated) {
    return <GuestMarketplaceHome navigate={navigate} />;
  }

  // Provider: show their own manage view
  if (isMarketplaceProvider(role)) {
    const config = getMarketplaceConfig(role);
    return (
      <div className="min-h-screen bg-[#0B1528] text-white pb-28">
        <div className="px-5 pt-6">
          <ProviderHomeStrip
            config={config}
            user={user}
            onManage={() => navigate('/dashboard')}
          />
          {/* Provider can also browse other categories */}
          <div className="mt-6">
            <h2 className="text-[10px] text-slate-500 font-bold uppercase mb-3">Lòt Kategori</h2>
            <div className="space-y-2">
              {getAllCategoryConfigs()
                .filter(c => c.role !== role)
                .slice(0, 4)
                .map(cat => (
                  <CategoryCard
                    key={cat.role}
                    config={cat}
                    onClick={() => navigate(`/marketplace/${cat.role}`)}
                  />
                ))}
            </div>
            <button onClick={() => navigate('/marketplace?browse=1')}
              className="w-full mt-3 py-2.5 rounded-xl bg-slate-800/50 text-slate-400 text-xs">
              Wè tout kategori →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Browser (worker, user, enterprise, company, etc.) — show all categories
  return <BrowserMarketplaceHome navigate={navigate} />;
}