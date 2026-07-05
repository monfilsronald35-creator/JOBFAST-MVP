/**
 * AvailabilityStatus.jsx
 *
 * Shared availability status page for ALL JOBFAST roles.
 *
 * - Uses real auth user (no more mock userId)
 * - Role-aware status options from gpsConfig.ROLE_AVAILABILITY_STATES
 * - Workers → PATCH /api/v1/workers/availability
 * - Marketplace providers → PATCH /api/v1/marketplace/availability
 * - Other roles → optimistic update only (MVP)
 * - No socket.io dependency (MVP — removed)
 * - Optimistic update: updates auth context immediately
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRoleAvailabilityStates } from '../config/gpsConfig';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

const MARKETPLACE_PROVIDER_ROLES = new Set([
  'restaurant', 'hotel', 'rental', 'office',
  'tourism', 'hospital', 'clinic', 'service_provider',
]);

function getAvailabilityEndpoint(role) {
  if (role === 'worker') return `${API_BASE}/workers/availability`;
  if (MARKETPLACE_PROVIDER_ROLES.has(role)) return `${API_BASE}/marketplace/availability`;
  return null; // optimistic only for other roles
}

export default function AvailabilityStatus() {
  const navigate              = useNavigate();
  const { user, login }       = useAuth();

  const role    = user?.role    || 'user';
  const userId  = user?._id    || user?.id;
  const options = getRoleAvailabilityStates(role);

  const currentAvailability = user?.availability
    || user?.marketplaceData?.availability
    || options[0]?.id
    || 'available';

  const [selected, setSelected] = useState(currentAvailability);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState(null);

  const handleSave = useCallback(async () => {
    if (selected === currentAvailability) {
      navigate(-1);
      return;
    }

    setSaving(true);
    setMsg(null);

    // Optimistic update
    const update = role === 'worker'
      ? { ...user, availability: selected }
      : {
          ...user,
          availability: selected,
          marketplaceData: { ...(user?.marketplaceData || {}), availability: selected },
        };
    login(update);

    const endpoint = getAvailabilityEndpoint(role);

    if (endpoint) {
      try {
        await fetch(endpoint, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ userId, availability: selected }),
        });
      } catch {
        /* keep optimistic state on network error */
      }
    }

    setSaving(false);
    setMsg('Estati mete ajou ✓');
    setTimeout(() => navigate(-1), 700);
  }, [selected, currentAvailability, user, userId, role, login, navigate]);

  const selectedOption = options.find(o => o.id === selected) || options[0];

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#0B1528] text-white pb-10">

      {/* Header */}
      <header className="mx-auto flex max-w-sm w-full items-center justify-between px-5 pt-6 pb-4 border-b border-slate-800/50">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xs font-black uppercase tracking-widest">
          Estati Disponibilite
        </h1>
        <div />
      </header>

      {/* Role context */}
      <div className="max-w-sm mx-auto w-full px-5 pt-5">
        <p className="text-[10px] text-slate-500 mb-1">
          Wap chanje estati pou wòl: <span className="text-slate-300 font-semibold capitalize">{role.replace('_', ' ')}</span>
        </p>
        <p className="text-xs text-slate-400 mb-5">
          Chwazi estati ou a pou lòt itilizatè yo ka wè disponibilite ou.
        </p>
      </div>

      {/* Status options */}
      <main className="flex-1 max-w-sm mx-auto w-full px-5">
        <div className="flex flex-col gap-3">
          {options.map((opt) => {
            const active = selected === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelected(opt.id)}
                className={`flex gap-4 p-4 rounded-2xl border text-left transition ${
                  active
                    ? 'border-yellow-400/60 bg-yellow-400/5'
                    : 'border-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="text-2xl shrink-0 leading-none pt-0.5">
                  {opt.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-white">{opt.label}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                </div>
                {active && (
                  <div className="shrink-0 w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center mt-0.5">
                    <span className="text-[8px] text-black font-black">✓</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {msg && (
          <p className="text-xs text-emerald-400 text-center mt-4">{msg}</p>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-sm mx-auto w-full px-5 mt-6">
        {/* Current selection preview */}
        {selectedOption && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-slate-800/50 rounded-xl">
            <span className="text-base">{selectedOption.emoji}</span>
            <span className="text-xs text-slate-300">
              Seleksyon: <span className="font-bold text-white">{selectedOption.label}</span>
            </span>
          </div>
        )}
        <button
          disabled={saving}
          onClick={handleSave}
          className="w-full bg-yellow-400 text-black font-black py-4 rounded-2xl text-sm disabled:opacity-60 transition"
        >
          {saving ? 'Ap sove...' : 'Mete ajou Estati'}
        </button>
      </footer>
    </div>
  );
}