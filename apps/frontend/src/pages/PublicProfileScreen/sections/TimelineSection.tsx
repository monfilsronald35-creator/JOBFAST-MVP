import { memo } from 'react';
import { motion } from 'framer-motion';

interface TimelineEvent { id?: string; period?: string; date?: string; title?: string; company?: string; description?: string; }
interface TimelineData { events?: TimelineEvent[]; }
interface SectionProps { profile?: Record<string, unknown>; data?: TimelineData | TimelineEvent[]; }

const TimelineSection = memo(function TimelineSection({ profile: _profile, data }: SectionProps) {
  const events: TimelineEvent[] = Array.isArray(data) ? data : (data?.events ?? []);
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.8rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-5 mt-4">
      <h3 className="text-base font-black text-white mb-4">📅 Experience</h3>
      {events.length === 0 ? (
        <p className="text-[11px] text-slate-400">No experience listed.</p>
      ) : (
        <ol className="relative border-l border-slate-700 ml-3 space-y-4">
          {events.map((ev, i) => (
            <li key={ev.id ?? i} className="ml-4">
              <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-amber-400 border border-slate-900" />
              <p className="text-[10px] text-amber-400 mb-0.5">{ev.period ?? ev.date ?? ''}</p>
              <p className="text-[11px] font-bold text-white">{ev.title ?? ''}</p>
              <p className="text-[10px] text-slate-400">{ev.company ?? ev.description ?? ''}</p>
            </li>
          ))}
        </ol>
      )}
    </motion.section>
  );
});

export default TimelineSection;