"use client";

import React, { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  MotionValue,
  PanInfo,
} from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { useSwipe, SWIPE_PAGES } from './SwipeNavigator';

// Direct imports of the deck pages so neighbouring panels can render live
// page content while the user is mid-swipe.
import HomePage from '../page';
import MatchesPage from '../matches/page';
import PropertiesPage from '../properties/page';
import TenantsPage from '../find-room/page';

const PAGE_COMPONENTS = [HomePage, MatchesPage, PropertiesPage, TenantsPage];

// Fraction of the viewport the track must be dragged past before a release
// commits to the neighbouring page.
const COMMIT_THRESHOLD = 0.25;
// Velocity (px/s) past which a fling commits even below the distance threshold.
const FLING_VELOCITY = 500;
// Shared spring profile for every track animation (swipe commit, snap back,
// tab-triggered slide and route-change slides).
const SPRING = { type: 'spring' as const, stiffness: 300, damping: 35 };

interface SwipeWrapperProps {
  children: ReactNode;
}

export function SwipeWrapper({ children }: SwipeWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { pos, registerAnimator } = useSwipe();
  const currentIndex = SWIPE_PAGES.indexOf(pathname);
  const isDeck = currentIndex >= 0;

  // Track transform — always "offset from the current page", so 0 = rest.
  const x = useMotionValue(0);
  const viewportOpacity = useMotionValue(1);
  const dragControls = useDragControls();

  // Live measurement (px). State drives dragConstraints, the ref feeds the
  // gesture math without re-rendering mid-drag.
  const viewportRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef(0);
  const [viewportWidth, setViewportWidth] = useState(0);

  // Cached panel elements per deck index, mounted from gesture/navigation
  // events. Once a slot is populated it keeps rendering the SAME element, so
  // visited pages preserve their state (filters, scroll, fetched data)
  // across swipes — no remount flash. The active slot additionally renders
  // the routed children until a gesture caches it, which keeps SSR and
  // hydration fully intact.
  const [panels, setPanels] = useState<Record<number, ReactNode>>({});

  const currentIndexRef = useRef(currentIndex);
  const childrenRef = useRef(children);
  const prevIndexRef = useRef(currentIndex);

  // Commit bookkeeping: a swipe release animates the target panel into view
  // and only then syncs the router. The token lets a newer gesture or route
  // change cancel a pending push.
  const commitInFlightRef = useRef(false);
  const commitTokenRef = useRef(0);
  const pendingTargetRef = useRef(-1);

  // Keep the stable callbacks below reading the freshest route index and
  // routed children.
  useLayoutEffect(() => {
    currentIndexRef.current = currentIndex;
    childrenRef.current = children;
  });

  // ------------------------------------------------------------------
  // Live swipe progress → navigation context
  // ------------------------------------------------------------------
  // pos maps the drag transform to a float deck position (equal to
  // currentIndex at rest) which the bottom navigation uses to progressively
  // highlight tabs while the finger is still moving.
  useMotionValueEvent(x, 'change', (latest) => {
    const w = widthRef.current || 1;
    pos.set(currentIndex - latest / w);
  });

  const mountSlots = useCallback(
    (indices: number[], seedIndex?: number, seedElement?: ReactNode) => {
      setPanels((prev) => {
        let changed = false;
        const next = { ...prev };
        indices.forEach((i) => {
          if (i >= 0 && i < SWIPE_PAGES.length && next[i] === undefined) {
            const PageComponent = PAGE_COMPONENTS[i];
            next[i] = <PageComponent />;
            changed = true;
          }
        });
        // Cache the live routed panel too, so its state survives while the
        // user swipes away and later returns.
        if (
          seedIndex !== undefined &&
          seedElement !== undefined &&
          seedIndex >= 0 &&
          seedIndex < SWIPE_PAGES.length &&
          next[seedIndex] === undefined
        ) {
          next[seedIndex] = seedElement;
          changed = true;
        }
        return changed ? next : prev;
      });
    },
    []
  );

  // ------------------------------------------------------------------
  // Commit / cancel a swipe
  // ------------------------------------------------------------------
  const commitToIndex = useCallback(
    (targetIndex: number, velocity: number, fromIndex: number, fromElement: ReactNode) => {
      commitInFlightRef.current = true;
      pendingTargetRef.current = targetIndex;
      const token = ++commitTokenRef.current;
      mountSlots([targetIndex], fromIndex, fromElement);

      const w = widthRef.current;
      if (!w) {
        router.push(SWIPE_PAGES[targetIndex], { scroll: false });
        return;
      }

      // Slide the target panel the rest of the way in, carrying the release
      // velocity so the motion feels like a continuation of the finger.
      animate(x, (fromIndex - targetIndex) * w, { ...SPRING, velocity })
        .then(() => {
          if (commitTokenRef.current !== token) return;
          router.push(SWIPE_PAGES[targetIndex], { scroll: false });
        })
        .catch(() => {});
    },
    [mountSlots, router, x]
  );

  // ------------------------------------------------------------------
  // Gestures
  // ------------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isDeck) return;

    const target = e.target as Element | null;
    let willDrag = false;
    if (e.pointerType === 'touch') {
      willDrag = true;
    } else if (e.pointerType === 'mouse' && target) {
      // Mouse drags start only from passive surfaces so text selection,
      // links, inputs and the data tables keep working normally.
      willDrag = !target.closest(
        'a, button, input, textarea, select, table, [data-no-swipe]'
      );
    }

    if (commitInFlightRef.current) {
      // A new gesture takes ownership of the track: cancel the pending
      // route sync so the user can change their mind mid-flight.
      commitTokenRef.current++;
      commitInFlightRef.current = false;
      pendingTargetRef.current = -1;
      if (!willDrag) {
        animate(x, 0, { ...SPRING });
      }
    }

    if (willDrag) dragControls.start(e);
  };

  const handleDragStart = () => {
    // Mount + cache the neighbouring panels so the incoming page is live
    // content while the finger is still moving, and cache the outgoing
    // routed panel so its state survives the round trip. A live gesture
    // also takes ownership of the deck position: any navigation pill
    // sweep still in flight must stop so the finger drives the tabs again.
    pos.stop();
    mountSlots([currentIndex - 1, currentIndex + 1], currentIndex, children);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const w = widthRef.current;
    if (!w) return;

    // Normalised progress: +1 = next page fully in view, -1 = previous.
    const progress = -x.get() / w;
    const velocity = info.velocity.x;
    const hasNext = currentIndex < SWIPE_PAGES.length - 1;
    const hasPrev = currentIndex > 0;

    let target: number | null = null;
    if (
      hasNext &&
      (progress > COMMIT_THRESHOLD ||
        (progress > 0.04 && velocity < -FLING_VELOCITY))
    ) {
      target = currentIndex + 1;
    } else if (
      hasPrev &&
      (progress < -COMMIT_THRESHOLD ||
        (progress < -0.04 && velocity > FLING_VELOCITY))
    ) {
      target = currentIndex - 1;
    }

    if (target !== null) {
      commitToIndex(target, velocity, currentIndex, children);
    } else {
      // Released below the threshold: snap cleanly back to the resting
      // page — the navigation tabs reset as the progress returns to 0.
      commitInFlightRef.current = false;
      pendingTargetRef.current = -1;
      animate(x, 0, { ...SPRING, velocity });
    }
  };

  // ------------------------------------------------------------------
  // Tab-triggered navigation (Navbar) — same animation as a swipe
  // ------------------------------------------------------------------
  const animateToIndex = useCallback(
    (targetIndex: number) => {
      const cur = currentIndexRef.current;
      if (targetIndex === cur) return;

      if (cur < 0 || !widthRef.current) {
        router.push(SWIPE_PAGES[targetIndex], { scroll: false });
        return;
      }

      if (Math.abs(targetIndex - cur) === 1) {
        // Adjacent tab: mirror a finger swipe — slide the deck, then sync
        // the route so the URL lands exactly when the panel does.
        commitToIndex(targetIndex, 0, cur, childrenRef.current);
      } else {
        // Multi-page jump: cache the outgoing panel, navigate immediately;
        // the route-change effect plays a settle-in fade.
        mountSlots([], cur, childrenRef.current);
        router.push(SWIPE_PAGES[targetIndex], { scroll: false });
      }
    },
    [commitToIndex, mountSlots, router]
  );

  useEffect(() => {
    registerAnimator(animateToIndex);
  }, [registerAnimator, animateToIndex]);

  // Keep client-side transitions instant after a swipe commit.
  useEffect(() => {
    SWIPE_PAGES.forEach((page) => router.prefetch(page));
  }, [router]);

  // ------------------------------------------------------------------
  // Route changes
  // ------------------------------------------------------------------
  useLayoutEffect(() => {
    const prevIndex = prevIndexRef.current;
    const wasCommit =
      commitInFlightRef.current && currentIndex === pendingTargetRef.current;

    prevIndexRef.current = currentIndex;
    // Any route change supersedes whatever commit was pending, along with
    // any navigation pill sweep still animating.
    commitTokenRef.current++;
    commitInFlightRef.current = false;
    pendingTargetRef.current = -1;
    pos.stop();

    if (!isDeck) {
      // Route outside the deck (e.g. /list-property): plain document flow.
      x.stop();
      x.set(0);
      pos.set(-1);
      return;
    }

    if (prevIndex === currentIndex) {
      // Initial mount or same-route update: rest position.
      x.stop();
      x.set(0);
      pos.set(currentIndex);
      return;
    }

    if (wasCommit) {
      // Swipe/tab-slide commit: the track already rests on the target panel,
      // so rebase the deck around the new route with zero visual change.
      x.stop();
      x.set(0);
      pos.set(currentIndex);
      return;
    }

    // External navigation (in-page links, browser back/forward).
    const w = widthRef.current;
    const delta = currentIndex - prevIndex;

    if (prevIndex >= 0 && w > 0 && Math.abs(delta) === 1) {
      // Adjacent route change: start with the outgoing page filling the
      // viewport, then slide the incoming page in — same motion as a swipe.
      x.stop();
      x.set(delta * w);
      animate(x, 0, { type: 'spring', stiffness: 260, damping: 30 });
    } else {
      // Multi-page jump: land instantly and settle in with a soft fade,
      // while the navigation pill sweeps across the skipped tabs so the
      // highlight change stays progressive even for long jumps.
      x.stop();
      x.set(0);
      viewportOpacity.set(0.35);
      animate(viewportOpacity, 1, { duration: 0.28, ease: 'easeOut' });
      animate(pos, currentIndex, { duration: 0.3, ease: 'easeOut' });
      return;
    }

    pos.set(currentIndex - x.get() / (w || 1));
  }, [currentIndex, isDeck, pos, viewportOpacity, x]);

  // ------------------------------------------------------------------
  // Viewport measurement
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!isDeck) return;
    const el = viewportRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.clientWidth;
      if (w > 0 && w !== widthRef.current) {
        widthRef.current = w;
        setViewportWidth(w);
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isDeck]);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  if (!isDeck) {
    return <div style={plainViewportStyle}>{children}</div>;
  }

  const hasNext = currentIndex < SWIPE_PAGES.length - 1;
  const hasPrev = currentIndex > 0;
  const panelWidth = Math.max(viewportWidth, 1);

  return (
    <div ref={viewportRef} style={viewportStyle}>
      <motion.div
        style={{ x, z: 0, opacity: viewportOpacity, ...trackStyle }}
        drag="x"
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{
          left: hasNext ? -viewportWidth : 0,
          right: hasPrev ? viewportWidth : 0,
        }}
        dragElastic={0.15}
        dragMomentum={false}
        onPointerDown={handlePointerDown}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {SWIPE_PAGES.map((_, i) => {
          const role = i - currentIndex;
          const panel =
            panels[i] !== undefined ? panels[i] : i === currentIndex ? children : null;
          return (
            <DeckPanel key={i} role={role} x={x} width={panelWidth}>
              {panel}
            </DeckPanel>
          );
        })}
      </motion.div>
    </div>
  );
}

/* ==================================================================
   Deck panel — one page slot of the horizontal slider
================================================================== */
interface DeckPanelProps {
  /** Distance from the active page (-1 previous, 0 active, +1 next). */
  role: number;
  x: MotionValue<number>;
  width: number;
  children?: ReactNode;
}

function DeckPanel({ role, x, width, children }: DeckPanelProps) {
  // Progressive depth cue: the resting panel keeps full opacity and scale
  // while it (and its neighbours) settle slightly dimmed and shrunk until
  // the swipe hands over — all derived live from the drag transform.
  const opacity = useTransform(
    x,
    role === 0 ? [-width, 0, width] : role > 0 ? [-width, 0] : [0, width],
    role === 0 ? [0.7, 1, 0.7] : role > 0 ? [1, 0.7] : [0.7, 1]
  );
  const scale = useTransform(
    x,
    role === 0 ? [-width, 0, width] : role > 0 ? [-width, 0] : [0, width],
    role === 0 ? [1, 0.95, 1] : role > 0 ? [1, 0.95] : [0.95, 1]
  );

  return (
    <motion.div
      style={{
        position: 'absolute',
        top: 0,
        left: `${role * 100}%`,
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        overscrollBehaviorY: 'contain',
        WebkitOverflowScrolling: 'touch',
        // Lets vertical page scroll and horizontal table scroll stay native,
        // while free horizontal movement drives the deck drag.
        touchAction: 'pan-x pan-y',
        opacity,
        scale,
      }}
    >
      {children}
    </motion.div>
  );
}

/* ==================================================================
   Static styles
================================================================== */
const viewportStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
};

const trackStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  touchAction: 'pan-x pan-y',
  willChange: 'transform',
};

const plainViewportStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  overflowY: 'auto',
  overflowX: 'hidden',
  // Keeps plain-route content clear of the floating bottom navigation pill.
  paddingBottom: 'var(--bottom-nav-clearance)',
  boxSizing: 'border-box',
};
