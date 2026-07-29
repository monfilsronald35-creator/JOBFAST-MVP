import React, { memo } from 'react';
import { motion } from 'framer-motion';

const BookingPanel = memo(function BookingPanel({ profile, data }) {
  const bookings = Array.isArray(data) ? data : data?.bookings ?? [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.8rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📆</span>
        <h3 className="text-base font-black text-white">Bookings</h3>
        <button
          type="button"
          className="ml-auto rounded-2xl bg-amber-400 px-4 py-1.5 text-[11px] font-bold text-black hover:bg-amber-300 transition-colors"
        >
          Book Now
        </button>
      </div>

      {bookings.length === 0 ? (
        <p className="text-[11px] text-slate-400">No upcoming bookings.</p>
      ) : (
        <ul className="space-y-2">
          {bookings.slice(0, 5).map((b, i) => (
            <li key={b.id ?? i} className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-3 py-2">
              <div>
                <p className="text-[11px] font-bold text-white">{b.title ?? 'Booking'}</p>
                <p className="text-[9px] text-slate-400">{b.date ?? ''} · {b.duration ?? ''}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                b.status === 'confirmed' ? 'bg-emerald-400/20 text-emerald-300' :
                b.status === 'pending' ? 'bg-amber-400/20 text-amber-300' :
                'bg-slate-700 text-slate-400'
              }`}>
                {b.status ?? 'Pending'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </motion.section>
  );
});

export default BookingPanel;