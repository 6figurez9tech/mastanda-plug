// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);
  const touchStartTime = useRef(0);
  
  // Theme state with localStorage persistence
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme !== null) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  useEffect(() => {
    const bg = isDarkMode ? '#0d0d0d' : '#f8f9fa';
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
  }, [isDarkMode]);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('themeChange'));
    }
  };

  const brandTeal = '#217d9d';

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
    touchStartY.current = e.changedTouches[0].screenY;
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX;
    touchEndY.current = e.changedTouches[0].screenY;
    handleSwipe();
  };

  const handleSwipe = () => {
    const MIN_SWIPE_DISTANCE = 100;
    const MAX_SWIPE_DURATION = 300;
    
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;
    const duration = Date.now() - touchStartTime.current;

    // Only trigger if horizontal movement is significantly greater than vertical (axis locking)
    if (Math.abs(deltaX) <= Math.abs(deltaY) * 2) {
      return;
    }

    // Only trigger if swipe distance meets minimum threshold
    if (Math.abs(deltaX) <= MIN_SWIPE_DISTANCE) {
      return;
    }

    // Only trigger if swipe is fast enough (distinguishes from slow drag)
    if (duration >= MAX_SWIPE_DURATION) {
      return;
    }

    // Execute navigation based on direction
    if (deltaX > 0) {
      // Swipe right - no action on homepage
    } else {
      // Swipe left - go to Matches
      router.push('/matches');
    }
  };

  // Theme-aware style helpers
  const getAppBgStyle = () => ({
    backgroundColor: isDarkMode ? '#0d0d0d' : '#f8f9fa',
    minHeight: '100vh',
    height: 'auto',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    margin: 0,
    padding: '0 16px 140px 16px',
    color: isDarkMode ? '#ffffff' : '#212529',
    fontFamily: 'sans-serif',
    flex: 1,
    boxSizing: 'border-box' as const,
  });

  const getAppContainerStyle = () => ({
    width: '100%',
    maxWidth: '430px',
    margin: '0 auto',
    boxSizing: 'border-box' as const,
    position: 'relative' as const,
  });

  const getHeaderRowStyle = () => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    marginBottom: '20px',
  });

  const getTitleStyle = () => ({
    margin: 0,
    fontSize: '1.4rem',
    fontWeight: '800',
  });

  const getBrandContainerStyle = () => ({
    textAlign: 'center',
    marginBottom: '36px',
  });

  const getLogoTitleStyle = () => ({
    fontSize: '2.2rem',
    fontWeight: '900',
    margin: '0 0 8px 0',
    color: isDarkMode ? '#ffffff' : '#212529',
    letterSpacing: '-1px',
  });

  const getTaglineStyle = () => ({
    fontSize: '0.95rem',
    color: isDarkMode ? '#888888' : '#6c757d',
    lineHeight: '1.5',
    margin: 0,
  });

  const getMetricGridStyle = () => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '28px',
  });

  const getMetricCardStyle = () => ({
    backgroundColor: isDarkMode ? '#141414' : '#ffffff',
    borderRadius: '16px',
    padding: '16px',
    border: isDarkMode ? '1px solid #222222' : '1px solid #e9ecef',
  });

  const getMetricLabelStyle = () => ({
    fontSize: '0.85rem',
    color: isDarkMode ? '#888888' : '#6c757d',
    fontWeight: '500',
  });

  const getMetricValueStyle = () => ({
    fontSize: '1.8rem',
    fontWeight: '800',
    margin: '6px 0',
    color: isDarkMode ? '#ffffff' : '#212529',
  });

  const getMetricSubtextStyle = () => ({
    fontSize: '0.75rem',
    color: isDarkMode ? '#555555' : '#6c757d',
    margin: 0,
  });

  const getPrimaryActionBtn = () => ({
    display: 'block',
    textAlign: 'center',
    padding: '14px',
    backgroundColor: '#38bdf8',
    color: '#000000',
    fontWeight: '700',
    borderRadius: '24px',
    textDecoration: 'none',
    fontSize: '1rem',
  });

  const getSecondaryActionBtn = () => ({
    ...getPrimaryActionBtn(),
    backgroundColor: isDarkMode ? '#222222' : '#e9ecef',
    color: isDarkMode ? '#ffffff' : '#212529',
    border: isDarkMode ? '1px solid #333333' : '1px solid #dee2e6',
  });

  const getMatchesActionBtn = () => ({
    ...getPrimaryActionBtn(),
    backgroundColor: 'transparent',
    color: brandTeal,
    border: '2px solid ' + brandTeal,
  });

  const getNavDockStyle = () => ({
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 32px)',
    maxWidth: '398px',
    borderRadius: '30px',
    padding: '8px 12px',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 9999,
    boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    backgroundColor: isDarkMode ? 'rgba(26, 26, 26, 0.8)' : 'rgba(255, 255, 255, 0.85)',
    border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
  });

  const getNavTabStyle = (isActive: boolean) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    textDecoration: 'none',
    color: isActive ? brandTeal : isDarkMode ? '#666' : '#6c757d',
    cursor: 'pointer',
    transition: 'color 0.2s ease',
    padding: isActive ? '6px 16px' : '6px 12px',
    borderRadius: '20px',
    backgroundColor: isActive 
      ? (isDarkMode ? 'rgba(33, 125, 157, 0.15)' : 'rgba(33, 125, 157, 0.1)')
      : 'transparent',
  });

  const getNavIconStyle = () => ({
    fontSize: '1.4rem',
  });

  const getNavLabelStyle = () => ({
    fontSize: '0.7rem',
    fontWeight: '600',
  });

  return (
    <div 
      style={getAppBgStyle()}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div style={getAppContainerStyle()}>
        
        <div style={getHeaderRowStyle()}>
          <h1 style={getTitleStyle()}>Home</h1>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleTheme();
            }}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>

        <div style={getBrandContainerStyle()}>
          <h1 style={getLogoTitleStyle()}>mastanda-plug</h1>
          <p style={getTaglineStyle()}>Connecting tenants and landlords across Zimbabwe with zero agent fees.</p>
        </div>

        <div style={getMetricGridStyle()}>
          <div style={getMetricCardStyle()}>
            <span style={getMetricLabelStyle()}>Tenant Recommendations</span>
            <h2 style={getMetricValueStyle()}>Auto</h2>
            <p style={getMetricSubtextStyle()}>Pairs generated seamlessly by location rules</p>
          </div>
          <div style={getMetricCardStyle()}>
            <span style={getMetricLabelStyle()}>Platform Cost Status</span>
            <h2 style={getMetricValueStyle()}><span style={{color: '#10b981'}}>100% Free</span></h2>
            <p style={getMetricSubtextStyle()}>Zero middleman commissions or agent stress</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '24px' }}>
          <Link href="/properties" style={getPrimaryActionBtn()}>📢 List a Vacant Property Room</Link>
          <Link href="/find-room" style={getSecondaryActionBtn()}>🔍 Register Tenant Search Profile</Link>
          <Link href="/matches" style={getMatchesActionBtn()}>⚡ Launch Active Match Core Engine</Link>
        </div>

      </div>

      {/* Floating Navigation Dock */}
      <div style={getNavDockStyle()}>
        <Link href="/matches" style={getNavTabStyle(false)}>
          <span style={getNavIconStyle()}>⚡</span>
          <span style={getNavLabelStyle()}>Matches</span>
        </Link>
        <Link href="/properties" style={getNavTabStyle(false)}>
          <span style={getNavIconStyle()}>🏠</span>
          <span style={getNavLabelStyle()}>Properties</span>
        </Link>
        <Link href="/find-room" style={getNavTabStyle(false)}>
          <span style={getNavIconStyle()}>👥</span>
          <span style={getNavLabelStyle()}>Tenants</span>
        </Link>
      </div>
    </div>
  );
}
