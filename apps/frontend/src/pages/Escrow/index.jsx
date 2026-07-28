import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { escrowAPI } from '../../services/escrow';
import {
  Shield,
  ShieldAlert,
  Clock3,
  FileText,
  Image as ImageIcon,
  Video,
  Paperclip,
  Search,
  Plus,
  MoreVertical,
  X,
  Upload,
  Signature,
  Send,
  Sparkles,
  CircleCheckBig,
  Wallet,
  Landmark,
  Briefcase,
  Store,
  Hotel,
  Home,
  CarFront,
  Construction,
  Package,
  LandPlot,
  AlertTriangle,
  Check,
  ArrowRightLeft,
  Clock4,
  BadgeCheck,
  FileUp,
  ClipboardCheck,
  Scale,
  Bot,
  Users,
} from 'lucide-react';

const MOCK_ESCROWS = [
  {
    _id: 'e1',
    jobTitle: 'Marketplace Product Escrow',
    category: 'marketplace',
    amount: 45000,
    currency: 'HTG',
    employerName: 'Konstriksyon HAÏTI SA',
    workerName: 'Jean-Pierre M.',
    status: 'in_progress',
    myRole: 'worker',
    startDate: '2026-07-08',
    dueDate: '2026-07-20',
    endDate: '2026-07-20',
    autoReleaseDays: 7,
    releaseMode: 'milestone',
    releasePercent: 30,
    workerValidated: false,
    employerValidated: false,
    milestoneIndex: 1,
    milestoneTotal: 3,
    proofCount: 2,
    description: 'Enstalasyon elektrik konplè pou batiman 3 nivo nan Pétion-Ville.',
    disputeReason: '',
    evidence: [{ type: 'photo', name: 'site-photo-1.jpg' }, { type: 'doc', name: 'invoice.pdf' }],
    signatures: { employer: false, worker: false },
  },
  {
    _id: 'e2',
    jobTitle: 'Hotel Reservation Escrow',
    category: 'reservation',
    amount: 18000,
    currency: 'HTG',
    employerName: 'Marie Dupont',
    workerName: 'Anselme T.',
    status: 'pending_validation',
    myRole: 'employer',
    startDate: '2026-07-01',
    dueDate: '2026-07-10',
    endDate: '2026-07-10',
    autoReleaseDays: 3,
    releaseMode: 'partial',
    releasePercent: 50,
    workerValidated: true,
    employerValidated: false,
    milestoneIndex: 2,
    milestoneTotal: 2,
    proofCount: 1,
    description: 'Penti konplè 5 chanm nan rezidans Bourdon.',
    disputeReason: '',
    evidence: [{ type: 'video', name: 'finish-video.mp4' }],
    signatures: { employer: true, worker: true },
  },
  {
    _id: 'e3',
    jobTitle: 'Freelance Service Escrow',
    category: 'freelance',
    amount: 12000,
    currency: 'HTG',
    employerName: 'Résidence Belle Vue',
    workerName: 'Calixte B.',
    status: 'completed',
    myRole: 'worker',
    startDate: '2026-06-25',
    dueDate: '2026-07-02',
    endDate: '2026-07-02',
    autoReleaseDays: 1,
    releaseMode: 'full',
    releasePercent: 100,
    workerValidated: true,
    employerValidated: true,
    milestoneIndex: 3,
    milestoneTotal: 3,
    proofCount: 3,
    description: 'Travay plonbri nan 2 saldeben.',
    disputeReason: '',
    evidence: [{ type: 'photo', name: 'before.jpg' }, { type: 'photo', name: 'after.jpg' }],
    signatures: { employer: true, worker: true },
  },
  {
    _id: 'e4',
    jobTitle: 'Construction Project Escrow',
    category: 'construction',
    amount: 35000,
    currency: 'HTG',
    employerName: 'Jean-Robert P.',
    workerName: 'Délira C.',
    status: 'disputed',
    myRole: 'employer',
    startDate: '2026-06-20',
    dueDate: '2026-07-05',
    endDate: '2026-07-05',
    autoReleaseDays: 14,
    releaseMode: 'milestone',
    releasePercent: 30,
    workerValidated: true,
    employerValidated: false,
    milestoneIndex: 1,
    milestoneTotal: 4,
    proofCount: 4,
    description: 'Konstriksyon twati lakay 4 chanm.',
    disputeReason: 'Travay la pa fini jan yo te konvni a.',
    evidence: [{ type: 'photo', name: 'roof-stage.jpg' }, { type: 'doc', name: 'contract.pdf' }],
    signatures: { employer: true, worker: false },
  },
];

const STATUS_CFG = {
  funded: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', icon: '💰', labelKey: 'escrow.status.funded', defaultValue: 'Finanse' },
  in_progress: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', icon: '⚡', labelKey: 'escrow.status.in_progress', defaultValue: 'An kou' },
  pending_validation: { color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30', icon: '⏳', labelKey: 'escrow.status.pending_validation', defaultValue: 'Kap tann validasyon' },
  completed: { color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', icon: '✅', labelKey: 'escrow.status.completed', defaultValue: 'Lajan lage' },
  disputed: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: '⚠️', labelKey: 'escrow.status.disputed', defaultValue: 'Dispute' },
  cancelled: { color: 'text-slate-400', bg: 'bg-slate-800/60 border-slate-700', icon: '✕', labelKey: 'escrow.status.cancelled', defaultValue: 'Anile' },
};

const CATEGORY_CFG = {
  marketplace: { labelKey: 'escrow.category.marketplace', defaultValue: 'Marketplace', icon: Store },
  reservation: { labelKey: 'escrow.category.reservation', defaultValue: 'Hotel Reservation', icon: Hotel },
  housing: { labelKey: 'escrow.category.housing', defaultValue: 'Housing Rental', icon: Home },
  construction: { labelKey: 'escrow.category.construction', defaultValue: 'Construction', icon: Construction },
  freelance: { labelKey: 'escrow.category.freelance', defaultValue: 'Freelance Service', icon: Briefcase },
  vehicle: { labelKey: 'escrow.category.vehicle', defaultValue: 'Vehicle', icon: CarFront },
  land: { labelKey: 'escrow.category.land', defaultValue: 'Land & Real Estate', icon: LandPlot },
  product: { labelKey: 'escrow.category.product', defaultValue: 'Product', icon: Package },
};

const FILTERS = [
  { id: 'active', labelKey: 'escrow.filters.active', defaultValue: 'Aktif' },
  { id: 'completed', labelKey: 'escrow.filters.completed', defaultValue: 'Konplè' },
  { id: 'disputed', labelKey: 'escrow.filters.disputed', defaultValue: 'Dispute' },
  { id: 'all', labelKey: 'escrow.filters.all', defaultValue: 'Tout' },
];

const fmt = (amount, currency = 'HTG') => `${currency} ${Number(amount).toLocaleString()}`;
const fmtPct = (n) => `${Number(n || 0)}%`;

function Badge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-800/60 text-slate-300 border-slate-700',
    blue: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    green: 'bg-green-500/10 text-green-300 border-green-500/30',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    red: 'bg-red-500/10 text-red-300 border-red-500/30',
    indigo: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    violet: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
  };
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold ${tones[tone] || tones.slate}`}>{children}</span>;
}

function calcProgress(escrow) {
  const total = Number(escrow.milestoneTotal || 1);
  const current = Number(escrow.milestoneIndex || 0);
  return Math.min(100, Math.round((current / total) * 100));
}

function canAutoRelease(escrow) {
  if (['completed', 'cancelled', 'disputed'].includes(escrow.status)) return false;
  if (!escrow.autoReleaseDays) return false;
  const end = new Date(escrow.endDate);
  const now = new Date();
  const diffDays = Math.floor((now - end) / (1000 * 60 * 60 * 24));
  return diffDays >= escrow.autoReleaseDays;
}

function getEvidenceIcon(type) {
  if (type === 'photo') return ImageIcon;
  if (type === 'video') return Video;
  if (type === 'doc') return FileText;
  return Paperclip;
}

function useEscrowMaps(escrows) {
  return useMemo(() => {
    const byId = new Map();
    const byRole = { worker: [], employer: [] };
    for (const e of escrows) {
      byId.set(e._id, e);
      if (e.myRole === 'worker') byRole.worker.push(e._id);
      if (e.myRole === 'employer') byRole.employer.push(e._id);
    }
    return { escrowMap: byId, roleMap: byRole };
  }, [escrows]);
}

const EvidenceList = memo(function EvidenceList({ items = [], t }) {
  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <p className="text-xs text-slate-500">{t('escrow.noEvidence', { defaultValue: 'Pa gen evidans ankò.' })}</p>
      ) : items.map((item, idx) => {
        const Icon = getEvidenceIcon(item.type);
        return (
          <div key={`${item.name}-${idx}`} className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/50 border border-slate-700">
            <Icon className="w-4 h-4 text-cyan-300" />
            <span className="text-xs text-slate-300 truncate">{item.name}</span>
          </div>
        );
      })}
    </div>
  );
});

function BottomSheet({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full rounded-t-3xl bg-[#0b1220] p-5 pb-8 border-t border-slate-800 max-h-[85vh] overflow-y-auto">
        <div className="w-12 h-1 rounded-full bg-slate-600 mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black text-white">{title}</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DisputeModal({ escrow, onClose, onDispute }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSending(true);
    await onDispute(escrow._id, { reason, details });
    setSending(false);
    onClose();
  };

  return (
    <BottomSheet open title={t('escrow.openDispute', { defaultValue: 'Ouvri Dispute' })} onClose={onClose}>
      <p className="text-xs text-slate-400 mb-4">{t('escrow.disputeNote', { defaultValue: 'JOBFAST ap analize evidans yo epi mete ka a nan workflow revizyon.' })}</p>
      <form onSubmit={submit} className="space-y-3">
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          required
          placeholder={t('escrow.disputeReason', { defaultValue: 'Esplike pwoblèm nan…' })}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-red-500/50 resize-none"
        />
        <textarea
          value={details}
          onChange={e => setDetails(e.target.value)}
          rows={3}
          placeholder={t('escrow.disputeDetails', { defaultValue: 'Ajoute plis detay, nimewo dosye, oswa nòt medyatè.' })}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-red-500/50 resize-none"
        />
        <button type="submit" disabled={sending || !reason.trim()} className="w-full py-3.5 rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-40 text-white font-black text-sm transition">
          {sending ? t('escrow.sending', { defaultValue: '⏳…' }) : t('escrow.submitDispute', { defaultValue: 'Voye Dispute' })}
        </button>
      </form>
    </BottomSheet>
  );
}

function EvidenceUploadModal({ escrow, onClose, onUpload }) {
  const { t } = useTranslation();
  const [files, setFiles] = useState([]);
  const [caption, setCaption] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (!files.length) return;
    setSending(true);
    await onUpload(escrow._id, { files, caption });
    setSending(false);
    onClose();
  };

  return (
    <BottomSheet open title={t('escrow.uploadEvidenceTitle', { defaultValue: 'Upload prèv' })} onClose={onClose}>
      <p className="text-xs text-slate-400 mb-4">{t('escrow.uploadEvidenceNote', { defaultValue: 'Foto, videyo, ak dokiman yo ka sèvi kòm evidans nan dispute oswa milestone release.' })}</p>
      <form onSubmit={submit} className="space-y-3">
        <input
          type="file"
          multiple
          onChange={e => setFiles(Array.from(e.target.files || []))}
          className="w-full text-xs text-slate-300"
        />
        <textarea
          value={caption}
          onChange={e => setCaption(e.target.value)}
          rows={3}
          placeholder={t('escrow.evidenceCaption', { defaultValue: 'Kisa prèv yo montre?' })}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
        />
        <button type="submit" disabled={sending || !files.length} className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-white font-black text-sm transition">
          {sending ? t('escrow.sending', { defaultValue: '⏳…' }) : t('escrow.submitEvidence', { defaultValue: 'Voye prèv' })}
        </button>
      </form>
    </BottomSheet>
  );
}

function ActionsSheet({ escrow, open, onClose, onValidate, onDispute, onAutoRelease, onPartialRelease, onMilestoneAdvance, onUploadEvidence, onSign }) {
  const { t } = useTranslation();
  const canAuto = canAutoRelease(escrow);

  return (
    <BottomSheet open={open} title={t('escrow.moreActions', { defaultValue: 'More Actions' })} onClose={onClose}>
      <div className="space-y-2">
        <button type="button" onClick={() => { onClose(); onUploadEvidence(escrow._id); }} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-800/70 border border-slate-700">
          <span className="flex items-center gap-2 text-sm font-bold text-white"><Upload className="w-4 h-4 text-cyan-300" />{t('escrow.uploadEvidenceTitle', { defaultValue: 'Upload prèv' })}</span>
          <ArrowRightLeft className="w-4 h-4 text-slate-500" />
        </button>
        <button type="button" onClick={() => { onClose(); onPartialRelease(escrow._id, 30); }} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-800/70 border border-slate-700">
          <span className="flex items-center gap-2 text-sm font-bold text-white"><Wallet className="w-4 h-4 text-amber-300" />{t('escrow.partialRelease30', { defaultValue: 'Partial Release 30%' })}</span>
          <Badge tone="amber">30%</Badge>
        </button>
        <button type="button" onClick={() => { onClose(); onPartialRelease(escrow._id, 50); }} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-800/70 border border-slate-700">
          <span className="flex items-center gap-2 text-sm font-bold text-white"><Wallet className="w-4 h-4 text-amber-300" />{t('escrow.partialRelease50', { defaultValue: 'Partial Release 50%' })}</span>
          <Badge tone="amber">50%</Badge>
        </button>
        <button type="button" onClick={() => { onClose(); onPartialRelease(escrow._id, 100); }} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-800/70 border border-slate-700">
          <span className="flex items-center gap-2 text-sm font-bold text-white"><Wallet className="w-4 h-4 text-emerald-300" />{t('escrow.partialRelease100', { defaultValue: 'Partial Release 100%' })}</span>
          <Badge tone="green">100%</Badge>
        </button>
        <button type="button" onClick={() => { onClose(); onMilestoneAdvance(escrow._id); }} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-800/70 border border-slate-700">
          <span className="flex items-center gap-2 text-sm font-bold text-white"><ClipboardCheck className="w-4 h-4 text-indigo-300" />{t('escrow.milestoneNext', { defaultValue: 'Milestone Next' })}</span>
          <Badge tone="indigo">{fmtPct(escrow.milestoneIndex * 100 / Math.max(escrow.milestoneTotal, 1))}</Badge>
        </button>
        <button type="button" onClick={() => { onClose(); onSign(escrow._id); }} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-800/70 border border-slate-700">
          <span className="flex items-center gap-2 text-sm font-bold text-white"><Signature className="w-4 h-4 text-violet-300" />{t('escrow.signAction', { defaultValue: 'Siyen' })}</span>
          <Badge tone="violet">{t('escrow.pending', { defaultValue: 'Pending' })}</Badge>
        </button>
        {canAuto && (
          <button type="button" onClick={() => { onClose(); onAutoRelease(escrow._id); }} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="flex items-center gap-2 text-sm font-bold text-emerald-200"><Sparkles className="w-4 h-4" />{t('escrow.autoRelease', { defaultValue: 'Auto Release' })}</span>
            <Badge tone="green">{t('escrow.ready', { defaultValue: 'Ready' })}</Badge>
          </button>
        )}
        <button type="button" onClick={() => { onClose(); onValidate(escrow._id); }} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-green-500/10 border border-green-500/30">
          <span className="flex items-center gap-2 text-sm font-bold text-green-200"><Check className="w-4 h-4" />{t('escrow.validateWork', { defaultValue: 'Konfime travay la' })}</span>
          <Badge tone="green">{t('escrow.completed', { defaultValue: 'Completed' })}</Badge>
        </button>
        <button type="button" onClick={() => { onClose(); onDispute(escrow._id, { reason: t('escrow.disputeQuickReason', { defaultValue: 'Mwen vle ouvri yon dispute.' }), details: '' }); }} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30">
          <span className="flex items-center gap-2 text-sm font-bold text-red-200"><AlertTriangle className="w-4 h-4" />{t('escrow.openDispute', { defaultValue: 'Ouvri Dispute' })}</span>
          <Badge tone="red">{t('escrow.disputed', { defaultValue: 'Disputed' })}</Badge>
        </button>
      </div>
    </BottomSheet>
  );
}

function SignatureState({ label, done, t }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${done ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800/50 border-slate-700'}`}>
      <span className="text-xs text-slate-300">{label}</span>
      <span className={`text-xs font-black ${done ? 'text-green-300' : 'text-slate-500'}`}>
        {done ? t('escrow.signed', { defaultValue: 'Signed' }) : t('escrow.pending', { defaultValue: 'Pending' })}
      </span>
    </div>
  );
}

function EscrowCard({ escrow, onClick }) {
  const { t } = useTranslation();
  const cfg = STATUS_CFG[escrow.status] || STATUS_CFG.funded;
  const category = CATEGORY_CFG[escrow.category] || {};
  const isWorker = escrow.myRole === 'worker';
  const otherName = isWorker ? escrow.employerName : escrow.workerName;
  const progress = calcProgress(escrow);

  return (
    <button type="button" onClick={onClick} className="w-full text-left bg-[#0d1526] border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition">
      <div className="flex items-center gap-3 p-4">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl border shrink-0 ${cfg.bg}`}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{escrow.jobTitle}</p>
          <p className="text-xs text-slate-500 truncate">{isWorker ? '👤' : '🏢'} {otherName}</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge tone="slate">{t(category.labelKey || 'escrow.category.unknown', { defaultValue: category.defaultValue || escrow.category })}</Badge>
            <Badge tone={cfg.labelKey === 'escrow.status.completed' ? 'green' : 'amber'}>{progress}%</Badge>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-black text-white">{fmt(escrow.amount, escrow.currency)}</p>
          <p className={`text-xs font-bold ${cfg.color}`}>{t(cfg.labelKey, { defaultValue: cfg.defaultValue })}</p>
        </div>
      </div>
    </button>
  );
}

function EscrowDetail({ escrow, onClose, onValidate, onDispute, onAutoRelease, onPartialRelease, onMilestoneAdvance, onOpenEvidence, onSign, onOpenActions }) {
  const { t } = useTranslation();
  const cfg = STATUS_CFG[escrow.status] || STATUS_CFG.funded;
  const isWorker = escrow.myRole === 'worker';
  const myValidated = isWorker ? escrow.workerValidated : escrow.employerValidated;
  const canValidate = ['in_progress', 'pending_validation'].includes(escrow.status) && !myValidated;
  const canDispute = ['in_progress', 'pending_validation'].includes(escrow.status);
  const canAuto = canAutoRelease(escrow);
  const progress = calcProgress(escrow);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#020617]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
        <button type="button" onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-300">←</button>
        <h2 className="font-bold text-white flex-1 truncate">{escrow.jobTitle}</h2>
        <button type="button" onClick={onOpenActions} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-300">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 pb-28">
        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${cfg.bg}`}>
          <span className="text-2xl">{cfg.icon}</span>
          <div>
            <p className={`font-black text-sm ${cfg.color}`}>{t(cfg.labelKey, { defaultValue: cfg.defaultValue })}</p>
            <p className="text-xs text-slate-400">{escrow.startDate} → {escrow.endDate}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-[#0d1526] border border-slate-700 rounded-2xl text-center">
            <p className="text-xs text-slate-400 mb-1">{t('escrow.amountLocked', { defaultValue: 'Montan nan Escrow' })}</p>
            <p className="text-2xl font-black text-white">{fmt(escrow.amount, escrow.currency)}</p>
          </div>
          <div className="p-4 bg-[#0d1526] border border-slate-700 rounded-2xl text-center">
            <p className="text-xs text-slate-400 mb-1">{t('escrow.milestoneProgress', { defaultValue: 'Milestone Progress' })}</p>
            <p className="text-2xl font-black text-white">{progress}%</p>
          </div>
        </div>
        
        <div className="p-4 bg-[#0d1526] border border-slate-700 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t('escrow.autoRelease', { defaultValue: 'Auto Release' })}</p>
            <Badge tone={canAuto ? 'green' : 'slate'}>
              {canAuto
                ? t('escrow.ready', { defaultValue: 'Ready' })
                : t('escrow.readyAfterDays', { defaultValue: 'After {{days}} days', days: escrow.autoReleaseDays })}
            </Badge>
          </div>
          <p className="text-sm text-slate-300">{t('escrow.autoReleaseNote', { defaultValue: 'Auto release a ka fèt si pa gen dispute apre kantite jou ki defini a.' })}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl">
            <p className="text-xs text-slate-400">{t('escrow.employer', { defaultValue: 'Anplwayè' })}</p>
            <p className="text-sm font-bold text-white mt-0.5 truncate">{escrow.employerName}</p>
            <div className={`mt-2 text-xs font-bold ${escrow.employerValidated ? 'text-green-400' : 'text-slate-500'}`}>
              {escrow.employerValidated ? t('escrow.validated', { defaultValue: '✓ Valide' }) : t('escrow.notValidated', { defaultValue: '○ Pa validé' })}
            </div>
          </div>
          <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl">
            <p className="text-xs text-slate-400">{t('escrow.worker', { defaultValue: 'Travayè' })}</p>
            <p className="text-sm font-bold text-white mt-0.5 truncate">{escrow.workerName}</p>
            <div className={`mt-2 text-xs font-bold ${escrow.workerValidated ? 'text-green-400' : 'text-slate-500'}`}>
              {escrow.workerValidated ? t('escrow.validated', { defaultValue: '✓ Valide' }) : t('escrow.notValidated', { defaultValue: '○ Pa validé' })}
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{t('escrow.jobDescription', { defaultValue: 'Deskripsyon Travay' })}</p>
          <p className="text-sm text-slate-300 leading-relaxed">{escrow.description}</p>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-700 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wide">{t('escrow.categoryLabel', { defaultValue: 'Category' })}</p>
            <Badge tone="blue">{t(CATEGORY_CFG[escrow.category]?.labelKey || 'escrow.category.unknown', { defaultValue: CATEGORY_CFG[escrow.category]?.defaultValue || escrow.category })}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
            <div>{t('escrow.releaseModeLabel', { defaultValue: 'Status mode' })}: <span className="text-white font-bold">{escrow.releaseMode}</span></div>
            <div>{t('escrow.releasePercentLabel', { defaultValue: 'Release %' })}: <span className="text-white font-bold">{fmtPct(escrow.releasePercent)}</span></div>
            <div>{t('escrow.milestonesLabel', { defaultValue: 'Milestones' })}: <span className="text-white font-bold">{escrow.milestoneIndex}/{escrow.milestoneTotal}</span></div>
            <div>{t('escrow.proofFilesLabel', { defaultValue: 'Proof files' })}: <span className="text-white font-bold">{escrow.proofCount}</span></div>
          </div>
        </div>

        {escrow.evidence?.length > 0 && (
          <div className="p-4 bg-[#0d1526] border border-slate-700 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t('escrow.proofUploaded', { defaultValue: 'Prèv ki upload' })}</p>
              <Badge tone="indigo">{escrow.evidence.length} {t('escrow.files', { defaultValue: 'files' })}</Badge>
            </div>
            <EvidenceList items={escrow.evidence} t={t} />
          </div>
        )}

        <div className="p-4 bg-[#0d1526] border border-slate-700 rounded-2xl">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">{t('escrow.digitalSignature', { defaultValue: 'Siyati Dijital' })}</p>
          <div className="space-y-2">
            <SignatureState label={t('escrow.employerSignature', { defaultValue: 'Siyati Anplwayè' })} done={escrow.signatures?.employer} t={t} />
            <SignatureState label={t('escrow.workerSignature', { defaultValue: 'Siyati Travayè' })} done={escrow.signatures?.worker} t={t} />
          </div>
        </div>

        {escrow.status === 'disputed' && escrow.disputeReason && (
          <div className="p-4 bg-red-900/20 border border-red-700/40 rounded-2xl">
            <p className="text-xs font-bold text-red-400 mb-1">⚠️ {t('escrow.disputeReasonLabel', { defaultValue: 'Rezon Dispute' })}</p>
            <p className="text-sm text-slate-300">{escrow.disputeReason}</p>
          </div>
        )}

        <div className="p-4 bg-indigo-900/20 border border-indigo-700/40 rounded-2xl">
          <p className="text-xs font-bold text-indigo-300 mb-2">🔒 {t('escrow.howItWorks', { defaultValue: 'Kijan Escrow travay' })}</p>
          <div className="space-y-1.5">
            <p className="text-xs text-slate-400">{t('escrow.step1', { defaultValue: 'Lajan finanse nan JOBFAST Escrow.' })}</p>
            <p className="text-xs text-slate-400">{t('escrow.step2', { defaultValue: 'Travay la kòmanse ak milestone yo suiv.' })}</p>
            <p className="text-xs text-slate-400">{t('escrow.step3', { defaultValue: 'Prèv, upload, ak siyati dijital yo verifye.' })}</p>
            <p className="text-xs text-slate-400">{t('escrow.step4', { defaultValue: 'Lajan lage otomatik, pasyèl, oswa final selon règ yo.' })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EscrowPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [escrows, setEscrows] = useState(MOCK_ESCROWS);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [query, setQuery] = useState('');
  const [showActions, setShowActions] = useState(false);

  const { escrowMap } = useEscrowMaps(escrows);

  const totalLocked = useMemo(
    () => escrows.filter(e => !['completed', 'cancelled'].includes(e.status)).reduce((s, e) => s + Number(e.amount || 0), 0),
    [escrows]
  );

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

  const updateEscrow = useCallback((id, updater) => {
    setEscrows(prev => prev.map(e => (e._id === id ? updater(e) : e)));
  }, []);

  const syncDetail = useCallback((id) => {
    setDetail(prev => {
      if (!prev || prev._id !== id) return prev;
      return escrowMap.get(id) || prev;
    });
  }, [escrowMap]);

  const handleValidate = useCallback(async (id) => {
    try { await escrowAPI.validate(id); } catch {}
    updateEscrow(id, e => {
      const isWorker = e.myRole === 'worker';
      const next = {
        ...e,
        workerValidated: isWorker ? true : e.workerValidated,
        employerValidated: !isWorker ? true : e.employerValidated,
      };
      if (next.workerValidated && next.employerValidated) next.status = 'completed';
      else next.status = 'pending_validation';
      return next;
    });
    syncDetail(id);
  }, [updateEscrow, syncDetail]);

  const handleDispute = useCallback(async (id, payload) => {
    try { await escrowAPI.dispute(id, payload); } catch {}
    updateEscrow(id, e => ({ ...e, status: 'disputed', disputeReason: payload.reason }));
    syncDetail(id);
  }, [updateEscrow, syncDetail]);

  const handleAutoRelease = useCallback(async (id) => {
    try { await escrowAPI.autoRelease(id); } catch {}
    updateEscrow(id, e => ({ ...e, status: 'completed' }));
    syncDetail(id);
  }, [updateEscrow, syncDetail]);

  const handlePartialRelease = useCallback(async (id, percent) => {
    try { await escrowAPI.partialRelease(id, { percent }); } catch {}
    updateEscrow(id, e => ({ ...e, releasePercent: percent, status: percent === 100 ? 'completed' : 'pending_validation' }));
    syncDetail(id);
  }, [updateEscrow, syncDetail]);

  const handleMilestoneAdvance = useCallback(async (id) => {
    try { await escrowAPI.advanceMilestone(id); } catch {}
    updateEscrow(id, e => ({ ...e, milestoneIndex: Math.min(e.milestoneIndex + 1, e.milestoneTotal), status: 'in_progress' }));
    syncDetail(id);
  }, [updateEscrow, syncDetail]);

  const handleUploadEvidence = useCallback(async (id, payload) => {
    try { await escrowAPI.uploadEvidence(id, payload); } catch {}
    if (!payload) return;
    updateEscrow(id, e => ({
      ...e,
      proofCount: (e.proofCount || 0) + (payload.files?.length || 0),
      evidence: [...(e.evidence || []), ...((payload.files || []).map(f => ({ type: f.type?.startsWith('video') ? 'video' : 'doc', name: f.name })))]
    }));
    syncDetail(id);
  }, [updateEscrow, syncDetail]);

  const handleSign = useCallback(async (id) => {
    try { await escrowAPI.sign(id); } catch {}
    updateEscrow(id, e => {
      const next = { ...e, signatures: { ...(e.signatures || {}) } };
      if (e.myRole === 'worker') next.signatures.worker = true;
      else next.signatures.employer = true;
      return next;
    });
    syncDetail(id);
  }, [updateEscrow, syncDetail]);

  const filtered = useMemo(() => {
    let list = escrows;
    if (activeTab === 'active') list = list.filter(e => ['funded', 'in_progress', 'pending_validation'].includes(e.status));
    if (activeTab === 'completed') list = list.filter(e => e.status === 'completed');
    if (activeTab === 'disputed') list = list.filter(e => e.status === 'disputed');
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(e =>
        [e.jobTitle, e.employerName, e.workerName, e.description, e.category]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      );
    }
    return list;
  }, [escrows, activeTab, query]);

  const enterpriseStats = useMemo(() => {
    const byStatus = status => escrows.filter(e => e.status === status).length;
    return [
      { label: t('escrow.stats.active', { defaultValue: 'Active' }), value: byStatus('in_progress') + byStatus('funded') + byStatus('pending_validation'), icon: Shield },
      { label: t('escrow.stats.completed', { defaultValue: 'Completed' }), value: byStatus('completed'), icon: CircleCheckBig },
      { label: t('escrow.stats.disputed', { defaultValue: 'Disputed' }), value: byStatus('disputed'), icon: ShieldAlert },
      { label: t('escrow.stats.autoReady', { defaultValue: 'Auto Release Ready' }), value: escrows.filter(canAutoRelease).length, icon: Clock3 },
    ];
  }, [escrows, t]);

  const detailEscrow = detail ? escrowMap.get(detail._id) || detail : null;

  return (
    <div className="flex flex-col min-h-screen bg-[#020617] text-white pb-24">
      <div className="px-4 pt-4 pb-3">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-800 p-5 shadow-2xl shadow-indigo-900/50 mb-3">
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative z-10">
            <p className="text-indigo-200 text-xs uppercase tracking-widest mb-1">🔒 {t('escrow.totalLocked', { defaultValue: 'Total Kenbe nan Escrow' })}</p>
            <p className="text-3xl font-black">{fmt(totalLocked, 'HTG')}</p>
            <p className="text-indigo-200 text-xs mt-2">{t('escrow.protectedNote', { defaultValue: 'Fon pwoteje jiskaske release, sign, oswa dispute rezoud.' })}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {enterpriseStats.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800/70">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">{s.label}</p>
                  <Icon className="w-4 h-4 text-cyan-300" />
                </div>
                <p className="text-xl font-black text-emerald-300">{s.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mx-4 mb-3 p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl">
        <p className="text-xs font-bold text-slate-300 mb-3">{t('escrow.processTitle', { defaultValue: 'Kijan Escrow JOBFAST travay' })}</p>
        <div className="flex items-center gap-1">
          {[
            { icon: '🏢', label: t('escrow.employer', { defaultValue: 'Anplwayè' }) },
            { icon: '→', label: '', isArrow: true },
            { icon: '🔒', label: 'JOBFAST\nEscrow' },
            { icon: '→', label: '', isArrow: true },
            { icon: '👷', label: t('escrow.worker', { defaultValue: 'Travayè' }) },
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
          {t('escrow.releaseCondition', { defaultValue: 'Lajan ka lage otomatik, pasyèl, oswa etap pa etap selon milestone ak dispute rules.' })}
        </p>
      </div>

      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 rounded-2xl bg-slate-900/80 border border-slate-800/70 px-3 py-2">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('escrow.searchPlaceholder', { defaultValue: 'Search escrow...' })}
            className="w-full bg-transparent outline-none text-sm text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="sticky top-14 z-30 px-4 pb-3">
        <div className="flex rounded-xl bg-slate-800/60 p-0.5">
          {FILTERS.map(tb => (
            <button
              key={tb.id}
              type="button"
              onClick={() => setActiveTab(tb.id)}
              className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition ${
                activeTab === tb.id ? 'bg-[#0d1526] text-white shadow' : 'text-slate-400'
              }`}
            >
              {t(tb.labelKey, { defaultValue: tb.defaultValue })}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-3 flex-1">
        {loading && [1, 2].map(i => <div key={i} className="h-20 bg-slate-800/40 rounded-2xl animate-pulse" />)}

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

      {detailEscrow && (
        <EscrowDetail
          escrow={detailEscrow}
          onClose={() => setDetail(null)}
          onValidate={handleValidate}
          onDispute={handleDispute}
          onAutoRelease={handleAutoRelease}
          onPartialRelease={handlePartialRelease}
          onMilestoneAdvance={handleMilestoneAdvance}
          onOpenEvidence={(id) => handleUploadEvidence(id)}
          onSign={handleSign}
          onOpenActions={() => setShowActions(true)}
        />
      )}

      {detailEscrow && (
        <ActionsSheet
          open={showActions}
          escrow={detailEscrow}
          onClose={() => setShowActions(false)}
          onValidate={handleValidate}
          onDispute={handleDispute}
          onAutoRelease={handleAutoRelease}
          onPartialRelease={handlePartialRelease}
          onMilestoneAdvance={handleMilestoneAdvance}
          onUploadEvidence={() => setShowActions(false)}
          onSign={handleSign}
        />
      )}

      {detailEscrow && (
        <EvidenceUploadModal
          escrow={detailEscrow}
          onClose={() => {}}
          onUpload={handleUploadEvidence}
        />
      )}
    </div>
  );
}
