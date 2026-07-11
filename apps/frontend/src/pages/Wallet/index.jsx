import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { walletAPI } from '../../services/wallet';

// ── Mock data (shown while backend wallet endpoints aren't live) ─
const MOCK_BALANCE = { amount: 0, currency: 'HTG', usd: 0, eur: 0 };

const MOCK_TRANSACTIONS = [
  { _id:'t1', type:'received', label:'Peman pou sèvis elektrik', amount:8500,  currency:'HTG', from:'Marc A.',    date:'2026-07-10', status:'completed' },
  { _id:'t2', type:'sent',     label:'Peman loyer ekipman',     amount:3000,  currency:'HTG', to:'Paul G.',      date:'2026-07-09', status:'completed' },
  { _id:'t3', type:'deposit',  label:'Depot via MonCash',       amount:15000, currency:'HTG', from:'MonCash',    date:'2026-07-08', status:'completed' },
  { _id:'t4', type:'withdraw', label:'Retrait bank',            amount:10000, currency:'HTG', to:'BNC',          date:'2026-07-07', status:'completed' },
  { _id:'t5', type:'escrow',   label:'Travay konstriksyon',     amount:25000, currency:'HTG', from:'JOBFAST',    date:'2026-07-06', status:'pending'   },
];

const MOCK_RATES = { USD: 135.5, EUR: 148.2, CAD: 99.8 };

// ── Helpers ──────────────────────────────────────────────────
function fmt(amount, currency = 'HTG') {
  return `${currency} ${Number(amount).toLocaleString()}`;
}

function txIcon(type) {
  return { received:'⬇️', sent:'⬆️', deposit:'💳', withdraw:'🏦', escrow:'🔒' }[type] || '💸';
}

function txColor(type) {
  return { received:'text-green-400', sent:'text-red-400', deposit:'text-blue-400', withdraw:'text-orange-400', escrow:'text-amber-400' }[type] || 'text-slate-400';
}

// ── Send Money modal ──────────────────────────────────────────
function SendModal({ onClose, onSend }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ recipient:'', amount:'', currency:'HTG', note:'' });
  const [sending, setSending] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.recipient || !form.amount) return;
    setSending(true);
    await onSend(form);
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full bg-[#0d1526] rounded-t-3xl p-5 space-y-4 pb-10 z-10">
        <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-2" />
        <h3 className="text-base font-bold">{t('wallet.send', { defaultValue: 'Voye Lajan' })}</h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" value={form.recipient} onChange={e=>set('recipient',e.target.value)}
            placeholder={t('wallet.recipientPlaceholder', { defaultValue: 'Telefòn, email, oswa @username' })}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/50" required />

          <div className="flex gap-3">
            <input type="number" value={form.amount} onChange={e=>set('amount',e.target.value)}
              placeholder="0" min="1" required
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50" />
            <select value={form.currency} onChange={e=>set('currency',e.target.value)}
              className="w-24 px-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none">
              <option>HTG</option><option>USD</option><option>EUR</option>
            </select>
          </div>

          <input type="text" value={form.note} onChange={e=>set('note',e.target.value)}
            placeholder={t('wallet.notePlaceholder', { defaultValue: 'Nòt (opsyonèl)' })}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/50" />

          <button type="submit" disabled={sending}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-900 font-black text-sm transition">
            {sending ? '⏳…' : `⬆️ ${t('wallet.sendNow', { defaultValue: 'Voye Kounye a' })}`}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Deposit modal ─────────────────────────────────────────────
function DepositModal({ onClose }) {
  const { t } = useTranslation();
  const methods = [
    { id:'moncash',   icon:'📱', label:'MonCash'  },
    { id:'natcash',   icon:'💳', label:'NatCash'  },
    { id:'card',      icon:'💳', label:'Card'     },
    { id:'bank',      icon:'🏦', label:'Bank'     },
    { id:'bitcoin',   icon:'₿',  label:'Bitcoin'  },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full bg-[#0d1526] rounded-t-3xl p-5 pb-10 z-10">
        <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4" />
        <h3 className="text-base font-bold mb-4">{t('wallet.depositVia', { defaultValue: 'Depoze via' })}</h3>
        <div className="space-y-2">
          {methods.map(m => (
            <button key={m.id} type="button"
              className="flex items-center gap-3 w-full px-4 py-3.5 bg-slate-800 border border-slate-700 hover:border-amber-500/50 rounded-xl transition text-left"
              onClick={() => { /* TODO: open payment flow */ onClose(); }}>
              <span className="text-xl">{m.icon}</span>
              <span className="text-sm font-semibold">{m.label}</span>
              <span className="ml-auto text-slate-500 text-sm">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
export default function WalletPage() {
  const { t }    = useTranslation();
  const { user } = useAuth();

  const [balance,      setBalance]      = useState(MOCK_BALANCE);
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
  const [rates,        setRates]        = useState(MOCK_RATES);
  const [loading,      setLoading]      = useState(false);
  const [showSend,     setShowSend]     = useState(false);
  const [showDeposit,  setShowDeposit]  = useState(false);
  const [activeTab,    setActiveTab]    = useState('all'); // all | received | sent | pending

  useEffect(() => {
    setLoading(true);
    Promise.all([
      walletAPI.getBalance().then(r => setBalance(r?.data?.data || r?.data || MOCK_BALANCE)).catch(()=>{}),
      walletAPI.getTransactions().then(r => {
        const d = r?.data?.data || r?.data;
        if (Array.isArray(d) && d.length) setTransactions(d);
      }).catch(()=>{}),
      walletAPI.getExchangeRates().then(r => setRates(r?.data?.data || r?.data || MOCK_RATES)).catch(()=>{}),
    ]).finally(() => setLoading(false));
  }, []);

  const handleSend = async (data) => {
    try {
      await walletAPI.sendMoney(data);
      setTransactions(prev => [{
        _id: Date.now(), type:'sent', label: data.note || `Voye a ${data.recipient}`,
        amount: Number(data.amount), currency: data.currency, to: data.recipient,
        date: new Date().toISOString().slice(0,10), status:'completed',
      }, ...prev]);
    } catch { /* show error toast TODO */ }
    setShowSend(false);
  };

  const filteredTx = transactions.filter(tx => {
    if (activeTab === 'all')      return true;
    if (activeTab === 'received') return ['received','deposit'].includes(tx.type);
    if (activeTab === 'sent')     return ['sent','withdraw'].includes(tx.type);
    if (activeTab === 'pending')  return tx.status === 'pending';
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#020617] text-white pb-24">

      {/* ── Balance card ─────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-5 shadow-2xl shadow-indigo-900/50">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />

          <div className="relative z-10">
            <p className="text-indigo-200 text-xs uppercase tracking-widest mb-1">{t('wallet.balance', { defaultValue: 'Balans Total' })}</p>
            <p className="text-4xl font-black tracking-tight">
              {fmt(balance.amount, balance.currency)}
            </p>
            {/* secondary balances */}
            <div className="flex items-center gap-4 mt-3">
              <span className="text-indigo-200 text-xs">≈ USD {Number(balance.usd || balance.amount / (rates.USD || 135.5)).toFixed(2)}</span>
              <span className="text-indigo-300 text-xs">|</span>
              <span className="text-indigo-200 text-xs">≈ EUR {Number(balance.eur || balance.amount / (rates.EUR || 148.2)).toFixed(2)}</span>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-indigo-100">
                {user?.name || 'JOBFAST User'}
              </span>
              <span className="text-xs text-indigo-300">•</span>
              <span className="text-xs text-indigo-200">{t('wallet.escrowProtected', { defaultValue: '🔒 Escrow protège' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick actions ─────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2 px-4 py-3">
        {[
          { icon:'⬆️', label:t('wallet.send',     { defaultValue:'Voye'    }), action:() => setShowSend(true)    },
          { icon:'⬇️', label:t('wallet.receive',  { defaultValue:'Resevwa' }), action:() => {}                   },
          { icon:'💳', label:t('wallet.deposit',  { defaultValue:'Depoze'  }), action:() => setShowDeposit(true) },
          { icon:'🏦', label:t('wallet.withdraw', { defaultValue:'Retire'  }), action:() => {}                   },
        ].map(({ icon, label, action }) => (
          <button key={label} type="button" onClick={action}
            className="flex flex-col items-center gap-1.5 py-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl hover:border-indigo-500/40 transition">
            <span className="text-xl leading-none">{icon}</span>
            <span className="text-xs text-slate-300 font-semibold">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Exchange rates ────────────────────────────────────── */}
      <div className="mx-4 mb-3 p-3 bg-slate-800/40 border border-slate-700/60 rounded-2xl">
        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">💱 {t('wallet.rates', { defaultValue: 'Taux de change' })}</p>
        <div className="flex justify-between">
          {[['USD', rates.USD], ['EUR', rates.EUR], ['CAD', rates.CAD]].map(([cur, rate]) => (
            <div key={cur} className="text-center">
              <p className="text-xs text-slate-400">{cur}</p>
              <p className="text-sm font-black text-white">{rate}</p>
              <p className="text-xs text-slate-600">HTG</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Transactions ──────────────────────────────────────── */}
      <div className="px-4 flex-1">
        {/* tabs */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { id:'all',      label:t('wallet.all',      { defaultValue:'Tout'       }) },
            { id:'received', label:t('wallet.received', { defaultValue:'Resevwa'    }) },
            { id:'sent',     label:t('wallet.sent',     { defaultValue:'Voye'       }) },
            { id:'pending',  label:t('wallet.pending',  { defaultValue:'An Atant'   }) },
          ].map(tb => (
            <button key={tb.id} type="button" onClick={() => setActiveTab(tb.id)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                activeTab === tb.id
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
              }`}>
              {tb.label}
            </button>
          ))}
        </div>

        {/* list */}
        {loading && (
          <div className="space-y-3">
            {Array.from({length: 4}).map((_,i) => (
              <div key={i} className="h-16 bg-slate-800/40 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && filteredTx.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <span className="text-4xl">💳</span>
            <p className="text-slate-400 text-sm">{t('wallet.noTransactions', { defaultValue: 'Okenn tranzaksyon' })}</p>
          </div>
        )}

        {!loading && filteredTx.map(tx => (
          <div key={tx._id}
            className="flex items-center gap-3 py-3.5 border-b border-slate-800/60 last:border-none">
            {/* icon */}
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-lg">
              {txIcon(tx.type)}
            </div>
            {/* info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{tx.label}</p>
              <p className="text-xs text-slate-500">
                {tx.from ? `↙ ${tx.from}` : tx.to ? `↗ ${tx.to}` : ''} · {tx.date}
              </p>
            </div>
            {/* amount + status */}
            <div className="text-right shrink-0">
              <p className={`text-sm font-black ${txColor(tx.type)}`}>
                {['received','deposit'].includes(tx.type) ? '+' : '-'}{fmt(tx.amount, tx.currency)}
              </p>
              <p className={`text-xs ${tx.status === 'pending' ? 'text-amber-400' : 'text-slate-600'}`}>
                {tx.status === 'pending' ? '⏳ ' + t('wallet.pending', { defaultValue:'An atant' }) : '✓'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Cards & bank accounts section ────────────────────── */}
      <div className="mx-4 mt-4 mb-2 p-4 bg-slate-800/30 border border-slate-700/60 rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold">{t('wallet.cardsAndAccounts', { defaultValue: 'Kat & Kont Bank' })}</p>
          <button type="button" className="text-xs text-amber-400 font-bold">
            + {t('wallet.add', { defaultValue: 'Ajoute' })}
          </button>
        </div>
        <div className="space-y-2">
          {[
            { icon:'📱', label:'MonCash', value:'+509 *** ***', linked:true  },
            { icon:'🏦', label:'BNC',     value:'Kont *** 4521', linked:true  },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center text-lg">{item.icon}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="text-xs text-slate-500">{item.value}</p>
              </div>
              {item.linked && <span className="text-xs text-green-400 font-bold">● Konekte</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Escrow notice ─────────────────────────────────────── */}
      <div className="mx-4 mb-2 p-4 bg-indigo-900/30 border border-indigo-700/40 rounded-2xl">
        <p className="text-xs font-bold text-indigo-300 mb-1">🔒 {t('wallet.escrowTitle', { defaultValue: 'JOBFAST Escrow' })}</p>
        <p className="text-xs text-slate-400 leading-relaxed">
          {t('wallet.escrowDesc', { defaultValue: 'Lajan travay yo kenbe an sekurité jiskaske travay la valide pa tou de pati yo. Sa pwoteje Travayè ak Anplwayè.' })}
        </p>
      </div>

      {/* ── Modals ───────────────────────────────────────────── */}
      {showSend    && <SendModal    onClose={() => setShowSend(false)}    onSend={handleSend}              />}
      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)}                                  />}
    </div>
  );
}
