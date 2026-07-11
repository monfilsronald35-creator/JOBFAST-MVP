import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { storiesAPI } from '../../services/stories';

// ── Mock feed (shown while API is offline) ────────────────────
function mockFeed(user) {
  return [
    { userId:'me', name: user?.name || 'Mwen', avatar: null, isOwn: true, stories:[], hasNew: false },
    { userId:'u1', name:'Marie C.',   avatar:null, hasNew:true,  stories:[{ id:'s1', type:'text', bg:'from-pink-600 to-rose-500',    text:'Bonj!',       postedAt: Date.now()-3600000 }] },
    { userId:'u2', name:'Jean P.',    avatar:null, hasNew:true,  stories:[{ id:'s2', type:'text', bg:'from-indigo-600 to-blue-500',  text:'Travay fini!', postedAt: Date.now()-7200000 }] },
    { userId:'u3', name:'Alex M.',    avatar:null, hasNew:false, stories:[{ id:'s3', type:'text', bg:'from-amber-500 to-orange-500', text:'Nèf!',         postedAt: Date.now()-86400000}] },
    { userId:'u4', name:'MATCO SA',   avatar:null, hasNew:true,  stories:[{ id:'s4', type:'text', bg:'from-teal-600 to-emerald-500', text:'Nou rekrute!', postedAt: Date.now()-1800000 }] },
    { userId:'u5', name:'Tech HT',    avatar:null, hasNew:true,  stories:[{ id:'s5', type:'text', bg:'from-violet-600 to-purple-500',text:'Lanse!',       postedAt: Date.now()-900000  }] },
  ];
}

const RING_COLORS  = ['from-pink-500 to-rose-500','from-amber-400 to-orange-500','from-indigo-500 to-blue-600','from-teal-400 to-emerald-500','from-violet-500 to-purple-600'];
const TEXT_BG_OPTS = ['from-pink-600 to-rose-500','from-indigo-600 to-blue-500','from-amber-500 to-orange-500','from-teal-600 to-emerald-500','from-violet-600 to-purple-500','from-green-600 to-emerald-500'];
const REACTIONS    = ['❤️','🔥','👏','😂','😮','🙌'];

// ── Time helper ────────────────────────────────────────────────
function timeAgo(ts) {
  const d = (Date.now() - ts) / 1000;
  if (d < 3600)  return `${Math.floor(d/60)}m`;
  if (d < 86400) return `${Math.floor(d/3600)}h`;
  return `${Math.floor(d/86400)}j`;
}

// ── Avatar circle ──────────────────────────────────────────────
function Avatar({ name = '', avatar, size = 14 }) {
  const letter = (name[0] || '?').toUpperCase();
  const idx    = name.charCodeAt(0) % RING_COLORS.length;
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br ${RING_COLORS[idx]} flex items-center justify-center text-white font-black text-xs shadow-lg shrink-0 overflow-hidden`}>
      {avatar ? <img src={avatar} alt={name} className="w-full h-full object-cover" /> : letter}
    </div>
  );
}

// ── StoryViewer (fullscreen) ───────────────────────────────────
function StoryViewer({ feed, startIndex, onClose }) {
  const { t } = useTranslation();
  const [userIdx,   setUserIdx]   = useState(startIndex);
  const [storyIdx,  setStoryIdx]  = useState(0);
  const [paused,    setPaused]    = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [showMenu,  setShowMenu]  = useState(false);
  const [viewed,    setViewed]    = useState(new Set());
  const timerRef = useRef(null);
  const DURATION = 5000; // ms per story

  const current = feed[userIdx];
  const stories = current?.stories || [];
  const story   = stories[storyIdx];
  const isOwn   = current?.isOwn;

  // Progress ticker
  useEffect(() => {
    if (paused || !story) return;
    setProgress(0);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / DURATION) * 100);
      setProgress(pct);
      if (pct >= 100) goNext();
    }, 50);
    return () => clearInterval(timerRef.current);
  }, [userIdx, storyIdx, paused]);

  // Mark viewed
  useEffect(() => {
    if (story?.id && !viewed.has(story.id)) {
      setViewed(prev => new Set([...prev, story.id]));
      storiesAPI.view(story.id).catch(() => {});
    }
  }, [story?.id]);

  const goNext = useCallback(() => {
    if (storyIdx < stories.length - 1) {
      setStoryIdx(i => i + 1);
    } else if (userIdx < feed.length - 1) {
      setUserIdx(i => i + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
  }, [storyIdx, stories.length, userIdx, feed.length, onClose]);

  const goPrev = useCallback(() => {
    if (storyIdx > 0) {
      setStoryIdx(i => i - 1);
    } else if (userIdx > 0) {
      setUserIdx(i => i - 1);
      setStoryIdx(0);
    }
  }, [storyIdx, userIdx]);

  if (!current || !story) { onClose(); return null; }

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* ── Background ── */}
      <div className={`absolute inset-0 bg-gradient-to-b ${story.bg || 'from-slate-800 to-slate-900'} transition-all duration-300`} />
      {story.imageUrl && (
        <img src={story.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}

      {/* ── Progress bars ── */}
      <div className="relative z-10 flex gap-1 px-3 pt-2">
        {stories.map((s, i) => (
          <div key={s.id} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-none"
              style={{ width: i < storyIdx ? '100%' : i === storyIdx ? `${progress}%` : '0%' }}
            />
          </div>
        ))}
      </div>

      {/* ── Header ── */}
      <div className="relative z-10 flex items-center gap-3 px-3 pt-2 pb-3">
        <Avatar name={current.name} avatar={current.avatar} size={10} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{current.name}</p>
          <p className="text-xs text-white/60">{timeAgo(story.postedAt || Date.now())}</p>
        </div>
        <button type="button" onClick={() => setShowMenu(v => !v)} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white text-sm">
          ⋮
        </button>
        <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white text-base">
          ✕
        </button>
      </div>

      {/* ── Context menu ── */}
      {showMenu && (
        <div className="absolute top-16 right-4 z-20 bg-[#1e293b] border border-slate-700 rounded-2xl overflow-hidden shadow-2xl min-w-[160px]">
          {isOwn ? (
            <>
              <button onClick={() => { storiesAPI.addHighlight(story.id).catch(()=>{}); setShowMenu(false); }}
                className="w-full text-left px-4 py-3 text-sm text-white hover:bg-slate-700">
                ✨ {t('stories.addHighlight', { defaultValue: 'Ajoute kòm Highlight' })}
              </button>
              <button onClick={() => { storiesAPI.delete(story.id).catch(()=>{}); goNext(); setShowMenu(false); }}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-slate-700 border-t border-slate-700">
                🗑 {t('stories.delete', { defaultValue: 'Efase istwa sa' })}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { storiesAPI.report(story.id, 'inappropriate').catch(()=>{}); setShowMenu(false); }}
                className="w-full text-left px-4 py-3 text-sm text-white hover:bg-slate-700">
                🚩 {t('stories.report', { defaultValue: 'Rapòte' })}
              </button>
              <button onClick={() => setShowMenu(false)}
                className="w-full text-left px-4 py-3 text-sm text-white hover:bg-slate-700 border-t border-slate-700">
                🚫 {t('stories.block', { defaultValue: 'Bloke moun sa' })}
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Story content ── */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Tap zones */}
        <button type="button" onClick={goPrev}
          onMouseDown={() => setPaused(true)} onMouseUp={() => setPaused(false)}
          className="absolute left-0 top-0 w-1/3 h-full z-10 focus:outline-none" />
        <button type="button" onClick={goNext}
          onMouseDown={() => setPaused(true)} onMouseUp={() => setPaused(false)}
          className="absolute right-0 top-0 w-1/3 h-full z-10 focus:outline-none" />

        {/* Text story */}
        {story.type === 'text' && (
          <div className="px-8 text-center">
            <p className="text-2xl font-black text-white drop-shadow-lg leading-relaxed">
              {story.text}
            </p>
          </div>
        )}
        {/* Image story */}
        {story.type === 'image' && story.imageUrl && (
          <img src={story.imageUrl} alt="" className="max-h-[60vh] max-w-full object-contain rounded-2xl" />
        )}
      </div>

      {/* ── Reactions row ── */}
      {!isOwn && (
        <div className="relative z-10 flex items-center gap-2 px-4 pb-6">
          {REACTIONS.map(emoji => (
            <button key={emoji} type="button"
              onClick={() => storiesAPI.react(story.id, emoji).catch(()=>{})}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-lg hover:scale-125 transition-transform">
              {emoji}
            </button>
          ))}
          <input
            className="flex-1 bg-black/30 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm text-white placeholder-white/50 focus:outline-none"
            placeholder={t('stories.replyPlaceholder', { defaultValue: 'Reponn…' })}
          />
        </div>
      )}
    </div>
  );
}

// ── Create story sheet ────────────────────────────────────────
function CreateStorySheet({ onClose, onCreated }) {
  const { t }    = useTranslation();
  const { user } = useAuth();
  const [type,   setType]      = useState('text');
  const [text,   setText]      = useState('');
  const [bg,     setBg]        = useState(TEXT_BG_OPTS[0]);
  const [posting, setPosting]  = useState(false);
  const fileRef = useRef(null);

  const handlePost = async () => {
    if (type === 'text' && !text.trim()) return;
    setPosting(true);
    try {
      const payload = { type, bg, text, userId: user?._id, postedAt: Date.now() };
      const res = await storiesAPI.create(payload);
      onCreated(res?.data?.data || payload);
    } catch {
      onCreated({ id: Date.now(), type, bg, text, userId: user?._id, name: user?.name, postedAt: Date.now() });
    }
    setPosting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full bg-[#0d1526] rounded-t-3xl z-10 overflow-hidden max-h-[85vh] overflow-y-auto">
        <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mt-3 mb-4" />
        <h3 className="text-base font-bold px-5 mb-4">{t('stories.create', { defaultValue: 'Kreye Istwa' })}</h3>

        {/* Type switch */}
        <div className="flex gap-2 px-5 mb-4">
          {[
            { id:'text',  icon:'✍️', label:'Tèks'   },
            { id:'image', icon:'📷', label:'Photo'   },
            { id:'video', icon:'🎥', label:'Videyo'  },
          ].map(opt => (
            <button key={opt.id} type="button" onClick={() => setType(opt.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition ${
                type === opt.id ? 'bg-amber-500 border-amber-400 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}>
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className={`mx-5 h-40 rounded-2xl bg-gradient-to-br ${bg} flex items-center justify-center mb-4 cursor-pointer`}
          onClick={() => type !== 'text' && fileRef.current?.click()}>
          {type === 'text' ? (
            <textarea
              value={text} onChange={e => setText(e.target.value)} maxLength={120} rows={3}
              placeholder={t('stories.textPlaceholder', { defaultValue: 'Ekri istwa ou…' })}
              className="bg-transparent text-white font-bold text-center text-lg w-full px-4 resize-none focus:outline-none placeholder-white/60"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <div className="text-center">
              <span className="text-4xl">{type === 'image' ? '📷' : '🎥'}</span>
              <p className="text-white/70 text-xs mt-2">{t('stories.tapToUpload', { defaultValue: 'Tape pou chwazi' })}</p>
            </div>
          )}
        </div>

        <input ref={fileRef} type="file" accept={type === 'image' ? 'image/*' : 'video/*'} className="hidden" />

        {/* Background color picker (text only) */}
        {type === 'text' && (
          <div className="flex gap-2 px-5 mb-5 overflow-x-auto pb-1">
            {TEXT_BG_OPTS.map(b => (
              <button key={b} type="button" onClick={() => setBg(b)}
                className={`w-8 h-8 rounded-full bg-gradient-to-br ${b} shrink-0 border-2 transition ${bg === b ? 'border-white scale-110' : 'border-transparent'}`} />
            ))}
          </div>
        )}

        {/* Post button */}
        <div className="px-5 pb-8">
          <button type="button" onClick={handlePost} disabled={posting || (type==='text' && !text.trim())}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-900 font-black text-sm transition">
            {posting ? '⏳…' : `✨ ${t('stories.post', { defaultValue: 'Poste Istwa' })}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main StoryRing component ───────────────────────────────────
export default function StoryRing() {
  const { user }  = useAuth();
  const { t }     = useTranslation();
  const [feed,        setFeed]        = useState([]);
  const [viewerOpen,  setViewerOpen]  = useState(false);
  const [viewerStart, setViewerStart] = useState(0);
  const [createOpen,  setCreateOpen]  = useState(false);

  useEffect(() => {
    storiesAPI.getFeed()
      .then(res => {
        const data = res?.data?.data || res?.data;
        if (Array.isArray(data) && data.length) setFeed(data);
        else setFeed(mockFeed(user));
      })
      .catch(() => setFeed(mockFeed(user)));
  }, [user]);

  const openViewer = (idx) => {
    const target = feed[idx];
    if (target?.isOwn && !target.stories?.length) {
      setCreateOpen(true);
    } else if (target?.stories?.length) {
      setViewerStart(idx);
      setViewerOpen(true);
    } else {
      setCreateOpen(true);
    }
  };

  const handleCreated = (newStory) => {
    setFeed(prev => prev.map(f =>
      f.isOwn ? { ...f, stories: [...(f.stories || []), newStory], hasNew: true } : f
    ));
  };

  return (
    <>
      <div className="flex gap-3 overflow-x-auto px-4 py-2 scrollbar-hide">
        {feed.map((person, idx) => {
          const hasNew = person.hasNew;
          const isOwn  = person.isOwn;
          const ringColor = isOwn ? 'from-amber-400 to-amber-600' : hasNew ? 'from-pink-500 to-violet-600' : 'from-slate-600 to-slate-700';

          return (
            <button
              key={person.userId}
              type="button"
              onClick={() => openViewer(idx)}
              className="flex flex-col items-center gap-1 shrink-0 focus-visible:outline-none"
            >
              {/* Ring */}
              <div className={`p-0.5 rounded-full bg-gradient-to-br ${ringColor} ${hasNew ? 'shadow-lg shadow-pink-500/30' : ''}`}>
                <div className="p-0.5 bg-[#020617] rounded-full">
                  {isOwn ? (
                    <div className="relative">
                      <Avatar name={user?.name || 'M'} avatar={user?.photo} size={14} />
                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-amber-500 border-2 border-[#020617] flex items-center justify-center text-slate-900 font-black text-[10px]">
                        +
                      </div>
                    </div>
                  ) : (
                    <Avatar name={person.name} avatar={person.avatar} size={14} />
                  )}
                </div>
              </div>
              {/* Name */}
              <p className="text-[10px] font-semibold text-slate-400 max-w-[56px] truncate text-center">
                {isOwn ? t('stories.myStory', { defaultValue: 'Istwa Mwen' }) : person.name.split(' ')[0]}
              </p>
            </button>
          );
        })}
      </div>

      {viewerOpen && (
        <StoryViewer feed={feed} startIndex={viewerStart} onClose={() => setViewerOpen(false)} />
      )}
      {createOpen && (
        <CreateStorySheet onClose={() => setCreateOpen(false)} onCreated={handleCreated} />
      )}
    </>
  );
}
