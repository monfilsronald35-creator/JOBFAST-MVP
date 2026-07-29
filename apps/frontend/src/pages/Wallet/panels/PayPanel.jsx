import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';

const PayPanel = memo(function PayPanel({ onClose }) {
  const [code, setCode] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-4 rounded-3xl border border-white/10 bg-slate-900/90 backdrop-blur-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-black text-white">🔳 Pay</h3>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="h-40 w-40 rounded-2xl bg-white flex items-center justify-center">
          <p className="text-[10px] text-slate-900 text-center px-2">Scan to Pay<br />QR Code</p>
        </div>

        <div className="w-full">
          <p className="text-[11px] text-slate-400 mb-2">Or enter payment code:</p>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Payment code"
              className="flex-1 rounded-2xl bg-black/40 border border-slate-700 px-4 py-2.5 text-[11px] text-slate-100 outline-none focus:border-amber-400"
            />
            <button type="button" disabled={!code} className="rounded-2xl bg-amber-400 px-4 py-2.5 text-[11px] font-bold text-black disabled:opacity-40">
              Pay
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default PayPanel;