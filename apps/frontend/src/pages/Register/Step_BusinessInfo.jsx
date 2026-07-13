import React, { useState } from 'react';

const inp = 'w-full px-4 py-3.5 rounded-2xl text-white text-sm placeholder-slate-500 focus:outline-none transition';
const inpStyle = { background: '#0d1526', border: '1.5px solid #1F2937' };

// Business type labels and icons
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

export default function Step_BusinessInfo({ businessType, loading, onSubmit }) {
  const meta = BIZ_META[businessType] || { label: 'Biznis', icon: '🏢' };

  const [form, setForm]         = useState({ name: '', email: '', phone: '', password: '', city: '', description: '' });
  const [extras, setExtras]     = useState({ delivery: false, reservation: false, stars: 0 });
  const [errors, setErrors]     = useState({});
  const [showPass, setShowPass] = useState(false);

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
    onSubmit({ ...form, extras });
  };

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

      {/* Name */}
      <div>
        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
          Non {meta.label} <span className="text-red-400">*</span>
        </label>
        <input
          value={form.name}
          onChange={e => upd('name', e.target.value)}
          placeholder={`Egz: ${meta.label === 'Restoran' ? 'Chez Marie' : meta.label === 'Otèl' ? 'Hotel Montana' : `Mon ${meta.label}`}`}
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
              <button
                key={s}
                type="button"
                onClick={() => updX('stars', s)}
                className="text-2xl transition-transform active:scale-90"
                style={{ opacity: extras.stars >= s ? 1 : 0.3 }}
              >⭐</button>
            ))}
          </div>
        </div>
      )}

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

      {/* Phone */}
      <div>
        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
          Telefòn <span className="text-red-400">*</span>
        </label>
        <input
          type="tel"
          value={form.phone}
          onChange={e => upd('phone', e.target.value)}
          placeholder="+509 3777 0000"
          className={inp}
          style={{ ...inpStyle, borderColor: errors.phone ? '#ef4444' : '#1F2937' }}
        />
        {errors.phone && <p className="text-red-400 text-xs mt-1">Telefòn obligatwa</p>}
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
          <button
            type="button"
            onClick={() => setShowPass(p => !p)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm"
          >
            {showPass ? '🙈' : '👁'}
          </button>
        </div>
        {errors.password && <p className="text-red-400 text-xs mt-1">Minimòm 6 karaktè</p>}
      </div>

      {/* City */}
      <div>
        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
          Vil / Lokasyon <span className="text-red-400">*</span>
        </label>
        <input
          value={form.city}
          onChange={e => upd('city', e.target.value)}
          placeholder="Egz: Port-au-Prince, Punta Cana"
          className={inp}
          style={{ ...inpStyle, borderColor: errors.city ? '#ef4444' : '#1F2937' }}
        />
        {errors.city && <p className="text-red-400 text-xs mt-1">Vil obligatwa</p>}
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
              <button
                type="button"
                onClick={() => updX('delivery', !extras.delivery)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all active:scale-95"
                style={{
                  background: extras.delivery ? 'rgba(250,204,21,0.15)' : '#0d1526',
                  border:     `1.5px solid ${extras.delivery ? '#FACC15' : '#1F2937'}`,
                  color:      extras.delivery ? '#FACC15' : '#94a3b8',
                }}
              >
                🛵 Livrezon
              </button>
            )}
            {showReservation && (
              <button
                type="button"
                onClick={() => updX('reservation', !extras.reservation)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all active:scale-95"
                style={{
                  background: extras.reservation ? 'rgba(250,204,21,0.15)' : '#0d1526',
                  border:     `1.5px solid ${extras.reservation ? '#FACC15' : '#1F2937'}`,
                  color:      extras.reservation ? '#FACC15' : '#94a3b8',
                }}
              >
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