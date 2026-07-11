import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { escrowAPI } from '../../services/escrow';

const MOCK_ESCROWS = [
  {
    _id:'e1', jobTitle:'Elektrisyen pou batiman 3 etaj', amount:45000, currency:'HTG',
    employerName:'Konstriksyon HAÏTI SA', workerName:'Jean-Pierre M.',
    status:'in_progress', myRole:'worker', startDate:'2026-07-08', endDate:'2026-07-20',
    workerValidated:false, employerValidated:false,
    description:'Enstalasyon elektrik konplè pou batiman 3 nivo nan Pétion-Ville.',
  },
  {
    _id:'e2', jobTitle:'Penti enteryè 5 chanm', amount:18000, currency:'HTG',
    employerName:'Marie Dupont', workerName:'Anselme T.',
    status:'pending_validation', myRole:'employer', startDate:'2026-07-01', endDate:'2026-07-10',
    workerValidated:true, employerValidated:false,
    description:'Penti konplè 5 chanm nan rezidans Bourdon.',
  },
  {
    _id:'e3', jobTitle:'Plonbri saldeben × 2', amount:12000, currency:'HTG',
    employerName:'Résidence Belle Vue', workerName:'Calixte B.',
    status:'completed', myRole:'worker', startDate:'2026-06-25', endDate:'2026-07-02',
    workerValidated:true, employerValidated:true,
    description:'Travay plonbri nan 2 saldeben.',
  },
  {
    _id:'e4', jobTitle:'Chapant pou twati', amount:35000, currency:'HTG',
    employerName:'Jean-Robert P.', workerName:'Délira C.',
    status:'disputed', myRole:'employer', startDate:'2026-06-20', endDate:'2026-07-05',
    workerValidated:true, employerValidated:false,
    description:'Konstriksyon twati lakay 4 chanm.',
    disputeReason:'Travay la pa fini jan yo te konvni a.',
  },
];

const STATUS_CFG = {
  funded:             { color:'text-blue-400',   bg:'bg-blue-500/10 border-blue-500/30',    icon:'💰', label:'Finanse'              },
  in_progress:        { color:'text-amber-400',  bg:'bg-amber-500/10 border-amber-500/30',  icon:'⚡', label:'An kou'               },
  pending_validation: { color:'text-indigo-400', bg:'bg-indigo-500/10 border-indigo-500/30',icon:'⏳', label:'Kap tann validasyon'  },
  completed:          { color:'text-green-400',  bg:'bg-green-500/10 border-green-500/30',  icon:'✅', label:'Lajan lage'           },
  disputed:           { color:'text-red-400',    bg:'bg-red-500/10 border-red-500/30',      icon:'⚠️', label:'Dispute'              },
  cancelled:          { color:'text-slate-400',  bg:'bg-slate-800/60 border-slate-700',     icon:'✕',  label:'Anile'               },
};

function fmt(amount, currency = 'HTG') {
  return `${currency} ${Number(amount).toLocaleString()}`;
}

// ── Dispute modal ─────────────────────────────────────────────
function DisputeModal({ escrow, onClose, onDispute }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSending(true);
    await onDispute(escrow._id, reason);
    setSending(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full bg-[#0d1526] rounded-t-3xl p-5 pb-10 z-10">
        <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4" />
        <h3 className="text-base font-bold text-white mb-1">⚠️ {t('escrow.openDispute', { defaultValue: 'Ouvri Dispute' })}</h3>
        <p className="text-xs text-slate-400 mb-4">{t('escrow.disputeNote', { defaultValue: 'JOBFAST ap revize dispute a nan 48è.' })}</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4} required
            placeholder={t('escrow.disputeReason', { defaultValue: 'Esplike pwobl​èm nan…' })}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-red-500/50 resize-none" />
          <button type="submit" disabled={sending || !reason.trim()}
            className="w-full py-3.5 rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-40 text-white font-black text-sm transition">
            {sending ? '⏳…' : `⚠️ ${t('escrow.submitDispute', { defaultValue: 'Voye Dispute' })}`}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Escrow detail modal ───────────────────────────────────────
function EscrowDetail({ escrow, onClose, onValidate, onDispute }) {
  const { t }    = useTranslation();
  const { user } = useAuth();
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const cfg = STATUS_CFG[escrow.status] || STATUS_CFG.funded;

  const isWorker   = escrow.myRole === 'worker';
  const myValidated = isWorker ? escrow.workerValidated : escrow.employerValidated;
  const otherValidated = isWorker ? escrow.employerValidated : escrow.workerValidated;
  const canValidate = ['in_progress','pending_validation'].includes(escrow.status) && !myValidated;
  const canDispute  = ['in_progress','pending_validation'].includes(escrow.status);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#020617]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
        <button type="button" onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-300">←</button>
        <h2 className="font-bold text-white flex-1 truncate">{escrow.jobTitle}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 pb-28">
        {/* Status */}
        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${cfg.bg}`}>
          <span className="text-2xl">{cfg.icon}</span>
          <div>
            <p className={`font-black text-sm ${cfg.color}`}>{t(`escrow.status.${escrow.status}`, { defaultValue: cfg.label })}</p>
            <p className="text-xs text-slate-400">
              {escrow.startDate} → {escrow.endDate}
            </p>
          </div>
        </div>

        {/* Amount */}
        <div className="p-4 bg-[#0d1526] border border-slate-700 rounded-2xl text-center">
          <p className="text-xs text-slate-400 mb-1">{t('escrow.fundedAmount', { defaultValue: 'Montan nan Escrow' })}</p>
          <p className="text-3xl font-black text-white">{fmt(escrow.amount, escrow.currency)}</p>
          <p className="text-xs text-slate-500 mt-1">🔒 {t('escrow.heldSafely', { defaultValue: 'Kenbe an sekurité pa JOBFAST' })}</p>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label:t('escrow.employer', { defaultValue:'Anplwayè' }), name:escrow.employerName, role:'employer', validated:escrow.employerValidated },
            { label:t('escrow.worker',   { defaultValue:'Travayè'  }), name:escrow.workerName,   role:'worker',   validated:escrow.workerValidated   },
          ].map(p => (
            <div key={p.role} className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl">
              <p className="text-xs text-slate-400">{p.label}</p>
              <p className="text-sm font-bold text-white mt-0.5 truncate">{p.name}</p>
              <div className={`mt-2 flex items-center gap-1 text-xs font-bold ${p.validated ? 'text-green-400' : 'text-slate-500'}`}>
                {p.validated ? '✓ Valide' : '○ Pa validé'}
              </div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{t('escrow.jobDescription', { defaultValue: 'Deskripsyon Travay' })}</p>
          <p className="text-sm text-slate-300 leading-relaxed">{escrow.description}</p>
        </div>

        {/* Dispute reason */}
        {escrow.status === 'disputed' && escrow.disputeReason && (
          <div className="p-4 bg-red-900/20 border border-red-700/40 rounded-2xl">
            <p className="text-xs font-bold text-red-400 mb-1">⚠️ {t('escrow.disputeReason', { defaultValue: 'Rezon Dispute' })}</p>
            <p className="text-sm text-slate-300">{escrow.disputeReason}</p>
          </div>
        )}

        {/* How escrow works */}
        <div className="p-4 bg-indigo-900/20 border border-indigo-700/40 rounded-2xl">
          <p className="text-xs font-bold text-indigo-300 mb-2">🔒 {t('escrow.howItWorks', { defaultValue: 'Kijan Escrow travay' })}</p>
          <div className="space-y-1.5">
            {[
              `1. ${t('escrow.step1', { defaultValue: 'Anplwayè depoze lajan nan JOBFAST Escrow' })}`,
              `2. ${t('escrow.step2', { defaultValue: 'Travay la kòmanse' })}`,
              `3. ${t('escrow.step3', { defaultValue: 'Tou de valide travay la fin' })}`,
              `4. ${t('escrow.step4', { defaultValue: 'JOBFAST lage lajan bay Travayè a' })}`,
            ].map(s => (
              <p key={s} className="text-xs text-slate-400">{s}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Action bar */}
      {(canValidate || canDispute) && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#020617]/95 backdrop-blur-sm border-t border-slate-800 space-y-2">
          {canValidate && (
            <button type="button" onClick={() => onValidate(escrow._id)}
              className="w-full py-3.5 rounded-xl bg-green-500 hover:bg-green-400 text-white font-black text-sm transition">
              ✅ {myValidated === false && !otherValidated
                ? t('escrow.validateWork', { defaultValue: 'Konfime Travay Fini' })
                : t('escrow.waitingOther', { defaultValue: 'Kap tann lòt pati…' })}
            </button>
          )}
          {canDispute && (
            <button type="button" onClick={() => setShowDisputeForm(true)}
              className="w-full py-2.5 rounded-xl border border-red-500/50 text-red-400 font-bold text-sm transition hover:bg-red-500/10">
              ⚠️ {t('escrow.openDispute', { defaultValue: 'Ouvri Dispute' })}
            </button>
          )}
        </div>
      )}

      {showDisputeForm && (
        <DisputeModal
          escrow={escrow}
          onClose={() => setShowDisputeForm(false)}
          onDispute={onDispute}
        />
      )}
    </div>
  );
}

// ── Escrow card ───────────────────────────────────────────────
function EscrowCard({ escrow, onClick }) {
  const { t } = useTranslation();
  const cfg = STATUS_CFG[escrow.status] || STATUS_CFG.funded;
  const isWorker = escrow.myRole === 'worker';
  const otherName = isWorker ? escrow.employerName : escrow.workerName;

  return (
    <button type="button" onClick={onClick}
      className="w-full text-left bg-[#0d1526] border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition">
      <div className="flex items-center gap-3 p-4">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl border shrink-0 ${cfg.bg}`}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{escrow.jobTitle}</p>
          <p className="text-xs text-slate-500 truncate">
            {isWorker ? '👤' : '🏢'} {otherName}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-black text-white">{fmt(escrow.amount, escrow.currency)}</p>
          <p className={`text-xs font-bold ${cfg.color}`}>{t(`escrow.status.${escrow.status}`, { defaultValue: cfg.label })}</p>
        </div>
      </div>

      {/* Validation progress */}
      {['in_progress','pending_validation'].includes(escrow.status) && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            <div className={`flex-1 flex items-center gap-1.5 text-xs ${escrow.workerValidated ? 'text-green-400' : 'text-slate-500'}`}>
              <span className={`w-3 h-3 rounded-full border ${escrow.workerValidated ? 'bg-green-400 border-green-400' : 'border-slate-600'}`} />
              {t('escrow.worker', { defaultValue: 'Travayè' })}
            </div>
            <div className="h-px flex-1 bg-slate-700" />
            <div className={`flex-1 flex items-center justify-end gap-1.5 text-xs ${escrow.employerValidated ? 'text-green-400' : 'text-slate-500'}`}>
              {t('escrow.employer', { defaultValue: 'Anplwayè' })}
              <span className={`w-3 h-3 rounded-full border ${escrow.employerValidated ? 'bg-green-400 border-green-400' : 'border-slate-600'}`} />
            </div>
          </div>
        </div>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
export default function EscrowPage() {
  const { t }    = useTranslation();
  const { user } = useAuth();
  const [escrows,  setEscrows]  = useState(MOCK_ESCROWS);
  const [loading,  setLoading]  = useState(false);
  const [detail,   setDetail]   = useState(null);
  const [activeTab, setActiveTab] = useState('active');

  const totalLocked = escrows
    .filter(e => !['completed','cancelled'].includes(e.status))
    .reduce((s, e) => s + e.amount, 0);

  useEffect(() => {
    setLoading(true);
    escrowAPI.getMyEscrows()
      .then(res => {
        const d = res?.data?.data || res?.data;
        if (Array.isArray(d) && d.length) setEscrows(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleValidate = useCallback(async (id) => {
    try { await escrowAPI.validate(id); } catch {}
    const isWorker = escrows.find(e => e._id === id)?.myRole === 'worker';
    setEscrows(prev => prev.map(e => {
      if (e._id !== id) return e;
      const updated = {
        ...e,
        workerValidated:   isWorker ? true : e.workerValidated,
        employerValidated: !isWorker ? true : e.employerValidated,
      };
      if (updated.workerValidated && updated.employerValidated) updated.status = 'completed';
      else updated.status = 'pending_validation';
      return updated;
    }));
    setDetail(prev => prev?._id === id ? escrows.find(e => e._id === id) : prev);
  }, [escrows]);

  const handleDispute = useCallback(async (id, reason) => {
    try { await escrowAPI.dispute(id, reason); } catch {}
    setEscrows(prev => prev.map(e => e._id === id ? { ...e, status:'disputed', disputeReason:reason } : e));
  }, []);

  const filtered = escrows.filter(e => {
    if (activeTab === 'active')    return ['funded','in_progress','pending_validation'].includes(e.status);
    if (activeTab === 'completed') return e.status === 'completed';
    if (activeTab === 'disputed')  return e.status === 'disputed';
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#020617] text-white pb-24">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3">
        {/* Balance in escrow card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-800 p-5 shadow-2xl shadow-indigo-900/50 mb-1">
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative z-10">
            <p className="text-indigo-200 text-xs uppercase tracking-widest mb-1">🔒 {t('escrow.totalLocked', { defaultValue: 'Total Kenbe nan Escrow' })}</p>
            <p className="text-3xl font-black">HTG {totalLocked.toLocaleString()}</p>
            <p className="text-indigo-200 text-xs mt-2">{t('escrow.protectedNote', { defaultValue: 'Fon pwoteje jiskaske travay valide' })}</p>
          </div>
        </div>
      </div>

      {/* ── How it works strip ────────────────────────────────── */}
      <div className="mx-4 mb-3 p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl">
        <p className="text-xs font-bold text-slate-300 mb-3">{t('escrow.processTitle', { defaultValue: 'Kijan Escrow JOBFAST travay' })}</p>
        <div className="flex items-center gap-1">
          {[
            { icon:'🏢', label:t('escrow.employer', { defaultValue:'Anplwayè' }) },
            { icon:'→', label:'', isArrow:true },
            { icon:'🔒', label:'JOBFAST\nEscrow' },
            { icon:'→', label:'', isArrow:true },
            { icon:'👷', label:t('escrow.worker',   { defaultValue:'Travayè'  }) },
          ].map((item, i) => (
            item.isArrow ? (
              <span key={i} className="text-slate-500 text-sm">→</span>
            ) : (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-lg">{item.icon}</span>
                <span className="text-[9px] text-slate-400 text-center leading-tight whitespace-pre">{item.label}</span>
              </div>
            )
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center">
          {t('escrow.releaseCondition', { defaultValue: 'Lajan lage sèlman apre tou de valide' })}
        </p>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div className="sticky top-14 z-30 px-4 pb-3">
        <div className="flex rounded-xl bg-slate-800/60 p-0.5">
          {[
            { id:'active',    label:t('escrow.active',    { defaultValue:'Aktif'    }) },
            { id:'completed', label:t('escrow.completed', { defaultValue:'Konplè'   }) },
            { id:'disputed',  label:t('escrow.disputed',  { defaultValue:'Dispute'  }) },
            { id:'all',       label:t('escrow.all',       { defaultValue:'Tout'     }) },
          ].map(tb => (
            <button key={tb.id} type="button" onClick={() => setActiveTab(tb.id)}
              className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition ${
                activeTab === tb.id ? 'bg-[#0d1526] text-white shadow' : 'text-slate-400'
              }`}>
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── List ──────────────────────────────────────────────── */}
      <div className="px-4 space-y-3 flex-1">
        {loading && [1,2].map(i => <div key={i} className="h-20 bg-slate-800/40 rounded-2xl animate-pulse" />)}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-5xl">🔒</span>
            <p className="text-slate-400 text-sm">{t('escrow.empty', { defaultValue: 'Pa gen escrow aktif' })}</p>
          </div>
        )}

        {!loading && filtered.map(e => (
          <EscrowCard key={e._id} escrow={e} onClick={() => setDetail(e)} />
        ))}
      </div>

      {/* ── Detail view ───────────────────────────────────────── */}
      {detail && (
        <EscrowDetail
          escrow={detail}
          onClose={() => setDetail(null)}
          onValidate={handleValidate}
          onDispute={handleDispute}
        />
      )}
    </div>
  );
}
