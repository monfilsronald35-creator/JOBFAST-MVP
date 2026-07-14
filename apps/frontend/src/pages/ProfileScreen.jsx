import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

const BG     = "#050B18";
const CARD   = "#0d1526";
const GOLD   = "#FACC15";
const BORDER = "#1F2937";

// ── Role metadata ─────────────────────────────────────────────────────
const ROLE_META = {
  worker:           { label: 'Travayè',       color: '#FACC15' },
  service_provider: { label: 'Prestatè',      color: '#34d399' },
  freelancer:       { label: 'Freelancer',    color: '#a78bfa' },
  restaurant:       { label: 'Restoran',      color: '#f97316' },
  hotel:            { label: 'Otèl',          color: '#06b6d4' },
  company:          { label: 'Konpayi',       color: '#60a5fa' },
  employer:         { label: 'Anplwayè',      color: '#60a5fa' },
  hospital:         { label: 'Lopital',       color: '#ef4444' },
  clinic:           { label: 'Klinik',        color: '#14b8a6' },
};
const getRoleMeta = (role) =>
  ROLE_META[role] || { label: role || 'Pwofesyonèl', color: '#FACC15' };

// ── Image compression ─────────────────────────────────────────────────
async function compressImage(file, maxPx = 700, quality = 0.68) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ════════════════════════════════════════════════════════════════════════
// EDIT MODAL (bottom sheet)
// ════════════════════════════════════════════════════════════════════════
function EditModal({ user, onClose, onSave }) {
  const [name,   setName]   = useState(user?.name || '');
  const [bio,    setBio]    = useState(user?.profileMetadata?.bio || '');
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
      <div className="w-full max-w-lg rounded-t-3xl pb-10"
        style={{ background: '#070e1c', border: `1px solid ${BORDER}` }}
        onClick={e => e.stopPropagation()}>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-700" />
        </div>

        <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b" style={{ borderColor: BORDER }}>
          <button onClick={onClose}
            style={{ color: '#64748b', fontWeight: 700, fontSize: 14 }}>
            Anile
          </button>
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
            <p style={{ fontSize: 11, fontWeight: 800, color: '#64748b',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Non
            </p>
            <input value={name} onChange={e => setName(e.target.value)}
              maxLength={60} style={inp} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#64748b',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Bio
            </p>
            <textarea value={bio} onChange={e => setBio(e.target.value)}
              maxLength={300} rows={4}
              placeholder="Dekri tèt ou, travay ou fè..."
              style={{ ...inp, resize: 'none' }} />
            <p style={{ fontSize: 10, color: '#475569', textAlign: 'right', marginTop: 4 }}>
              {bio.length}/300
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// POST CREATION MODAL (bottom sheet)
// ════════════════════════════════════════════════════════════════════════
function PostModal({ user, onClose, onCreated }) {
  const [caption,   setCaption]   = useState('');
  const [mediaB64,  setMediaB64]  = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'photo' | 'video'
  const [warning,   setWarning]   = useState('');
  const [error,     setError]     = useState('');
  const [posting,   setPosting]   = useState(false);
  const photoRef = useRef(null);
  const videoRef = useRef(null);

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setWarning('');
    setError('');
    try {
      const b64 = await compressImage(file);
      setMediaB64(b64);
      setMediaType('photo');
    } catch {
      setWarning('Foto a pa ka chaje. Eseye yon lòt.');
    }
  };

  const handleVideo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setWarning('Videyo a twò gwo (max 3 MB). Tanpri chwazi yon videyo pi kout.');
      return;
    }
    setWarning('');
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      setMediaB64(ev.target.result);
      setMediaType('video');
    };
    reader.onerror = () => setWarning('Videyo a pa ka chaje. Eseye yon lòt.');
    reader.readAsDataURL(file);
  };

  const handlePublish = async () => {
    if (!caption.trim() && !mediaB64) return;
    setPosting(true);
    setError('');
    try {
      const res = await API.post('/posts', {
        type:      mediaType || 'text',
        mediaUrl:  mediaB64 || '',
        caption:   caption.trim(),
        audience:  'public',
      });
      if (res?.data?.success && res.data.post) {
        onCreated(res.data.post);
        onClose();
      } else {
        setError('Repons sèvè a pa bon. Eseye ankò.');
        setPosting(false);
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        setError('Sesyon ou a ekspire. Dekonekte epi rekonekte.');
      } else if (status === 413) {
        setError('Foto/videyo a twò gwo. Chwazi yon imaj pi piti.');
      } else if (!navigator.onLine) {
        setError('Pa gen entènèt. Tcheke koneksyon ou epi eseye ankò.');
      } else {
        setError('Erè pandan piblikasyon. Eseye ankò.');
      }
      setPosting(false);
    }
  };

  const canPost = (caption.trim() || mediaB64) && !posting;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-3xl pb-10"
        style={{ background: '#070e1c', border: `1px solid ${BORDER}` }}
        onClick={e => e.stopPropagation()}>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-700" />
        </div>

        <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b" style={{ borderColor: BORDER }}>
          <button onClick={onClose}
            style={{ color: '#64748b', fontWeight: 700, fontSize: 14 }}>
            Anile
          </button>
          <p className="font-black text-white">Nouvo Piblikasyon</p>
          <button onClick={handlePublish} disabled={!canPost}
            style={{
              fontWeight: 900, fontSize: 14,
              color: canPost ? GOLD : '#334155',
            }}>
            {posting ? 'Ap poste...' : 'Pibliye'}
          </button>
        </div>

        <div className="px-5 pt-4 space-y-4">

          {/* Error banner */}
          {error && (
            <div className="rounded-xl px-4 py-3 text-[12px] font-bold text-red-400"
              style={{ background: '#1a0a0a', border: '1px solid #7f1d1d' }}>
              {error}
            </div>
          )}

          {/* Media picker / preview */}
          {mediaB64 ? (
            <div className="relative rounded-2xl overflow-hidden"
              style={{ background: CARD, maxHeight: 260 }}>
              {mediaType === 'video'
                ? <video src={mediaB64} controls playsInline
                    style={{ width: '100%', maxHeight: 260, objectFit: 'cover' }} />
                : <img src={mediaB64} alt=""
                    style={{ width: '100%', maxHeight: 260, objectFit: 'cover' }} />}
              <button onClick={() => { setMediaB64(null); setMediaType(null); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center bg-black/60 text-white text-xs">
                ✕
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => photoRef.current?.click()}
                className="flex-1 flex flex-col items-center gap-2 py-5 rounded-2xl border active:scale-95 transition"
                style={{ background: CARD, borderColor: BORDER }}>
                <span className="text-2xl">📷</span>
                <span className="text-[11px] font-black text-slate-400">Foto</span>
              </button>
              <button onClick={() => videoRef.current?.click()}
                className="flex-1 flex flex-col items-center gap-2 py-5 rounded-2xl border active:scale-95 transition"
                style={{ background: CARD, borderColor: BORDER }}>
                <span className="text-2xl">🎥</span>
                <span className="text-[10px] font-black text-slate-400 text-center px-2">
                  Videyo (15-30 sek)
                </span>
              </button>
            </div>
          )}

          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={handleVideo} />

          {warning && (
            <p className="text-[11px] text-red-400 font-bold">{warning}</p>
          )}

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

// ════════════════════════════════════════════════════════════════════════
// POST VIEWER (full-screen modal)
// ════════════════════════════════════════════════════════════════════════
function PostViewer({ post, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={onClose}>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full text-white text-xl"
        style={{ background: '#ffffff20' }}>
        ✕
      </button>
      <div className="w-full max-w-lg px-2" onClick={e => e.stopPropagation()}>
        {post.type === 'video'
          ? <video src={post.mediaUrl} controls autoPlay playsInline
              className="w-full rounded-2xl" style={{ maxHeight: '80vh', objectFit: 'contain' }} />
          : post.mediaUrl
            ? <img src={post.mediaUrl} alt=""
                className="w-full rounded-2xl" style={{ maxHeight: '80vh', objectFit: 'contain' }} />
            : <div className="p-8 rounded-2xl text-center" style={{ background: CARD }}>
                <p className="text-white text-base leading-relaxed">{post.caption}</p>
              </div>
        }
        {post.caption && post.mediaUrl && (
          <p className="text-slate-300 text-sm mt-3 px-1 leading-relaxed">{post.caption}</p>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN PROFILE SCREEN
// ════════════════════════════════════════════════════════════════════════
function ProfileScreen() {
  const navigate                             = useNavigate();
  const { user, login: updateSession, logout } = useAuth();
  const fileRef                              = useRef(null);

  const [showEdit,    setShowEdit]    = useState(false);
  const [showPost,    setShowPost]    = useState(false);
  const [posts,       setPosts]       = useState([]);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [viewer,      setViewer]      = useState(null); // post to view fullscreen

  const role       = user?.role || 'worker';
  const roleMeta   = getRoleMeta(role);
  const roleColor  = roleMeta.color;

  const avatarSrc = user?.profileMetadata?.profilePhoto
    || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'user')}`;

  const locationLabel = (() => {
    const city    = user?.location?.city    || user?.city    || '';
    const country = user?.location?.country || user?.country || '';
    return [city, country].filter(Boolean).join(', ');
  })();

  const bio        = user?.profileMetadata?.bio || '';
  const name       = user?.name || '';
  const profession = user?.professionLabel || user?.profession || '';

  const stats = {
    posts:     postsLoaded ? posts.length : (user?.stats?.posts ?? 0),
    followers: user?.stats?.followers ?? 0,
    following: user?.stats?.following ?? 0,
  };

  // ── Load posts from backend ─────────────────────────────────────────
  useEffect(() => {
    if (!user?._id && !user?.id) return;
    const userId = user._id || user.id;
    API.get(`/posts/user/${userId}`, { params: { limit: 24 } })
      .then(res => {
        if (res?.data?.success) setPosts(res.data.posts || []);
      })
      .catch(() => {})
      .finally(() => setPostsLoaded(true));
  }, [user?._id, user?.id]);

  // ── Avatar photo change ─────────────────────────────────────────────
  const handlePhotoChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoSaving(true);
    try {
      const dataUrl = await compressImage(file, 400, 0.8);
      const updated = {
        ...user,
        profileMetadata: { ...(user?.profileMetadata || {}), profilePhoto: dataUrl },
      };
      try { await API.patch('/users/profile', { profilePhoto: dataUrl }); } catch {}
      updateSession(updated);
    } finally {
      setPhotoSaving(false);
    }
  }, [user, updateSession]);

  // ── Save name + bio ─────────────────────────────────────────────────
  const handleSaveProfile = useCallback(async ({ name: n, bio: b }) => {
    const updated = {
      ...user,
      name: n,
      profileMetadata: { ...(user?.profileMetadata || {}), bio: b },
    };
    try { await API.patch('/users/profile', { name: n, bio: b }); } catch {}
    updateSession(updated);
  }, [user, updateSession]);

  // ── Post created ────────────────────────────────────────────────────
  const handlePostCreated = useCallback((newPost) => {
    setPosts(prev => [newPost, ...prev]);
  }, []);

  // ── Logout ──────────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    if (typeof logout === 'function') logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: BG }}>
        <p className="text-slate-500">Ap chaje...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen pb-32 text-white" style={{ background: BG }}>

      {/* ── STICKY HEADER ──────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b"
        style={{ background: BG, borderColor: BORDER }}>
        <button type="button" onClick={() => navigate(-1)}
          className="text-xl text-slate-400 active:opacity-60 w-8">
          ←
        </button>
        <p className="font-black text-white text-sm">{name || 'Pwofil'}</p>
        <button type="button"
          className="w-8 text-right text-slate-400 text-xl active:opacity-60"
          onClick={() => setShowEdit(true)}>
          ⋮
        </button>
      </div>

      {/* ── INSTAGRAM-STYLE: AVATAR + STATS ROW ────────────────────── */}
      <div className="px-4 pt-5 pb-3 flex items-center gap-5">

        {/* Avatar (80px) */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2"
            style={{ borderColor: roleColor }}>
            {photoSaving ? (
              <div className="w-full h-full flex items-center justify-center"
                style={{ background: CARD }}>
                <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: roleColor }} />
              </div>
            ) : (
              <img src={avatarSrc} alt={name}
                className="w-full h-full object-cover"
                onError={e => {
                  e.currentTarget.src =
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
                }} />
            )}
          </div>
          {/* ➕ change photo */}
          <button type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center active:scale-90 transition"
            style={{ background: roleColor, color: '#0a0f1a', border: `2px solid ${BG}`, fontSize: 14, fontWeight: 900 }}>
            +
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={handlePhotoChange} />
        </div>

        {/* Stats (to the right of avatar) */}
        <div className="flex flex-1 justify-around">
          {[
            { value: stats.posts,     label: 'Piblikasyon' },
            { value: stats.followers, label: 'Followers'   },
            { value: stats.following, label: 'Suivi(e)s'   },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center">
              <span className="text-[18px] font-black text-white leading-tight">{value}</span>
              <span className="text-[9px] font-bold text-slate-500 text-center">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── NAME, ROLE, LOCATION, BIO ──────────────────────────────── */}
      <div className="px-4 pb-3">
        <p className="font-black text-white text-[15px] leading-tight">{name}</p>

        {/* Role badge */}
        <p className="text-[12px] font-bold mt-0.5" style={{ color: roleColor }}>
          {profession || roleMeta.label}
        </p>

        {/* Location */}
        {locationLabel && (
          <p className="text-[11px] text-slate-500 mt-0.5">📍 {locationLabel}</p>
        )}

        {/* Bio */}
        {bio ? (
          <p className="text-[12px] text-slate-300 mt-2 leading-relaxed">{bio}</p>
        ) : (
          <button type="button" onClick={() => setShowEdit(true)}
            className="mt-2 text-[11px] text-slate-600 italic active:opacity-70">
            + Ajoute bio ou...
          </button>
        )}
      </div>

      {/* ── ACTION BUTTONS ─────────────────────────────────────────── */}
      <div className="px-4 pb-4 flex gap-2">
        <button type="button" onClick={() => setShowEdit(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-[12px] font-black active:scale-95 transition"
          style={{ background: CARD, borderColor: BORDER, color: '#cbd5e1' }}>
          ✏️ Modifier Profil
        </button>
        <button type="button" onClick={() => setShowPost(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-black active:scale-95 transition"
          style={{ background: roleColor, color: '#0a0f1a' }}>
          ➕ Ajoute Post
        </button>
      </div>

      {/* ── DIVIDER ────────────────────────────────────────────────── */}
      <div className="border-b mb-1" style={{ borderColor: BORDER }} />

      {/* ── POSTS GRID (3 columns, square cells) ───────────────────── */}
      {!postsLoaded ? (
        <div className="grid grid-cols-3 gap-0.5 px-0.5 py-0.5">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="aspect-square animate-pulse" style={{ background: CARD }} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <span className="text-4xl mb-3">📷</span>
          <p className="text-sm font-black text-slate-500">Okenn piblikasyon toujou</p>
          <p className="text-[11px] text-slate-600 mt-1 text-center px-8">
            Tape + pou pataje premye foto ou a
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5 px-0.5 py-0.5">
          {posts.map(post => (
            <button key={post.id} type="button"
              className="aspect-square overflow-hidden relative active:opacity-80 transition"
              style={{ background: CARD }}
              onClick={() => setViewer(post)}>

              {post.mediaUrl && post.type !== 'text' ? (
                post.type === 'video'
                  ? <>
                      <video src={post.mediaUrl}
                        className="w-full h-full object-cover" muted playsInline />
                      {/* Play icon overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <span className="text-white text-2xl" style={{ textShadow: '0 1px 4px #0008' }}>
                          ▶
                        </span>
                      </div>
                    </>
                  : <img src={post.mediaUrl} alt=""
                      className="w-full h-full object-cover"
                      onError={e => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-2">
                  <p className="text-[9px] text-slate-400 text-center leading-tight line-clamp-4">
                    {post.caption}
                  </p>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── LOGOUT LINK ────────────────────────────────────────────── */}
      <div className="flex justify-center py-8">
        <button type="button" onClick={handleLogout}
          className="text-[12px] font-bold active:opacity-70"
          style={{ color: '#ef4444' }}>
          Dekonekte
        </button>
      </div>

      {/* ── MODALS ─────────────────────────────────────────────────── */}
      {showEdit && (
        <EditModal
          user={user}
          onClose={() => setShowEdit(false)}
          onSave={handleSaveProfile}
        />
      )}
      {showPost && (
        <PostModal
          user={user}
          onClose={() => setShowPost(false)}
          onCreated={handlePostCreated}
        />
      )}
      {viewer && (
        <PostViewer
          post={viewer}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
}

export default React.memo(ProfileScreen);