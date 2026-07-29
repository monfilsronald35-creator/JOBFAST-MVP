import React, { memo } from 'react';
import { motion } from 'framer-motion';

const ProfileTimeline = memo(function ProfileTimeline({ profile, data }) {
  const events = Array.isArray(data) ? data : data?.events ?? [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.8rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📅</span>
        <h3 className="text-base font-black text-white">Career Timeline</h3>
      </div>

      {events.length === 0 ? (
        <p className="text-[11px] text-slate-400">No timeline events yet.</p>
      ) : (
        <ol className="relative border-l border-slate-700 ml-3 space-y-4">
          {events.map((ev, i) => (
            <li key={ev.id ?? i} className="ml-4">
              <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-amber-400 border border-slate-900" />
              <p className="text-[10px] text-slate-400 mb-0.5">{ev.date ?? ''}</p>
              <p className="text-[11px] font-bold text-white">{ev.title ?? ''}</p>
              {ev.description && <p className="text-[10px] text-slate-300 mt-0.5">{ev.description}</p>}
            </li>
          ))}
        </ol>
      )}
    </motion.section>
  );
});

export default ProfileTimeline;