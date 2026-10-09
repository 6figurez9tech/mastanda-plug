"use client";

import React, { ReactNode, RefObject, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  MotionValue,
} from 'framer-motion';
import { useSwipe } from './SwipeNavigator';

// 🏠 Recreated High-Quality Home Logo Icon Component (Nested Arch Design)
interface HomeLogoIconProps {
  size?: number;
  isDarkMode?: boolean;
}

function HomeLogoIcon({ size = 24, isDarkMode = true }: HomeLogoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      {/* 1. Outer House Silhouette Base - Fixed Logo Brand Color */}
      <path
        d="M3 10.5 L12 3 L21 10.5 V21 H17 V14 A5 5 0 0 0 7 14 V21 H3 Z"
        fill="#217d9d"
      />

      {/* 2. Middle Concentric Arch Cutout - Matches panel dark background color */}
      <path
        d="M6 12.5 L12 7.5 L18 12.5 V21 H14 V14 A2 2 0 0 0 10 14 V21 H6 Z"
        fill={isDarkMode ? '#0d0d0d' : '#f8f9fa'}
      />

      {/* 3. Inner Core / Doorway Arch - Fixed Logo Brand Color */}
      <path
        d="M9 14.5 L12 12 L15 14.5 V21 H9 Z"
        fill="#217d9d"
      />
    </svg>
  );
}

/* ==================================================================
   Mobile tab — every visual state is a live function of the deck
   position, so the highlight tracks the finger mid-swipe instead of
   jumping when the route commits.
================================================================== */
interface MobileTabProps {
  /** Live float deck position shared with the swipe deck. */
  pos: MotionValue<number>;
  /** Deck index of the tab's page (tab order matches the deck order). */
  deckIndex: number;
  path: string;
  label: string;
  active: boolean;
  brandColor: string;
  inactiveColor: string;
  /** Animated navigation (same slide a finger swipe produces). */
  onNavigate: (path: string) => void;
  tabRef: RefObject<HTMLAnchorElement | null>;
  children: ReactNode;
}

function MobileTab({
  pos,
  deckIndex,
  path,
  label,
  active,
  brandColor,
  inactiveColor,
  onNavigate,
  tabRef,
  children,
}: MobileTabProps) {
  // Normalised activation (0 → 1) for this tab, derived live from the deck
  // position: 1 while the tab's page fills the viewport, easing linearly
  // to 0 across one full page of swipe in either direction. Mapping the
  // drag displacement straight into this value is what makes the outgoing
  // tab fade + shrink while the incoming one brightens + scales up.
  const activation = useTransform(
    pos,
    [deckIndex - 1, deckIndex, deckIndex + 1],
    [0, 1, 0]
  );

  const iconScale = useTransform(activation, [0, 1], [0.85, 1]);
  const iconOpacity = useTransform(activation, [0, 1], [0.55, 1]);
  const labelScale = useTransform(activation, [0, 1], [0.94, 1]);
  const labelOpacity = useTransform(activation, [0, 1], [0.6, 1]);
  const color = useTransform(activation, [0, 1], [inactiveColor, brandColor]);

  // Tapping a tab runs the same animated deck slide a finger swipe does,
  // so the highlight animates identically. Modified clicks keep their
  // native navigation (new tab, new window, etc.).
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <motion.div style={tabWrapperStyle} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Link
        ref={tabRef}
        href={path}
        onClick={handleClick}
        aria-current={active ? 'page' : undefined}
        style={tabStyle}
      >
        <motion.span style={{ ...tabIconStyle, scale: iconScale, opacity: iconOpacity, color }}>
          {children}
        </motion.span>
        <motion.span style={{ ...tabTextStyle, scale: labelScale, opacity: labelOpacity, color }}>
          {label}
        </motion.span>
      </Link>
    </motion.div>
  );
}

// Number of tabs in the bottom bar. They map to deck pages 1..3; Home
// (deck page 0) is reached by swiping and is intentionally not tabbed.
const MOBILE_TAB_COUNT = 3;

interface NavbarProps {
  isDarkMode?: boolean;
}

export default function Navbar({ isDarkMode = true }: NavbarProps) {
  const pathname = usePathname();
  const { pos, currentIndex, swipeTo } = useSwipe();
  const isActive = (path: string) => pathname === path;

  // The custom ocean teal brand color requested by the user
  const brandColor = '#217d9d';
  const inactiveColor = '#777777';

  // Theme-based background colors
  const themeBgColor = isDarkMode ? '#0d0d0d' : '#f8f9fa';
  const navBorderColor = isDarkMode ? '#1c1c1c' : '#e0e0e0';
  const pillBgColor = isDarkMode ? '#13232d' : '#e8f4f8';

  // ------------------------------------------------------------------
  // Sliding active pill
  // ------------------------------------------------------------------
  const containerRef = useRef<HTMLDivElement>(null);
  const matchesTabRef = useRef<HTMLAnchorElement>(null);
  const propertiesTabRef = useRef<HTMLAnchorElement>(null);
  const tenantsTabRef = useRef<HTMLAnchorElement>(null);

  const pillX = useMotionValue(0);
  const pillY = useMotionValue(0);
  const pillWidth = useMotionValue('0px');
  const pillHeight = useMotionValue('0px');
  const pillOpacity = useMotionValue(0);

  const metricsRef = useRef<{
    lefts: number[];
    tops: number[];
    widths: number[];
    heights: number[];
  } | null>(null);

  // Translate the live deck position into the pill's geometry: between two
  // integer positions the pill interpolates between the two tabs, so it
  // slides underneath the tabs exactly as far as the finger has moved.
  const updatePill = useCallback(
    (p: number) => {
      const m = metricsRef.current;
      if (!m) return;
      // Tab 0 (Matches) is deck page 1. Clamping pins the pill to the
      // nearest real tab while swiping past the deck's ends, on Home
      // (deck 0) and on non-deck routes (p = -1).
      const tabFloat = Math.min(Math.max(p - 1, 0), MOBILE_TAB_COUNT - 1);
      const i = Math.floor(tabFloat);
      const j = Math.min(i + 1, MOBILE_TAB_COUNT - 1);
      const t = tabFloat - i;
      pillX.set(m.lefts[i] + (m.lefts[j] - m.lefts[i]) * t);
      pillY.set(m.tops[i] + (m.tops[j] - m.tops[i]) * t);
      pillWidth.set(`${m.widths[i] + (m.widths[j] - m.widths[i]) * t}px`);
      pillHeight.set(`${m.heights[i] + (m.heights[j] - m.heights[i]) * t}px`);
      // Hidden on Home and on non-deck routes; fades in over the first
      // half of a Home → Matches swipe so it appears progressively too.
      pillOpacity.set(Math.min(Math.max((p - 0.25) / 0.5, 0), 1));
    },
    [pillX, pillY, pillWidth, pillHeight, pillOpacity]
  );

  useMotionValueEvent(pos, 'change', updatePill);

  // Measure the tab geometry once (and again on resize) so the pill can be
  // placed pixel-perfectly behind whichever tab is active.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const containerRect = container.getBoundingClientRect();
      const lefts: number[] = [];
      const tops: number[] = [];
      const widths: number[] = [];
      const heights: number[] = [];
      [matchesTabRef, propertiesTabRef, tenantsTabRef].forEach((ref) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        lefts.push(rect.left - containerRect.left);
        tops.push(rect.top - containerRect.top);
        widths.push(rect.width);
        heights.push(rect.height);
      });
      // Skipped while the mobile nav is display:none on desktop widths.
      if (widths.length === MOBILE_TAB_COUNT && widths.every((w) => w > 0)) {
        metricsRef.current = { lefts, tops, widths, heights };
        updatePill(pos.get());
      }
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [pos, updatePill, matchesTabRef, propertiesTabRef, tenantsTabRef]);

  return (
    <>
      {/* 🖥️ DESKTOP TOP HEADER NAV (Only visible on computers, hidden on mobile) */}
      <nav style={{ ...desktopNavWrapperStyle, backgroundColor: themeBgColor, borderBottom: `1px solid ${navBorderColor}` }} className="desktop-nav-only">
        <div style={navContainerStyle}>
          <Link href="/" style={brandGroupStyle}>
            {/* Logo container housing the dual-colored SVG icon component */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <HomeLogoIcon size={28} isDarkMode={isDarkMode} />
            </div>
            <span style={brandNameTextStyle}>mastanda-plug</span>
          </Link>

          <div style={{ ...menuTabsStyle, backgroundColor: isDarkMode ? '#0a0a0a' : '#ffffff', border: `1px solid ${navBorderColor}` }}>
            <Link href="/matches" style={isActive('/matches') ? { ...desktopActiveTabStyle, color: brandColor } : desktopTabStyle}>Matches</Link>
            <Link href="/properties" style={isActive('/properties') ? { ...desktopActiveTabStyle, color: brandColor } : desktopTabStyle}>Properties</Link>
            <Link href="/find-room" style={isActive('/find-room') ? { ...desktopActiveTabStyle, color: brandColor } : desktopTabStyle}>Tenants</Link>
          </div>
          <div style={{ width: '140px' }} className="hidden md:block"></div>
        </div>
      </nav>

      {/* 📱 FLOATING PILL BOTTOM TAB BAR (hidden on desktop) — a frosted,
          rounded pill hovering above the page content; the sliding highlight
          and per-tab activation keep tracking the swipe progress live. */}
      <div
        style={{
          ...bottomNavWrapperStyle,
          backgroundColor: isDarkMode ? 'rgba(10, 18, 24, 0.75)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(13, 43, 56, 0.08)'}`,
          boxShadow: isDarkMode ? '0 12px 32px rgba(0, 0, 0, 0.55)' : '0 12px 32px rgba(13, 43, 56, 0.18)',
        }}
        className="mobile-nav-only"
      >
        <div style={bottomNavContainerStyle} ref={containerRef}>

          {/* Active pill — slides between tabs, tracking the swipe progress
              live (transform-driven, so it stays on the compositor). */}
          <motion.div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              x: pillX,
              y: pillY,
              width: pillWidth,
              height: pillHeight,
              opacity: pillOpacity,
              // Nests inside the 24px container radius with its 6px inner padding.
              borderRadius: '18px',
              backgroundColor: pillBgColor,
              boxShadow: isDarkMode
                ? '0 4px 14px rgba(33, 125, 157, 0.35)'
                : '0 4px 14px rgba(33, 125, 157, 0.22)',
              pointerEvents: 'none',
            }}
          />

          <MobileTab
            pos={pos}
            deckIndex={1}
            path="/matches"
            label="Matches"
            active={currentIndex === 1}
            brandColor={brandColor}
            inactiveColor={inactiveColor}
            onNavigate={swipeTo}
            tabRef={matchesTabRef}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
          </MobileTab>

          <MobileTab
            pos={pos}
            deckIndex={2}
            path="/properties"
            label="Properties"
            active={currentIndex === 2}
            brandColor={brandColor}
            inactiveColor={inactiveColor}
            onNavigate={swipeTo}
            tabRef={propertiesTabRef}
          >
            {/* Custom dual-colored logo used dynamically inside the active/inactive tabs */}
            <HomeLogoIcon size={22} isDarkMode={isDarkMode} />
          </MobileTab>

          <MobileTab
            pos={pos}
            deckIndex={3}
            path="/find-room"
            label="Tenants"
            active={currentIndex === 3}
            brandColor={brandColor}
            inactiveColor={inactiveColor}
            onNavigate={swipeTo}
            tabRef={tenantsTabRef}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </MobileTab>

        </div>
      </div>

      <style jsx global>{`
        @media (min-width: 768px) {
          .mobile-nav-only { display: none !important; }
          .desktop-nav-only { display: block !important; }
        }
        @media (max-width: 767px) {
          .desktop-nav-only { display: none !important; }
          .mobile-nav-only { display: block !important; }
        }
      `}</style>
    </>
  );
}

/* ==================================================
   MOBILE FLOATING PILL BOTTOM NAV STYLES
================================================== */
const bottomNavWrapperStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 'var(--bottom-nav-float)',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '90%',
  maxWidth: '450px',
  borderRadius: '24px',
  zIndex: 999,
};

const bottomNavContainerStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  padding: '6px 8px'
};

const tabWrapperStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 1
};

const tabStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textDecoration: 'none',
  color: '#777777',
  fontSize: '0.72rem',
  fontWeight: '600',
  padding: '8px 14px',
  borderRadius: '20px',
  gap: '5px'
};

const tabIconStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const tabTextStyle: React.CSSProperties = {
  letterSpacing: '0.2px'
};

/* ==================================================
   LAPTOP DESKTOP HEADER NAVIGATION DESIGN SYSTEM
================================================== */
const desktopNavWrapperStyle: React.CSSProperties = { padding: '14px 24px', position: 'sticky', top: 0, zIndex: 100 };
const navContainerStyle: React.CSSProperties = { maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const brandGroupStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' };
const brandNameTextStyle: React.CSSProperties = { fontSize: '1.25rem', fontWeight: '800', color: '#ffffff', fontFamily: 'sans-serif', letterSpacing: '-0.5px' };
const menuTabsStyle: React.CSSProperties = { display: 'flex', backgroundColor: '#0a0a0a', padding: '4px', borderRadius: '20px', border: '1px solid #1c1c1c', gap: '4px' };
const desktopTabStyle: React.CSSProperties = { textDecoration: 'none', padding: '6px 16px', fontSize: '0.85rem', fontWeight: '600', color: '#888888', borderRadius: '16px' };
const desktopActiveTabStyle: React.CSSProperties = { ...desktopTabStyle, backgroundColor: '#13232d' };
