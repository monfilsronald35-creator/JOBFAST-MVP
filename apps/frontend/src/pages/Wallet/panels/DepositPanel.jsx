import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';

const METHODS = [
  { id: 'card', label: 'Credit / Debit Card', icon: '💳' },
  { id: 'moncash', label: 'MonCash', icon: '📱' },
  { id: 'natcash', label: 'Natcash', icon: '📱' },
  { id: 'bank', label: 'Bank Transfer', icon: '🏦' },
];

const DepositPanel = memo(function DepositPanel({ onClose }) {
  const [method, setMethod] = useState('');
  const [amount, setAmount] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-4 rounded-3xl border border-white/10 bg-slate-900/90 backdrop-blur-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-black text-white">💰 Deposit</h3>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {METHODS.map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMethod(m.id)}
            className={`rounded-2xl border px-3 py-2 text-[11px] text-left transition-all ${
              method === m.id ? 'border-amber-400/60 bg-amber-400/10 text-amber-300' : 'border-white/10 bg-black/30 text-slate-200'
            }`}
          >
            <span className="text-base">{m.icon}</span> {m.label}
          </button>
        ))}
      </div>

      <input
        type="number"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="Amount (HTG)"
        min="1"
        className="w-full rounded-2xl bg-black/40 border border-slate-700 px-4 py-3 text-[11px] text-slate-100 outline-none focus:border-amber-400 mb-3"
      />
      <button
        type="button"
        disabled={!method || !amount}
        className="w-full rounded-2xl bg-emerald-500 py-3 text-[12px] font-black text-black disabled:opacity-40"
      >
        Deposit
      </button>
    </motion.div>
  );
});

export default DepositPanel;