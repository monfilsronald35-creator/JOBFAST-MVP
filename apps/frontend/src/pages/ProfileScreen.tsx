import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  memo,
  lazy,
  Suspense,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import { useTranslation } from "react-i18next";
import { useInfiniteQuery, useQueryClient, useMutation, type QueryKey } from "@tanstack/react-query";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useOfflineQueue } from "../hooks/useOfflineQueue";

// ─── Lazy panels ──────────────────────────────────────────────────────────────

const EditModal   = lazy(() => import("./EditModal"));
const PostModal   = lazy(() => import("./PostModal"));
const PostViewer  = lazy(() => import("./PostViewer"));

// ─── Constants ────────────────────────────────────────────────────────────────

const BG     = "#050B18";
const CARD   = "#0d1526";
const GOLD   = "#FACC15";
const BORDER = "#1F2937";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoleMeta { label: string; color: string }

const ROLE_META: Record<string, RoleMeta> = {
  worker:           { label: "Travayè",    color: "#FACC15" },
  service_provider: { label: "Prestatè",   color: "#34d399" },
  freelancer:       { label: "Freelancer", color: "#a78bfa" },
  restaurant:       { label: "Restoran",   color: "#f97316" },
  hotel:            { label: "Otèl",       color: "#06b6d4" },
  company:          { label: "Konpayi",    color: "#60a5fa" },
  employer:         { label: "Anplwayè",   color: "#60a5fa" },
  hospital:         { label: "Lopital",    color: "#ef4444" },
  clinic:           { label: "Klinik",     color: "#14b8a6" },
};

const getRoleMeta = (role: string): RoleMeta =>
  ROLE_META[role] ?? { label: role || "Pwofesyonèl", color: GOLD };

interface SrcSet {
  avif?: string; webp?: string; jpeg?: string; default?: string;
  small?: string; medium?: string; large?: string; xlarge?: string;
  thumbnail?: string; nextPrefetch?: string;
}

interface FeedPost {
  id?: string;
  _id?: string;
  type?: string;
  caption?: string;
  cdnUrl?: string;
  thumbnailUrl?: string;
  mediaSrcSet?: SrcSet;
  isOptimistic?: boolean;
  meta?: Record<string, unknown>;
  audience?: string;
}

interface FeedPage { posts: FeedPost[]; nextCursor: string | null }

interface PostPayload {
  type: string;
  caption: string;
  audience: string;
  meta: Record<string, unknown>;
}

interface EnqueueMutationReturn { enqueueMutation: (p: { type: string; payload: unknown }) => Promise<void> }

// ─── Image helpers ────────────────────────────────────────────────────────────

async function compressImage(file: File, maxPx = 700, quality = 0.68): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("File read error"));
    reader.onload  = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image load error"));
      img.onload  = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = (e.target!.result) as string;
    };
    reader.readAsDataURL(file);
  });
}

function selectBestImageFormat(srcSet: SrcSet = {}): string {
  return srcSet.avif ?? srcSet.webp ?? srcSet.jpeg ?? srcSet.default ?? "";
}

// ─── Skeleton components ──────────────────────────────────────────────────────

const SkeletonBlock = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <div className={`animate-pulse bg-slate-700/40 rounded-xl ${className ?? ""}`} style={style} />
);

const AvatarSkeleton = () => (
  <div className="relative shrink-0">
    <SkeletonBlock className="w-24 h-24 rounded-full" />
  </div>
);

const NameSkeleton = () => (
  <div className="mt-3 space-y-2">
    <SkeletonBlock className="h-4 w-32" />
    <SkeletonBlock className="h-3 w-20" />
    <SkeletonBlock className="h-3 w-40" />
  </div>
);

const GridSkeleton = () => (
  <div className="grid grid-cols-3 gap-0.5 mt-2">
    {Array.from({ length: 9 }).map((_, i) => <SkeletonBlock key={i} className="aspect-square" />)}
  </div>
);

// ─── LazyImage ────────────────────────────────────────────────────────────────

interface LazyImageProps {
  src?: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  onVisible?: () => void;
}

function LazyImage({
  src,
  alt,
  className,
  style,
  placeholder = "data:image/gif;base64,R0lGODdhAQABAIABAP///wAAACwAAAAAAQABAAACAkQBADs=",
  onVisible,
}: LazyImageProps) {
  const [loaded,  setLoaded]  = useState(false);
  const [visible, setVisible] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setVisible(true);
          onVisible?.();
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onVisible]);

  const blurStyle: React.CSSProperties = loaded ? {} : { filter: "blur(12px)", transform: "scale(1.02)" };

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`} style={style}>
      {!loaded && <div className="absolute inset-0 shimmer" />}
      <img
        ref={imgRef}
        src={visible ? src : placeholder}
        alt={alt}
        className="w-full h-full object-cover"
        style={blurStyle}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

// ─── FeedPostCard ─────────────────────────────────────────────────────────────

interface FeedPostCardProps { post: FeedPost; onOpen: (post: FeedPost) => void }

const FeedPostCard = memo(function FeedPostCard({ post, onOpen }: FeedPostCardProps) {
  const srcSet    = post.mediaSrcSet ?? {};
  const isVideo   = post.type === "video";
  const thumbnail = srcSet.thumbnail ?? srcSet.small ?? post.thumbnailUrl;
  const fullSrc   = selectBestImageFormat(srcSet) || post.cdnUrl;
  const hasMedia  = !!(thumbnail ?? fullSrc);

  const handleVisible = () => {
    if (srcSet.nextPrefetch) {
      const img = new Image();
      img.src = srcSet.nextPrefetch;
    }
  };

  const responsiveSrcSet = [
    srcSet.small   && `${srcSet.small} 320w`,
    srcSet.medium  && `${srcSet.medium} 640w`,
    srcSet.large   && `${srcSet.large} 960w`,
    srcSet.xlarge  && `${srcSet.xlarge} 1280w`,
  ].filter(Boolean).join(", ");

  const sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1440px) 25vw, 20vw";

  return (
    <button
      type="button"
      onClick={() => onOpen(post)}
      className="aspect-square overflow-hidden relative active:opacity-80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
      style={{ background: CARD }}
      aria-label={post.caption ?? "Post"}
    >
      {hasMedia && post.type !== "text" ? (
        isVideo ? (
          <>
            <LazyImage src={thumbnail ?? fullSrc} alt="" onVisible={handleVisible} />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="text-white text-2xl" style={{ textShadow: "0 1px 4px #0008" }}>▶</span>
            </div>
          </>
        ) : (
          <picture>
            {srcSet.avif && <source srcSet={responsiveSrcSet || srcSet.avif} type="image/avif" />}
            {srcSet.webp && <source srcSet={responsiveSrcSet || srcSet.webp} type="image/webp" />}
            <img
              src={fullSrc}
              alt=""
              loading="lazy"
              decoding="async"
              srcSet={responsiveSrcSet || undefined}
              sizes={responsiveSrcSet ? sizes : undefined}
              className="w-full h-full object-cover"
            />
          </picture>
        )
      ) : (
        <div className="w-full h-full flex items-center justify-center p-2">
          <p className="text-[9px] text-slate-400 text-center leading-tight line-clamp-4">{post.caption}</p>
        </div>
      )}
    </button>
  );
});

// ─── ProfileScreenInner ───────────────────────────────────────────────────────

function ProfileScreenInner() {
  const navigate = useNavigate();
  const { user, login: updateSession, logout } = useAuth() as {
    user: unknown;
    login: (u: Record<string, unknown>) => void;
    logout?: () => void;
  };
  const u = user as Record<string, unknown> | null;

  const fileRef = useRef<HTMLInputElement | null>(null);
  const { t }   = useTranslation();
  const queryClient = useQueryClient();
  const { enqueueMutation } = useOfflineQueue() as unknown as EnqueueMutationReturn;

  const [showEdit, setShowEdit] = useState(false);
  const [showPost, setShowPost] = useState(false);
  const [viewer,   setViewer]   = useState<FeedPost | null>(null);

  const role      = (u?.['role'] as string | undefined) ?? "worker";
  const roleMeta  = getRoleMeta(role);
  const roleColor = roleMeta.color;

  const profileMeta = (u?.['profileMetadata'] as Record<string, unknown> | undefined) ?? {};
  const avatarCdn   = (profileMeta['profilePhotoCdn'] as string | undefined) ?? (profileMeta['profilePhoto'] as string | undefined) ?? null;
  const avatarFallback = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent((u?.['name'] as string | undefined) ?? "user")}`;

  const locationLabel = (() => {
    const loc     = (u?.['location'] as Record<string, string> | undefined) ?? {};
    const city    = loc['city']    ?? (u?.['city']    as string | undefined) ?? "";
    const country = loc['country'] ?? (u?.['country'] as string | undefined) ?? "";
    return [city, country].filter(Boolean).join(", ");
  })();

  const bio        = (profileMeta['bio']        as string | undefined) ?? "";
  const name       = (u?.['name']               as string | undefined) ?? "";
  const profession = (u?.['professionLabel']    as string | undefined) ?? (u?.['profession'] as string | undefined) ?? "";
  const userId     = (u?.['_id'] as string | undefined) ?? (u?.['id'] as string | undefined);

  const handleLogout = useCallback(() => {
    if (typeof logout === "function") logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  const handlePhotoChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const dataUrl = await compressImage(file, 400, 0.8);
      const updated: Record<string, unknown> = {
        ...u,
        profileMetadata: { ...profileMeta, profilePhoto: dataUrl },
      };
      try { await API.patch("/users/profile", { profilePhoto: dataUrl }); } catch { /* ignore */ }
      updateSession(updated);
    },
    [u, profileMeta, updateSession]
  );

  const handleSaveProfile = useCallback(
    async ({ name: n, bio: b }: { name: string; bio: string }) => {
      const updated: Record<string, unknown> = {
        ...u,
        name: n,
        profileMetadata: { ...profileMeta, bio: b },
      };
      try { await API.patch("/users/profile", { name: n, bio: b }); } catch { /* ignore */ }
      updateSession(updated);
    },
    [u, profileMeta, updateSession]
  );

  // FEED: Infinite Query
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteQuery<FeedPage, Error>({
    queryKey: ["profileFeed", userId] as QueryKey,
    queryFn: async ({ pageParam }) => {
      const cursor = (pageParam as string | null) ?? null;
      const res = await API.get(`/feed/profile/${userId}`, { params: { cursor, limit: 40 } });
      const { items = [], nextCursor = null } = (res.data?.data as { items?: FeedPost[]; nextCursor?: string | null } | undefined) ?? {};
      return { posts: items, nextCursor };
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!userId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 3,
    networkMode: "online",
  });

  const allPosts = data?.pages?.flatMap((p) => p.posts) ?? [];

  const virtualizer = useWindowVirtualizer({
    count: allPosts.length,
    estimateSize: () => 220,
    overscan: 10,
  });

  const virtualItems = virtualizer.getVirtualItems();

  useEffect(() => {
    if (!hasNextPage || !data) return;
    const total     = allPosts.length;
    const lastIndex = virtualItems[virtualItems.length - 1]?.index ?? 0;
    if (total > 0 && lastIndex / total > 0.7 && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [virtualItems, allPosts.length, hasNextPage, isFetchingNextPage, fetchNextPage, data]);

  const stats = {
    posts:     allPosts.length,
    followers: (u?.['stats'] as Record<string, number> | undefined)?.['followers'] ?? 0,
    following: (u?.['stats'] as Record<string, number> | undefined)?.['following'] ?? 0,
  };

  type PostMutCtx = { previous: unknown };

  const createPostMutation = useMutation<unknown, Error, PostPayload, PostMutCtx>({
    mutationFn: async (payload) => {
      if (!navigator.onLine) {
        await enqueueMutation({ type: "createPost", payload });
        return { offline: true, post: { ...payload, id: `temp-${Date.now()}` } };
      }
      const res = await API.post("/posts", payload);
      return (res.data as { post?: unknown })?.post;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["profileFeed", userId] as QueryKey });
      const previous = queryClient.getQueryData(["profileFeed", userId] as QueryKey);
      const optimisticPost: FeedPost = { ...variables, id: `optimistic-${Date.now()}`, isOptimistic: true };
      queryClient.setQueryData(["profileFeed", userId] as QueryKey, (old: unknown) => {
        const data = old as { pages?: FeedPage[]; pageParams?: unknown[] } | undefined;
        if (!data) return old;
        return {
          ...data,
          pages: [
            { ...data.pages![0], posts: [optimisticPost, ...(data.pages![0]?.posts ?? [])], nextCursor: data.pages![0]?.nextCursor ?? null },
            ...(data.pages?.slice(1) ?? []),
          ],
          pageParams: data.pageParams,
        };
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(["profileFeed", userId] as QueryKey, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["profileFeed", userId] as QueryKey });
    },
  });

  const handlePostCreated = useCallback(
    (postPayload: PostPayload) => {
      createPostMutation.mutate({ type: postPayload.type ?? "text", caption: postPayload.caption ?? "", audience: "public", meta: postPayload.meta ?? {} });
    },
    [createPostMutation]
  );

  if (!u) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: BG }}>
        <p className="text-slate-500">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen pb-32 text-white" style={{ background: BG }}>
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b" style={{ background: BG, borderColor: BORDER }} aria-label={t("profile.header")}>
        <button type="button" onClick={() => navigate(-1)} className="text-xl text-slate-400 active:opacity-60 w-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500" aria-label={t("common.back")}>←</button>
        <div className="flex flex-col items-center">
          <p className="font-black text-white text-sm">{name || t("profile.title")}</p>
          <span className="text-[10px] font-bold mt-0.5" style={{ color: roleColor }}>{t("profile.verifiedBadge")}</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="px-2 h-7 rounded-full flex items-center justify-center bg-white/5 text-[10px] font-black gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500" aria-label={t("profile.notifications")}>🔔 <span>12</span></button>
          <button type="button" className="px-2 h-7 rounded-full flex items-center justify-center bg-white/5 text-[10px] font-black gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500" aria-label={t("profile.settings")}>⚙️ <span>{t("profile.settingsShort")}</span></button>
          <button type="button" className="px-2 h-7 rounded-full flex items-center justify-center bg-white/5 text-[10px] font-black gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500" aria-label={t("profile.wallet")}>💳 <span>1</span></button>
        </div>
      </header>

      {/* Profile overview */}
      <section className="px-4 pt-4 pb-3" aria-label={t("profile.overview")}>
        <div className="w-full h-24 rounded-2xl mb-4 relative overflow-hidden" style={{ background: "radial-gradient(circle at 20% 0%, #1e293b, #020617 70%)", border: `1px solid ${BORDER}` }}>
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_0_0,#FACC15_0,#0000_40%)]" />
        </div>

        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2" style={{ borderColor: roleColor }}>
              {status === "pending" ? <AvatarSkeleton /> : <LazyImage src={avatarCdn ?? avatarFallback} alt={name} className="w-full h-full object-cover" />}
            </div>
            <button type="button" onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500" style={{ background: roleColor, color: "#0a0f1a", border: `2px solid ${BG}`, fontSize: 14, fontWeight: 900 }} aria-label={t("profile.changePhoto")} tabIndex={0}>+</button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { void handlePhotoChange(e); }} />
          </div>

          <div className="flex flex-1 justify-around">
            {[
              { value: stats.posts,     label: t("profile.stats.posts")     },
              { value: stats.followers, label: t("profile.stats.followers") },
              { value: stats.following, label: t("profile.stats.following") },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center">
                <span className="text-[18px] font-black text-white leading-tight">{value}</span>
                <span className="text-[9px] font-bold text-slate-500 text-center">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3">
          {status === "pending" ? <NameSkeleton /> : (
            <>
              <p className="font-black text-white text-[15px] leading-tight">{name}</p>
              <p className="text-[12px] font-bold mt-0.5" style={{ color: roleColor }}>{profession || roleMeta.label}</p>
              {locationLabel && <p className="text-[11px] text-slate-500 mt-0.5">📍 {locationLabel}</p>}
              {bio ? (
                <p className="text-[12px] text-slate-300 mt-2 leading-relaxed">{bio}</p>
              ) : (
                <button type="button" onClick={() => setShowEdit(true)} className="mt-2 text-[11px] text-slate-600 italic active:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
                  {t("profile.addBio")}
                </button>
              )}
            </>
          )}
        </div>
      </section>

      {/* Actions */}
      <section className="px-4 pb-4 flex flex-wrap gap-2" aria-label={t("profile.actions")}>
        <button type="button" onClick={() => setShowEdit(true)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-[12px] font-black active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500" style={{ background: CARD, borderColor: BORDER, color: "#cbd5e1" }} aria-label={t("profile.edit")}>
          ✏️ {t("profile.edit")}
        </button>
        <button type="button" onClick={() => setShowPost(true)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-black active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500" style={{ background: roleColor, color: "#0a0f1a" }} aria-label={t("post.newPost")}>
          ➕ {t("post.newPost")}
        </button>
      </section>

      <div className="border-b mb-1" style={{ borderColor: BORDER }} />

      {/* Feed: virtualized grid + infinite scroll */}
      <section
        aria-label={t("profile.postsSection")}
        className="px-0.5 py-0.5"
        style={{ position: "relative", height: "calc(100vh - 220px)", overflowY: "auto" }}
      >
        {status === "pending" ? <GridSkeleton /> : allPosts.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <span className="text-4xl mb-3">📷</span>
            <p className="text-sm font-black text-slate-500">{t("profile.noPosts")}</p>
            <p className="text-[11px] text-slate-600 mt-1 text-center px-8">{t("profile.noPostsHint")}</p>
          </div>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}>
            {virtualItems.map((item) => {
              const post = allPosts[item.index];
              if (!post) return null;
              return (
                <div
                  key={(post.id ?? post._id) || item.key}
                  style={{ position: "absolute", top: item.start, left: 0, right: 0, padding: "2px" }}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0.5">
                    <FeedPostCard post={post} onOpen={setViewer} />
                  </div>
                </div>
              );
            })}
            {isFetchingNextPage && <p className="text-[11px] text-slate-500 text-center mt-2">{t("common.loadingMore")}</p>}
          </div>
        )}
      </section>

      {/* Logout */}
      <div className="flex justify-center py-8">
        <button type="button" onClick={handleLogout} className="text-[12px] font-bold active:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500" style={{ color: "#ef4444" }} aria-label={t("auth.logout")}>
          {t("auth.logout")}
        </button>
      </div>

      {/* Modals */}
      <Suspense fallback={null}>
        {showEdit && <EditModal   user={u} onClose={() => setShowEdit(false)} onSave={(p: { name: string; bio: string }) => { void handleSaveProfile(p); }} />}
        {showPost && <PostModal   user={u} onClose={() => setShowPost(false)} onCreated={handlePostCreated} />}
        {viewer   && <PostViewer post={viewer} onClose={() => setViewer(null)} />}
      </Suspense>
    </div>
  );
}

// ─── Error fallback ───────────────────────────────────────────────────────────

function ProfileScreenErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center" style={{ background: BG }} role="alert">
      <div>
        <p className="text-sm font-black text-red-400 mb-2">Yon erè rive nan pwofil la.</p>
        <p className="text-[11px] text-slate-500 mb-4">{error?.message ?? "Unknown error"}</p>
        <button type="button" onClick={resetErrorBoundary} className="px-4 py-2 rounded-lg text-[12px] font-black" style={{ background: GOLD, color: "#0a0f1a" }}>
          Rechaje pwofil la
        </button>
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

function ProfileScreen() {
  return (
    <ErrorBoundary FallbackComponent={ProfileScreenErrorFallback} onReset={() => {}}>
      <ProfileScreenInner />
    </ErrorBoundary>
  );
}

export default memo(ProfileScreen);