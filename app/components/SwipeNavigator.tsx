"use client";

import React, { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { MotionValue, useMotionValue } from 'framer-motion';
import { usePathname } from 'next/navigation';

/**
 * Ordered horizontal page deck controlled by the swipe navigator.
 * The bottom navigation tabs and the swipe gestures share this order.
 */
export const SWIPE_PAGES = ['/', '/matches', '/properties', '/find-room'];

interface SwipeContextType {
  /**
   * Live float position within the deck. Equals `currentIndex` while at
   * rest, and moves continuously (0 → 1 per page) while a swipe or a
   * programmatic slide is in flight. The bottom navigation consumes this
   * to progressively highlight tabs and slide the active pill.
   */
  pos: MotionValue<number>;
  /** Index of the active page in SWIPE_PAGES (-1 when the route is outside the deck). */
  currentIndex: number;
  /** Animated navigation used by the bottom navigation tabs. */
  swipeTo: (path: string) => void;
  /** Used by the SwipeWrapper to publish its animation controller. */
  registerAnimator: (animator: (index: number) => void) => void;
}

const SwipeContext = createContext<SwipeContextType | undefined>(undefined);

export const useSwipe = () => {
  const context = useContext(SwipeContext);
  if (!context) {
    throw new Error('useSwipe must be used within SwipeProvider');
  }
  return context;
};

interface SwipeProviderProps {
  children: ReactNode;
}

export function SwipeProvider({ children }: SwipeProviderProps) {
  const pathname = usePathname();
  const currentIndex = SWIPE_PAGES.indexOf(pathname);

  // Initial value matches the server-rendered route so the navigation
  // highlights the correct tab before any gesture happens.
  const pos = useMotionValue(currentIndex);

  // The SwipeWrapper registers its slide controller here so the Navbar can
  // trigger the exact same animated slide a finger swipe produces.
  const [animator, setAnimator] = useState<(index: number) => void>(() => {});

  const registerAnimator = useCallback((fn: (index: number) => void) => {
    setAnimator(() => fn);
  }, []);

  const swipeTo = useCallback(
    (path: string) => {
      const index = SWIPE_PAGES.indexOf(path);
      if (index >= 0) animator(index);
    },
    [animator]
  );

  return (
    <SwipeContext.Provider value={{ pos, currentIndex, swipeTo, registerAnimator }}>
      {children}
    </SwipeContext.Provider>
  );
}
