import React, { memo } from 'react';
import { motion } from 'framer-motion';

const BADGES = [
  { key: 'identity', label: 'Identity Verified', icon: '🪪' },
  { key: 'phone', label: 'Phone Verified', icon: '📱' },
  { key: 'email', label: 'Email Verified', icon: '✉️' },
  { key: 'payment', label: 'Payment Verified', icon: '💳' },
  { key: 'government', label: 'Gov ID Verified', icon: '🏛️' },
];

const ProfileTrust = memo(function ProfileTrust({ profile, data }) {
  const score = data?.trustScore ?? profile?.trustScore ?? 0;
  const verified = data?.verifiedFields ?? [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.8rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🛡️</span>
        <h3 className="text-base font-black text-white">Trust Center</h3>
        <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-400/10 border border-emerald-400/30 px-3 py-1 text-[11px] font-bold text-emerald-300">
          {score}% Trusted
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {BADGES.map(({ key, label, icon }) => {
          const isVerified = verified.includes(key) || profile?.verificationStatus === 'verified';
          return (
            <div
              key={key}
              className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-[11px] border ${
                isVerified
                  ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                  : 'border-slate-700 bg-slate-800/40 text-slate-500'
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
              {isVerified && <span className="ml-auto">✓</span>}
            </div>
          );
        })}
      </div>
    </motion.section>
  );
});

export default ProfileTrust;