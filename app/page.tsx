"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  // Theme state with localStorage persistence
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  useEffect(() => {
    const readTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      setIsDarkMode(savedTheme === null ? true : savedTheme === 'dark');
    };

    // Initial sync with localStorage, deferred to just before the next
    // paint so the effect body itself never calls setState synchronously.
    const raf = requestAnimationFrame(readTheme);

    // Keep this page's theme in sync when it is toggled on another page.
    window.addEventListener('themeChange', readTheme);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('themeChange', readTheme);
    };
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

  // Theme-aware style helpers
  const getAppBgStyle = (): React.CSSProperties => ({
    backgroundColor: isDarkMode ? '#0d0d0d' : '#f8f9fa',
    minHeight: '100vh',
    height: 'auto',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    margin: 0,
    padding: '0 16px var(--bottom-nav-clearance) 16px',
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

  const getBrandContainerStyle = (): React.CSSProperties => ({
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

  const getMetricGridStyle = (): React.CSSProperties => ({
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

  const getPrimaryActionBtn = (): React.CSSProperties => ({
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

  return (
    <div style={getAppBgStyle()}>
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
    </div>
  );
}
