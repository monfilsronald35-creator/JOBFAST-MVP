import React, { useState, useCallback, memo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { walletAPI } from '../../services/wallet';

// ── Design tokens ────────────────────────────────────────────────
const BG   = '#050B18';
const CARD = '#0d1526';

// ── Mock data ────────────────────────────────────────────────────
const MOCK_BALANCES = [
  { currency: 'USD', symbol: '$',   amount: 2845.60  },
  { currency: 'EUR', symbol: '€',   amount: 1245.30  },
  { currency: 'HTG', symbol: 'HTG ', amount: 385400  },
  { currency: 'DOP', symbol: 'RD$', amount: 148250   },
];

const MOCK_TRANSACTIONS = [
  { id:'t1', type:'income',      icon:'⬇', label:'ABC Construction',   sub:'Payment Received',    amount:'+$800',   color:'text-green-400', date:'Jul 10', status:'completed' },
  { id:'t2', type:'marketplace', icon:'🛒', label:'Online Purchase',    sub:'Marketplace',         amount:'-$45',    color:'text-red-400',   date:'Jul 9',  status:'completed' },
  { id:'t3', type:'reservation', icon:'🏨', label:'Hotel Montana',      sub:'Reservation Payment', amount:'-$240',   color:'text-red-400',   date:'Jul 8',  status:'completed' },
  { id:'t4', type:'salary',      icon:'💼', label:'Monthly Salary',     sub:'Ronald Monfils',      amount:'+$1,200', color:'text-green-400', date:'Jul 7',  status:'completed' },
  { id:'t5', type:'transfer',    icon:'↗',  label:'Transfer to Paul G.',sub:'Transfer',            amount:'-$300',   color:'text-red-400',   date:'Jul 6',  status:'completed' },
  { id:'t6', type:'crypto',      icon:'₿',  label:'Bitcoin Received',   sub:'Crypto',              amount:'+$520',   color:'text-green-400', date:'Jul 5',  status:'completed' },
  { id:'t7', type:'income',      icon:'⬇', label:'Hotel Montana',      sub:'Service Payment',     amount:'+$150',   color:'text-green-400', date:'Jul 4',  status:'completed' },
  { id:'t8', type:'expenses',    icon:'⬆', label:'Utility Bills',      sub:'Electricity',         amount:'-$85',    color:'text-red-400',   date:'Jul 3',  status:'completed' },
];

const MOCK_ESCROW = [
  { id:'e1', title:'Construction Project', amount:'$4,500', employer:'ABC Construction', worker:'Ronald Monfils', status:'active',    color:'text-green-400', dot:'bg-green-500' },
  { id:'e2', title:'Restaurant Renovation',amount:'$2,100', employer:'Hotel Montana',    worker:'Jean Louis',     status:'active',    color:'text-green-400', dot:'bg-green-500' },
  { id:'e3', title:'Electrical Work',      amount:'$800',   employer:'Paul G.',          worker:'Ronald Monfils', status:'completed', color:'text-slate-400', dot:'bg-slate-500' },
];

const TX_FILTERS = ['All','Income','Expenses','Marketplace','Reservations','Salary','Transfer','Crypto'];

const DEPOSIT_METHODS = [
  { id:'card',     icon:'💳', label:'Debit / Credit Card' },
  { id:'apple',    icon:'🍎', label:'Apple Pay'           },
  { id:'google',   icon:'🟢', label:'Google Pay'          },
  { id:'paypal',   icon:'🅿️', label:'PayPal'              },
  { id:'stripe',   icon:'⚡', label:'Stripe'              },
  { id:'wise',     icon:'💸', label:'Wise'                },
  { id:'remitly',  icon:'✈️', label:'Remitly'             },
  { id:'bank',     icon:'🏦', label:'Bank Transfer'       },
  { id:'wu',       icon:'🌐', label:'Western Union'       },
  { id:'mg',       icon:'💵', label:'MoneyGram'           },
  { id:'usdt',     icon:'🪙', label:'USDT'                },
  { id:'btc',      icon:'₿',  label:'Bitcoin'             },
  { id:'eth',      icon:'Ξ',  label:'Ethereum'            },
  { id:'moncash',  icon:'📱', label:'MonCash'             },
  { id:'natcash',  icon:'📲', label:'NatCash'             },
];

const WITHDRAW_METHODS = [
  { id:'bank',   icon:'🏦', label:'Bank Account'  },
  { id:'card',   icon:'💳', label:'Card'          },
  { id:'crypto', icon:'🪙', label:'Crypto Wallet' },
  { id:'mc',     icon:'📱', label:'MonCash'       },
  { id:'nc',     icon:'📲', label:'NatCash'       },
  { id:'cash',   icon:'💵', label:'Cash Pickup'   },
  { id:'agent',  icon:'🏪', label:'Agent'         },
];

const PAY_CATEGORIES = [
  { id:'worker',      icon:'👷', label:'Worker'           },
  { id:'company',     icon:'🏢', label:'Company'          },
  { id:'hotel',       icon:'🏨', label:'Hotel'            },
  { id:'restaurant',  icon:'🍽', label:'Restaurant'       },
  { id:'hospital',    icon:'🏥', label:'Hospital'         },
  { id:'marketplace', icon:'🛒', label:'Marketplace'      },
  { id:'supplier',    icon:'🚚', label:'Supplier'         },
  { id:'lawyer',      icon:'⚖', label:'Lawyer'           },
  { id:'doctor',      icon:'👨‍⚕️', label:'Doctor'           },
  { id:'reservation', icon:'📅', label:'Reservation'      },
  { id:'invoice',     icon:'📄', label:'Invoice'          },
  { id:'rent',        icon:'🏠', label:'Rent'             },
  { id:'transport',   icon:'🚕', label:'Transport'        },
  { id:'school',      icon:'🏫', label:'School'           },
  { id:'utility',     icon:'⚡', label:'Utility Bills'    },
];

const CURRENCIES = ['USD','EUR','HTG','DOP','CAD','GBP','MXN','JPY','CNY','USDT','BTC','ETH'];

// ── Helpers ──────────────────────────────────────────────────────
const cls = (...parts) => parts.filter(Boolean).join(' ');

function fmtBalance({ symbol, amount, currency }) {
  if (['HTG','DOP','CAD','GBP','MXN','JPY','CNY'].includes(currency)) {
    return `${symbol}${Number(amount).toLocaleString()}`;
  }
  return `${symbol}${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Shared UI pieces ─────────────────────────────────────────────
const Pill = memo(function Pill({ label, active, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={cls('shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition',
        active ? 'bg-amber-500 border-amber-400 text-slate-900' : 'bg-slate-800/70 border-slate-700/60 text-slate-400 hover:text-slate-200')}>
      {label}
    </button>
  );
});

const SectionTitle = memo(function SectionTitle({ children }) {
  return <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 mb-3 mt-5">{children}</p>;
});

// ── Full-screen panel wrapper ────────────────────────────────────
const Panel = memo(function Panel({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: BG }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-slate-800/70">
        <button type="button" onClick={onClose}
          className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white">
          ←
        </button>
        <p className="font-black text-base">{title}</p>
      </div>
      <div className="flex-1 overflow-y-auto pb-10">
        {children}
      </div>
    </div>
  );
});

// ── Simple QR placeholder ────────────────────────────────────────
function QRPlaceholder({ value }) {
  return (
    <div className="w-44 h-44 mx-auto bg-white p-2 rounded-2xl flex items-center justify-center">
      <svg viewBox="0 0 21 21" className="w-full h-full" shapeRendering="crispEdges">
        {/* Corner squares */}
        <rect x="0" y="0" width="7" height="7" fill="#000" />
        <rect x="1" y="1" width="5" height="5" fill="#fff" />
        <rect x="2" y="2" width="3" height="3" fill="#000" />
        <rect x="14" y="0" width="7" height="7" fill="#000" />
        <rect x="15" y="1" width="5" height="5" fill="#fff" />
        <rect x="16" y="2" width="3" height="3" fill="#000" />
        <rect x="0" y="14" width="7" height="7" fill="#000" />
        <rect x="1" y="15" width="5" height="5" fill="#fff" />
        <rect x="2" y="16" width="3" height="3" fill="#000" />
        {/* Data cells */}
        {[9,10,12,15,17,11,14,16,18,8,13,19,20].map((x,i) =>
          [8,9,11,13,15,17,10,12,14,16,18,20].map((y,j) =>
            (x+y+i*j) % 3 !== 0
              ? <rect key={`${x}-${y}-${i}-${j}`} x={x} y={y} width="1" height="1" fill="#000" />
              : null
          )
        )}
      </svg>
    </div>
  );
}

// ── SEND PANEL ───────────────────────────────────────────────────
function SendPanel({ onClose }) {
  const [step, setStep] = useState(1); // 1=recipient 2=amount 3=confirm
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [desc, setDesc] = useState('');
  const [ref, setRef] = useState('');
  const [method, setMethod] = useState('Wallet');
  const [search, setSearch] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const RECENT = ['Ronald Monfils','ABC Construction','Hotel Montana','Dr Jean Louis'];
  const CATS   = [['👷','Workers'],['🏢','Companies'],['🏨','Hotels'],['🍽','Restaurants'],['🏥','Hospitals'],['🛒','Marketplace']];
  const METHODS = ['Wallet','Visa','Mastercard','Bank','USDT'];

  if (sent) return (
    <Panel title="Send Money" onClose={onClose}>
      <div className="flex flex-col items-center justify-center h-64 gap-4 px-6">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-3xl">✅</div>
        <p className="text-xl font-black">Payment Sent!</p>
        <p className="text-slate-400 text-sm text-center">{amount} {currency} → {recipient}</p>
        <button type="button" onClick={onClose}
          className="mt-4 px-8 py-3 rounded-xl bg-amber-500 text-slate-900 font-black text-sm">Done</button>
      </div>
    </Panel>
  );

  return (
    <Panel title="Send Money" onClose={onClose}>
      {/* Step 1 — Recipient */}
      {step === 1 && (
        <div className="px-4 pt-4 space-y-4">
          <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-800/70 border border-slate-700 rounded-xl">
            <span className="text-slate-500">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, phone, @username…"
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none" />
          </div>

          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 mb-2">👤 Recent</p>
            <div className="space-y-1">
              {RECENT.filter(r => !search || r.toLowerCase().includes(search.toLowerCase())).map(r => (
                <button key={r} type="button" onClick={() => { setRecipient(r); setStep(2); }}
                  className="flex items-center gap-3 w-full px-3 py-3 bg-slate-800/50 rounded-xl hover:bg-slate-700/50 transition text-left">
                  <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold">{r[0]}</div>
                  <span className="text-sm font-semibold">{r}</span>
                  <span className="ml-auto text-slate-500 text-xs">→</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Categories</p>
            <div className="grid grid-cols-3 gap-2">
              {CATS.map(([icon, label]) => (
                <button key={label} type="button" onClick={() => { setRecipient(label); setStep(2); }}
                  className="flex flex-col items-center gap-1.5 py-3 bg-slate-800/50 rounded-xl border border-slate-700/60 hover:border-amber-500/50 transition">
                  <span className="text-xl">{icon}</span>
                  <span className="text-[11px] text-slate-400">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Amount */}
      {step === 2 && (
        <div className="px-4 pt-4 space-y-3">
          <div className="p-3 bg-slate-800/50 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold">{recipient[0]}</div>
            <p className="text-sm font-bold">{recipient}</p>
          </div>

          <label className="block">
            <p className="text-[10px] text-slate-500 mb-1.5">Amount</p>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0.00" min="0"
              className="w-full px-4 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-lg font-black focus:border-amber-500/60 outline-none" />
          </label>

          <label className="block">
            <p className="text-[10px] text-slate-500 mb-1.5">Currency</p>
            <select value={currency} onChange={e => setCurrency(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm outline-none">
              {CURRENCIES.slice(0,9).map(c => <option key={c}>{c}</option>)}
            </select>
          </label>

          <label className="block">
            <p className="text-[10px] text-slate-500 mb-1.5">Description</p>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What is this for?"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 outline-none focus:border-amber-500/60" />
          </label>

          <label className="block">
            <p className="text-[10px] text-slate-500 mb-1.5">Reference</p>
            <input value={ref} onChange={e => setRef(e.target.value)} placeholder="Invoice #, Job ID…"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 outline-none focus:border-amber-500/60" />
          </label>

          <div>
            <p className="text-[10px] text-slate-500 mb-2">Payment Method</p>
            <div className="flex flex-wrap gap-2">
              {METHODS.map(m => (
                <button key={m} type="button" onClick={() => setMethod(m)}
                  className={cls('px-3 py-1.5 rounded-xl text-xs font-bold border transition',
                    method === m ? 'bg-amber-500 border-amber-400 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-400')}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <button type="button" disabled={!amount} onClick={() => setStep(3)}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-slate-900 font-black text-sm transition mt-2">
            SEND MONEY →
          </button>
        </div>
      )}

      {/* Step 3 — Confirm */}
      {step === 3 && (
        <div className="px-4 pt-4 space-y-3">
          <p className="text-[10px] font-black uppercase text-slate-500 mb-2">✅ Confirmation</p>

          <div className="p-4 bg-slate-800/50 rounded-2xl space-y-3 border border-slate-700/60">
            {[['Recipient', recipient], ['Amount', `${amount} ${currency}`], ['Fee', '$1.20'], ['Exchange Rate', `1 USD → 138 HTG`], ['Method', method], ['Estimated Arrival', 'Instant']].map(([k,v]) => (
              <div key={k} className="flex justify-between items-center">
                <span className="text-xs text-slate-400">{k}</span>
                <span className="text-xs font-bold text-white">{v}</span>
              </div>
            ))}
          </div>

          <div>
            <p className="text-[10px] text-slate-500 mb-2">Security</p>
            <div className="flex gap-2">
              {['PIN 🔢','Face ID 👁','Fingerprint 🤞'].map(s => (
                <button key={s} type="button"
                  className="flex-1 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-[11px] font-bold text-slate-300 hover:border-amber-500/50 transition">
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button type="button" disabled={loading} onClick={async () => {
              setLoading(true);
              await walletAPI.sendMoney({ recipient, amount, currency, desc, method }).catch(() => {});
              setLoading(false);
              setSent(true);
            }}
            className="w-full py-3.5 rounded-xl bg-green-500 hover:bg-green-400 disabled:opacity-50 text-slate-900 font-black text-sm transition">
            {loading ? 'Processing…' : 'CONFIRM PAYMENT ✓'}
          </button>
          <button type="button" onClick={() => setStep(2)}
            className="w-full py-2 text-xs text-slate-500">← Back</button>
        </div>
      )}
    </Panel>
  );
}

// ── RECEIVE PANEL ────────────────────────────────────────────────
function ReceivePanel({ onClose, user }) {
  const [copied, setCopied] = useState('');
  const walletId = 'JOBFAST-45892';
  const username = `@${(user?.name || 'user').toLowerCase().replace(/\s/g,'')}`;
  const acctNo   = '8745639201';

  const copy = (val, key) => {
    navigator.clipboard?.writeText(val).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <Panel title="Receive Money" onClose={onClose}>
      <div className="px-4 pt-4 space-y-4">
        {/* IDs */}
        <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/60 space-y-3">
          {[['Wallet ID', walletId], ['Username', username], ['Account #', acctNo]].map(([label, val]) => (
            <div key={label} className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500">{label}</p>
                <p className="text-sm font-black text-amber-400">{val}</p>
              </div>
              <button type="button" onClick={() => copy(val, label)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-700 rounded-lg transition">
                {copied === label ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          ))}
        </div>

        {/* QR */}
        <div className="p-4 bg-white/5 rounded-2xl border border-slate-700/60 flex flex-col items-center gap-4">
          <p className="text-xs text-slate-400">Scan to pay</p>
          <QRPlaceholder value={walletId} />
          <p className="text-xs text-slate-500">{walletId}</p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2">
          {[['📤','Share'],['📋','Copy Link'],['📄','Generate Invoice']].map(([icon, label]) => (
            <button key={label} type="button"
              className="flex flex-col items-center gap-1.5 py-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-300 hover:border-amber-500/40 transition">
              <span className="text-xl">{icon}</span>
              <span className="text-[10px]">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </Panel>
  );
}

// ── DEPOSIT PANEL ────────────────────────────────────────────────
function DepositPanel({ onClose }) {
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  if (done) return (
    <Panel title={`Deposit via ${selected?.label}`} onClose={onClose}>
      <div className="flex flex-col items-center justify-center h-64 gap-4 px-6">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-3xl">✅</div>
        <p className="text-xl font-black">Deposit Initiated!</p>
        <p className="text-slate-400 text-sm text-center">${amount} via {selected?.label}</p>
        <button type="button" onClick={onClose} className="mt-4 px-8 py-3 rounded-xl bg-amber-500 text-slate-900 font-black text-sm">Done</button>
      </div>
    </Panel>
  );

  if (selected) return (
    <Panel title={`Deposit via ${selected.label}`} onClose={() => setSelected(null)}>
      <div className="px-4 pt-4 space-y-4">
        <div className="text-4xl text-center pt-4">{selected.icon}</div>
        <p className="text-center font-bold text-lg">{selected.label}</p>
        <label className="block">
          <p className="text-[10px] text-slate-500 mb-1.5">Amount</p>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-lg font-black outline-none focus:border-amber-500/60" />
        </label>
        <button type="button" disabled={!amount || loading} onClick={async () => {
          setLoading(true);
          await walletAPI.deposit({ method: selected.id, amount }).catch(() => {});
          setLoading(false);
          setDone(true);
        }} className="w-full py-3.5 rounded-xl bg-amber-500 disabled:opacity-30 text-slate-900 font-black text-sm">
          {loading ? 'Processing…' : 'Continue →'}
        </button>
      </div>
    </Panel>
  );

  return (
    <Panel title="Deposit Funds" onClose={onClose}>
      <div className="px-4 pt-4 space-y-2">
        {DEPOSIT_METHODS.map(m => (
          <button key={m.id} type="button" onClick={() => setSelected(m)}
            className="flex items-center gap-3 w-full px-4 py-3.5 bg-slate-800/50 border border-slate-700/60 hover:border-amber-500/50 rounded-xl transition text-left">
            <span className="text-xl w-8 text-center">{m.icon}</span>
            <span className="text-sm font-semibold">{m.label}</span>
            <span className="ml-auto text-slate-500 text-sm">→</span>
          </button>
        ))}
      </div>
    </Panel>
  );
}

// ── WITHDRAW PANEL ───────────────────────────────────────────────
function WithdrawPanel({ onClose }) {
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  if (done) return (
    <Panel title={`Withdraw to ${selected?.label}`} onClose={onClose}>
      <div className="flex flex-col items-center justify-center h-64 gap-4 px-6">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-3xl">✅</div>
        <p className="text-xl font-black">Withdrawal Requested!</p>
        <p className="text-slate-400 text-sm text-center">${amount} → {selected?.label}</p>
        <button type="button" onClick={onClose} className="mt-4 px-8 py-3 rounded-xl bg-amber-500 text-slate-900 font-black text-sm">Done</button>
      </div>
    </Panel>
  );

  if (selected) return (
    <Panel title={`Withdraw to ${selected.label}`} onClose={() => setSelected(null)}>
      <div className="px-4 pt-4 space-y-4">
        <div className="text-4xl text-center pt-4">{selected.icon}</div>
        <p className="text-center font-bold text-lg">{selected.label}</p>
        <label className="block">
          <p className="text-[10px] text-slate-500 mb-1.5">Amount</p>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-lg font-black outline-none focus:border-amber-500/60" />
        </label>
        <button type="button" disabled={!amount || loading} onClick={async () => {
          setLoading(true);
          await walletAPI.withdraw({ method: selected.id, amount }).catch(() => {});
          setLoading(false);
          setDone(true);
        }} className="w-full py-3.5 rounded-xl bg-amber-500 disabled:opacity-30 text-slate-900 font-black text-sm">
          {loading ? 'Processing…' : 'Continue →'}
        </button>
      </div>
    </Panel>
  );

  return (
    <Panel title="Withdraw To" onClose={onClose}>
      <div className="px-4 pt-4 space-y-2">
        {WITHDRAW_METHODS.map(m => (
          <button key={m.id} type="button" onClick={() => setSelected(m)}
            className="flex items-center gap-3 w-full px-4 py-3.5 bg-slate-800/50 border border-slate-700/60 hover:border-amber-500/50 rounded-xl transition text-left">
            <span className="text-xl w-8 text-center">{m.icon}</span>
            <span className="text-sm font-semibold">{m.label}</span>
            <span className="ml-auto text-slate-500 text-sm">→</span>
          </button>
        ))}
      </div>
    </Panel>
  );
}

// ── PAY PANEL ────────────────────────────────────────────────────
function PayPanel({ onClose }) {
  const [cat, setCat] = useState(null);
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(false);

  if (paid) return (
    <Panel title="Pay Worker" onClose={onClose}>
      <div className="flex flex-col items-center justify-center h-64 gap-4 px-6">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-3xl">✅</div>
        <p className="text-xl font-black">Payment Sent!</p>
        <p className="text-slate-400 text-sm text-center">$360 paid · Escrow Released</p>
        <button type="button" onClick={onClose} className="mt-4 px-8 py-3 rounded-xl bg-amber-500 text-slate-900 font-black text-sm">Done</button>
      </div>
    </Panel>
  );

  if (cat === 'worker') return (
    <Panel title="Pay Worker" onClose={() => setCat(null)}>
      <div className="px-4 pt-4 space-y-4">
        <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/60 space-y-3">
          {[['Worker','Ronald Monfils'],['Profession','Electrician'],['Worked','3 Days'],['Rate','$120/day'],['Total','$360'],['Escrow','Protected ✔']].map(([k,v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-xs text-slate-400">{k}</span>
              <span className={cls('text-xs font-bold', k==='Escrow'?'text-green-400':k==='Total'?'text-amber-400':'text-white')}>{v}</span>
            </div>
          ))}
        </div>
        <button type="button" disabled={loading} onClick={async () => {
          setLoading(true);
          await walletAPI.sendMoney({ recipient: 'Ronald Monfils', amount: 360, currency: 'USD', method: 'Escrow' }).catch(() => {});
          setLoading(false);
          setPaid(true);
        }} className="w-full py-3.5 rounded-xl bg-amber-500 disabled:opacity-50 text-slate-900 font-black text-sm">
          {loading ? 'Processing…' : 'PAY NOW $360 →'}
        </button>
      </div>
    </Panel>
  );

  return (
    <Panel title="Pay" onClose={onClose}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-3 gap-2">
          {PAY_CATEGORIES.map(c => (
            <button key={c.id} type="button" onClick={() => setCat(c.id)}
              className="flex flex-col items-center gap-1.5 py-3.5 bg-slate-800/50 border border-slate-700/60 hover:border-amber-500/50 rounded-xl transition">
              <span className="text-2xl">{c.icon}</span>
              <span className="text-[11px] text-slate-300">{c.label}</span>
            </button>
          ))}
        </div>
      </div>
    </Panel>
  );
}

// ── INVOICE PANEL ────────────────────────────────────────────────
function InvoicePanel({ onClose }) {
  return (
    <Panel title="Invoice" onClose={onClose}>
      <div className="px-4 pt-4 space-y-4">
        <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/60 space-y-3">
          {[['Invoice #','INV-2026-00215'],['Company','ABC Construction'],['Customer','Ronald Monfils']].map(([k,v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-xs text-slate-400">{k}</span>
              <span className="text-xs font-bold text-white">{v}</span>
            </div>
          ))}
        </div>

        <div>
          <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Items</p>
          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60">
            <div className="flex justify-between">
              <span className="text-sm">Electrical Work</span>
              <span className="text-sm font-bold text-amber-400">$360</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/40 space-y-2">
          {[['Subtotal','$360'],['Tax (3.3%)','$12'],['Discount','-$5'],['Total','$367']].map(([k,v]) => (
            <div key={k} className={cls('flex justify-between', k==='Total' && 'border-t border-slate-700 pt-2 mt-2')}>
              <span className={cls('text-xs', k==='Total' ? 'font-black text-white' : 'text-slate-400')}>{k}</span>
              <span className={cls('text-xs font-bold', k==='Total' ? 'text-amber-400 text-base' : 'text-white')}>{v}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button type="button"
            className="py-3 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-slate-300 hover:border-amber-500/50 transition">
            📄 Generate PDF
          </button>
          <button type="button"
            className="py-3 rounded-xl bg-amber-500 text-slate-900 font-black text-sm hover:bg-amber-400 transition">
            ✉️ Send Invoice
          </button>
        </div>
      </div>
    </Panel>
  );
}

// ── EXCHANGE PANEL ───────────────────────────────────────────────
function ExchangePanel({ onClose }) {
  const [from, setFrom] = useState('USD');
  const [to,   setTo]   = useState('HTG');
  const [amt,  setAmt]  = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const rate = 138;
  const receive = amt ? (parseFloat(amt) * rate).toLocaleString() : '—';

  return (
    <Panel title="Currency Exchange" onClose={onClose}>
      {done && (
        <div className="flex flex-col items-center justify-center h-64 gap-4 px-6">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-3xl">✅</div>
          <p className="text-xl font-black">Converted!</p>
          <p className="text-slate-400 text-sm text-center">{amt} {from} → {receive} {to}</p>
          <button type="button" onClick={onClose} className="mt-4 px-8 py-3 rounded-xl bg-amber-500 text-slate-900 font-black text-sm">Done</button>
        </div>
      )}
      {!done &&
      <div className="px-4 pt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <p className="text-[10px] text-slate-500 mb-1.5">From</p>
            <select value={from} onChange={e => setFrom(e.target.value)}
              className="w-full px-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm outline-none">
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="block">
            <p className="text-[10px] text-slate-500 mb-1.5">To</p>
            <select value={to} onChange={e => setTo(e.target.value)}
              className="w-full px-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm outline-none">
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </label>
        </div>

        <label className="block">
          <p className="text-[10px] text-slate-500 mb-1.5">Amount ({from})</p>
          <input type="number" value={amt} onChange={e => setAmt(e.target.value)} placeholder="0.00"
            className="w-full px-4 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xl font-black outline-none focus:border-amber-500/60" />
        </label>

        <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/40 space-y-2">
          {[['Exchange Rate', `1 ${from} = ${rate} ${to}`], ['Fee', '$1.10'], ['You Receive', `${receive} ${to}`]].map(([k,v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-xs text-slate-400">{k}</span>
              <span className={cls('text-xs font-bold', k==='You Receive' ? 'text-amber-400' : 'text-white')}>{v}</span>
            </div>
          ))}
        </div>

        <button type="button" disabled={!amt || loading} onClick={async () => {
          setLoading(true);
          await new Promise(r => setTimeout(r, 600));
          setLoading(false);
          setDone(true);
        }}
          className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-slate-900 font-black text-sm transition">
          {loading ? 'Converting…' : 'Convert Now 🔄'}
        </button>
      </div>
      }
    </Panel>
  );
}

// ── ESCROW PANEL ─────────────────────────────────────────────────
function EscrowPanel({ onClose }) {
  const [tab, setTab] = useState('active');
  const [escrows, setEscrows] = useState(MOCK_ESCROW);
  const [toast, setToast] = useState('');
  const TABS = ['active','completed','disputed','cancelled'];
  const filtered = escrows.filter(e => tab === 'active' ? e.status === 'active' : e.status === tab || tab === 'completed');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const releasePayment = (id) => {
    setEscrows(prev => prev.map(e => e.id === id ? { ...e, status: 'completed' } : e));
    showToast('Payment released successfully!');
  };

  const raiseDispute = (id) => {
    setEscrows(prev => prev.map(e => e.id === id ? { ...e, status: 'disputed' } : e));
    showToast('Dispute raised. Support will contact you.');
  };

  return (
    <Panel title="Escrow Dashboard" onClose={onClose}>
      {toast && (
        <div className="mx-4 mt-3 px-4 py-2.5 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-xs font-bold text-center">{toast}</div>
      )}
      <div className="px-4 pt-4">
        <div className="flex gap-2 mb-4">
          {TABS.map(t => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={cls('flex-1 py-2 rounded-xl text-[10px] font-black capitalize border transition',
                tab === t ? 'bg-amber-500 border-amber-400 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-400')}>
              {t}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map(e => (
            <div key={e.id} className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black">{e.title}</p>
                <span className={cls('text-[10px] font-bold px-2 py-0.5 rounded-full', e.dot,
                  e.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-slate-700 text-slate-400')}>
                  {e.status === 'active' ? '🟢 In Progress' : '✓ Done'}
                </span>
              </div>
              {[['Amount', e.amount, 'text-amber-400'], ['Employer', e.employer, 'text-white'], ['Worker', e.worker, 'text-white']].map(([k,v,c]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-xs text-slate-500">{k}</span>
                  <span className={cls('text-xs font-bold', c)}>{v}</span>
                </div>
              ))}
              {e.status === 'active' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button type="button" onClick={() => releasePayment(e.id)} className="py-2 rounded-xl bg-green-500 text-slate-900 text-xs font-black">Release Payment</button>
                  <button type="button" onClick={() => raiseDispute(e.id)} className="py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold">Raise Dispute</button>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm">No {tab} escrow contracts</div>
          )}
        </div>
      </div>
    </Panel>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN WALLET PAGE
// ════════════════════════════════════════════════════════════════
export default function WalletPage() {
  const { user } = useAuth();

  const [currencyIdx, setCurrencyIdx] = useState(0);
  const [txFilter,    setTxFilter]    = useState('All');
  const [panel,       setPanel]       = useState(null); // 'send'|'receive'|'deposit'|'withdraw'|'pay'|'invoice'|'exchange'|'escrow'
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
  const [securityState, setSecurity]  = useState({ pin: true, faceId: true, fingerprint: true, tfa: true });

  // Try to load real data; fall back silently to mock
  useEffect(() => {
    walletAPI.getTransactions()
      .then(r => { const d = r?.data?.data || r?.data; if (Array.isArray(d) && d.length) setTransactions(d); })
      .catch(() => {});
  }, []);

  const currentBalance = MOCK_BALANCES[currencyIdx];

  const filteredTx = transactions.filter(tx => {
    if (txFilter === 'All') return true;
    return tx.type === txFilter.toLowerCase();
  });

  const QUICK_ACTIONS = [
    { icon:'⬆',  label:'Send',     id:'send'     },
    { icon:'⬇',  label:'Receive',  id:'receive'  },
    { icon:'🏦', label:'Deposit',  id:'deposit'  },
    { icon:'🏧', label:'Withdraw', id:'withdraw' },
    { icon:'💳', label:'Pay',      id:'pay'      },
    { icon:'📄', label:'Invoice',  id:'invoice'  },
    { icon:'🔄', label:'Exchange', id:'exchange' },
    { icon:'🔐', label:'Escrow',   id:'escrow'   },
  ];

  const toggleSecurity = (key) => setSecurity(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="flex flex-col min-h-screen text-white pb-6" style={{ background: BG }}>

      {/* ── Header badge row ─────────────────────────────────── */}
      <div className="px-4 pt-5 pb-2 flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">💳 JOBFAST GLOBAL WALLET</p>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-bold">🛡 PCI DSS</span>
          <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold">256-bit</span>
        </div>
      </div>

      {/* ── Balance card ─────────────────────────────────────── */}
      <div className="px-4 mb-4">
        <div className="relative overflow-hidden rounded-3xl p-5 shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #1a237e 0%, #283593 40%, #4527a0 100%)' }}>
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white/5" />

          <div className="relative z-10">
            <p className="text-[10px] text-indigo-300 uppercase tracking-widest mb-1">Total Balance</p>
            <p className="text-4xl font-black tracking-tight">{fmtBalance(currentBalance)}</p>

            {/* other currencies */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
              {MOCK_BALANCES.filter((_, i) => i !== currencyIdx).map(b => (
                <button key={b.currency} type="button" onClick={() => setCurrencyIdx(MOCK_BALANCES.indexOf(b))}
                  className="text-indigo-300 text-[11px] hover:text-white transition">
                  {fmtBalance(b)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-4">
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-indigo-100">
                {user?.name || 'JOBFAST User'}
              </span>
              <span className="text-[10px] text-green-300 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">Escrow Protected ✔</span>
            </div>
          </div>
        </div>

        {/* supported currencies strip */}
        <div className="mt-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1.5 py-1">
            {CURRENCIES.map(c => (
              <span key={c} className="shrink-0 text-[10px] text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700/40">{c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────── */}
      <div className="px-4 mb-5">
        <div className="grid grid-cols-4 gap-2">
          {QUICK_ACTIONS.map(a => (
            <button key={a.id} type="button" onClick={() => setPanel(a.id)}
              className="flex flex-col items-center gap-1.5 py-3 bg-slate-800/70 border border-slate-700/60 rounded-2xl hover:border-amber-500/50 active:scale-95 transition">
              <span className="text-xl leading-none">{a.icon}</span>
              <span className="text-[11px] text-slate-300 font-semibold">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Recent Transactions ───────────────────────────────── */}
      <SectionTitle>💰 Recent Transactions</SectionTitle>

      {/* filter tabs */}
      <div className="px-4 mb-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {TX_FILTERS.map(f => (
            <Pill key={f} label={f} active={txFilter === f} onClick={() => setTxFilter(f)} />
          ))}
        </div>
      </div>

      {/* list */}
      <div className="px-4 space-y-0">
        {filteredTx.map(tx => (
          <div key={tx.id} className="flex items-center gap-3 py-3.5 border-b border-slate-800/50 last:border-none">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg"
              style={{ background: '#0d1526' }}>
              {tx.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{tx.label}</p>
              <p className="text-[11px] text-slate-500">{tx.sub} · {tx.date}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={cls('text-sm font-black', tx.color)}>{tx.amount}</p>
              <p className="text-[10px] text-slate-600">{tx.status === 'completed' ? '✓' : '⏳'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* receipt actions on first tx */}
      <div className="mx-4 mt-1 mb-2 p-3 bg-slate-800/30 border border-slate-700/40 rounded-2xl">
        <p className="text-[10px] text-slate-500 mb-2">ABC Construction · +$800</p>
        <div className="flex gap-2">
          {['📋 Receipt','⬇ Download PDF','🔁 Repeat','📤 Share'].map(a => (
            <button key={a} type="button"
              className="flex-1 py-1.5 text-[10px] font-bold bg-slate-700 rounded-lg text-slate-300 hover:bg-slate-600 transition">
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* ── Cards & Accounts ──────────────────────────────────── */}
      <SectionTitle>💳 Cards & Accounts</SectionTitle>
      <div className="px-4 space-y-2">
        {[
          { label:'Visa ****4582',       tag:'Default', icon:'💳', color:'from-indigo-600 to-blue-700'   },
          { label:'Mastercard ****8210', tag:'',        icon:'💳', color:'from-red-700 to-orange-600'    },
        ].map(c => (
          <div key={c.label} className={`flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r ${c.color} shadow-lg`}>
            <span className="text-2xl">{c.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-black">{c.label}</p>
              {c.tag && <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{c.tag}</span>}
            </div>
            <div className="flex gap-2">
              {['Freeze','Limits','PIN'].map(a => (
                <button key={a} type="button" className="text-[10px] bg-black/20 px-2 py-1 rounded-lg font-bold">{a}</button>
              ))}
            </div>
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2 mt-1">
          {[['🏦','Bank Accounts'],['🪙','Crypto Wallets'],['💳','Virtual Cards'],['🏧','Physical Cards']].map(([icon, label]) => (
            <button key={label} type="button"
              className="flex items-center gap-2 px-3 py-3 bg-slate-800/50 border border-slate-700/60 rounded-xl hover:border-amber-500/40 transition">
              <span>{icon}</span>
              <span className="text-[11px] text-slate-300 font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Analytics ─────────────────────────────────────────── */}
      <SectionTitle>📊 Analytics</SectionTitle>
      <div className="px-4 grid grid-cols-2 gap-2 mb-2">
        {[
          { label:'Monthly Income',    val:'$8,240',  color:'text-green-400',  bg:'bg-green-500/5 border-green-500/20'  },
          { label:'Expenses',          val:'$3,250',  color:'text-red-400',    bg:'bg-red-500/5 border-red-500/20'      },
          { label:'Savings',           val:'$4,990',  color:'text-amber-400',  bg:'bg-amber-500/5 border-amber-500/20'  },
          { label:'Escrow',            val:'$2,100',  color:'text-indigo-400', bg:'bg-indigo-500/5 border-indigo-500/20'},
          { label:'Marketplace Sales', val:'$1,980',  color:'text-purple-400', bg:'bg-purple-500/5 border-purple-500/20'},
        ].map(a => (
          <div key={a.label} className={cls('p-3 rounded-2xl border', a.bg)}>
            <p className="text-[10px] text-slate-500 mb-1">{a.label}</p>
            <p className={cls('text-lg font-black', a.color)}>{a.val}</p>
          </div>
        ))}
        <div className="p-3 rounded-2xl border border-slate-700/40 bg-slate-800/30 flex items-center justify-center">
          <span className="text-3xl">📈</span>
        </div>
      </div>

      {/* ── Security ──────────────────────────────────────────── */}
      <SectionTitle>🔒 Security</SectionTitle>
      <div className="px-4 space-y-2">
        {[
          { key:'pin',         label:'PIN',         icon:'🔢' },
          { key:'faceId',      label:'Face ID',     icon:'👁' },
          { key:'fingerprint', label:'Fingerprint', icon:'🤞' },
          { key:'tfa',         label:'2FA',         icon:'🛡' },
        ].map(s => (
          <div key={s.key} className="flex items-center gap-3 px-4 py-3.5 bg-slate-800/50 border border-slate-700/60 rounded-xl">
            <span className="text-xl w-8 text-center">{s.icon}</span>
            <p className="flex-1 text-sm font-semibold">{s.label}</p>
            <button type="button" onClick={() => toggleSecurity(s.key)}
              className={cls('w-12 h-6 rounded-full transition-all relative',
                securityState[s.key] ? 'bg-green-500' : 'bg-slate-700')}>
              <span className={cls('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all',
                securityState[s.key] ? 'left-6' : 'left-0.5')} />
            </button>
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2 mt-1">
          {['Trusted Devices 📱','Login History 📋','Security Alerts 🔔','Emergency Lock 🚨'].map(a => (
            <button key={a} type="button"
              className="py-2.5 px-3 bg-slate-800/50 border border-slate-700/60 rounded-xl text-[11px] text-slate-400 font-semibold hover:border-amber-500/40 transition text-left">
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* ── Support ───────────────────────────────────────────── */}
      <SectionTitle>🆘 Support</SectionTitle>
      <div className="px-4 grid grid-cols-3 gap-2 mb-4">
        {[['💬','Live Chat'],['🎫','Open Ticket'],['⚖','Dispute'],['💸','Refund'],['❓','Help Center'],['📞','Call']].map(([icon, label]) => (
          <button key={label} type="button"
            className="flex flex-col items-center gap-1.5 py-3 bg-slate-800/50 border border-slate-700/60 rounded-xl hover:border-amber-500/40 transition">
            <span className="text-xl">{icon}</span>
            <span className="text-[11px] text-slate-400">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Notifications ────────────────────────────────────── */}
      <SectionTitle>🔔 Notifications</SectionTitle>
      <div className="px-4 space-y-1 mb-8">
        {['Money Received','Money Sent','Escrow Released','Payment Failed','Invoice Paid','Card Added','Security Alert','Refund Completed'].map(n => (
          <div key={n} className="flex items-center justify-between px-4 py-3 bg-slate-800/40 border border-slate-700/40 rounded-xl">
            <span className="text-sm text-slate-300">{n}</span>
            <div className="w-10 h-5 rounded-full bg-green-500 relative">
              <span className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Panels ──────────────────────────────────────────── */}
      {panel === 'send'     && <SendPanel     onClose={() => setPanel(null)} />}
      {panel === 'receive'  && <ReceivePanel  onClose={() => setPanel(null)} user={user} />}
      {panel === 'deposit'  && <DepositPanel  onClose={() => setPanel(null)} />}
      {panel === 'withdraw' && <WithdrawPanel onClose={() => setPanel(null)} />}
      {panel === 'pay'      && <PayPanel      onClose={() => setPanel(null)} />}
      {panel === 'invoice'  && <InvoicePanel  onClose={() => setPanel(null)} />}
      {panel === 'exchange' && <ExchangePanel onClose={() => setPanel(null)} />}
      {panel === 'escrow'   && <EscrowPanel   onClose={() => setPanel(null)} />}
    </div>
  );
}
