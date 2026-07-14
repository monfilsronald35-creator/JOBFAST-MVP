import React, { useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

const BG     = "#050B18";
const CARD   = "#0d1526";
const GOLD   = "#FACC15";
const BORDER = "#1F2937";

// ── Role metadata ─────────────────────────────────────────────────────
const ROLE_META = {
  worker:           { label: 'Travayè',          icon: '👷', color: GOLD     },
  service_provider: { label: 'Prestatè Sèvis',   icon: '🛠',  color: '#34d399' },
  freelancer:       { label: 'Freelancer',        icon: '👔', color: '#a78bfa' },
  restaurant:       { label: 'Restoran',          icon: '🍽', color: '#f97316' },
  hotel:            { label: 'Otèl',              icon: '🏨', color: '#06b6d4' },
  hospital:         { label: 'Lopital',           icon: '🏥', color: '#ef4444' },
  clinic:           { label: 'Klinik',            icon: '🩺', color: '#14b8a6' },
  company:          { label: 'Konpayi',           icon: '🏢', color: '#60a5fa' },
  employer:         { label: 'Anplwayè',          icon: '🏢', color: '#60a5fa' },
  shop:             { label: 'Boutik',            icon: '🏪', color: '#f59e0b' },
  real_estate:      { label: 'Imobilye',          icon: '🏠', color: '#10b981' },
  marketplace:      { label: 'Marketplace',       icon: '🛒', color: '#8b5cf6' },
  supplier:         { label: 'Founisè',           icon: '🚚', color: '#64748b' },
  bank:             { label: 'Bank',              icon: '🏦', color: '#22c55e' },
  school:           { label: 'Lekòl',             icon: '🏫', color: '#3b82f6' },
  government:       { label: 'Gouvènman',         icon: '🏛', color: '#6366f1' },
  ngo:              { label: 'ONG',               icon: '🌍', color: '#16a34a' },
  tourism:          { label: 'Touris / Agans',    icon: '✈️', color: '#a855f7' },
  enterprise:       { label: 'Antrepriz',         icon: '🏭', color: '#475569' },
};

const BIZ_ROLES = new Set([
  'restaurant','hotel','hospital','clinic','company','employer','shop',
  'real_estate','marketplace','supplier','bank','school',
  'government','ngo','tourism','enterprise',
]);

// ── Business-specific action buttons for the profile ─────────────────
const BIZ_ACTIONS = {
  restaurant: [
    { icon: '🍽', label: 'Ajoute Pla'     },
    { icon: '📅', label: 'Rezèvasyon'     },
    { icon: '🛵', label: 'Kòmand'         },
    { icon: '📹', label: 'Videyo Promo'   },
  ],
  hotel: [
    { icon: '🛏', label: 'Chanm'          },
    { icon: '📅', label: 'Rezèvasyon'     },
    { icon: '🖼', label: 'Galri'          },
    { icon: '📹', label: 'Videyo'         },
  ],
  hospital: [
    { icon: '📅', label: 'Randevou'       },
    { icon: '👨‍⚕️', label: 'Doktè'      },
    { icon: '🚨', label: 'Dijans'         },
    { icon: '📹', label: 'Videyo'         },
  ],
  clinic: [
    { icon: '📅', label: 'Randevou'       },
    { icon: '👨‍⚕️', label: 'Doktè'      },
    { icon: '🖼', label: 'Galri'          },
    { icon: '📹', label: 'Videyo'         },
  ],
  school: [
    { icon: '📚', label: 'Kou'            },
    { icon: '📅', label: 'Orè'            },
    { icon: '🖼', label: 'Galri'          },
    { icon: '📹', label: 'Videyo'         },
  ],
};
const DEFAULT_BIZ_ACTIONS = [
  { icon: '💼', label: 'Poste Djòb'      },
  { icon: '🖼', label: 'Ajoute Foto'     },
  { icon: '📹', label: 'Videyo Promo'    },
  { icon: '📢', label: 'Pwomosyon'       },
];

// ── Post creation modal ───────────────────────────────────────────────
function PostModal({ onClose, onPost }) {
  const [caption, setCaption] = useState('');
  const [media,   setMedia]   = useState(null);  // { type: 'image'|'video', url, file }
  const [posting, setPosting] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const type = f.type.startsWith('video') ? 'video' : 'image';
    setMedia({ type, url: URL.createObjectURL(f), file: f });
  };

  const handleSubmit = async () => {
    if (!caption.trim() && !media) return;
    setPosting(true);
    await onPost({ caption, media });
    setPosting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-3xl pb-8"
        style={{ background: '#070e1c', border: `1px solid ${BORDER}` }}
        onClick={e => e.stopPropagation()}>

        {/* Handle + header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b" style={{ borderColor: BORDER }}>
          <button onClick={onClose} style={{ color: '#64748b', fontWeight: 700, fontSize: 14 }}>Anile</button>
          <p className="font-black text-white">Nouvo Piblikasyon</p>
          <button onClick={handleSubmit} disabled={posting || (!caption.trim() && !media)}
            style={{
              fontWeight: 900, fontSize: 14,
              color: (posting || (!caption.trim() && !media)) ? '#334155' : GOLD,
            }}>
            {posting ? 'Ap poste...' : 'Pibliye'}
          </button>
        </div>

        <div className="px-5 pt-4 space-y-4">
          {/* Media preview */}
          {media ? (
            <div className="relative rounded-2xl overflow-hidden"
              style={{ aspectRatio: media.type === 'video' ? '16/9' : '1/1', background: CARD }}>
              {media.type === 'image'
                ? <img src={media.url} alt="" className="w-full h-full object-cover" />
                : <video src={media.url} controls className="w-full h-full object-cover" />}
              <button onClick={() => setMedia(null)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center bg-black/60 text-white text-xs">
                ✕
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => { fileRef.current.accept='image/*'; fileRef.current.click(); }}
                className="flex-1 flex flex-col items-center gap-2 py-5 rounded-2xl border active:scale-95 transition"
                style={{ background: CARD, borderColor: BORDER }}>
                <span className="text-2xl">📷</span>
                <span className="text-[11px] font-black text-slate-400">Foto</span>
              </button>
              <button onClick={() => { fileRef.current.accept='video/*'; fileRef.current.click(); }}
                className="flex-1 flex flex-col items-center gap-2 py-5 rounded-2xl border active:scale-95 transition"
                style={{ background: CARD, borderColor: BORDER }}>
                <span className="text-2xl">🎥</span>
                <span className="text-[11px] font-black text-slate-400">Videyo (max 30 sek)</span>
              </button>
            </div>
          )}
          <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />

          {/* Caption */}
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Dekri eksperyans ou, travay ou fè..."
            maxLength={500}
            rows={3}
            style={{
              width: '100%', background: CARD, border: `1.5px solid ${BORDER}`,
              borderRadius: 16, padding: '12px 14px', color: '#fff',
              fontSize: 14, resize: 'none', outline: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Edit profile inline modal ─────────────────────────────────────────
function EditModal({ user, onClose, onSave }) {
  const [name, setName] = useState(user?.name || '');
  const [bio,  setBio]  = useState(user?.profileMetadata?.bio || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), bio: bio.trim() });
    setSaving(false);
    onClose();
  };

  const inp = {
    width: '100%', background: '#0f172a', border: `1.5px solid ${BORDER}`,
    borderRadius: 14, padding: '12px 14px', color: '#fff',
    fontSize: 14, outline: 'none',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-3xl pb-8"
        style={{ background: '#070e1c', border: `1px solid ${BORDER}` }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b" style={{ borderColor: BORDER }}>
          <button onClick={onClose} style={{ color: '#64748b', fontWeight: 700, fontSize: 14 }}>Anile</button>
          <p className="font-black text-white">Modifye Pwofil</p>
          <button onClick={handleSave} disabled={saving || !name.trim()}
            style={{
              fontWeight: 900, fontSize: 14,
              color: (saving || !name.trim()) ? '#334155' : GOLD,
            }}>
            {saving ? 'Ap sove...' : 'Sove'}
          </button>
        </div>

        <div className="px-5 pt-5 space-y-4">
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Non</p>
            <input value={name} onChange={e => setName(e.target.value)} maxLength={60} style={inp} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Bio</p>
            <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={300} rows={4}
              placeholder="Dekri tèt ou, travay ou fè..." style={{ ...inp, resize: 'none' }} />
            <p style={{ fontSize: 10, color: '#475569', textAlign: 'right', marginTop: 4 }}>{bio.length}/300</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════
function ProfileScreen() {
  const navigate                            = useNavigate();
  const { user, login: updateSession, logout } = useAuth();
  const fileRef                             = useRef(null);

  const [showEdit,    setShowEdit]    = useState(false);
  const [showPost,    setShowPost]    = useState(false);
  const [posts,       setPosts]       = useState([]);  // local post feed (MVP)
  const [photoSaving, setPhotoSaving] = useState(false);

  const role    = user?.role || 'worker';
  const isBiz   = BIZ_ROLES.has(role);
  const meta    = ROLE_META[role] || ROLE_META.worker;
  const accent  = meta.color;

  const avatarSrc = useMemo(() =>
    user?.profileMetadata?.profilePhoto ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'user')}`,
  [user]);

  const locationLabel = useMemo(() => {
    const city    = user?.location?.city || user?.city || '';
    const country = user?.location?.country || user?.country || '';
    return [city, country].filter(Boolean).join(', ');
  }, [user]);

  const stats = {
    posts:     user?.stats?.posts      ?? posts.length,
    followers: user?.stats?.followers  ?? 0,
    following: user?.stats?.following  ?? 0,
  };

  // ── Photo change ──────────────────────────────────────────────
  const handlePhotoChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setPhotoSaving(true);
      const updated = {
        ...user,
        profileMetadata: { ...(user?.profileMetadata || {}), profilePhoto: dataUrl },
      };
      try { await API.patch('/users/profile', { profilePhoto: dataUrl }); } catch {}
      updateSession(updated);
      setPhotoSaving(false);
    };
    reader.readAsDataURL(file);
  }, [user, updateSession]);

  // ── Save name + bio ───────────────────────────────────────────
  const handleSaveProfile = useCallback(async ({ name, bio }) => {
    const updated = {
      ...user,
      name,
      profileMetadata: { ...(user?.profileMetadata || {}), bio },
    };
    try { await API.patch('/users/profile', { name, bio }); } catch {}
    updateSession(updated);
  }, [user, updateSession]);

  // ── Create post ───────────────────────────────────────────────
  const handlePost = useCallback(async ({ caption, media }) => {
    const newPost = {
      id:      Date.now(),
      caption,
      media,
      createdAt: new Date().toISOString(),
    };
    setPosts(prev => [newPost, ...prev]);
  }, []);

  // ── Logout ────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: BG }}>
        <p className="text-slate-500">Ap chaje...</p>
      </div>
    );
  }

  const bizActions = BIZ_ACTIONS[role] || DEFAULT_BIZ_ACTIONS;
  const bio        = user?.profileMetadata?.bio || '';
  const name       = user?.name || '';
  const profession = user?.professionLabel || user?.profession || '';

  return (
    <div className="w-full min-h-screen pb-32 text-white" style={{ background: BG }}>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b"
        style={{ background: BG, borderColor: BORDER }}>
        <button type="button" onClick={() => navigate(-1)} className="text-xl text-slate-400 active:opacity-60">
          ←
        </button>
        <p className="font-black text-white text-sm">Pwofil</p>
        <button type="button" onClick={() => setShowEdit(true)}
          className="text-[11px] font-black px-3 py-1.5 rounded-xl active:opacity-70"
          style={{ background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}40` }}>
          ✏️ Modifye
        </button>
      </div>

      {/* ── AVATAR + IDENTITY ──────────────────────────────────── */}
      <div className="flex flex-col items-center pt-8 pb-5 px-4">

        {/* Avatar with ➕ button */}
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4"
            style={{ borderColor: accent }}>
            {photoSaving ? (
              <div className="w-full h-full flex items-center justify-center" style={{ background: CARD }}>
                <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: accent }} />
              </div>
            ) : (
              <img src={avatarSrc} alt={name}
                className="w-full h-full object-cover"
                onError={e => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${name}`; }} />
            )}
          </div>

          {/* ➕ Photo change button */}
          <button type="button" onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition"
            style={{ background: accent, color: '#0a0f1a', border: `2px solid ${BG}` }}>
            <span style={{ fontSize: 14, fontWeight: 900, lineHeight: 1 }}>+</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>

        {/* Name */}
        <h1 className="text-xl font-black text-white text-center leading-tight">{name}</h1>

        {/* Role badge */}
        <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-black px-3 py-1 rounded-full"
          style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}40` }}>
          {meta.icon} {isBiz ? meta.label : (profession || meta.label)}
        </span>

        {/* Location */}
        {locationLabel && (
          <p className="text-[12px] text-slate-500 mt-1.5 flex items-center gap-1">
            📍 {locationLabel}
          </p>
        )}

        {/* Stats row */}
        <div className="flex w-full max-w-xs mt-6 divide-x" style={{ divideColor: BORDER }}>
          {[
            { value: stats.posts,     label: 'Piblikasyon' },
            { value: stats.followers, label: 'Followers'   },
            { value: stats.following, label: 'Suivi(e)s'   },
          ].map(({ value, label }) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-0.5 px-2">
              <span className="text-xl font-black text-white">{value}</span>
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── BIO ────────────────────────────────────────────────── */}
      <div className="px-4 mb-4">
        {bio ? (
          <div className="p-4 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-sm leading-relaxed text-slate-300">{bio}</p>
          </div>
        ) : (
          <button type="button" onClick={() => setShowEdit(true)}
            className="w-full p-4 rounded-2xl border border-dashed text-center active:opacity-70"
            style={{ borderColor: BORDER }}>
            <p className="text-sm text-slate-600 italic">+ Ajoute bio ou...</p>
          </button>
        )}
      </div>

      {/* ── BUSINESS ACTIONS ───────────────────────────────────── */}
      {isBiz && (
        <div className="px-4 mb-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2.5">
            ⚡ Aksyon Rapid
          </p>
          <div className="grid grid-cols-4 gap-2">
            {bizActions.map(a => (
              <button key={a.label} type="button"
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl border active:scale-95 transition"
                style={{ background: CARD, borderColor: BORDER }}>
                <span className="text-xl leading-none">{a.icon}</span>
                <span className="text-[8px] font-black text-slate-400 text-center leading-tight px-0.5">
                  {a.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── POST CTA ───────────────────────────────────────────── */}
      <div className="px-4 mb-6">
        <button type="button" onClick={() => setShowPost(true)}
          className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl border active:scale-[0.98] transition"
          style={{
            background:  `${accent}0a`,
            border:      `1.5px solid ${accent}30`,
          }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${accent}20` }}>
            <span className="text-lg">📤</span>
          </div>
          <div className="flex-1 text-left">
            <p className="text-[13px] font-black" style={{ color: accent }}>
              {isBiz ? 'Pibliye Kontni Biznis' : 'Pibliye Eksperyans Ou'}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Foto · Videyo (15–30 sek)
            </p>
          </div>
          <span style={{ color: accent, fontSize: 18 }}>+</span>
        </button>
      </div>

      {/* ── POSTS FEED ─────────────────────────────────────────── */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            📸 Piblikasyon
          </p>
          {posts.length > 0 && (
            <span className="text-[10px] text-slate-600">{posts.length} pòs</span>
          )}
        </div>

        {posts.length === 0 ? (
          <div className="flex flex-col items-center py-12 rounded-2xl border border-dashed"
            style={{ borderColor: BORDER }}>
            <span className="text-4xl mb-3">📷</span>
            <p className="text-sm font-black text-slate-500">Okenn piblikasyon toujou</p>
            <p className="text-[11px] text-slate-600 mt-1 text-center px-6">
              Klike + pou pataje foto ak videyo travay ou
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts.map(post => (
              <div key={post.id} className="aspect-square rounded-lg overflow-hidden"
                style={{ background: CARD }}>
                {post.media?.type === 'image' && (
                  <img src={post.media.url} alt="" className="w-full h-full object-cover" />
                )}
                {post.media?.type === 'video' && (
                  <video src={post.media.url} className="w-full h-full object-cover" muted />
                )}
                {!post.media && (
                  <div className="w-full h-full flex items-center justify-center p-2">
                    <p className="text-[9px] text-slate-400 text-center leading-tight">{post.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── DEKONEKTE ──────────────────────────────────────────── */}
      <div className="px-4 mb-8">
        <button type="button" onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border font-black text-sm active:scale-[0.98] transition"
          style={{ background: '#1a0a0a', borderColor: '#991b1b40', color: '#ef4444' }}>
          🚪 Dekonekte
        </button>
      </div>

      {/* ── FLOATING ➕ BUTTON ──────────────────────────────────── */}
      <button type="button" onClick={() => setShowPost(true)}
        className="fixed right-4 bottom-24 z-40 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl active:scale-90 transition"
        style={{
          background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
          boxShadow:  `0 8px 32px ${accent}40`,
        }}>
        <span style={{ fontSize: 24, color: '#0a0f1a', fontWeight: 900 }}>+</span>
      </button>

      {/* ── MODALS ─────────────────────────────────────────────── */}
      {showEdit && (
        <EditModal
          user={user}
          onClose={() => setShowEdit(false)}
          onSave={handleSaveProfile}
        />
      )}
      {showPost && (
        <PostModal
          onClose={() => setShowPost(false)}
          onPost={handlePost}
        />
      )}
    </div>
  );
}

export default React.memo(ProfileScreen);