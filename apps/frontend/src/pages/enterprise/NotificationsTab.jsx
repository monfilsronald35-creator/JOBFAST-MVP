import React, { memo } from 'react';
import { motion } from 'framer-motion';

const NotificationsTab = memo(function NotificationsTab({ user }) {
  const channels = [
    { label: 'Email Notifications', enabled: true },
    { label: 'Push Notifications', enabled: true },
    { label: 'SMS Alerts', enabled: false },
    { label: 'Webhook Events', enabled: true },
    { label: 'Slack Integration', enabled: false },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-4">
      <h2 className="text-base font-black text-white">Notification Settings</h2>
      <ul className="space-y-2">
        {channels.map(({ label, enabled }) => (
          <li key={label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
            <span className="text-[11px] text-slate-200">{label}</span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
              enabled
                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                : 'border-slate-700 bg-slate-800 text-slate-400'
            }`}>
              {enabled ? 'ON' : 'OFF'}
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
});

export default NotificationsTab;