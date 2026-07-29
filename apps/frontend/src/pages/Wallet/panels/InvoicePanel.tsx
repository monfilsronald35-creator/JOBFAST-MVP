import { memo, useState } from 'react';
import { motion } from 'framer-motion';

interface Props { onClose: () => void; }

const InvoicePanel = memo(function InvoicePanel({ onClose }: Props) {
  const [client, setClient] = useState('');
  const [desc,   setDesc]   = useState('');
  const [amount, setAmount] = useState('');
  const [due,    setDue]    = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-4 rounded-3xl border border-white/10 bg-slate-900/90 backdrop-blur-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-black text-white">📄 Create Invoice</h3>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
      </div>

      <div className="space-y-3">
        <input
          value={client}
          onChange={e => setClient(e.target.value)}
          placeholder="Client name or email"
          className="w-full rounded-2xl bg-black/40 border border-slate-700 px-4 py-2.5 text-[11px] text-slate-100 outline-none focus:border-amber-400"
        />
        <input
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Service description"
          className="w-full rounded-2xl bg-black/40 border border-slate-700 px-4 py-2.5 text-[11px] text-slate-100 outline-none focus:border-amber-400"
        />
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Amount (HTG)"
          className="w-full rounded-2xl bg-black/40 border border-slate-700 px-4 py-2.5 text-[11px] text-slate-100 outline-none focus:border-amber-400"
        />
        <input
          type="date"
          value={due}
          onChange={e => setDue(e.target.value)}
          className="w-full rounded-2xl bg-black/40 border border-slate-700 px-4 py-2.5 text-[11px] text-slate-100 outline-none focus:border-amber-400"
        />
        <button
          type="button"
          disabled={!client || !amount}
          className="w-full rounded-2xl bg-amber-400 py-3 text-[12px] font-black text-black disabled:opacity-40"
        >
          Send Invoice
        </button>
      </div>
    </motion.div>
  );
});

export default InvoicePanel;