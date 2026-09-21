"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// 🏠 Recreated High-Quality Home Logo Icon Component (Nested Arch Design)
interface HomeLogoIconProps {
  size?: number;
}

function HomeLogoIcon({ size = 24 }: HomeLogoIconProps) {
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
        fill="#111111" 
      />
      
      {/* 3. Inner Core / Doorway Arch - Fixed Logo Brand Color */}
      <path 
        d="M9 14.5 L12 12 L15 14.5 V21 H9 Z" 
        fill="#217d9d" 
      />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  // The custom ocean teal brand color requested by the user
  const brandColor = '#217d9d';

  return (
    <>
      {/* 🖥️ DESKTOP TOP HEADER NAV (Only visible on computers, hidden on mobile) */}
      <nav style={desktopNavWrapperStyle} className="desktop-nav-only">
        <div style={navContainerStyle}>
          <Link href="/" style={brandGroupStyle}>
            {/* Logo container housing the dual-colored SVG icon component */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <HomeLogoIcon size={28} />
            </div>
            <span style={brandNameTextStyle}>mastanda-plug</span>
          </Link>

          <div style={menuTabsStyle}>
            <Link href="/matches" style={isActive('/matches') ? { ...desktopActiveTabStyle, color: brandColor } : desktopTabStyle}>Matches</Link>
            <Link href="/list-property" style={isActive('/list-property') ? { ...desktopActiveTabStyle, color: brandColor } : desktopTabStyle}>Properties</Link>
            <Link href="/find-room" style={isActive('/find-room') ? { ...desktopActiveTabStyle, color: brandColor } : desktopTabStyle}>Tenants</Link>
          </div>
          <div style={{ width: '140px' }} className="hidden md:block"></div>
        </div>
      </nav>

      {/* 📱 TRUE NATIVE BOTTOM TAB BAR (Hidden on desktop, absolute bottom on mobile!) */}
      <div style={bottomNavWrapperStyle} className="mobile-nav-only">
        <div style={bottomNavContainerStyle}>
          
          {/* Matches Section */}
          <Link href="/matches" style={isActive('/matches') ? { ...activePillContainer, color: brandColor, backgroundColor: '#13232d' } : inactiveTabStyle}>
            <span style={isActive('/matches') ? { ...activeIconStyle, color: brandColor } : iconStyle}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
            </span>
            <span style={textStyle}>Matches</span>
          </Link>

          {/* Properties Section */}
          <Link href="/list-property" style={isActive('/list-property') ? { ...activePillContainer, color: brandColor, backgroundColor: '#13232d' } : inactiveTabStyle}>
            <span style={isActive('/list-property') ? { ...activeIconStyle, color: brandColor } : iconStyle}>
              {/* Custom dual-colored logo used dynamically inside the active/inactive tabs */}
              <HomeLogoIcon size={22} />
            </span>
            <span style={textStyle}>Properties</span>
          </Link>

          {/* Tenants Section */}
          <Link href="/find-room" style={isActive('/find-room') ? { ...activePillContainer, color: brandColor, backgroundColor: '#13232d' } : inactiveTabStyle}>
            <span style={isActive('/find-room') ? { ...activeIconStyle, color: brandColor } : iconStyle}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </span>
            <span style={textStyle}>Tenants</span>
          </Link>

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
          body { padding-bottom: 90px !important; }
        }
      `}</style>
    </>
  );
}

/* ==================================================
   MOBILE BOTTOM TAB DOCK BAR STYLES
================================================== */
const bottomNavWrapperStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: '#111111', 
  borderTop: '1px solid #1c1c1c',
  padding: '10px 0 16px 0',
  zIndex: 2000,
  boxShadow: '0 -8px 24px rgba(0,0,0,0.6)'
};

const bottomNavContainerStyle: React.CSSProperties = {
  maxWidth: '440px',
  margin: '0 auto',
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  padding: '0 12px'
};

const inactiveTabStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textDecoration: 'none',
  color: '#777777', 
  fontSize: '0.72rem',
  fontWeight: '600',
  padding: '8px 18px',
  borderRadius: '20px',
  transition: 'all 0.2s ease-in-out',
  gap: '5px'
};

const activePillContainer: React.CSSProperties = {
  ...inactiveTabStyle,
};

const iconStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0.6,
  transition: 'all 0.2s ease'
};

const activeIconStyle: React.CSSProperties = {
  ...iconStyle,
  opacity: 1,
};

const textStyle: React.CSSProperties = {
  letterSpacing: '0.2px'
};

/* ==================================================
   LAPTOP DESKTOP HEADER NAVIGATION DESIGN SYSTEM
================================================== */
const desktopNavWrapperStyle: React.CSSProperties = { backgroundColor: '#111111', borderBottom: '1px solid #1a1a1a', padding: '14px 24px', position: 'sticky', top: 0, zIndex: 100 };
const navContainerStyle: React.CSSProperties = { maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const brandGroupStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' };
const brandNameTextStyle: React.CSSProperties = { fontSize: '1.25rem', fontWeight: '800', color: '#ffffff', fontFamily: 'sans-serif', letterSpacing: '-0.5px' };
const menuTabsStyle: React.CSSProperties = { display: 'flex', backgroundColor: '#0a0a0a', padding: '4px', borderRadius: '20px', border: '1px solid #1c1c1c', gap: '4px' };
const desktopTabStyle: React.CSSProperties = { textDecoration: 'none', padding: '6px 16px', fontSize: '0.85rem', fontWeight: '600', color: '#888888', borderRadius: '16px' };
const desktopActiveTabStyle: React.CSSProperties = { ...desktopTabStyle, backgroundColor: '#13232d' };
