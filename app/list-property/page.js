"use client";

import { useState } from "react";
import { supabase } from "../../utils/supabaseClient";

const CITIES = ["Harare", "Bulawayo", "Mutare", "Gweru"];

export default function LandlordListing() {
  const [formData, setFormData] = useState({ city: "", suburb: "", room_type: "", price: "", has_borehole: false, has_municipal_water: false, has_electricity: false, whatsapp_number: "" });
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");
    let cleanPhone = formData.whatsapp_number.replace(/[^0-9+]/g, "");

    const { error } = await supabase.from("landlord_listings").insert([
      { city: formData.city, suburb: formData.suburb.trim() || null, room_type: formData.room_type, price: parseFloat(formData.price), has_borehole: formData.has_borehole, has_municipal_water: formData.has_municipal_water, has_electricity: formData.has_electricity, whatsapp_number: cleanPhone }
    ]);

    if (error) { setStatus("error"); setErrorMessage(error.message); return; }
    setStatus("success");
    setFormData({ city: "", suburb: "", room_type: "", price: "", has_borehole: false, has_municipal_water: false, has_electricity: false, whatsapp_number: "" });
  };

  return (
    <div style={panelBgStyle}>
      <div style={panelContainerStyle}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={sectionHeadingStyle}>Properties</h1>
          <span style={liveBadgeStyle}>● Active Core Grid</span>
        </div>

        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={tableHeaderRowStyle}>
                <th style={thStyle}>Property</th>
                <th style={thStyle}>Location</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Rent</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style={tableDataRowStyle}>
                <td style={{ ...tdStyle, color: '#888', fontWeight: 'bold' }}>PROP-001</td>
                <td style={tdStyle}>Tshabalala, Bulawayo</td>
                <td style={tdStyle}>Single Room</td>
                <td style={{ ...tdStyle, color: '#10b981', fontWeight: 'bold' }}>$60/mo</td>
                <td><span style={greenBadgeStyle}>Available</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={formWrapperCardStyle}>
          <h2 style={formTitleStyle}>List a new vacant room</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <select name="city" value={formData.city} onChange={handleChange} required style={inputBoxStyle}>
              <option value="">Select City Location...</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="text" name="suburb" value={formData.suburb} onChange={handleChange} placeholder="Suburb (e.g. Tshabalala)" style={inputBoxStyle} />
            <input type="text" name="room_type" value={formData.room_type} onChange={handleChange} placeholder="Room Setup Type (e.g. Single Room)" required style={inputBoxStyle} />
            <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="Monthly Rent Price (USD)" required style={inputBoxStyle} />
            <input type="tel" name="whatsapp_number" value={formData.whatsapp_number} onChange={handleChange} placeholder="WhatsApp Contact Number (07...)" required style={inputBoxStyle} />

            <div style={{ backgroundColor: '#0d0d0d', padding: '14px', borderRadius: '10px', border: '1px solid #222' }}>
              <label style={checkboxLabelStyle}><input type="checkbox" name="has_borehole" checked={formData.has_borehole} onChange={handleChange} style={checkboxStyle} /> Borehole clean water source</label>
              <label style={checkboxLabelStyle}><input type="checkbox" name="has_municipal_water" checked={formData.has_municipal_water} onChange={handleChange} style={checkboxStyle} /> Council municipal water line</label>
              <label style={checkboxLabelStyle}><input type="checkbox" name="has_electricity" checked={formData.has_electricity} onChange={handleChange} style={checkboxStyle} /> Constant solar electrical backup</label>
            </div>

            <button type="submit" disabled={status === "submitting"} style={submitPillBtnStyle}> Save Property Listing</button>
            {status === "success" && <div style={{ color: '#10b981', fontWeight: 'bold', textAlign: 'center' }}>✅ Property successfully registered live!</div>}
            {status === "error" && <div style={{ color: '#ef4444', textAlign: 'center' }}>⚠️ Denied: {errorMessage}</div>}
          </form>
        </div>

      </div>
    </div>
  );
}

const panelBgStyle = { backgroundColor: '#0d0d0d', minHeight: '100vh', color: '#ffffff', padding: '32px 16px', fontFamily: 'sans-serif' };
const panelContainerStyle = { maxWidth: '480px', margin: '0 auto', paddingBottom: '80px' };
const sectionHeadingStyle = { fontSize: '1.6rem', fontWeight: '900', margin: 0 };
const liveBadgeStyle = { backgroundColor: '#142834', color: '#38bdf8', padding: '4px 12px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: '700' };
const tableWrapperStyle = { backgroundColor: '#141414', border: '1px solid #222', borderRadius: '14px', padding: '12px', marginBottom: '24px', overflowX: 'auto' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', minWidth: '400px' };
const tableHeaderRowStyle = { borderBottom: '1px solid #222' };
const thStyle = { padding: '10px', fontSize: '0.75rem', color: '#666', textTransform: 'uppercase' };
const tableDataRowStyle = { borderBottom: '1px solid #1a1a1a' };
const tdStyle = { padding: '12px 10px', fontSize: '0.85rem' };
const greenBadgeStyle = { backgroundColor: '#142d20', color: '#10b981', padding: '4px 10px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '700' };
const formWrapperCardStyle = { backgroundColor: '#141414', border: '1px solid #222', borderRadius: '20px', padding: '24px' };
const formTitleStyle = { fontSize: '1.2rem', fontWeight: '800', marginBottom: '16px' };
const inputBoxStyle = { width: '100%', padding: '12px', backgroundColor: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' };
const checkboxLabelStyle = { display: 'flex', alignItems: 'center', gap: '10px', color: '#e5e7eb', fontSize: '0.85rem', marginBottom: '10px', cursor: 'pointer' };
const checkboxStyle = { width: '16px', height: '16px', accentColor: '#38bdf8' };
const submitPillBtnStyle = { display: 'block', width: '100%', padding: '14px', backgroundColor: '#38bdf8', color: '#000000', border: 'none', borderRadius: '24px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer' };