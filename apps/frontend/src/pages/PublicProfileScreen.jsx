import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal, Grid3x3, Play, Tag, Heart, MessageCircle, Share2, Bookmark, X, Send, CheckCircle } from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { followUser, unfollowUser, isFollowing, saveUser, unsaveUser, isSaved, likePost, unlikePost, isLiked, getLikeCount, getUserPosts, addPost, getUserStats, addComment, getComments } from '../services/social';

const BG = '#050B18'; const CARD = '#0d1526'; const BORDER = '#1F2937'; const GOLD = '#FACC15';

// ── Story Highlight circle ────────────────────────────────────
const Highlight = memo(({ label, emoji, onPress }) => (
  <button type="button" onClick={onPress}
    className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition-transform">
    <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center text-2xl"
      style={{ borderColor: GOLD, background: `${GOLD}15` }}>
      {emoji}
    </div>
    <span className="text-[10px] text-slate-300 font-bold whitespace-nowrap max-w-[64px] truncate">{label}</span>
  </button>
));

// ── Post thumbnail card ───────────────────────────────────────
const PostThumb = memo(({ post, onPress }) => (
  <button type="button" onClick={() => onPress(post)}
    className="relative aspect-square overflow-hidden bg-slate-800 active:opacity-80 transition-opacity">
    {post.mediaUrl ? (
      post.type === 'video'
        ? <video src={post.mediaUrl} className="w-full h-full object-cover" muted playsInline />
        : <img src={post.mediaUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-3xl"
        style={{ background: post.type === 'promotion' ? `${GOLD}20` : CARD }}>
        {post.type === 'promotion' ? '📢' : post.type === 'video' ? '🎥' : '🖼'}
      </div>
    )}
    {post.type === 'video' && (
      <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
        <Play className="w-3 h-3 text-white fill-white" />
      </div>
    )}
    {post.likesCount > 0 && (
      <div className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5">
        <Heart className="w-3 h-3 text-white fill-white" />
        <span className="text-[9px] text-white font-bold">{fmtNum(post.likesCount)}</span>
      </div>
    )}
  </button>
));

// ── Post Modal (full view) ────────────────────────────────────
function PostModal({ post, myId, myName, myAvatar, onClose }) {
  const navigate  = useNavigate();
  const [liked,   setLiked]   = useState(() => isLiked(myId, post.id || post._id));
  const [likes,   setLikes]   = useState(() => getLikeCount(post.id || post._id) || post.likesCount || 0);
  const [comments,setComments]= useState(() => getComments(post.id || post._id));
  const [text,    setText]    = useState('');
  const [showComments, setShowComments] = useState(false);
  const lastTap = useRef(0);

  const toggleLike = useCallback(() => {
    if (liked) { unlikePost(myId, post); setLikes(l => Math.max(0, l - 1)); }
    else       { likePost(myId, post);   setLikes(l => l + 1); }
    setLiked(l => !l);
  }, [liked, myId, post]);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) { if (!liked) toggleLike(); }
    lastTap.current = now;
  }, [liked, toggleLike]);

  const handleComment = useCallback(() => {
    if (!text.trim()) return;
    const c = addComment(myId, post.id || post._id, text.trim(), myName, myAvatar);
    setComments(prev => [...prev, c]);
    setText('');
  }, [text, myId, post, myName, myAvatar]);

  return (
    <div className="fixed inset-0 z-[300] flex flex-col" style={{ background: BG }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: BORDER }}>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button type="button" onClick={() => navigate(`/u/${post.userId}`)}
          className="flex items-center gap-2 flex-1">
          <img src={post.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.userId}`}
            alt="" className="w-8 h-8 rounded-full object-cover border" style={{ borderColor: GOLD }} />
          <div className="text-left">
            <p className="text-xs font-black text-white leading-none">{post.userName || 'Itilizatè'}</p>
            <p className="text-[10px] text-slate-500">{timeAgo(post.createdAt)}</p>
          </div>
        </button>
        <button type="button">
          <MoreHorizontal className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Media */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative" onClick={handleDoubleTap}>
          {post.mediaUrl ? (
            post.type === 'video'
              ? <video src={post.mediaUrl} className="w-full max-h-[50vh] object-cover" controls playsInline />
              : <img src={post.mediaUrl} alt="" className="w-full object-contain max-h-[60vh]" />
          ) : (
            <div className="w-full h-64 flex items-center justify-center text-6xl"
              style={{ background: CARD }}>
              {post.type === 'promotion' ? '📢' : '🖼'}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 pt-3 pb-2 flex items-center gap-4">
          <button type="button" onClick={toggleLike} className="flex items-center gap-1.5 transition-transform active:scale-90">
            <Heart className={`w-6 h-6 transition-colors ${liked ? 'text-red-500 fill-red-500 scale-110' : 'text-slate-300'}`} />
          </button>
          <button type="button" onClick={() => setShowComments(true)} className="text-slate-300">
            <MessageCircle className="w-6 h-6" />
          </button>
          <button type="button" className="text-slate-300">
            <Share2 className="w-6 h-6" />
          </button>
          <div className="flex-1" />
          <button type="button" className="text-slate-300">
            <Bookmark className="w-6 h-6" />
          </button>
        </div>

        {/* Likes count */}
        {likes > 0 && (
          <p className="px-4 text-xs font-black text-white mb-1">
            {fmtNum(likes)} like{likes !== 1 ? 's' : ''}
          </p>
        )}

        {/* Caption */}
        {post.caption && (
          <p className="px-4 pb-3 text-sm text-slate-200">
            <span className="font-black text-white mr-1">{post.userName}</span>
            {post.caption}
          </p>
        )}

        {/* Comments count */}
        {comments.length > 0 && (
          <button type="button" onClick={() => setShowComments(true)}
            className="px-4 pb-3 text-xs text-slate-500 text-left">
            Wè tout {comments.length} kòmantè yo
          </button>
        )}
      </div>

      {/* Comment input */}
      <div className="border-t px-4 py-3 flex items-center gap-3" style={{ borderColor: BORDER }}>
        <img src={myAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${myId}`}
          alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleComment()}
          placeholder="Ajoute yon kòmantè…"
          className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
        />
        {text.trim() && (
          <button type="button" onClick={handleComment}
            className="text-amber-400 font-black text-sm">Voye</button>
        )}
      </div>

      {/* Comments sheet */}
      {showComments && (
        <div className="fixed inset-0 z-[400] flex flex-col justify-end" onClick={() => setShowComments(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative rounded-t-3xl overflow-hidden flex flex-col max-h-[70vh]"
            style={{ background: CARD }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: BORDER }}>
              <span className="font-black text-white">Kòmantè yo</span>
              <button type="button" onClick={() => setShowComments(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-3 space-y-4">
              {comments.length === 0 && (
                <p className="text-center text-slate-500 text-sm py-8">Pa gen kòmantè ankò. Soyez premye!</p>
              )}
              {comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <img src={c.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.userId}`}
                    alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                  <div>
                    <span className="text-xs font-black text-white">{c.userName} </span>
                    <span className="text-xs text-slate-300">{c.text}</span>
                    <p className="text-[10px] text-slate-600 mt-0.5">{timeAgo(c.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t px-5 py-3 flex items-center gap-3" style={{ borderColor: BORDER }}>
              <input value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleComment()}
                placeholder="Ekri yon kòmantè…"
                className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none" />
              {text.trim() && (
                <button type="button" onClick={handleComment}>
                  <Send className="w-5 h-5 text-amber-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────
function fmtNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0','') + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace('.0','') + 'K';
  return String(n);
}
function timeAgo(date) {
  if (!date) return '';
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)  return `${s}s`;
  if (s < 3600) return `${Math.floor(s/60)}m`;
  if (s < 86400) return `${Math.floor(s/3600)}h`;
  return `${Math.floor(s/86400)}j`;
}

// ── Main component ────────────────────────────────────────────
export default function PublicProfileScreen() {
  const { userId }   = useParams();
  const navigate     = useNavigate();
  const { user: me } = useAuth();

  const [profile,      setProfile]      = useState(null);
  const [posts,        setPosts]        = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeTab,    setActiveTab]    = useState('posts');
  const [following,    setFollowing]    = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [stats,        setStats]        = useState({ posts: 0, followers: 0, following: 0 });
  const [openPost,     setOpenPost]     = useState(null);
  const [showOptions,  setShowOptions]  = useState(false);

  const myId    = String(me?._id || me?.id || '');
  const isOwnProfile = myId && userId && (myId === userId || myId === String(userId));

  // Load profile
  useEffect(() => {
    let alive = true;
    setLoadingProfile(true);
    API.get(`/users/${userId}`)
      .then(res => { if (alive) { setProfile(res.data?.data || res.data?.user || res.data); } })
      .catch(() => {})
      .finally(() => { if (alive) setLoadingProfile(false); });
    return () => { alive = false; };
  }, [userId]);

  // Load posts from localStorage + API
  useEffect(() => {
    const local = getUserPosts(userId);
    setPosts(local);
    API.get(`/posts/user/${userId}`)
      .then(res => {
        const remote = res.data?.posts || [];
        if (remote.length > 0) {
          remote.forEach(p => addPost(p)); // sync to local
          setPosts(getUserPosts(userId));
        }
      })
      .catch(() => {});
  }, [userId]);

  // Social state
  useEffect(() => {
    if (!myId) return;
    setFollowing(isFollowing(myId, userId));
    setSaved(isSaved(myId, userId));
    const s = getUserStats(userId);
    setStats(s);
  }, [myId, userId]);

  const handleFollow = useCallback(() => {
    if (!myId) { navigate('/login'); return; }
    if (following) {
      unfollowUser(myId, userId);
      setStats(s => ({ ...s, followers: Math.max(0, s.followers - 1) }));
    } else {
      followUser(myId, userId);
      setStats(s => ({ ...s, followers: s.followers + 1 }));
    }
    setFollowing(f => !f);
  }, [following, myId, userId, navigate]);

  const handleSave = useCallback(() => {
    if (!myId) return;
    if (saved) unsaveUser(myId, userId);
    else       saveUser(myId, userId);
    setSaved(s => !s);
  }, [saved, myId, userId]);

  const handleMessage = useCallback(() => {
    navigate(`/chat/${userId}`);
  }, [navigate, userId]);

  // Profile data
  const name      = profile?.name || 'Itilizatè';
  const profession= profile?.profession || profile?.role || '';
  const city      = profile?.location?.city || '';
  const bio       = profile?.profileMetadata?.bio?.short || profile?.bio || '';
  const photo     = profile?.profileMetadata?.profilePhoto || profile?.profilePhoto
    || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
  const rating    = profile?.stats?.rating || 0;
  const verified  = profile?.stats?.totalJobs > 0 || false;
  const username  = (name || '').toLowerCase().replace(/\s+/g, '_');

  // Story highlights auto-generated from profile
  const highlights = [
    { id:'portfolio', emoji:'🖼', label:'Portfolio'  },
    { id:'services',  emoji:'⚡', label:'Sèvis'      },
    { id:'reviews',   emoji:'⭐', label:'Review'     },
    { id:'work',      emoji:'💼', label:'Travay'     },
    { id:'about',     emoji:'👤', label:'À propos'   },
  ];

  // Filtered posts by tab
  const displayPosts = activeTab === 'videos'
    ? posts.filter(p => p.type === 'video')
    : activeTab === 'tagged'
    ? []
    : posts;

  if (loadingProfile && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: BG }}>

      {/* ── Sticky header ──────────────────────────────────────── */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 h-12 border-b"
        style={{ background: BG, borderColor: BORDER }}>
        <button type="button" onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-black text-white">{username}</span>
        <button type="button" onClick={() => setShowOptions(true)}
          className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* ── Profile section ────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3">

        {/* Avatar + Stats */}
        <div className="flex items-center gap-4 mb-3">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full p-0.5"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #f59e0b, #d97706)` }}>
              <img src={photo} alt={name}
                className="w-full h-full rounded-full object-cover border-2"
                style={{ borderColor: BG }} />
            </div>
            {verified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: BG }}>
                <CheckCircle className="w-5 h-5 text-amber-400 fill-amber-400" />
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex-1 flex justify-around">
            {[
              { value: stats.posts,     label: 'Posts'  },
              { value: stats.followers, label: 'Abonè'  },
              { value: stats.following, label: 'Swivi'  },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <span className="text-[17px] font-black text-white">{fmtNum(value)}</span>
                <span className="text-[11px] text-slate-400 font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Name + profession + rating */}
        <div className="mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black text-white">{name}</span>
            {verified && <CheckCircle className="w-4 h-4 text-amber-400 fill-amber-400" />}
          </div>
          {profession && (
            <p className="text-xs font-bold text-amber-400 mt-0.5">{profession}</p>
          )}
          {rating > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
              {'★★★★★'.split('').map((s, i) => (
                <span key={i} className="text-xs" style={{ color: i < Math.round(rating) ? GOLD : '#334155' }}>★</span>
              ))}
              <span className="text-[10px] text-slate-400 ml-0.5">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Bio */}
        {bio && <p className="text-xs text-slate-300 mb-1 leading-relaxed">{bio}</p>}

        {/* Location */}
        {city && (
          <p className="text-xs text-slate-500 mb-3">📍 {city}</p>
        )}

        {/* Story highlights */}
        <div className="flex gap-4 overflow-x-auto pb-1 mb-4" style={{ scrollbarWidth: 'none' }}>
          {highlights.map(h => (
            <Highlight key={h.id} emoji={h.emoji} label={h.label} onPress={() => {}} />
          ))}
        </div>

        {/* Action buttons */}
        {isOwnProfile ? (
          <div className="flex gap-2">
            <button type="button" onClick={() => navigate('/edit-profile')}
              className="flex-1 py-2.5 rounded-xl text-sm font-black text-white border transition-all active:scale-95"
              style={{ borderColor: BORDER, background: CARD }}>
              Modifye Pwofil
            </button>
            <button type="button" onClick={() => navigate('/create-post')}
              className="flex-1 py-2.5 rounded-xl text-sm font-black text-slate-950 transition-all active:scale-95"
              style={{ background: GOLD }}>
              + Pibliye
            </button>
          </div>
        ) : (
          <div className="flex gap-2 items-center">
            <button type="button" onClick={handleFollow}
              className="flex-1 py-2.5 rounded-xl text-sm font-black transition-all active:scale-95"
              style={following
                ? { background: CARD, color: 'white', border: `1px solid ${BORDER}` }
                : { background: GOLD, color: '#0f172a' }}>
              {following ? 'Swivi ✓' : 'Swiv'}
            </button>
            <button type="button" onClick={handleMessage}
              className="flex-1 py-2.5 rounded-xl text-sm font-black text-white border transition-all active:scale-95"
              style={{ borderColor: BORDER, background: CARD }}>
              Mesaj
            </button>
            <button type="button" onClick={handleSave}
              className="w-10 h-10 flex items-center justify-center rounded-xl border transition-all active:scale-95"
              style={{ borderColor: saved ? GOLD : BORDER, background: saved ? `${GOLD}20` : CARD }}>
              <Bookmark className={`w-4 h-4 ${saved ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
            </button>
          </div>
        )}
      </div>

      {/* ── Content tabs ──────────────────────────────────────── */}
      <div className="flex border-b sticky top-12 z-40" style={{ background: BG, borderColor: BORDER }}>
        {[
          { id: 'posts',  Icon: Grid3x3 },
          { id: 'videos', Icon: Play    },
          { id: 'tagged', Icon: Tag     },
        ].map(({ id, Icon }) => (
          <button key={id} type="button" onClick={() => setActiveTab(id)}
            className="flex-1 flex justify-center items-center py-3 relative transition-all">
            <Icon className={`w-5 h-5 transition-colors ${activeTab === id ? 'text-amber-400' : 'text-slate-600'}`}
              strokeWidth={activeTab === id ? 2.5 : 1.5} />
            {activeTab === id && (
              <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full"
                style={{ background: GOLD }} />
            )}
          </button>
        ))}
      </div>

      {/* ── Post grid ─────────────────────────────────────────── */}
      {displayPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            {activeTab === 'videos' ? '🎥' : activeTab === 'tagged' ? '🏷' : '📷'}
          </div>
          <div className="text-center">
            <p className="font-black text-white text-sm">
              {activeTab === 'videos' ? 'Pa gen vidéyo' : activeTab === 'tagged' ? 'Pa gen tag' : 'Pa gen post ankò'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {isOwnProfile ? 'Pibliye premye foto ou!' : 'Okenn kontni pou kounye a'}
            </p>
          </div>
          {isOwnProfile && activeTab === 'posts' && (
            <button type="button" onClick={() => navigate('/create-post')}
              className="px-6 py-3 rounded-2xl font-black text-sm text-slate-950 active:scale-95 transition"
              style={{ background: GOLD }}>
              📷 Pibliye yon post
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5">
          {displayPosts.map(post => (
            <PostThumb key={post.id || post._id} post={post} onPress={setOpenPost} />
          ))}
        </div>
      )}

      {/* ── Post full-view modal ──────────────────────────────── */}
      {openPost && (
        <PostModal
          post={openPost}
          myId={myId}
          myName={me?.name || ''}
          myAvatar={me?.profileMetadata?.profilePhoto || ''}
          onClose={() => setOpenPost(null)}
        />
      )}

      {/* ── Options bottom sheet ──────────────────────────────── */}
      {showOptions && (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end" onClick={() => setShowOptions(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative rounded-t-3xl overflow-hidden" style={{ background: CARD }}
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mt-3 mb-2" />
            {[
              { label: 'Pataje Pwofil',  emoji: '🔗', action: () => { navigator.share?.({ url: window.location.href }); setShowOptions(false); }},
              { label: 'Kopye Lyen',     emoji: '📋', action: () => { navigator.clipboard?.writeText(window.location.href); setShowOptions(false); }},
              ...(!isOwnProfile ? [
                { label: 'Rapòte',       emoji: '🚩', action: () => setShowOptions(false) },
                { label: 'Bloke',        emoji: '🚫', action: () => setShowOptions(false) },
              ] : []),
            ].map(o => (
              <button key={o.label} type="button" onClick={o.action}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-800/40 transition">
                <span className="text-xl">{o.emoji}</span>
                <span className="text-sm font-bold text-white">{o.label}</span>
              </button>
            ))}
            <button type="button" onClick={() => setShowOptions(false)}
              className="w-full py-4 text-sm font-black text-red-400 border-t" style={{ borderColor: BORDER }}>
              Anile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
