import { memo, useState } from 'react';
import { motion } from 'framer-motion';

interface SendPayload { recipient: string; amount: number; note: string; }
interface Props { onClose?: () => void; onSend?: (data: SendPayload) => Promise<void>; }

const SendPanel = memo(function SendPanel({ onClose, onSend }: Props) {
  const [recipient, setRecipient] = useState('');
  const [amount,    setAmount]    = useState('');
  const [note,      setNote]      = useState('');
  const [loading,   setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount) return;
    setLoading(true);
    try {
      await onSend?.({ recipient, amount: parseFloat(amount) * 100, note });
      onClose?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-4 rounded-3xl border border-white/10 bg-slate-900/90 backdrop-blur-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-black text-white">💸 Send Money</h3>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          value={recipient}
          onChange={e => setRecipient(e.target.value)}
          placeholder="Recipient (phone, email, or @username)"
          className="w-full rounded-2xl bg-black/40 border border-slate-700 px-4 py-3 text-[11px] text-slate-100 outline-none focus:border-amber-400"
          required
        />
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Amount (HTG)"
          min="1"
          step="0.01"
          className="w-full rounded-2xl bg-black/40 border border-slate-700 px-4 py-3 text-[11px] text-slate-100 outline-none focus:border-amber-400"
          required
        />
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Note (optional)"
          className="w-full rounded-2xl bg-black/40 border border-slate-700 px-4 py-3 text-[11px] text-slate-100 outline-none focus:border-amber-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-amber-400 py-3 text-[12px] font-black text-black disabled:opacity-50"
        >
          {loading ? 'Sending…' : 'Send'}
        </button>
      </form>
    </motion.div>
  );
});

export default SendPanel;