import React, { memo } from 'react';
import { motion } from 'framer-motion';

function StarRating({ value = 0 }) {
  return (
    <span className="text-amber-400 text-[11px]">
      {'★'.repeat(Math.round(value))}{'☆'.repeat(5 - Math.round(value))}
    </span>
  );
}

const ProfileReviews = memo(function ProfileReviews({ profile, data }) {
  const reviews = Array.isArray(data) ? data : data?.reviews ?? [];
  const avg = data?.averageRating ?? profile?.rating ?? 0;
  const total = data?.totalCount ?? profile?.reviewCount ?? reviews.length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.8rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">⭐</span>
        <h3 className="text-base font-black text-white">Reviews</h3>
        <span className="ml-auto text-sm text-slate-300">{avg.toFixed(1)} · {total} reviews</span>
      </div>

      {reviews.length === 0 ? (
        <p className="text-[11px] text-slate-400">No reviews yet.</p>
      ) : (
        <ul className="space-y-3">
          {reviews.slice(0, 5).map((r, i) => (
            <li key={r.id ?? i} className="rounded-2xl border border-white/8 bg-black/20 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-white">{r.reviewerName ?? 'Anonymous'}</span>
                <StarRating value={r.rating ?? 5} />
              </div>
              <p className="text-[11px] text-slate-300">{r.comment ?? ''}</p>
            </li>
          ))}
        </ul>
      )}
    </motion.section>
  );
});

export default ProfileReviews;