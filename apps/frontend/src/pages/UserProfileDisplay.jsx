// src/pages/UserProfileDisplay.jsx
import React, { useMemo, useState, useEffect, useCallback, memo, lazy, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, PROFESSION_METADATA } from '../constants/categories';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import {
  ArrowLeft, Star, Share2, Bookmark, Play, Phone, MessageCircle, MapPin, ShieldCheck,
  BadgeCheck, Sparkles, Eye, BriefcaseBusiness, Clock3, Route, Wifi, Heart, FileText,
  Shield, Camera, Gauge, Loader2, ChevronRight
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../api/profile';
import { useProfileRealtime } from '../hooks/useProfileRealtime';

const ProfileAnalytics = lazy(() => import('./sections/ProfileAnalytics'));
const ProfileReviews = lazy(() => import('./sections/ProfileReviews'));
const ProfileTimeline = lazy(() => import('./sections/ProfileTimeline'));
const ProfilePortfolio = lazy(() => import('./sections/ProfilePortfolio'));
const ProfileAI = lazy(() => import('./sections/ProfileAI'));
const ProfileTrust = lazy(() => import('./sections/ProfileTrust'));
const ProfileActivity = lazy(() => import('./sections/ProfileActivity'));
const MediaGallery = lazy(() => import('./sections/MediaGallery'));
const BookingPanel = lazy(() => import('./sections/BookingPanel'));
const MapPanel = lazy(() => import('./sections/MapPanel'));
const ServicesPanel = lazy(() => import('./sections/ServicesPanel'));
const SecurityPanel = lazy(() => import('./sections/SecurityPanel'));
const EnterpriseDashboard = lazy(() => import('./sections/EnterpriseDashboard'));

const cls = (...p) => p.filter(Boolean).join(' ');

const Panel = memo(({ title, icon: Icon, children }) => (
  <div className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/5 backdrop-blur-2xl">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10),transparent_34%)]" />
    <div className="relative p-5 md:p-6">
      <div className="mb-4 flex items-center gap-2">
        {Icon ? <Icon className="h-4 w-4 text-amber-300" /> : null}
        <h3 className="text-base font-black text-white">{title}</h3>
      </div>
      {children}
    </div>
  </div>
));

function useInView(ref, rootMargin = '240px') {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && setInView(true), { rootMargin, threshold: 0.01 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return inView;
}

function useHeroMotion() {
  const { scrollY } = useScroll();
  return {
    coverY: useTransform(scrollY, [0, 360], [0, -90]),
    coverScale: useTransform(scrollY, [0, 360], [1, 1.07]),
    avatarScale: useTransform(scrollY, [0, 360], [1, 0.74]),
    avatarY: useTransform(scrollY, [0, 360], [0, 18]),
    nameY: useTransform(scrollY, [0, 360], [0, -20]),
    navOpacity: useTransform(scrollY, [0, 220], [0, 1]),
  };
}

function Skeleton({ className = '' }) {
  return <div className={cls('animate-pulse rounded-2xl bg-white/8', className)} />;
}

function ProfileHero({ profile, profession, navigate, onFollow, onSave, followed, saved }) {
  const reduced = useReducedMotion();
  const { coverY, coverScale, avatarScale, avatarY, nameY, navOpacity } = useHeroMotion();
  const coverVideoRef = React.useRef(null);
  const coverWrapRef = React.useRef(null);
  const inView = useInView(coverWrapRef);

  useEffect(() => {
    if (coverVideoRef.current) {
      if (inView) coverVideoRef.current.play().catch(() => {});
      else coverVideoRef.current.pause();
    }
  }, [inView]);

  return (
    <div ref={coverWrapRef} className="relative">
      <motion.div style={{ y: coverY, scale: coverScale }} className="relative min-h-[92vh] overflow-hidden rounded-[2rem] bg-slate-950">
        {profile.coverVideo ? (
          <video
            ref={coverVideoRef}
            className="absolute inset-0 h-full w-full object-cover"
            muted
            loop
            playsInline
            preload="none"
            poster={profile.coverPhoto}
          >
            <source src={profile.coverVideo} type="application/x-mpegURL" />
          </video>
        ) : (
          <img
            src={profile.coverPhoto}
            alt={`${profile.name} cover`}
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            srcSet={`${profile.coverPhoto}?format=avif&w=1280 1280w, ${profile.coverPhoto}?format=webp&w=1920 1920w, ${profile.coverPhoto}?w=2400 2400w`}
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,.12),rgba(2,6,23,.96)),radial-gradient(circle_at_20%_20%,rgba(250,204,21,.18),transparent_20%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,.14),transparent_24%)]" />
        <motion.div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,.12),transparent_25%)]" animate={reduced ? undefined : { opacity: [0.35, 0.8, 0.35] }} transition={{ repeat: Infinity, duration: 6 }} />

        <div className="absolute left-4 top-4 right-4 z-20 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="glass-btn"><ArrowLeft className="h-4 w-4" /></button>
          <motion.div style={{ opacity: navOpacity }} className="glass-pill"><ShieldCheck className="h-4 w-4 text-emerald-400" /><span className="text-[11px] font-bold">Enterprise Profile</span></motion.div>
          <div className="flex items-center gap-2">
            <button onClick={onSave} className="glass-btn"><Bookmark className={cls('h-4 w-4', saved ? 'fill-amber-400 text-amber-400' : 'text-white')} /></button>
            <button className="glass-btn"><Share2 className="h-4 w-4 text-white" /></button>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
              <div className="flex items-end gap-4">
                <motion.div style={{ scale: avatarScale, y: avatarY }} className="relative">
                  <div className="absolute -inset-2 rounded-[1.8rem] bg-amber-400/20 blur-2xl" />
                  <div className="absolute -inset-[2px] rounded-[1.8rem] bg-[conic-gradient(from_180deg,rgba(34,197,94,.9),rgba(250,204,21,.9),rgba(59,130,246,.9),rgba(34,197,94,.9))]" />
                  <div className="relative h-28 w-28 overflow-hidden rounded-[1.7rem] border border-white/20 bg-slate-900 md:h-36 md:w-36">
                    {profile.profilePhoto ? <img src={profile.profilePhoto} alt={profile.name} className="h-full w-full object-cover" loading="eager" decoding="async" /> : <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-yellow-400 to-orange-500 text-5xl font-black text-black">{profile.name?.charAt(0)?.toUpperCase()}</div>}
                  </div>
                  <motion.div animate={reduced ? undefined : { scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 2.2 }} className="absolute -right-1 -bottom-1 h-7 w-7 rounded-full bg-emerald-400" />
                </motion.div>
                <motion.div style={{ y: nameY }} className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">{profile.name}</h1>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-black text-emerald-300">
                      <BadgeCheck className="h-3 w-3" /> Verified
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-amber-300 md:text-base">{profession?.label || profile.profession}</p>
                </motion.div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button className="glass-action-primary"><MessageCircle className="h-4 w-4" /> Message</button>
              <button onClick={onFollow} className="glass-action"><Heart className="h-4 w-4" /> {followed ? 'Following' : 'Follow'}</button>
              <button className="glass-action"><Play className="h-4 w-4" /> Book now</button>
              <button className="glass-action"><Phone className="h-4 w-4" /> Quote</button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function UserProfileDisplay() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [followed, setFollowed] = useState(false);
  const [saved, setSaved] = useState(false);

  const profileId = id || user?._id || user?.id;

  const profileQuery = useQuery({
    queryKey: ['profile', profileId],
    queryFn: () => profileApi.getProfile(profileId),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const aiQuery = useQuery({ queryKey: ['profile-ai', profileId], queryFn: () => profileApi.getAI(profileId), staleTime: 10 * 60 * 1000, gcTime: 30 * 60 * 1000 });
  const trustQuery = useQuery({ queryKey: ['profile-trust', profileId], queryFn: () => profileApi.getTrust(profileId), staleTime: 10 * 60 * 1000, gcTime: 30 * 60 * 1000 });
  const analyticsQuery = useQuery({ queryKey: ['profile-analytics', profileId], queryFn: () => profileApi.getAnalytics(profileId), staleTime: 60 * 1000, gcTime: 15 * 60 * 1000 });
  const reviewsQuery = useQuery({ queryKey: ['profile-reviews', profileId], queryFn: () => profileApi.getReviews(profileId), staleTime: 5 * 60 * 1000, gcTime: 30 * 60 * 1000 });
  const portfolioQuery = useQuery({ queryKey: ['profile-portfolio', profileId], queryFn: () => profileApi.getPortfolio(profileId), staleTime: 10 * 60 * 1000, gcTime: 30 * 60 * 1000 });
  const mediaQuery = useQuery({ queryKey: ['profile-media', profileId], queryFn: () => profileApi.getMedia(profileId), staleTime: 10 * 60 * 1000, gcTime: 30 * 60 * 1000 });
  const timelineQuery = useQuery({ queryKey: ['profile-timeline', profileId], queryFn: () => api.get(`/profiles/${profileId}/timeline`).then(r => r.data), staleTime: 5 * 60 * 1000, gcTime: 30 * 60 * 1000 });
  const activityQuery = useQuery({ queryKey: ['profile-activity', profileId], queryFn: () => api.get(`/profiles/${profileId}/activity`).then(r => r.data), staleTime: 60 * 1000, gcTime: 15 * 60 * 1000 });
  const bookingQuery = useQuery({ queryKey: ['profile-bookings', profileId], queryFn: () => profileApi.getBookings(profileId), staleTime: 30 * 1000, gcTime: 10 * 60 * 1000 });

  const profile = useMemo(() => profileQuery.data || {}, [profileQuery.data]);
  const category = useMemo(() => Object.values(CATEGORIES).find(c => c.id === profile.category), [profile.category]);
  const profession = useMemo(() => PROFESSION_METADATA[profile.profession], [profile.profession]);

  const patchProfile = useCallback((delta) => {
    queryClient.setQueryData(['profile', profileId], prev => prev ? { ...prev, ...delta } : prev);
  }, [queryClient, profileId]);

  useProfileRealtime(profileId, patchProfile);

  const refs = {
    ai: useRef(null), trust: useRef(null), analytics: useRef(null), portfolio: useRef(null),
    reviews: useRef(null), timeline: useRef(null), activity: useRef(null), gallery: useRef(null),
    booking: useRef(null), map: useRef(null), services: useRef(null), security: useRef(null), enterprise: useRef(null),
  };

  const visible = {
    ai: useInView(refs.ai), trust: useInView(refs.trust), analytics: useInView(refs.analytics),
    portfolio: useInView(refs.portfolio), reviews: useInView(refs.reviews), timeline: useInView(refs.timeline),
    activity: useInView(refs.activity), gallery: useInView(refs.gallery), booking: useInView(refs.booking),
    map: useInView(refs.map), services: useInView(refs.services), security: useInView(refs.security), enterprise: useInView(refs.enterprise),
  };

  if (profileQuery.isLoading) return <main className="min-h-screen bg-[#050B18] text-white flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-amber-300" /></main>;

  return (
    <main className="min-h-screen bg-[#050B18] text-white">
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(250,204,21,.18),transparent_20%),radial-gradient(circle_at_80%_18%,rgba(59,130,246,.16),transparent_24%),radial-gradient(circle_at_50%_80%,rgba(34,197,94,.14),transparent_24%),linear-gradient(180deg,#071021,#050B18)]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-6">
        <ProfileHero
          profile={profile}
          profession={profession}
          navigate={navigate}
          onFollow={() => setFollowed(v => !v)}
          onSave={() => setSaved(v => !v)}
          followed={followed}
          saved={saved}
        />

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel title="About" icon={FileText}>
            <p className="text-sm text-slate-200">{profile.bio}</p>
          </Panel>
          <Panel title="Contact" icon={MessageCircle}>
            <div className="grid grid-cols-2 gap-2">
              <button className="glass-action-primary justify-center">Message</button>
              <button onClick={() => navigate(`/rating/${profileId}`)} className="glass-action justify-center">Evalye</button>
            </div>
          </Panel>
        </section>

        <div ref={refs.ai} className="mt-6">{visible.ai && <Suspense fallback={<Skeleton className="h-72" />}><ProfileAI profile={profile} data={aiQuery.data} /></Suspense>}</div>
        <div ref={refs.trust} className="mt-4">{visible.trust && <Suspense fallback={<Skeleton className="h-64" />}><ProfileTrust profile={profile} data={trustQuery.data} /></Suspense>}</div>
        <div ref={refs.booking} className="mt-4">{visible.booking && <Suspense fallback={<Skeleton className="h-64" />}><BookingPanel profile={profile} data={bookingQuery.data} /></Suspense>}</div>
        <div ref={refs.services} className="mt-4">{visible.services && <Suspense fallback={<Skeleton className="h-64" />}><ServicesPanel profile={profile} /></Suspense>}</div>
        <div ref={refs.map} className="mt-4">{visible.map && <Suspense fallback={<Skeleton className="h-64" />}><MapPanel profile={profile} /></Suspense>}</div>
        <div ref={refs.analytics} className="mt-4">{visible.analytics && <Suspense fallback={<Skeleton className="h-72" />}><ProfileAnalytics profile={profile} data={analyticsQuery.data} /></Suspense>}</div>
        <div ref={refs.portfolio} className="mt-4">{visible.portfolio && <Suspense fallback={<Skeleton className="h-72" />}><ProfilePortfolio profile={profile} data={portfolioQuery.data} /></Suspense>}</div>
        <div ref={refs.gallery} className="mt-4">{visible.gallery && <Suspense fallback={<Skeleton className="h-72" />}><MediaGallery profile={profile} data={mediaQuery.data} /></Suspense>}</div>
        <div ref={refs.timeline} className="mt-4">{visible.timeline && <Suspense fallback={<Skeleton className="h-64" />}><ProfileTimeline profile={profile} data={timelineQuery.data} /></Suspense>}</div>
        <div ref={refs.activity} className="mt-4">{visible.activity && <Suspense fallback={<Skeleton className="h-64" />}><ProfileActivity profile={profile} data={activityQuery.data} /></Suspense>}</div>
        <div ref={refs.reviews} className="mt-4">{visible.reviews && <Suspense fallback={<Skeleton className="h-64" />}><ProfileReviews profile={profile} data={reviewsQuery.data} /></Suspense>}</div>
        <div ref={refs.security} className="mt-4">{visible.security && <Suspense fallback={<Skeleton className="h-64" />}><SecurityPanel profile={profile} /></Suspense>}</div>
        <div ref={refs.enterprise} className="mt-4">{visible.enterprise && <Suspense fallback={<Skeleton className="h-72" />}><EnterpriseDashboard profile={profile} /></Suspense>}</div>
      </div>
    </main>
  );
}
