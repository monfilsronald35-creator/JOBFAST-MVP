import { memo } from 'react';
import { motion } from 'framer-motion';

const EVENTS = [
  { user: 'Admin',   action: 'Updated compliance policy',  time: '2026-07-28 09:14' },
  { user: 'Finance', action: 'Approved payout #8821',      time: '2026-07-28 08:55' },
  { user: 'HR',      action: 'Onboarded 3 new employees',  time: '2026-07-27 17:30' },
  { user: 'Admin',   action: 'Changed RBAC permissions',   time: '2026-07-27 14:12' },
];

interface TabProps { user?: Record<string, unknown>; }

const AuditTrailTab = memo(function AuditTrailTab({ user: _user }: TabProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-4">
      <h2 className="text-base font-black text-white">Audit Trail</h2>
      <ul className="space-y-2">
        {EVENTS.map(({ user: u, action, time }, i) => (
          <li key={i} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
            <span className="text-base mt-0.5">📋</span>
            <div className="min-w-0">
              <p className="text-[11px] text-white"><span className="font-bold text-amber-300">{u}</span> — {action}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">{time}</p>
            </div>
          </li>
        ))}
      </ul>
    </motion.div>
  );
});

export default AuditTrailTab;