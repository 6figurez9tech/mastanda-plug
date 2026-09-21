"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";

interface TenantRequest {
  id: string | number;
  name: string;
  city: string;
  preferred_suburb?: string | null;
  room_type_wanted: string;
  max_price: number | string;
  whatsapp_number: string;
  status: string;
  needs_borehole?: boolean;
  needs_municipal_water?: boolean;
  needs_solar_backup?: boolean;
  created_at?: string;
}

interface TenantFormData {
  name: string;
  city: string;
  preferred_suburb: string;
  room_type_wanted: string;
  max_price: string;
  whatsapp_number: string;
  status: string;
}

const CITIES = ["Harare", "Bulawayo", "Mutare", "Gweru"];
const STATUSES = ["All statuses", "Searching", "Matched", "Placed"];
const ROOM_TYPES = ["Single Room", "Shared Room", "Bedsitter", "1 Bedroom Apartment"];

export default function TenantDashboard() {
  const [tenants, setTenants] = useState<TenantRequest[]>([]);
  const [statusLoading, setStatusLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All statuses");
  const [filterCity, setFilterCity] = useState("All cities");
  const [selectedTenant, setSelectedTenant] = useState<TenantRequest | null>(null);

  const [formData, setFormData] = useState<TenantFormData>({
    name: "",
    city: "Harare",
    preferred_suburb: "",
    room_type_wanted: "Single Room",
    max_price: "",
    whatsapp_number: "",
    status: "Searching",
  });

  const [needs_borehole, setNeedsBorehole] = useState(false);
  const [needs_municipal_water, setNeedsMunicipalWater] = useState(false);
  const [needs_solar_backup, setNeedsSolarBackup] = useState(false);

  const [showForm, setShowForm] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchTenants = async () => {
    const { data, error } = await supabase
      .from("tenant_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTenants(data as TenantRequest[]);
    }
    setStatusLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("tenant_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (!error && data) {
        setTenants(data as TenantRequest[]);
      }
      setStatusLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  let filteredTenants = tenants;
  if (searchTerm.trim() !== "") {
    const term = searchTerm.toLowerCase();
    filteredTenants = filteredTenants.filter(
      t =>
        (t.name && t.name.toLowerCase().includes(term)) ||
        (t.id && t.id.toString().includes(term))
    );
  }
  if (filterStatus !== "All statuses") {
    filteredTenants = filteredTenants.filter(t => t.status === filterStatus);
  }
  if (filterCity !== "All cities") {
    filteredTenants = filteredTenants.filter(t => t.city === filterCity);
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    const cleanPhone = String(formData.whatsapp_number || "").replace(/[^0-9]/g, "");
    const maxPrice = parseFloat(formData.max_price);

    const { error } = await supabase.from("tenant_requests").insert([
      {
        name: formData.name,
        city: formData.city,
        preferred_suburb: formData.preferred_suburb || null,
        room_type_wanted: formData.room_type_wanted,
        max_price: maxPrice,
        whatsapp_number: cleanPhone,
        status: formData.status,
        needs_borehole,
        needs_municipal_water,
        needs_solar_backup,
      },
    ]);

    if (error) {
      setSubmitError(error.message);
      return;
    }
    setFormData({
      name: "",
      city: "Harare",
      preferred_suburb: "",
      room_type_wanted: "Single Room",
      max_price: "",
      whatsapp_number: "",
      status: "Searching",
    });
    setNeedsBorehole(false);
    setNeedsMunicipalWater(false);
    setNeedsSolarBackup(false);
    fetchTenants();
  };

  const whatsappLink = (number: string | number, message: string) => {
    let cleanNumber = String(number || "").replace(/[^0-9]/g, "");
    if (cleanNumber.startsWith("07")) cleanNumber = "263" + cleanNumber.substring(1);
    if (cleanNumber.length === 9 && cleanNumber.startsWith("7"))
      cleanNumber = "263" + cleanNumber;
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div style={panelBgStyle}>
      <div style={panelContainerStyle}>
        {selectedTenant ? (
          /* SINGLE PROFILE VIEWER SHEET MODAL LAYER */
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
                paddingBottom: "12px",
                borderBottom: "1px solid #222",
              }}
            >
              <div>
                <span style={{ fontSize: "0.8rem", color: "#666", fontWeight: "bold" }}>
                  Tenants
                </span>
                <h2
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "800",
                    margin: "4px 0 0 0",
                    color: "#ffffff",
                  }}
                >
                  TEN-{selectedTenant.id.toString().padStart(3, "0")} · {selectedTenant.name}
                </h2>
              </div>
              <a
                href={whatsappLink(
                  selectedTenant.whatsapp_number,
                  `Hi ${selectedTenant.name}! I saw your request on Mastanda Plug.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                style={messageTenantPillBtn}
              >
                Message tenant
              </a>
            </div>

            <div style={detailInnerCardBoxStyle}>
              <div style={metaFieldGroup}>
                <span style={metaFieldLabel}>Search location</span>
                <span style={metaFieldValue}>
                  {selectedTenant.preferred_suburb || "Any Area"}, {selectedTenant.city}
                </span>
              </div>
              <div style={metaFieldGroup}>
                <span style={metaFieldLabel}>Room need</span>
                <span style={metaFieldValue}>{selectedTenant.room_type_wanted}</span>
              </div>
              <div style={metaFieldGroup}>
                <span style={metaFieldLabel}>Minimum bedrooms</span>
                <span style={metaFieldValue}>1</span>
              </div>
              <div style={metaFieldGroup}>
                <span style={metaFieldLabel}>Maximum budget</span>
                <span style={{ ...metaFieldValue, color: "#10b981" }}>
                  ${selectedTenant.max_price}/month
                </span>
              </div>
              <div style={metaFieldGroup}>
                <span style={metaFieldLabel}>Profile status</span>
                <span style={metaFieldValue}>{selectedTenant.status}</span>
              </div>
              <div style={metaFieldGroup}>
                <span style={metaFieldLabel}>WhatsApp</span>
                <span style={{ ...metaFieldValue, color: "#38bdf8" }}>
                  +{selectedTenant.whatsapp_number}
                </span>
              </div>
            </div>
            <div onClick={() => setSelectedTenant(null)} style={closeDetailPanelBtn}>
              ← Back to Tenant Grid
            </div>
          </div>
        ) : (
          /* DYNAMIC HORIZONTAL SEARCH ROW MATRIX */
          <>
            <div style={headerRowStyle}>
              <h1 style={titleStyle}>Tenants</h1>
              <div
                onClick={() => setShowForm(!showForm)}
                style={{
                  backgroundColor: "#217d9d",
                  color: "#ffffff",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: "24px",
                  fontWeight: "700",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                {showForm ? "✕ Close Intake" : "+ Register tenant"}
              </div>
            </div>

            {/* FILTER ROW MATRIX */}
            <div style={filterSuiteContainerStyle}>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by name or ID"
                style={searchBarFieldStyle}
              />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={dropdownWidgetStyle}
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                value={filterCity}
                onChange={e => setFilterCity(e.target.value)}
                style={dropdownWidgetStyle}
              >
                <option value="All cities">All cities</option>
                {CITIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* TABLE LIST VIEWPORT */}
            <div style={tableViewportOuterWrapper}>
              <div style={scrollContainerIndicator}>
                <table style={mainDataTableLayout}>
                  <thead>
                    <tr style={tableHeaderRowStyle}>
                      <th style={thColumnHeadingStyle}>Tenant ↕</th>
                      <th style={thColumnHeadingStyle}>Location ↕</th>
                      <th style={thColumnHeadingStyle}>Budget ↕</th>
                      <th style={thColumnHeadingStyle}>Room Need ↕</th>
                      <th style={thColumnHeadingStyle}>Status ↕</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusLoading ? (
                      <tr>
                        <td
                          colSpan={5}
                          style={{ padding: "20px", color: "#666", textAlign: "center" }}
                        >
                          Loading...
                        </td>
                      </tr>
                    ) : filteredTenants.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          style={{ padding: "20px", color: "#666", textAlign: "center" }}
                        >
                          No active records found.
                        </td>
                      </tr>
                    ) : (
                      filteredTenants.map(item => (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedTenant(item)}
                          style={tableRowStyle}
                        >
                          <td
                            style={{
                              ...tdCellStyle,
                              fontWeight: "bold",
                              color: "#fff",
                              textDecoration: "underline",
                            }}
                          >
                            {item.name}
                          </td>
                          <td style={tdCellStyle}>
                            {item.preferred_suburb || "Any Area"}, {item.city}
                          </td>
                          <td style={tdCellStyle}>${item.max_price}/mo</td>
                          <td style={tdCellStyle}>{item.room_type_wanted}</td>
                          <td style={tdCellStyle}>
                            <span
                              style={
                                item.status === "Matched"
                                  ? matchedBadgeStyle
                                  : item.status === "Placed"
                                  ? placedBadgeStyle
                                  : searchingBadgeStyle
                              }
                            >
                              {item.status || "Searching"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* UPGRADED INTAKE PANEL FORM BOX */}
            {showForm && (
              <div style={formWrapperCardStyle}>
                <h2 style={formTitleStyle}>Quick tenant intake</h2>
                <p style={formSubtitleStyle}>
                  Capture a WhatsApp enquiry and add it to the matching queue.
                </p>

                <form onSubmit={handleFormSubmit} style={formGridStructure}>
                  <div style={fieldBlockStyle}>
                    <label style={labelStyle}>Full name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Sarah Khumalo"
                      required
                      style={inputBoxStyle}
                    />
                  </div>

                  <div style={fieldBlockStyle}>
                    <label style={labelStyle}>WhatsApp number</label>
                    <input
                      type="tel"
                      name="whatsapp_number"
                      value={formData.whatsapp_number}
                      onChange={handleInputChange}
                      placeholder="e.g. 0771234567"
                      required
                      style={inputBoxStyle}
                    />
                    <span style={inputHelpTextStyle}>
                      Include the leading 0, e.g. 0771234567
                    </span>
                  </div>

                  <div style={fieldBlockStyle}>
                    <label style={labelStyle}>Target city</label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      style={inputBoxStyle}
                    >
                      {CITIES.map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={fieldBlockStyle}>
                    <label style={labelStyle}>Target suburb or area</label>
                    <input
                      type="text"
                      name="preferred_suburb"
                      value={formData.preferred_suburb}
                      onChange={handleInputChange}
                      placeholder="e.g. Avondale (optional)"
                      style={inputBoxStyle}
                    />
                  </div>

                  <div style={fieldBlockStyle}>
                    <label style={labelStyle}>Room type wanted</label>
                    <select
                      name="room_type_wanted"
                      value={formData.room_type_wanted}
                      onChange={handleInputChange}
                      required
                      style={inputBoxStyle}
                    >
                      {ROOM_TYPES.map(r => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={fieldBlockStyle}>
                    <label style={labelStyle}>Maximum monthly budget (USD)</label>
                    <input
                      type="number"
                      name="max_price"
                      value={formData.max_price}
                      onChange={handleInputChange}
                      placeholder="e.g. 150"
                      min="0"
                      step="1"
                      required
                      style={inputBoxStyle}
                    />
                  </div>

                  {/* THREE UTILITY PARAMETERS CHECKBOX CARD */}
                  <div style={utilityCardBoxStyle}>
                    <label style={checkboxLabelStyle}>
                      <input
                        type="checkbox"
                        checked={needs_borehole}
                        onChange={e => setNeedsBorehole(e.target.checked)}
                        style={checkboxStyle}
                      />
                      Borehole clean water source
                    </label>
                    <label style={checkboxLabelStyle}>
                      <input
                        type="checkbox"
                        checked={needs_municipal_water}
                        onChange={e => setNeedsMunicipalWater(e.target.checked)}
                        style={checkboxStyle}
                      />
                      Council municipal water line
                    </label>
                    <label style={{ ...checkboxLabelStyle, marginBottom: 0 }}>
                      <input
                        type="checkbox"
                        checked={needs_solar_backup}
                        onChange={e => setNeedsSolarBackup(e.target.checked)}
                        style={checkboxStyle}
                      />
                      Constant solar electrical backup
                    </label>
                  </div>

                  {submitError && (
                    <div style={{ color: "#f87171", fontSize: "0.85rem" }}>
                      {submitError}
                    </div>
                  )}

                  <button type="submit" style={submitPillBtnStyle}>
                    Save tenant profile
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Global Theme/Layout
const panelBgStyle: React.CSSProperties = {
  fontFamily: "sans-serif",
  backgroundColor: "#0d0d0d",
  color: "#ffffff",
  minHeight: "100vh",
  padding: "24px 0 140px 0",
};

const panelContainerStyle: React.CSSProperties = {
  maxWidth: "460px",
  margin: "0 auto",
  padding: "0 14px",
};

const headerRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.6rem",
  fontWeight: "800",
};

// Form Fields & Controls
const searchBarFieldStyle: React.CSSProperties = {
  boxSizing: "border-box",
  width: "100%",
  padding: "12px 16px",
  backgroundColor: "#111111",
  border: "1px solid #222",
  borderRadius: "24px",
  color: "#ffffff",
  fontSize: "0.95rem",
  outline: "none",
};

const dropdownWidgetStyle: React.CSSProperties = {
  ...searchBarFieldStyle,
  appearance: "none",
};

const filterSuiteContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  marginBottom: "24px",
};

// Data Table Structure
const tableViewportOuterWrapper: React.CSSProperties = {
  backgroundColor: "#121212",
  border: "1px solid #1f1f1f",
  borderRadius: "16px",
  overflow: "hidden",
  marginBottom: "24px",
};

const scrollContainerIndicator: React.CSSProperties = {
  overflowX: "auto",
  WebkitOverflowScrolling: "touch",
};

const mainDataTableLayout: React.CSSProperties = {
  width: "100%",
  minWidth: "440px",
  borderCollapse: "collapse",
  textAlign: "left",
};

const tableHeaderRowStyle: React.CSSProperties = {
  backgroundColor: "#161616",
  borderBottom: "1px solid #1f1f1f",
};

const thColumnHeadingStyle: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: "0.75rem",
  fontWeight: "700",
  color: "#777777",
  textTransform: "uppercase",
};

const tableRowStyle: React.CSSProperties = {
  borderBottom: "1px solid #161616",
  cursor: "pointer",
};

const tdCellStyle: React.CSSProperties = {
  padding: "14px",
  fontSize: "0.85rem",
  color: "#cccccc",
};

// Status Badges (Base & Variants)
const baseBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 12px",
  borderRadius: "12px",
  fontSize: "0.75rem",
  fontWeight: "700",
};

const searchingBadgeStyle: React.CSSProperties = {
  ...baseBadgeStyle,
  backgroundColor: "#3a230f",
  color: "#f59e0b",
};

const matchedBadgeStyle: React.CSSProperties = {
  ...baseBadgeStyle,
  backgroundColor: "#181b3d",
  color: "#6366f1",
};

const placedBadgeStyle: React.CSSProperties = {
  ...baseBadgeStyle,
  backgroundColor: "#132f1d",
  color: "#10b981",
};

// Card & Form Layouts
const formWrapperCardStyle: React.CSSProperties = {
  backgroundColor: "#111111",
  border: "1px solid #222",
  borderRadius: "20px",
  padding: "24px",
  marginBottom: "24px",
  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)",
};

const formTitleStyle: React.CSSProperties = {
  margin: "0 0 4px 0",
  color: "#ffffff",
  fontSize: "1.25rem",
  fontWeight: "800",
};

const formSubtitleStyle: React.CSSProperties = {
  margin: "0 0 20px 0",
  color: "#888888",
  fontSize: "0.85rem",
  lineHeight: "1.4",
};

const formGridStructure: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const fieldBlockStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  fontWeight: "600",
  color: "#ffffff",
};

const inputBoxStyle: React.CSSProperties = {
  boxSizing: "border-box",
  width: "100%",
  padding: "12px",
  backgroundColor: "#1e1e1e",
  border: "1px solid #2a2a2a",
  borderRadius: "10px",
  color: "#fff",
  fontSize: "0.95rem",
  outline: "none",
};

const inputHelpTextStyle: React.CSSProperties = {
  marginTop: "2px",
  color: "#666666",
  fontSize: "0.75rem",
};

const utilityCardBoxStyle: React.CSSProperties = {
  backgroundColor: "#141414",
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid #222222",
};

const checkboxLabelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  color: "#e5e7eb",
  fontSize: "0.85rem",
  marginBottom: "10px",
  cursor: "pointer",
};

const checkboxStyle: React.CSSProperties = {
  width: "16px",
  height: "16px",
  accentColor: "#217d9d",
  cursor: "pointer",
};

// Buttons & Actions
const baseButtonStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "14px",
  border: "none",
  borderRadius: "24px",
  fontSize: "0.95rem",
  fontWeight: "700",
  cursor: "pointer",
  textAlign: "center",
};

const submitPillBtnStyle: React.CSSProperties = {
  ...baseButtonStyle,
  backgroundColor: "#217d9d",
  color: "#ffffff",
};

const messageTenantPillBtn: React.CSSProperties = {
  ...baseButtonStyle,
  display: "inline-block",
  width: "auto",
  padding: "10px 20px",
  backgroundColor: "#217d9d",
  color: "#ffffff",
  textDecoration: "none",
  fontSize: "0.85rem",
};

const closeDetailPanelBtn: React.CSSProperties = {
  ...baseButtonStyle,
  padding: "12px",
  backgroundColor: "#222",
  color: "#fff",
  borderRadius: "20px",
  fontWeight: "600",
  fontSize: "0.9rem",
};

// Detail Displays
const detailInnerCardBoxStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  backgroundColor: "#141414",
  border: "1px solid #222",
  borderRadius: "18px",
  padding: "20px",
  marginBottom: "24px",
};

const metaFieldGroup: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const metaFieldLabel: React.CSSProperties = {
  fontSize: "0.8rem",
  fontWeight: "600",
  color: "#555555",
};

const metaFieldValue: React.CSSProperties = {
  fontSize: "1.05rem",
  fontWeight: "700",
  color: "#ffffff",
};
