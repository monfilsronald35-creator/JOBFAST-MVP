import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';

const WithdrawPanel = memo(function WithdrawPanel({ onClose }) {
  const [dest, setDest] = useState('');
  const [amount, setAmount] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-4 rounded-3xl border border-white/10 bg-slate-900/90 backdrop-blur-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-black text-white">📤 Withdraw</h3>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
      </div>

      <div className="space-y-3">
        <select
          value={dest}
          onChange={e => setDest(e.target.value)}
          className="w-full rounded-2xl bg-black/40 border border-slate-700 px-4 py-3 text-[11px] text-slate-100 outline-none focus:border-amber-400"
        >
          <option value="">Select destination</option>
          <option value="moncash">MonCash</option>
          <option value="natcash">Natcash</option>
          <option value="bank">Bank Account</option>
          <option value="card">Debit Card</option>
        </select>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Amount (HTG)"
          min="1"
          className="w-full rounded-2xl bg-black/40 border border-slate-700 px-4 py-3 text-[11px] text-slate-100 outline-none focus:border-amber-400"
        />
        <p className="text-[10px] text-slate-400">Processing time: 1–3 business days.</p>
        <button
          type="button"
          disabled={!dest || !amount}
          className="w-full rounded-2xl bg-amber-400 py-3 text-[12px] font-black text-black disabled:opacity-40"
        >
          Withdraw
        </button>
      </div>
    </motion.div>
  );
});

export default WithdrawPanel;