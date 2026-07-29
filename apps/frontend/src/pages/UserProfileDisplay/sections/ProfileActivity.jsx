import React, { memo } from 'react';
import { motion } from 'framer-motion';

const ProfileActivity = memo(function ProfileActivity({ profile, data }) {
  const activities = Array.isArray(data) ? data : data?.items ?? [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.8rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">⚡</span>
        <h3 className="text-base font-black text-white">Recent Activity</h3>
      </div>

      {activities.length === 0 ? (
        <p className="text-[11px] text-slate-400">No recent activity.</p>
      ) : (
        <ul className="space-y-2">
          {activities.slice(0, 8).map((act, i) => (
            <li key={act.id ?? i} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-3 py-2">
              <span className="text-base">{act.icon ?? '📌'}</span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-white truncate">{act.title ?? ''}</p>
                <p className="text-[9px] text-slate-400">{act.time ?? ''}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </motion.section>
  );
});

export default ProfileActivity;