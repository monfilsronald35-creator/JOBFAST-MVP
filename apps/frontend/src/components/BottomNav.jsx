import React, {
  useState,
  useRef,
  useCallback,
  useLayoutEffect,
  useEffect,
  memo,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Plus, Bell, User } from "lucide-react";

/* =====================================================
   NAVIGATION ITEMS
===================================================== */
const NAV_ITEMS = [
  { path: "/", label: "Akèy", icon: Home, end: true },
  { path: "/search", label: "Chèche", icon: Search, alternativePath: "/search-results" },
  { path: "/create-post", label: "Poste", icon: Plus, center: true },
  { path: "/notifications", label: "Notifikasyon", icon: Bell },
  { path: "/profile", label: "Pwofil", icon: User },
];

/* =====================================================
   SSR SAFE LAYOUT EFFECT
===================================================== */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* =====================================================
   COMPONENT
===================================================== */
function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const itemRefs = useRef(
    Array.from({ length: NAV_ITEMS.length }, () => null)
  );
  const indicatorRef = useRef(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  /* =====================================================
     REDUCED MOTION DETECTION
  ===================================================== */
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);

    const listener = (e) => setReducedMotion(e.matches);
    media.addEventListener?.("change", listener);

    return () => media.removeEventListener?.("change", listener);
  }, []);

  /* =====================================================
     HAPTIC FEEDBACK
  ===================================================== */
  const vibrate = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, []);

  /* =====================================================
     ACTIVE ROUTE DETECTION
  ===================================================== */
  useEffect(() => {
    const currentPath = location.pathname;

    const index = NAV_ITEMS.findIndex((item) => {
      if (item.end) return currentPath === item.path;

      return (
        currentPath === item.path ||
        currentPath.startsWith(`${item.path}/`) ||
        (item.alternativePath &&
          (currentPath === item.alternativePath ||
            currentPath.startsWith(`${item.alternativePath}/`)))
      );
    });

    setActiveIndex(index >= 0 ? index : 0);
  }, [location.pathname]);

  /* =====================================================
     INDICATOR POSITION LOGIC
  ===================================================== */
  const updateIndicator = useCallback(() => {
    const indicator = indicatorRef.current;
    const target = itemRefs.current[activeIndex];

    if (!indicator || !target) return;

    let width;
    let left;

    if (NAV_ITEMS[activeIndex]?.center) {
      width = 32;
      left = target.offsetLeft + target.offsetWidth / 2 - width / 2;
    } else {
      width = target.offsetWidth;
      left = target.offsetLeft;
    }

    indicator.style.width = `${width}px`;
    indicator.style.transform = `translate3d(${left}px,0,0)`;
    indicator.style.transition = reducedMotion
      ? "none"
      : "transform 300ms ease, width 300ms ease";
  }, [activeIndex, reducedMotion]);

  useIsomorphicLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  /* =====================================================
     RESIZE & FONTS LISTENERS
  ===================================================== */
  useEffect(() => {
    if (typeof window === "undefined") return;

    let frame;
    let isMounted = true; // Sekirite pou anpeche memwa koule sou asenkron la

    const handleResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (isMounted) updateIndicator();
      });
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (isMounted) updateIndicator();
      });
    } else {
      const timeoutId = setTimeout(() => {
        if (isMounted) updateIndicator();
      }, 50);
      
      // Netwaye ti timeout lan si eleman an demoute anvan 50ms la fini
      return () => {
        isMounted = false;
        cancelAnimationFrame(frame);
        clearTimeout(timeoutId);
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("orientationchange", handleResize);
      };
    }

    return () => {
      isMounted = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [updateIndicator]);

  /* =====================================================
     NAVIGATION ACTIONS
  ===================================================== */
  const handleNavigation = useCallback(
    (path, isActive) => {
      vibrate();
      if (isActive) return;
      navigate(path);
    },
    [navigate, vibrate]
  );

  const handleKeyDown = useCallback(
    (event, path, isActive) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleNavigation(path, isActive);
      }
    },
    [handleNavigation]
  );

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-[100] w-full overflow-hidden border-t border-white/10 bg-black/80 supports-[backdrop-filter]:bg-black/40 backdrop-blur-xl pb-[max(env(safe-area-inset-bottom),8px)]"
    >
      {/* LINE INDICATOR */}
      <div className="absolute top-0 left-0 h-[3px] w-full pointer-events-none">
        <div
          ref={indicatorRef}
          className="h-[3px] rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 will-change-transform"
        />
      </div>

      {/* NAV CONTENT */}
      <div className="relative flex h-16 min-h-16 items-center justify-around">
        {NAV_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const isActive = index === activeIndex;

          /* ========================================
             CENTER ACTION BUTTON
          ======================================== */
          if (item.center) {
            return (
              <div key={item.path} className="relative flex h-full w-full items-center justify-center">
                <button
                  ref={(el) => (itemRefs.current[index] = el)}
                  type="button"
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => handleNavigation(item.path, isActive)}
                  onKeyDown={(e) => handleKeyDown(e, item.path, isActive)}
                  className={`absolute -top-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all active:scale-95 hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/50 ${
                    isActive ? "scale-105 ring-4 ring-amber-500/30" : ""
                  }`}
                >
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </button>
              </div>
            );
          }

          /* ========================================
             NORMAL BUTTON
          ======================================== */
          return (
            <button
              key={item.path}
              ref={(el) => (itemRefs.current[index] = el)}
              type="button"
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              onClick={() => handleNavigation(item.path, isActive)}
              onKeyDown={(e) => handleKeyDown(e, item.path, isActive)}
              className={`flex h-full w-full flex-col items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 ${
                isActive
                  ? "scale-105 font-semibold text-amber-500"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon aria-hidden="true" className="mb-0.5 h-5 w-5" />
              <span className="select-none text-[11px] tracking-wide">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default memo(BottomNav);
