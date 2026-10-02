"use client";

import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div style={appBgStyle}>
      <div style={appContainerStyle}>
        
        <div style={brandContainerStyle}>
          <h1 style={logoTitleStyle}>mastanda-plug</h1>
          <p style={taglineStyle}>Connecting tenants and landlords across Zimbabwe with zero agent fees.</p>
        </div>

        <div style={metricGridStyle}>
          <div style={metricCardStyle}>
            <span style={metricLabelStyle}>Tenant Recommendations</span>
            <h2 style={metricValueStyle}>Auto</h2>
            <p style={metricSubtextStyle}>Pairs generated seamlessly by location rules</p>
          </div>
          <div style={metricCardStyle}>
            <span style={metricLabelStyle}>Platform Cost Status</span>
            <h2 style={metricValueStyle}><span style={{color: '#10b981'}}>100% Free</span></h2>
            <p style={metricSubtextStyle}>Zero middleman commissions or agent stress</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '24px' }}>
          <Link href="/properties" style={primaryActionBtn}>📢 List a Vacant Property Room</Link>
          <Link href="/find-room" style={secondaryActionBtn}>🔍 Register Tenant Search Profile</Link>
          <Link href="/matches" style={matchesActionBtn}>⚡ Launch Active Match Core Engine</Link>
        </div>

      </div>
    </div>
  );
}

const appBgStyle: React.CSSProperties = { backgroundColor: '#0d0d0d', minHeight: '100vh', color: '#ffffff', padding: '40px 0 100px 0', fontFamily: 'sans-serif' };
const appContainerStyle: React.CSSProperties = { maxWidth: '440px', margin: '0 auto', padding: '0 20px' };
const brandContainerStyle: React.CSSProperties = { textAlign: 'center', marginBottom: '36px' };
const logoTitleStyle: React.CSSProperties = { fontSize: '2.2rem', fontWeight: '900', margin: '0 0 8px 0', color: '#ffffff', letterSpacing: '-1px' };
const taglineStyle: React.CSSProperties = { fontSize: '0.95rem', color: '#888888', lineHeight: '1.5', margin: 0 };
const metricGridStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' };
const metricCardStyle: React.CSSProperties = { backgroundColor: '#141414', borderRadius: '16px', padding: '16px', border: '1px solid #222222' };
const metricLabelStyle: React.CSSProperties = { fontSize: '0.85rem', color: '#888888', fontWeight: '500' };
const metricValueStyle: React.CSSProperties = { fontSize: '1.8rem', fontWeight: '800', margin: '6px 0', color: '#ffffff' };
const metricSubtextStyle: React.CSSProperties = { fontSize: '0.75rem', color: '#555555', margin: 0 };
const primaryActionBtn: React.CSSProperties = { display: 'block', textAlign: 'center', padding: '14px', backgroundColor: '#38bdf8', color: '#000000', fontWeight: '700', borderRadius: '24px', textDecoration: 'none', fontSize: '1rem' };
const secondaryActionBtn: React.CSSProperties = { ...primaryActionBtn, backgroundColor: '#222222', color: '#ffffff', border: '1px solid #333333' };
const matchesActionBtn: React.CSSProperties = { ...primaryActionBtn, backgroundColor: 'transparent', color: '#38bdf8', border: '2px solid #38bdf8' };