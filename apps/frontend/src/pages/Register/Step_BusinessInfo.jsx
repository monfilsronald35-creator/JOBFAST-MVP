import React, { useState } from 'react';

const inp = 'w-full px-4 py-3.5 rounded-2xl text-white text-sm placeholder-slate-500 focus:outline-none transition';
const inpStyle = { background: '#0d1526', border: '1.5px solid #1F2937' };

// ── Business type labels and icons ───────────────────────────────────
const BIZ_META = {
  hotel:       { label: 'Otèl',          icon: '🏨' },
  restaurant:  { label: 'Restoran',       icon: '🍽' },
  hospital:    { label: 'Lopital',        icon: '🏥' },
  clinic:      { label: 'Klinik',         icon: '🩺' },
  company:     { label: 'Konpayi',        icon: '🏢' },
  shop:        { label: 'Boutik',         icon: '🏪' },
  real_estate: { label: 'Imobilye',       icon: '🏠' },
  marketplace: { label: 'Marketplace',    icon: '🛒' },
  supplier:    { label: 'Founisè',        icon: '🚚' },
  bank:        { label: 'Bank',           icon: '🏦' },
  school:      { label: 'Lekòl',          icon: '🏫' },
  government:  { label: 'Gouvènman',      icon: '🏛' },
  ngo:         { label: 'ONG',            icon: '🌍' },
  tourism:     { label: 'Touris / Agans', icon: '✈️' },
};

// ── Countries with flag, name, dial code, and city examples ──────────
const COUNTRIES = [
  { code: 'ht', flag: '🇭🇹', name: 'Ayiti (Haiti)',          dial: '+509', cities: 'Pòtoprens, Okap, Gonayiv, Les Cayes, Jakmel, Saint-Marc' },
  { code: 'do', flag: '🇩🇴', name: 'Repiblik Dominikèn',     dial: '+1',   cities: 'Santo Domingo, Santiago, Punta Cana, La Romana, Puerto Plata' },
  { code: 'us', flag: '🇺🇸', name: 'États-Unis (USA)',        dial: '+1',   cities: 'New York, Miami, Boston, Atlanta, Houston' },
  { code: 'ca', flag: '🇨🇦', name: 'Kanada (Canada)',         dial: '+1',   cities: 'Montréal, Toronto, Ottawa, Québec' },
  { code: 'fr', flag: '🇫🇷', name: 'Frans (France)',          dial: '+33',  cities: 'Paris, Lyon, Marseille, Bordeaux' },
  { code: 'mx', flag: '🇲🇽', name: 'Meksik (México)',         dial: '+52',  cities: 'Ciudad de México, Cancún, Guadalajara' },
  { code: 'br', flag: '🇧🇷', name: 'Brezil (Brasil)',         dial: '+55',  cities: 'São Paulo, Rio de Janeiro, Salvador' },
  { code: 'es', flag: '🇪🇸', name: 'Espay (España)',          dial: '+34',  cities: 'Madrid, Barcelona, Sevilla' },
  { code: 'gp', flag: '🇬🇵', name: 'Gwadloup (Guadeloupe)',  dial: '+590', cities: 'Pointe-à-Pitre, Basse-Terre' },
  { code: 'mq', flag: '🇲🇶', name: 'Matnik (Martinique)',    dial: '+596', cities: 'Fort-de-France, Le Lamentin' },
  { code: 'gy', flag: '🇬🇾', name: 'Giyàn (Guyane)',         dial: '+594', cities: 'Cayenne, Saint-Laurent' },
];

// ── Country Selector ─────────────────────────────────────────────────
function CountrySelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = COUNTRIES.find(c => c.code === value) || COUNTRIES[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition active:scale-[0.99]"
        style={{ ...inpStyle, borderColor: open ? '#FACC15' : '#1F2937' }}
      >
        <span className="text-xl shrink-0">{selected.flag}</span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold truncate">{selected.name}</p>
          <p className="text-slate-500 text-xs mt-0.5">{selected.dial}</p>
        </div>
        <span className="text-slate-500 text-xs shrink-0">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: '#0a1020', border: '1px solid #1F2937', maxHeight: 280, overflowY: 'auto' }}>
          {COUNTRIES.map(c => (
            <button
              key={c.code}
              type="button"
              onClick={() => { onChange(c.code); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition active:bg-slate-800"
              style={{ borderBottom: '1px solid #1F2937', background: c.code === value ? '#FACC1510' : 'transparent' }}
            >
              <span className="text-lg shrink-0">{c.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold truncate">{c.name}</p>
              </div>
              <span className="text-slate-500 text-xs shrink-0 font-bold">{c.dial}</span>
              {c.code === value && <span className="text-amber-400 text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────
export default function Step_BusinessInfo({ businessType, loading, onSubmit }) {
  const meta = BIZ_META[businessType] || { label: 'Biznis', icon: '🏢' };

  const [country,   setCountry]   = useState('ht');
  const [form,      setForm]      = useState({ name: '', phone: '', email: '', password: '', city: '', description: '' });
  const [extras,    setExtras]    = useState({ delivery: false, reservation: false, stars: 0 });
  const [errors,    setErrors]    = useState({});
  const [showPass,  setShowPass]  = useState(false);
  const [branches,  setBranches]  = useState([]);  // ["Okap", "Les Cayes"]

  const countryObj = COUNTRIES.find(c => c.code === country) || COUNTRIES[0];

  const upd  = (field, val) => setForm(p => ({ ...p, [field]: val }));
  const updX = (field, val) => setExtras(p => ({ ...p, [field]: val }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())        e.name = true;
    if (!form.email.trim())       e.email = true;
    if (!form.phone.trim())       e.phone = true;
    if (form.password.length < 6) e.password = true;
    if (!form.city.trim())        e.city = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      ...form,
      phone:    `${countryObj.dial} ${form.phone}`,
      country,
      branches,
      extras,
    });
  };

  // Branch management
  const addBranch = () => setBranches(p => [...p, '']);
  const updBranch = (i, val) => setBranches(p => p.map((b, idx) => idx === i ? val : b));
  const rmBranch  = (i) => setBranches(p => p.filter((_, idx) => idx !== i));

  const showDelivery    = ['restaurant', 'shop', 'marketplace', 'supplier'].includes(businessType);
  const showReservation = ['restaurant', 'hotel', 'clinic', 'hospital', 'tourism'].includes(businessType);
  const showStars       = businessType === 'hotel';

  return (
    <div className="w-full space-y-4 pb-24">

      {/* Header badge */}
      <div className="flex items-center gap-3 p-4 rounded-2xl mb-2" style={{ background: '#0d1526', border: '1px solid #1F2937' }}>
        <span className="text-3xl">{meta.icon}</span>
        <div>
          <p className="font-black text-white">{meta.label}</p>
          <p className="text-xs text-slate-500">Ranpli enfòmasyon biznis ou</p>
        </div>
      </div>

      {/* Business Name */}
      <div>
        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
          Non {meta.label} <span className="text-red-400">*</span>
        </label>
        <input
          value={form.name}
          onChange={e => upd('name', e.target.value)}
          placeholder={`Egz: ${businessType === 'restaurant' ? 'Chez Marie' : businessType === 'hotel' ? 'Hotel Montana' : `Mon ${meta.label}`}`}
          className={inp}
          style={{ ...inpStyle, borderColor: errors.name ? '#ef4444' : '#1F2937' }}
        />
        {errors.name && <p className="text-red-400 text-xs mt-1">Non biznis obligatwa</p>}
      </div>

      {/* Stars for hotel */}
      {showStars && (
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Estèl (Stars)</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} type="button" onClick={() => updX('stars', s)}
                className="text-2xl transition-transform active:scale-90"
                style={{ opacity: extras.stars >= s ? 1 : 0.3 }}>⭐</button>
            ))}
          </div>
        </div>
      )}

      {/* Country */}
      <div>
        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
          Peyi <span className="text-red-400">*</span>
        </label>
        <CountrySelector value={country} onChange={setCountry} />
      </div>

      {/* Phone — dial code prefix + number */}
      <div>
        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
          Telefòn <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-2">
          {/* Dial code badge */}
          <div className="shrink-0 flex items-center gap-1.5 px-3 py-3.5 rounded-2xl font-bold text-sm"
            style={{ background: '#0d1526', border: '1.5px solid #1F2937', color: '#FACC15', minWidth: 72 }}>
            {countryObj.flag} {countryObj.dial}
          </div>
          <input
            type="tel"
            value={form.phone}
            onChange={e => upd('phone', e.target.value.replace(/[^\d\s\-]/g, ''))}
            placeholder="3777 0000"
            className={`${inp} flex-1`}
            style={{ ...inpStyle, borderColor: errors.phone ? '#ef4444' : '#1F2937' }}
          />
        </div>
        {errors.phone && <p className="text-red-400 text-xs mt-1">Telefòn obligatwa</p>}
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
          Email <span className="text-red-400">*</span>
        </label>
        <input
          type="email"
          value={form.email}
          onChange={e => upd('email', e.target.value)}
          placeholder="contact@monbiznis.com"
          className={inp}
          style={{ ...inpStyle, borderColor: errors.email ? '#ef4444' : '#1F2937' }}
        />
        {errors.email && <p className="text-red-400 text-xs mt-1">Email obligatwa</p>}
      </div>

      {/* Password */}
      <div>
        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
          Modpas <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            value={form.password}
            onChange={e => upd('password', e.target.value)}
            placeholder="Minimòm 6 karaktè"
            className={`${inp} pr-12`}
            style={{ ...inpStyle, borderColor: errors.password ? '#ef4444' : '#1F2937' }}
          />
          <button type="button" onClick={() => setShowPass(p => !p)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
            {showPass ? '🙈' : '👁'}
          </button>
        </div>
        {errors.password && <p className="text-red-400 text-xs mt-1">Minimòm 6 karaktè</p>}
      </div>

      {/* City — placeholder adapts to selected country */}
      <div>
        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
          Vil <span className="text-red-400">*</span>
        </label>
        <input
          value={form.city}
          onChange={e => upd('city', e.target.value)}
          placeholder={`Egz: ${countryObj.cities.split(',')[0].trim()}`}
          className={inp}
          style={{ ...inpStyle, borderColor: errors.city ? '#ef4444' : '#1F2937' }}
        />
        <p className="text-[10px] text-slate-600 mt-1">
          {countryObj.flag} Vil nan {countryObj.name.split(' (')[0]}: {countryObj.cities}
        </p>
        {errors.city && <p className="text-red-400 text-xs mt-1">Vil obligatwa</p>}
      </div>

      {/* Multiple branches */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
            Plizyè Branch (opsyonèl)
          </label>
          <button type="button" onClick={addBranch}
            className="text-[11px] font-black px-3 py-1 rounded-lg active:scale-95"
            style={{ background: '#FACC1518', color: '#FACC15', border: '1px solid #FACC1540' }}>
            + Ajoute Branch
          </button>
        </div>
        {branches.length > 0 && (
          <div className="space-y-2">
            {branches.map((b, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={b}
                  onChange={e => updBranch(i, e.target.value)}
                  placeholder={`Branch ${i + 1}: Egz. Okap`}
                  className={`${inp} flex-1`}
                  style={inpStyle}
                />
                <button type="button" onClick={() => rmBranch(i)}
                  className="px-3 rounded-2xl text-slate-500 active:text-red-400 transition"
                  style={{ background: '#0d1526', border: '1.5px solid #1F2937' }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Deskripsyon (opsyonèl)</label>
        <textarea
          value={form.description}
          onChange={e => upd('description', e.target.value)}
          placeholder="Dekri biznis ou brevman..."
          className={`${inp} resize-none`}
          style={inpStyle}
          rows={3}
          maxLength={300}
        />
      </div>

      {/* Type-specific toggles */}
      {(showDelivery || showReservation) && (
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Sèvis disponib</label>
          <div className="flex flex-wrap gap-3">
            {showDelivery && (
              <button type="button" onClick={() => updX('delivery', !extras.delivery)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all active:scale-95"
                style={{
                  background: extras.delivery ? 'rgba(250,204,21,0.15)' : '#0d1526',
                  border: `1.5px solid ${extras.delivery ? '#FACC15' : '#1F2937'}`,
                  color:  extras.delivery ? '#FACC15' : '#94a3b8',
                }}>
                🛵 Livrezon
              </button>
            )}
            {showReservation && (
              <button type="button" onClick={() => updX('reservation', !extras.reservation)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all active:scale-95"
                style={{
                  background: extras.reservation ? 'rgba(250,204,21,0.15)' : '#0d1526',
                  border: `1.5px solid ${extras.reservation ? '#FACC15' : '#1F2937'}`,
                  color:  extras.reservation ? '#FACC15' : '#94a3b8',
                }}>
                📅 Rezervasyon
              </button>
            )}
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: '100%', padding: '16px', borderRadius: '16px', marginTop: '8px',
          background: loading ? '#1e293b' : 'linear-gradient(135deg, #f59e0b, #facc15)',
          color: loading ? '#64748b' : '#020617',
          fontWeight: 900, fontSize: '15px', border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
        }}
      >
        {loading ? '⏳ Ap kreye kont...' : `🚀 Kreye ${meta.label} Mwen`}
      </button>
    </div>
  );
}