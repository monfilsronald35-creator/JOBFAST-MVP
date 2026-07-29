import { memo } from 'react';
import { motion } from 'framer-motion';

const SECURITY_ITEMS = [
  { label: 'Two-Factor Authentication', status: 'enabled', icon: '🔐' },
  { label: 'Device Binding',            status: 'active',  icon: '📱' },
  { label: 'Session Management',        status: 'active',  icon: '🔒' },
  { label: 'Login Notifications',       status: 'enabled', icon: '🔔' },
];

interface SectionProps { profile?: Record<string, unknown>; }

const SecurityPanel = memo(function SecurityPanel({ profile: _profile }: SectionProps) {
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.8rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🔑</span>
        <h3 className="text-base font-black text-white">Security</h3>
      </div>
      <ul className="space-y-2">
        {SECURITY_ITEMS.map(({ label, status, icon }) => (
          <li key={label} className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-3 py-2">
            <span className="text-[11px] text-slate-200 flex items-center gap-2"><span>{icon}</span>{label}</span>
            <span className="text-[9px] font-bold text-emerald-300 bg-emerald-400/10 border border-emerald-400/30 px-2 py-0.5 rounded-full">{status}</span>
          </li>
        ))}
      </ul>
    </motion.section>
  );
});

export default SecurityPanel;