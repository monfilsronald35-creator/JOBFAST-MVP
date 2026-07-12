import React, { useState, useEffect } from 'react';
import API from '@/api/axios';

// Seeding realistic support tickets since backend has no tickets DB yet
const SEED_TICKETS = [
  { id:'t1', subject:'Cannot login to my account',       user:'Marie Solange',   email:'marie@example.com',   category:'auth',     priority:'high',   status:'open',     created:'2026-07-11', messages:[{from:'user',text:'I cannot login. I enter my password and it says incorrect.',time:'10:30 AM'}] },
  { id:'t2', subject:'Payment not received',              user:'Jean Pierre',     email:'jp@example.com',      category:'payment',  priority:'urgent', status:'open',     created:'2026-07-11', messages:[{from:'user',text:'I completed a job 3 days ago and the employer released payment but I still have not received it.',time:'09:15 AM'}] },
  { id:'t3', subject:'Worker did not show up',            user:'ABC Construction',email:'abc@example.com',     category:'dispute',  priority:'high',   status:'pending',  created:'2026-07-10', messages:[{from:'user',text:'The worker I booked never showed up. I want a refund from escrow.',time:'2:00 PM'}] },
  { id:'t4', subject:'How to post a job?',                user:'Hotel Montana',   email:'hotel@example.com',   category:'general',  priority:'low',    status:'resolved', created:'2026-07-09', messages:[{from:'user',text:'I cannot find the button to post a new job listing.',time:'11:00 AM'},{from:'admin',text:'Go to the + button at the bottom of the screen and select Create Job. It will guide you through.',time:'11:45 AM'}] },
  { id:'t5', subject:'Profile verification stuck',        user:'Ronald Monfils',  email:'ronald@example.com',  category:'account',  priority:'medium', status:'open',     created:'2026-07-12', messages:[{from:'user',text:'I submitted my ID 5 days ago and my profile still says unverified.',time:'08:00 AM'}] },
  { id:'t6', subject:'App crashes on Android',            user:'Paul Dupont',     email:'paul@example.com',    category:'bug',      priority:'high',   status:'pending',  created:'2026-07-12', messages:[{from:'user',text:'Every time I try to open the map screen the app crashes completely.',time:'3:45 PM'}] },
];

const PRIORITY_STYLE = {
  urgent: 'bg-red-500/15 text-red-400 border-red-500/25',
  high:   'bg-orange-500/15 text-orange-400 border-orange-500/25',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  low:    'bg-slate-500/15 text-slate-400 border-slate-500/25',
};

const STATUS_STYLE = {
  open:     'bg-green-500/10 text-green-400 border-green-500/20',
  pending:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  resolved: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
};

const CAT_ICON = { auth:'🔐', payment:'💳', dispute:'⚖️', general:'💬', account:'👤', bug:'🐛' };

function Toast({ msg, onClose }) {
  useEffect(() => { if (msg) { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); } }, [msg]);
  if (!msg) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 px-5 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm font-bold shadow-xl">
      ✓ {msg}
    </div>
  );
}

function TicketPanel({ ticket, onClose, onUpdate }) {
  const [reply, setReply] = useState('');
  const [messages, setMessages] = useState(ticket.messages || []);
  const [status, setStatus] = useState(ticket.status);
  const [sending, setSending] = useState(false);
  const [aiMode, setAiMode] = useState(null);

  const AI_TEMPLATES = {
    reply:     `Thank you for contacting JOBFAST Support. We have received your ticket and are reviewing it. Our team will follow up within 24 hours. We appreciate your patience.`,
    diagnose:  `Based on your description, this appears to be related to [root cause]. Suggested steps:\n1. Clear app cache\n2. Re-login\n3. Check network connection\nIf issue persists, please share a screenshot.`,
    escalate:  `This ticket has been escalated to our technical team (Priority: HIGH). A specialist will contact you within 2 hours. Reference: ${ticket.id.toUpperCase()}.`,
  };

  const useTemplate = (type) => {
    setReply(AI_TEMPLATES[type]);
    setAiMode(null);
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    const msg = { from: 'admin', text: reply.trim(), time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) };
    const updated = [...messages, msg];
    setMessages(updated);
    setReply('');
    onUpdate(ticket.id, { messages: updated, status: status === 'open' ? 'pending' : status });
    setSending(false);
  };

  const resolve = () => {
    setStatus('resolved');
    onUpdate(ticket.id, { status: 'resolved' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch lg:items-center justify-center p-0 lg:p-6 bg-black/75">
      <div className="w-full lg:max-w-2xl bg-[#0d1526] border border-slate-700 rounded-none lg:rounded-2xl flex flex-col max-h-screen lg:max-h-[85vh]">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-800/60">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg">{CAT_ICON[ticket.category] || '💬'}</span>
              <h3 className="font-black text-base truncate">{ticket.subject}</h3>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${STATUS_STYLE[status]}`}>{status}</span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${PRIORITY_STYLE[ticket.priority]}`}>{ticket.priority}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{ticket.user} · {ticket.email} · {ticket.created}</p>
          </div>
          <button onClick={onClose} className="ml-3 text-slate-400 hover:text-white text-xl shrink-0">✕</button>
        </div>

        {/* Chat history */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.from === 'admin' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                m.from === 'admin'
                  ? 'bg-amber-500/15 border border-amber-500/20 text-amber-100'
                  : 'bg-slate-800 border border-slate-700 text-slate-200'
              }`}>
                <p className="font-semibold text-[10px] mb-1 opacity-70">{m.from === 'admin' ? '⚡ Support' : '👤 ' + ticket.user} · {m.time}</p>
                <p className="whitespace-pre-line">{m.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* AI assistant */}
        <div className="px-4 pt-2">
          <div className="flex gap-2 mb-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest self-center">🤖 AI Assist:</p>
            {['reply', 'diagnose', 'escalate'].map(m => (
              <button key={m} onClick={() => useTemplate(m)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-400 hover:text-amber-400 border border-slate-700 transition capitalize">
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Reply box */}
        <div className="p-4 border-t border-slate-800/60 space-y-3">
          <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3}
            placeholder="Type your reply…"
            className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500/60 resize-none" />
          <div className="flex gap-2">
            <button disabled={!reply.trim() || sending} onClick={sendReply}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 disabled:opacity-30 text-slate-900 text-sm font-black hover:bg-amber-400 transition">
              {sending ? 'Sending…' : 'Send Reply ↗'}
            </button>
            <button onClick={resolve}
              className="px-4 py-2.5 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-sm font-black hover:bg-green-500/25 transition">
              ✅ Resolve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSupport() {
  const [tickets,  setTickets]  = useState(SEED_TICKETS);
  const [filter,   setFilter]   = useState('all'); // all | open | pending | resolved
  const [catFilter,setCatFilter]= useState('');
  const [selected, setSelected] = useState(null);
  const [toast,    setToast]    = useState('');

  const updateTicket = (id, changes) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t));
    if (changes.status === 'resolved') setToast('Ticket resolved successfully');
    else setToast('Reply sent');
  };

  const filtered = tickets.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (catFilter && t.category !== catFilter) return false;
    return true;
  });

  const counts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    pending: tickets.filter(t => t.status === 'pending').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };

  const CATEGORIES = ['', 'auth', 'payment', 'dispute', 'general', 'account', 'bug'];

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Support Center</h1>
          <p className="text-slate-500 text-sm">{counts.open} open · {counts.pending} pending · {counts.resolved} resolved</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[['all','All'], ['open','Open'], ['pending','Pending'], ['resolved','Resolved']].map(([val, lbl]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition
              ${filter === val ? 'bg-amber-500 border-amber-400 text-slate-900' : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'}`}>
            {lbl} <span className="opacity-70">({counts[val]})</span>
          </button>
        ))}
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="px-3 py-2 bg-[#0d1526] border border-slate-700 rounded-xl text-sm text-slate-300 outline-none ml-auto">
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c ? `${CAT_ICON[c]} ${c}` : 'All Categories'}</option>
          ))}
        </select>
      </div>

      {/* Tickets list */}
      <div className="space-y-2">
        {filtered.length === 0
          ? <div className="bg-[#0d1526] border border-slate-800/60 rounded-2xl p-12 text-center text-slate-600">
              No tickets in this category
            </div>
          : filtered.map(ticket => (
              <button key={ticket.id} type="button" onClick={() => setSelected(ticket)}
                className="w-full text-left bg-[#0d1526] border border-slate-800/60 hover:border-slate-700 rounded-2xl p-4 transition group">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{CAT_ICON[ticket.category] || '💬'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-white group-hover:text-amber-400 transition truncate">{ticket.subject}</p>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${STATUS_STYLE[ticket.status]}`}>{ticket.status}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${PRIORITY_STYLE[ticket.priority]}`}>{ticket.priority}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{ticket.user} · {ticket.email}</p>
                    <p className="text-xs text-slate-600 mt-1 truncate">{ticket.messages[ticket.messages.length - 1]?.text}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] text-slate-600">{ticket.created}</p>
                    <p className="text-[10px] text-slate-700 mt-0.5">{ticket.messages.length} msg</p>
                  </div>
                </div>
              </button>
            ))
        }
      </div>

      {selected && (
        <TicketPanel
          ticket={tickets.find(t => t.id === selected.id) || selected}
          onClose={() => setSelected(null)}
          onUpdate={updateTicket}
        />
      )}
      <Toast msg={toast} onClose={() => setToast('')} />
    </div>
  );
}
