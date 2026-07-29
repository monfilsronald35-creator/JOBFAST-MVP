import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';

const CURRENCIES = ['HTG', 'USD', 'EUR', 'XCD'];
const RATES = { HTG: 1, USD: 0.0078, EUR: 0.0072, XCD: 0.021 };

const ExchangePanel = memo(function ExchangePanel({ onClose }) {
  const [from, setFrom] = useState('HTG');
  const [to, setTo] = useState('USD');
  const [amount, setAmount] = useState('');

  const converted = amount
    ? ((parseFloat(amount) * RATES[to]) / RATES[from]).toFixed(2)
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-4 rounded-3xl border border-white/10 bg-slate-900/90 backdrop-blur-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-black text-white">🔄 Exchange</h3>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[9px] text-slate-400 mb-1">From</p>
            <select
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="w-full rounded-2xl bg-black/40 border border-slate-700 px-3 py-2.5 text-[11px] text-slate-100 outline-none"
            >
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <p className="text-[9px] text-slate-400 mb-1">To</p>
            <select
              value={to}
              onChange={e => setTo(e.target.value)}
              className="w-full rounded-2xl bg-black/40 border border-slate-700 px-3 py-2.5 text-[11px] text-slate-100 outline-none"
            >
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder={`Amount in ${from}`}
          className="w-full rounded-2xl bg-black/40 border border-slate-700 px-4 py-3 text-[11px] text-slate-100 outline-none focus:border-amber-400"
        />

        {converted && (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-center">
            <p className="text-xl font-black text-emerald-300">{converted} {to}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Indicative rate · Live rate at transaction</p>
          </div>
        )}

        <button
          type="button"
          disabled={!amount || from === to}
          className="w-full rounded-2xl bg-amber-400 py-3 text-[12px] font-black text-black disabled:opacity-40"
        >
          Exchange
        </button>
      </div>
    </motion.div>
  );
});

export default ExchangePanel;