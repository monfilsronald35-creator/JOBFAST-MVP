import { memo } from 'react';
import { motion } from 'framer-motion';

interface Review { id?: string; reviewerName?: string; rating?: number; comment?: string; }
interface ReviewData { reviews?: Review[]; averageRating?: number; }
interface ProfileData { rating?: number; [key: string]: unknown; }
interface SectionProps { profile?: ProfileData; data?: ReviewData | Review[]; }

const ReviewsSection = memo(function ReviewsSection({ profile, data }: SectionProps) {
  const reviews: Review[] = Array.isArray(data) ? data : (data?.reviews ?? []);
  const avg = (!Array.isArray(data) ? data?.averageRating : null) ?? profile?.rating ?? 0;
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.8rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-5 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-black text-white">⭐ Reviews</h3>
        <span className="ml-auto text-sm font-bold text-amber-300">{Number(avg).toFixed(1)}</span>
      </div>
      {reviews.length === 0 ? (
        <p className="text-[11px] text-slate-400">No reviews yet.</p>
      ) : (
        <ul className="space-y-3">
          {reviews.slice(0, 5).map((r, i) => (
            <li key={r.id ?? i} className="rounded-2xl border border-white/8 bg-black/20 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-white">{r.reviewerName ?? 'Anonymous'}</span>
                <span className="text-amber-400 text-[11px]">{'★'.repeat(Math.min(5, Math.round(r.rating ?? 5)))}</span>
              </div>
              <p className="text-[11px] text-slate-300">{r.comment ?? ''}</p>
            </li>
          ))}
        </ul>
      )}
    </motion.section>
  );
});

export default ReviewsSection;