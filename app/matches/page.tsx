// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Listing {
  id: string | number;
  room_type: string;
  suburb: string;
  price: number | string;
  has_borehole?: boolean;
  has_electricity?: boolean;
  whatsapp_number: string;
}

interface TenantRequest {
  id: string | number;
  name?: string;
  room_type_wanted: string;
  preferred_suburb?: string;
  max_price: number | string;
  whatsapp_number: string;
}

const CITIES = ['Harare', 'Bulawayo', 'Mutare', 'Gweru'];

// Custom Dropdown Component
interface CustomDropdownProps {
  value: string;
  options: string[];
  placeholder: string;
  onSelect: (value: string) => void;
  isDarkMode: boolean;
}

function CustomDropdown({ value, options, placeholder, onSelect, isDarkMode }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getTriggerStyle = () => ({
    boxSizing: 'border-box',
    width: '100%',
    padding: '12px 16px',
    backgroundColor: isDarkMode ? '#1a1a1a' : '#f1f3f5',
    border: isDarkMode ? '1px solid #2a2a2a' : '1px solid #e9ecef',
    borderRadius: '12px',
    color: isDarkMode ? '#ffffff' : '#212529',
    fontSize: '0.95rem',
    outline: 'none',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  });

  const getDropdownStyle = () => ({
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    width: '100%',
    marginTop: '6px',
    zIndex: 99999,
    backgroundColor: isDarkMode ? '#141414' : '#ffffff',
    border: isDarkMode ? '1px solid #222' : '1px solid #e9ecef',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    maxHeight: '200px',
    overflowY: 'auto' as const,
  });

  const getOptionStyle = (isHovered: boolean) => ({
    padding: '12px 16px',
    cursor: 'pointer',
    backgroundColor: isHovered ? (isDarkMode ? '#1c1c1c' : '#f8f9fa') : 'transparent',
    color: isDarkMode ? '#ffffff' : '#212529',
    fontSize: '0.95rem',
    transition: 'background-color 0.15s ease',
  });

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        style={getTriggerStyle()}
      >
        <span>{value || placeholder}</span>
        <span style={{ fontSize: '0.8rem', marginLeft: '8px' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </div>
      {isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          style={getDropdownStyle()}
        >
          {options.map((option) => (
            <div
              key={option}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(option);
                setIsOpen(false);
              }}
              style={getOptionStyle(false)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode ? '#1c1c1c' : '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Matches() {
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

  const [city, setCity] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [requests, setRequests] = useState<TenantRequest[]>([]);
  const [status, setStatus] = useState('idle');

  const [roleMode, setRoleMode] = useState<'landlord' | 'tenant'>('landlord');

  const brandTeal = '#217d9d';
  const brandDarkTealbg = '#13232d';

  const handleCityChange = async (selectedCity: string) => {
    setCity(selectedCity);
    if (!selectedCity) { setListings([]); setRequests([]); setStatus('idle'); return; }

    setStatus('loading');
    const [listingsResult, requestsResult] = await Promise.all([
      supabase.from('landlord_listings').select('*').eq('city', selectedCity).order('created_at', { ascending: false }),
      supabase.from('tenant_requests').select('*').eq('city', selectedCity).order('created_at', { ascending: false }),
    ]);

    if (!listingsResult.error && !requestsResult.error) {
      setListings((listingsResult.data as Listing[]) || []);
      setRequests((requestsResult.data as TenantRequest[]) || []);
      setStatus('loaded');
    } else { setStatus('error'); }
  };

  const whatsappLink = (number: string, message: string) => {
    let cleanNumber = (number || '').replace(/[^0-9]/g, '');
    if (cleanNumber.startsWith('07')) cleanNumber = '263' + cleanNumber.substring(1);
    if (cleanNumber.length === 9 && cleanNumber.startsWith('7')) cleanNumber = '263' + cleanNumber;
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
  };

  const calculateMatchScore = (item: Listing | TenantRequest, isProperty: boolean) => {
    let baseScore = 75;
    if (isProperty) {
      const listing = item as Listing;
      if (listing.has_borehole) baseScore += 15;
      if (listing.has_electricity) baseScore += 10;
    } else {
      const req = item as TenantRequest;
      if (req.preferred_suburb) baseScore += 15;
    }
    return Math.min(baseScore, 100);
  };

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
      // Swipe right - go to Tenants
      router.push('/find-room');
    } else {
      // Swipe left - go to Properties
      router.push('/properties');
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

  const getTitleStyle = () => ({
    fontSize: '1.4rem',
    fontWeight: '800',
    margin: 0,
    letterSpacing: '-0.3px',
  });

  const getAutoMatchBtnStyle = () => ({
    borderRadius: '20px',
    padding: '6px 14px',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: brandTeal,
    backgroundColor: brandDarkTealbg,
  });

  const getFilterBoxStyle = () => ({
    backgroundColor: isDarkMode ? '#141414' : '#ffffff',
    border: isDarkMode ? '1px solid #222222' : '1px solid #e9ecef',
    padding: '14px',
    borderRadius: '16px',
    margin: '20px 0',
  });

  const getFilterLabelStyle = () => ({
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: isDarkMode ? '#666' : '#6c757d',
    marginBottom: '6px',
    letterSpacing: '0.3px',
  });

  const getTabSwitcherGrid = () => ({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
    backgroundColor: isDarkMode ? '#141414' : '#ffffff',
    padding: '4px',
    borderRadius: '12px',
    border: isDarkMode ? '1px solid #222222' : '1px solid #e9ecef',
    marginBottom: '20px',
  });

  const getInactiveToggleBtnStyle = () => ({
    padding: '10px 6px',
    backgroundColor: 'transparent',
    border: 'none',
    color: isDarkMode ? '#666666' : '#6c757d',
    borderRadius: '8px',
    fontSize: '0.82rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  });

  const getActiveToggleBtnStyle = () => ({
    ...getInactiveToggleBtnStyle(),
    color: '#ffffff',
    backgroundColor: isDarkMode ? '#1c1c1c' : '#e9ecef',
  });

  const getQueueCardStyle = () => ({
    backgroundColor: isDarkMode ? '#141414' : '#ffffff',
    border: isDarkMode ? '1px solid #222' : '1px solid #e9ecef',
    padding: '18px',
    borderRadius: '18px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: isDarkMode ? '0 4px 6px -1px rgba(0,0,0,0.2)' : '0 4px 6px -1px rgba(0,0,0,0.1)',
  });

  const getCardHeaderTitle = () => ({
    fontSize: '0.92rem',
    fontWeight: '700',
    margin: 0,
    color: isDarkMode ? '#ffffff' : '#212529',
  });

  const getLocationSubStyle = () => ({
    fontSize: '0.78rem',
    color: isDarkMode ? '#666666' : '#6c757d',
    fontWeight: '500',
    display: 'block',
    marginTop: '2px',
  });

  const getCardPriceStyle = () => ({
    fontSize: '0.92rem',
    fontWeight: '700',
    color: '#10b981',
  });

  const getMatchBadgeStyle = () => ({
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '24px',
    fontSize: '0.78rem',
    fontWeight: '800',
    color: brandTeal,
    backgroundColor: brandDarkTealbg,
  });

  const getAvatarCircleStyle = () => ({
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: isDarkMode ? '#1c1c1c' : '#e9ecef',
    color: isDarkMode ? '#ffffff' : '#212529',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '0.9rem',
    border: isDarkMode ? '1px solid #262626' : '1px solid #dee2e6',
    flexShrink: 0,
  });

  const getConnectButton = () => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    textDecoration: 'none',
    padding: '11px',
    borderRadius: '24px',
    fontWeight: '700',
    fontSize: '0.85rem',
    cursor: 'pointer',
  });

  const getEmptyQueueCard = () => ({
    backgroundColor: isDarkMode ? '#141414' : '#ffffff',
    border: isDarkMode ? '2px dashed #262626' : '2px dashed #dee2e6',
    color: isDarkMode ? '#555' : '#6c757d',
    padding: '36px 24px',
    borderRadius: '16px',
    textAlign: 'center',
    fontSize: '0.9rem',
  });

  const getActiveBadge = () => ({
    backgroundColor: '#132f1d',
    color: '#10b981',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '0.7rem',
    fontWeight: '700',
  });

  const getDarkBadge = () => ({
    backgroundColor: isDarkMode ? '#1c1c1c' : '#e9ecef',
    color: isDarkMode ? '#444' : '#adb5bd',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '0.7rem',
    fontWeight: '600',
    textDecoration: 'line-through',
  });

  const getMetaDividerStyle = () => ({
    height: '1px',
    backgroundColor: isDarkMode ? '#1f1f1f' : '#dee2e6',
    margin: '14px 0 12px 0',
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', marginBottom: '6px' }}>
          <h1 style={getTitleStyle()}>Live Matches</h1>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={getAutoMatchBtnStyle()}>
              Engine Active
            </span>
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
        </div>
        <p style={{ color: isDarkMode ? '#666666' : '#6c757d', fontSize: '0.85rem', marginBottom: '24px', lineHeight: '1.4' }}>
          Straightforward matchmaking pairings tracking local parameters and utility access metrics.
        </p>

        <div style={getFilterBoxStyle()}>
          <label style={getFilterLabelStyle()}>Target City Filter</label>
          <CustomDropdown
            value={city}
            options={CITIES}
            placeholder="Select location..."
            onSelect={handleCityChange}
            isDarkMode={isDarkMode}
          />
        </div>

        {status === 'loading' && <p style={{ color: isDarkMode ? '#888' : '#6c757d', textAlign: 'center', fontSize: '0.9rem', margin: '30px 0' }}>Scanning pairing matrices...</p>}

        {status === 'loaded' && (
          <>
            <div style={getTabSwitcherGrid()}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRoleMode('landlord');
                }}
                style={roleMode === 'landlord' ? getActiveToggleBtnStyle() : getInactiveToggleBtnStyle()}
              >
                🏠 Available Rooms ({listings.length})
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRoleMode('tenant');
                }}
                style={roleMode === 'tenant' ? getActiveToggleBtnStyle() : getInactiveToggleBtnStyle()}
              >
                🔍 Tenant Inquiries ({requests.length})
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {roleMode === 'landlord' && (
                <>
                  {listings.length === 0 && (
                    <div style={getEmptyQueueCard()}>
                      <p style={{ margin: '0 0 12px 0' }}>No active property rows listed in {city}.</p>
                      <Link href="/list-property" style={{ color: brandTeal, fontWeight: 'bold', textDecoration: 'none', fontSize: '0.85rem' }}>Be the first to list a room! →</Link>
                    </div>
                  )}
                  {listings.map((item: Listing) => (
                    <div key={item.id} style={getQueueCardStyle()}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                          <div style={getAvatarCircleStyle()}>H</div>
                          <div>
                            <h4 style={getCardHeaderTitle()}>{item.room_type} — {item.suburb}</h4>
                            <span style={getLocationSubStyle()}>📍 {city}, Zimbabwe</span>
                            <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                              <span style={item.has_borehole ? getActiveBadge() : getDarkBadge()}>🚰 Borehole</span>
                              <span style={item.has_electricity ? getActiveBadge() : getDarkBadge()}>💡 Power</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                          <span style={getMatchBadgeStyle()}>
                            {calculateMatchScore(item, true)}% Match
                          </span>
                          <span style={getCardPriceStyle()}>${item.price}<span style={{ fontSize: '0.75rem', color: isDarkMode ? '#666' : '#6c757d' }}> /mo</span></span>
                        </div>
                      </div>

                      <div style={getMetaDividerStyle()}></div>

                      <a
                        href={whatsappLink(item.whatsapp_number, `Hi! I saw your room listing in ${item.suburb} on mastanda-plug.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ ...getConnectButton(), backgroundColor: brandTeal }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                        Chat with Landlord
                      </a>
                    </div>
                  ))}
                </>
              )}

              {roleMode === 'tenant' && (
                <>
                  {requests.length === 0 && (
                    <div style={getEmptyQueueCard()}>
                      <p style={{ margin: '0 0 12px 0' }}>No tenant profiles pending matching for {city}.</p>
                      <Link href="/find-room" style={{ color: brandTeal, fontWeight: 'bold', textDecoration: 'none', fontSize: '0.85rem' }}>Submit what you are searching for! →</Link>
                    </div>
                  )}
                  {requests.map((item: TenantRequest) => (
                    <div key={item.id} style={getQueueCardStyle()}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                          <div style={{ ...getAvatarCircleStyle(), borderColor: isDarkMode ? '#33334d' : '#dee2e6' }}>T</div>
                          <div>
                            <h4 style={getCardHeaderTitle()}>{item.name || "Space Seeker"}</h4>
                            <p style={{ fontSize: '0.82rem', color: brandTeal, fontWeight: '700', margin: '2px 0 4px 0' }}>{item.room_type_wanted}</p>
                            <span style={getLocationSubStyle()}>📍 Wants: {item.preferred_suburb || city}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                          <span style={getMatchBadgeStyle()}>
                            {calculateMatchScore(item, false)}% Match
                          </span>
                          <span style={{ ...getCardPriceStyle(), color: isDarkMode ? '#ffffff' : '#212529' }}>Max: ${item.max_price}</span>
                        </div>
                      </div>

                      <div style={getMetaDividerStyle()}></div>

                      <a
                        href={whatsappLink(item.whatsapp_number, `Hi! I saw your room search query for ${item.preferred_suburb || city} on mastanda-plug.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ ...getConnectButton(), backgroundColor: '#181b3d', color: '#6366f1', border: '1px solid #22295c' }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        Connect with Tenant
                      </a>
                    </div>
                  ))}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Floating Navigation Dock */}
      <div style={getNavDockStyle()}>
        <Link href="/matches" style={getNavTabStyle(true)}>
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
