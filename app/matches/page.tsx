"use client";

import React, { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import Link from 'next/link';

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

export default function Matches() {
  const [city, setCity] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [requests, setRequests] = useState<TenantRequest[]>([]);
  const [status, setStatus] = useState('idle');

  const [roleMode, setRoleMode] = useState<'landlord' | 'tenant'>('landlord');

  const brandTeal = '#217d9d';
  const brandDarkTealbg = '#13232d';

  const handleCityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCity = e.target.value;
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

  return (
    <div style={appBgStyle}>
      <div style={appContainerStyle}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <h1 style={titleStyle}>Live Matches</h1>
          <span style={{ ...autoMatchBtnStyle, color: brandTeal, backgroundColor: brandDarkTealbg }}>
            Engine Active
          </span>
        </div>
        <p style={{ color: '#666666', fontSize: '0.85rem', marginBottom: '24px', lineHeight: '1.4' }}>
          Straightforward matchmaking pairings tracking local parameters and utility access metrics.
        </p>

        <div style={filterBoxStyle}>
          <label style={filterLabelStyle}>Target City Filter</label>
          <select value={city} onChange={handleCityChange} style={selectInputStyle}>
            <option value="">Select location...</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {status === 'loading' && <p style={{ color: '#888', textAlign: 'center', fontSize: '0.9rem', margin: '30px 0' }}>Scanning pairing matrices...</p>}

        {status === 'loaded' && (
          <>
            <div style={tabSwitcherGrid}>
              <button
                onClick={() => setRoleMode('landlord')}
                style={roleMode === 'landlord' ? activeToggleBtnStyle : inactiveToggleBtnStyle}
              >
                🏠 Available Rooms ({listings.length})
              </button>
              <button
                onClick={() => setRoleMode('tenant')}
                style={roleMode === 'tenant' ? activeToggleBtnStyle : inactiveToggleBtnStyle}
              >
                🔍 Tenant Inquiries ({requests.length})
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {roleMode === 'landlord' && (
                <>
                  {listings.length === 0 && (
                    <div style={emptyQueueCard}>
                      <p style={{ margin: '0 0 12px 0' }}>No active property rows listed in {city}.</p>
                      <Link href="/list-property" style={{ color: brandTeal, fontWeight: 'bold', textDecoration: 'none', fontSize: '0.85rem' }}>Be the first to list a room! →</Link>
                    </div>
                  )}
                  {listings.map((item: Listing) => (
                    <div key={item.id} style={queueCardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                          <div style={avatarCircleStyle}>H</div>
                          <div>
                            <h4 style={cardHeaderTitle}>{item.room_type} — {item.suburb}</h4>
                            <span style={locationSubStyle}>📍 {city}, Zimbabwe</span>
                            <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                              <span style={item.has_borehole ? activeBadge : darkBadge}>🚰 Borehole</span>
                              <span style={item.has_electricity ? activeBadge : darkBadge}>💡 Power</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                          <span style={{ ...matchBadgeStyle, color: brandTeal, backgroundColor: brandDarkTealbg }}>
                            {calculateMatchScore(item, true)}% Match
                          </span>
                          <span style={cardPriceStyle}>${item.price}<span style={{ fontSize: '0.75rem', color: '#666' }}> /mo</span></span>
                        </div>
                      </div>

                      <div style={metaDividerStyle}></div>

                      <a
                        href={whatsappLink(item.whatsapp_number, `Hi! I saw your room listing in ${item.suburb} on mastanda-plug.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ ...connectButton, backgroundColor: brandTeal }}
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
                    <div style={emptyQueueCard}>
                      <p style={{ margin: '0 0 12px 0' }}>No tenant profiles pending matching for {city}.</p>
                      <Link href="/find-room" style={{ color: brandTeal, fontWeight: 'bold', textDecoration: 'none', fontSize: '0.85rem' }}>Submit what you are searching for! →</Link>
                    </div>
                  )}
                  {requests.map((item: TenantRequest) => (
                    <div key={item.id} style={queueCardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                          <div style={{ ...avatarCircleStyle, borderColor: '#33334d' }}>T</div>
                          <div>
                            <h4 style={cardHeaderTitle}>{item.name || "Space Seeker"}</h4>
                            <p style={{ fontSize: '0.82rem', color: brandTeal, fontWeight: '700', margin: '2px 0 4px 0' }}>{item.room_type_wanted}</p>
                            <span style={locationSubStyle}>📍 Wants: {item.preferred_suburb || city}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                          <span style={{ ...matchBadgeStyle, color: brandTeal, backgroundColor: brandDarkTealbg }}>
                            {calculateMatchScore(item, false)}% Match
                          </span>
                          <span style={{ ...cardPriceStyle, color: '#ffffff' }}>Max: ${item.max_price}</span>
                        </div>
                      </div>

                      <div style={metaDividerStyle}></div>

                      <a
                        href={whatsappLink(item.whatsapp_number, `Hi! I saw your room search query for ${item.preferred_suburb || city} on mastanda-plug.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ ...connectButton, backgroundColor: '#181b3d', color: '#6366f1', border: '1px solid #22295c' }}
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
    </div>
  );
}

const appBgStyle: React.CSSProperties = {
  backgroundColor: '#0d0d0d',
  minHeight: '100vh',
  color: '#ffffff',
  padding: '30px 0 140px 0',
  fontFamily: 'sans-serif',
};

const appContainerStyle: React.CSSProperties = {
  maxWidth: '460px',
  margin: '0 auto',
  padding: '0 14px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.6rem',
  fontWeight: '800',
  margin: 0,
  letterSpacing: '-0.3px',
};

const autoMatchBtnStyle: React.CSSProperties = {
  borderRadius: '20px',
  padding: '6px 14px',
  fontSize: '0.75rem',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const filterBoxStyle: React.CSSProperties = {
  backgroundColor: '#141414',
  border: '1px solid #222',
  padding: '14px',
  borderRadius: '16px',
  margin: '20px 0',
};

const filterLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: '700',
  textTransform: 'uppercase',
  color: '#666',
  marginBottom: '6px',
  letterSpacing: '0.3px',
};

const selectInputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '12px',
  borderRadius: '10px',
  backgroundColor: '#0d0d0d',
  border: '1px solid #2a2a2a',
  color: '#fff',
  outline: 'none',
  fontSize: '0.95rem',
};

const tabSwitcherGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '6px',
  backgroundColor: '#141414',
  padding: '4px',
  borderRadius: '12px',
  border: '1px solid #222222',
  marginBottom: '20px',
};

const inactiveToggleBtnStyle: React.CSSProperties = {
  padding: '10px 6px',
  backgroundColor: 'transparent',
  border: 'none',
  color: '#666666',
  borderRadius: '8px',
  fontSize: '0.82rem',
  fontWeight: '700',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const activeToggleBtnStyle: React.CSSProperties = {
  ...inactiveToggleBtnStyle,
  color: '#ffffff',
  backgroundColor: '#1c1c1c',
};

const queueCardStyle: React.CSSProperties = {
  backgroundColor: '#141414',
  border: '1px solid #222',
  padding: '18px',
  borderRadius: '18px',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)',
};

const cardHeaderTitle: React.CSSProperties = {
  fontSize: '1.05rem',
  fontWeight: '800',
  margin: 0,
  color: '#ffffff',
};

const locationSubStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  color: '#666666',
  fontWeight: '500',
  display: 'block',
  marginTop: '2px',
};

const cardPriceStyle: React.CSSProperties = {
  fontSize: '1.2rem',
  fontWeight: '800',
  color: '#10b981',
};

const matchBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '4px 10px',
  borderRadius: '24px',
  fontSize: '0.78rem',
  fontWeight: '800',
};

const avatarCircleStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  backgroundColor: '#1c1c1c',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: '800',
  fontSize: '0.9rem',
  border: '1px solid #262626',
  flexShrink: 0,
};

const connectButton: React.CSSProperties = {
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
};

const emptyQueueCard: React.CSSProperties = {
  backgroundColor: '#141414',
  border: '2px dashed #262626',
  color: '#555',
  padding: '36px 24px',
  borderRadius: '16px',
  textAlign: 'center',
  fontSize: '0.9rem',
};

const activeBadge: React.CSSProperties = {
  backgroundColor: '#132f1d',
  color: '#10b981',
  padding: '3px 8px',
  borderRadius: '6px',
  fontSize: '0.7rem',
  fontWeight: '700',
};

const darkBadge: React.CSSProperties = {
  backgroundColor: '#1c1c1c',
  color: '#444',
  padding: '3px 8px',
  borderRadius: '6px',
  fontSize: '0.7rem',
  fontWeight: '600',
  textDecoration: 'line-through',
};

const metaDividerStyle: React.CSSProperties = {
  height: '1px',
  backgroundColor: '#1f1f1f',
  margin: '14px 0 12px 0',
};
