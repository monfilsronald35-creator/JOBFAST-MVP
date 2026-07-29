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
import {
  useInfiniteQuery,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { useWindowVirtualizer } from "@tanstack/react-virtual"; // Virtualization reyèl

// Hook offline queue (IndexedDB / localForage) – implementasyon reyèl ap fèt an deyò
import { useOfflineQueue } from "../hooks/useOfflineQueue"; // stub pou JOBFAST

// Modals/Viewers code-splitted nan fichye separe
const EditModal = lazy(() => import("./EditModal"));   //
const PostModal = lazy(() => import("./PostModal"));
const PostViewer = lazy(() => import("./PostViewer"));

const BG     = "#050B18";
const CARD   = "#0d1526";
const GOLD   = "#FACC15";
const BORDER = "#1F2937";

/* ================== ROLE METADATA ================== */

const ROLE_META = {
  worker:           { label: "Travayè",       color: "#FACC15" },
  service_provider: { label: "Prestatè",      color: "#34d399" },
  freelancer:       { label: "Freelancer",    color: "#a78bfa" },
  restaurant:       { label: "Restoran",      color: "#f97316" },
  hotel:            { label: "Otèl",          color: "#06b6d4" },
  company:          { label: "Konpayi",       color: "#60a5fa" },
  employer:         { label: "Anplwayè",      color: "#60a5fa" },
  hospital:         { label: "Lopital",       color: "#ef4444" },
  clinic:           { label: "Klinik",        color: "#14b8a6" },
};

const getRoleMeta = (role) =>
  ROLE_META[role] || { label: role || "Pwofesyonèl", color: GOLD };

/* ================== IMAGE HELPERS ================== */

async function compressImage(file, maxPx = 700, quality = 0.68) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("File read error"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image load error"));
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Pi bon URL imaj (backend/Cloudflare Images/Supabase Storage ta bay AVIF/WebP/thumbs)
function selectBestImageFormat(srcSet = {}) {
  if (srcSet.avif) return srcSet.avif;
  if (srcSet.webp) return srcSet.webp;
  return srcSet.jpeg || srcSet.default || "";
}

/* ================== SKELETON COMPONENTS ================== */

const SkeletonBlock = ({ className, style }) => (
  <div
    className={`animate-pulse bg-slate-700/40 rounded-xl ${className || ""}`}
    style={style}
  />
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
    {Array.from({ length: 9 }).map((_, i) => (
      <SkeletonBlock key={i} className="aspect-square" />
    ))}
  </div>
);

/* ================== LAZY IMAGE (CACHE-FRIENDLY) ================== */

function LazyImage({
  src,
  alt,
  className,
  style,
  placeholder = "data:image/gif;base64,R0lGODdhAQABAIABAP///wAAACwAAAAAAQABAAACAkQBADs=",
  onVisible,
}) {
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setVisible(true);
          if (typeof onVisible === "function") {
            onVisible();
          }
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onVisible]);

  const blurStyle = loaded
    ? {}
    : {
        filter: "blur(12px)",
        transform: "scale(1.02)",
      };

  return (
    <div
      className={`relative overflow-hidden ${className || ""}`}
      style={style}
    >
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

/* ================== FEED CARD (RESPONSIVE SRCSET + PREFETCH) ================== */

const FeedPostCard = memo(function FeedPostCard({ post, onOpen }) {
  const srcSet = post.mediaSrcSet || {};
  const isVideo = post.type === "video";
  const thumbnail = srcSet.thumbnail || srcSet.small || post.thumbnailUrl;
  const fullSrc = selectBestImageFormat(srcSet) || post.cdnUrl;
  const hasMedia = !!(thumbnail || fullSrc);

  const handleVisible = () => {
    if (srcSet.nextPrefetch) {
      const img = new Image();
      img.src = srcSet.nextPrefetch;
    }
  };

  const responsiveSrcSet = [
    srcSet.small && `${srcSet.small} 320w`,
    srcSet.medium && `${srcSet.medium} 640w`,
    srcSet.large && `${srcSet.large} 960w`,
    srcSet.xlarge && `${srcSet.xlarge} 1280w`,
  ]
    .filter(Boolean)
    .join(", ");

  const sizes =
    "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1440px) 25vw, 20vw";

  return (
    <button
      type="button"
      onClick={() => onOpen(post)}
      className="aspect-square overflow-hidden relative active:opacity-80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
      style={{ background: CARD }}
      aria-label={post.caption || "Post"}
    >
      {hasMedia && post.type !== "text" ? (
        isVideo ? (
          <>
            <LazyImage
              src={thumbnail || fullSrc}
              alt=""
              onVisible={handleVisible}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span
                className="text-white text-2xl"
                style={{ textShadow: "0 1px 4px #0008" }}
                >
                ▶
              </span>
            </div>
          </>
        ) : (
          <picture>
            {srcSet.avif && (
              <source srcSet={responsiveSrcSet || srcSet.avif} type="image/avif" />
            )}
            {srcSet.webp && (
              <source
                srcSet={responsiveSrcSet || srcSet.webp}
                type="image/webp"
              />
            )}
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
          <p className="text-[9px] text-slate-400 text-center leading-tight line-clamp-4">
            {post.caption}
          </p>
        </div>
      )}
    </button>
  );
});

/* ================== MAIN PROFILE SCREEN INNER ================== */

function ProfileScreenInner() {
  const navigate = useNavigate();
  const { user, login: updateSession, logout } = useAuth();
  const fileRef = useRef(null);
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { enqueueMutation } = useOfflineQueue(); // IndexedDB queue stub

  const [showEdit, setShowEdit] = useState(false);
  const [showPost, setShowPost] = useState(false);
  const [viewer, setViewer] = useState(null);

  const role = user?.role || "worker";
  const roleMeta = getRoleMeta(role);
  const roleColor = roleMeta.color;

  const avatarCdn =
    user?.profileMetadata?.profilePhotoCdn ||
    user?.profileMetadata?.profilePhoto;
  const avatarFallback = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
    user?.name || "user"
  )}`;

  const locationLabel = (() => {
    const city = user?.location?.city || user?.city || "";
    const country = user?.location?.country || user?.country || "";
    return [city, country].filter(Boolean).join(", ");
  })();

  const bio = user?.profileMetadata?.bio || "";
  const name = user?.name || "";
  const profession = user?.professionLabel || user?.profession || "";

  const handleLogout = useCallback(() => {
    if (typeof logout === "function") logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  const handlePhotoChange = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const dataUrl = await compressImage(file, 400, 0.8);
      const updated = {
        ...user,
        profileMetadata: {
          ...(user?.profileMetadata || {}),
          profilePhoto: dataUrl,
        },
      };
      try {
        await API.patch("/users/profile", { profilePhoto: dataUrl });
      } catch {}
      updateSession(updated);
    },
    [user, updateSession]
  );

  const handleSaveProfile = useCallback(
    async ({ name: n, bio: b }) => {
      const updated = {
        ...user,
        name: n,
        profileMetadata: { ...(user?.profileMetadata || {}), bio: b },
      };
      try {
        await API.patch("/users/profile", { name: n, bio: b });
      } catch {}
      updateSession(updated);
    },
    [user, updateSession]
  );

  const userId = user?._id || user?.id;

  // FEED: Infinite Query + Prefetch Next Page
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["profileFeed", userId],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam ?? null;
      const res = await API.get(`/feed/profile/${userId}`, {
        params: { cursor, limit: 40 },
      });
      const { items = [], nextCursor = null } = res.data?.data || {};
      return { posts: items, nextCursor };
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!userId,
    staleTime: 60_000,
    cacheTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 3,
    networkMode: "online",
  });

  const allPosts = data?.pages?.flatMap((p) => p.posts) ?? [];

  // Virtualization pou grid la – 2 / 3 / 4 / 5 kolòn depann de tailwind, men virtualizer ranje DOM la.
  const parentRef = useRef(null);
  const virtualizer = useWindowVirtualizer({
    count: allPosts.length,
    estimateSize: () => 220, // px, ka ajiste
    overscan: 10,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Prefetch next page lè user rive ~70% nan lis la
  useEffect(() => {
    if (!hasNextPage || !data) return;
    const total = allPosts.length;
    const lastIndex = virtualItems[virtualItems.length - 1]?.index ?? 0;
    if (total > 0 && lastIndex / total > 0.7 && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [virtualItems, allPosts.length, hasNextPage, isFetchingNextPage, fetchNextPage, data]);

  const stats = {
    posts: allPosts.length,
    followers: user?.stats?.followers ?? 0,
    following: user?.stats?.following ?? 0,
  };

  // Optimistic mutation pou nouvo post – pa tann server pou UI
  const createPostMutation = useMutation({
    mutationFn: async (payload) => {
      if (!navigator.onLine) {
        // Offline – ajoute nan queue IndexedDB pou voye pita
        await enqueueMutation({
          type: "createPost",
          payload,
        });
        return { offline: true, post: { ...payload, id: `temp-${Date.now()}` } };
      }
      const res = await API.post("/posts", payload);
      return res.data?.post;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["profileFeed", userId] });
      const previous = queryClient.getQueryData(["profileFeed", userId]);
      const optimisticPost = {
        ...variables,
        id: `optimistic-${Date.now()}`,
        _id: undefined,
        isOptimistic: true,
      };
      queryClient.setQueryData(["profileFeed", userId], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: [
            {
              ...old.pages[0],
              posts: [optimisticPost, ...(old.pages[0]?.posts || [])],
              nextCursor: old.pages[0]?.nextCursor ?? null,
            },
            ...old.pages.slice(1),
          ],
          pageParams: old.pageParams,
        };
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["profileFeed", userId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["profileFeed", userId] });
    },
  });
  
  const handlePostCreated = useCallback(
    (postPayload) => {
      createPostMutation.mutate({
        type: postPayload.type || "text",
        caption: postPayload.caption || "",
        audience: "public",
        // Add AI ranking metadata: distance, skills, activity, premium, language, location, CTR, watchTime, saveRate, reportRate
        meta: postPayload.meta || {},
      });
    },
    [createPostMutation]
  );

  if (!user) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: BG }}
      >
        <p className="text-slate-500">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div
      className="w-full min-h-screen pb-32 text-white"
      style={{ background: BG }}
    >
      {/* HEADER */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b"
        style={{ background: BG, borderColor: BORDER }}
        aria-label={t("profile.header")}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-xl text-slate-400 active:opacity-60 w-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          aria-label={t("common.back")}
        >
          ←
        </button>
        <div className="flex flex-col items-center">
          <p className="font-black text-white text-sm">
            {name || t("profile.title")}
          </p>
          <span
            className="text-[10px] font-bold mt-0.5"
            style={{ color: roleColor }}
          >
            {t("profile.verifiedBadge")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-2 h-7 rounded-full flex items-center justify-center bg-white/5 text-[10px] font-black gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
            aria-label={t("profile.notifications")}
          >
            🔔 <span>12</span>
          </button>
          <button
            type="button"
            className="px-2 h-7 rounded-full flex items-center justify-center bg-white/5 text-[10px] font-black gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
            aria-label={t("profile.settings")}
          >
            ⚙️ <span>{t("profile.settingsShort")}</span>
          </button>
          <button
            type="button"
            className="px-2 h-7 rounded-full flex items-center justify-center bg-white/5 text-[10px] font-black gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
            aria-label={t("profile.wallet")}
          >
            💳 <span>1</span>
          </button>
        </div>
      </header>

      {/* HEADER BODY */}
      <section className="px-4 pt-4 pb-3" aria-label={t("profile.overview")}>
        <div
          className="w-full h-24 rounded-2xl mb-4 relative overflow-hidden"
          style={{
            background:
              "radial-gradient(circle at 20% 0%, #1e293b, #020617 70%)",
            border: `1px solid ${BORDER}`,
          }}
        >
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_0_0,#FACC15_0,#0000_40%)]" />
        </div>

        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div
              className="w-24 h-24 rounded-full overflow-hidden border-2"
              style={{ borderColor: roleColor }}
            >
              {status === "loading" ? (
                <AvatarSkeleton />
              ) : (
                <LazyImage
                  src={avatarCdn || avatarFallback}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
              style={{
                background: roleColor,
                color: "#0a0f1a",
                border: `2px solid ${BG}`,
                fontSize: 14,
                fontWeight: 900,
              }}
              aria-label={t("profile.changePhoto")}
              tabIndex={0}
            >
              +
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          <div className="flex flex-1 justify-around">
            {[
              { value: stats.posts, label: t("profile.stats.posts") },
              { value: stats.followers, label: t("profile.stats.followers") },
              { value: stats.following, label: t("profile.stats.following") },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center">
                <span className="text-[18px] font-black text-white leading-tight">
                  {value}
                </span>
                <span className="text-[9px] font-bold text-slate-500 text-center">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3">
          {status === "loading" ? (
            <NameSkeleton />
          ) : (
            <>
              <p className="font-black text-white text-[15px] leading-tight">
                {name}
              </p>
              <p
                className="text-[12px] font-bold mt-0.5"
                style={{ color: roleColor }}
              >
                {profession || roleMeta.label}
              </p>
              {locationLabel && (
                <p className="text-[11px] text-slate-500 mt-0.5">
                  📍 {locationLabel}
                </p>
              )}
              {bio ? (
                <p className="text-[12px] text-slate-300 mt-2 leading-relaxed">
                  {bio}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowEdit(true)}
                  className="mt-2 text-[11px] text-slate-600 italic active:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                >
                  {t("profile.addBio")}
                </button>
              )}
            </>
          )}
        </div>
      </section>

      {/* ACTIONS */}
      <section
        className="px-4 pb-4 flex flex-wrap gap-2"
        aria-label={t("profile.actions")}
      >
        <button
          type="button"
          onClick={() => setShowEdit(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-[12px] font-black active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          style={{ background: CARD, borderColor: BORDER, color: "#cbd5e1" }}
          aria-label={t("profile.edit")}
        >
          ✏️ {t("profile.edit")}
        </button>
        <button
          type="button"
          onClick={() => setShowPost(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-black active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          style={{ background: roleColor, color: "#0a0f1a" }}
          aria-label={t("post.newPost")}
        >
          ➕ {t("post.newPost")}
        </button>
      </section>

      <div className="border-b mb-1" style={{ borderColor: BORDER }} />

      {/* FEED: Virtualized Grid + Infinite Scroll */}
      <section
        aria-label={t("profile.postsSection")}
        className="px-0.5 py-0.5"
        ref={parentRef}
        style={{
          position: "relative",
          height: "calc(100vh - 220px)",
          overflowY: "auto",
        }}
      >
        {status === "loading" ? (
          <GridSkeleton />
        ) : allPosts.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <span className="text-4xl mb-3">📷</span>
            <p className="text-sm font-black text-slate-500">
              {t("profile.noPosts")}
            </p>
            <p className="text-[11px] text-slate-600 mt-1 text-center px-8">
              {t("profile.noPostsHint")}
            </p>
          </div>
        ) : (
          <div
            style={{
              height: virtualizer.getTotalSize(),
              position: "relative",
              width: "100%",
            }}
          >
            {virtualItems.map((item) => {
              const post = allPosts[item.index];
              if (!post) return null;
              const top = item.start;
              return (
                <div
                  key={post.id || post._id || item.key}
                  style={{
                    position: "absolute",
                    top,
                    left: 0,
                    right: 0,
                    padding: "2px",
                  }}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0.5">
                    <FeedPostCard post={post} onOpen={setViewer} />
                  </div>
                </div>
              );
            })}
            {isFetchingNextPage && (
              <p className="text-[11px] text-slate-500 text-center mt-2">
                {t("common.loadingMore")}
              </p>
            )}
          </div>
        )}
      </section>

      {/* LOGOUT */}
      <div className="flex justify-center py-8">
        <button
          type="button"
          onClick={handleLogout}
          className="text-[12px] font-bold active:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          style={{ color: "#ef4444" }}
          aria-label={t("auth.logout")}
        >
          {t("auth.logout")}
        </button>
      </div>

      {/* MODALS (Code-splitted) */}
      <Suspense fallback={null}>
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
          <PostViewer post={viewer} onClose={() => setViewer(null)} />
        )}
      </Suspense>
    </div>
  );
}

/* ================== ERROR BOUNDARY WRAPPER ================== */

function ProfileScreenErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 text-center"
      style={{ background: BG }}
      role="alert"
    >
      <div>
        <p className="text-sm font-black text-red-400 mb-2">
          Yon erè rive nan pwofil la.
        </p>
        <p className="text-[11px] text-slate-500 mb-4">
          {error?.message || "Unknown error"}
        </p>
        <button
          type="button"
          onClick={resetErrorBoundary}
          className="px-4 py-2 rounded-lg text-[12px] font-black"
          style={{ background: GOLD, color: "#0a0f1a" }}
        >
          Rechaje pwofil la
        </button>
      </div>
    </div>
  );
}

function ProfileScreen() {
  return (
    <ErrorBoundary
      FallbackComponent={ProfileScreenErrorFallback}
      onReset={() => {
        // TanStack Query invalidate / reset si ou vle
      }}
    >
      <ProfileScreenInner />
    </ErrorBoundary>
  );
}

export default memo(ProfileScreen);
