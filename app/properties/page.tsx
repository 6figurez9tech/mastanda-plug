"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";

interface PropertyListing {
  id: string | number;
  created_at?: string;
  room_type: string;
  suburb?: string | null;
  city: string;
  price: number | string;
  has_borehole?: boolean;
  has_municipal_water?: boolean;
  has_solar_backup?: boolean;
  has_electricity?: boolean;
  whatsapp_number: string;
  status?: string;
}

interface PropertyFormData {
  whatsapp_number: string;
  city: string;
  suburb: string;
  room_type: string;
  price: string;
  status: string;
}

const CITIES = ["Harare", "Bulawayo", "Mutare", "Gweru"];
const STATUSES = ["All statuses", "Available", "Occupied"];
const ROOM_TYPES = [
  "Single Room",
  "1 Bedroom Apartment",
  "2-Room Flat",
  "Cottage",
];

export default function PropertiesDashboard() {
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [statusLoading, setStatusLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All statuses");
  const [filterCity, setFilterCity] = useState("All cities");
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);

  // 1. Toggle States Strategy
  const [showIntake, setShowIntake] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formData, setFormData] = useState<PropertyFormData>({
    whatsapp_number: "",
    city: "Harare",
    suburb: "",
    room_type: "Single Room",
    price: "",
    status: "Available",
  });

  const [has_borehole, setHasBorehole] = useState(false);
  const [has_municipal_water, setHasMunicipalWater] = useState(false);
  const [has_solar_backup, setHasSolarBackup] = useState(false);

  const fetchProperties = async () => {
    const { data, error } = await supabase
      .from("landlord_listings")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProperties(data as PropertyListing[]);
    }
    setStatusLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("landlord_listings")
        .select("*")
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (!error && data) {
        setProperties(data as PropertyListing[]);
      }
      setStatusLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  let filteredProperties = properties;
  if (searchTerm.trim() !== "") {
    const term = searchTerm.toLowerCase();
    filteredProperties = filteredProperties.filter(p => {
      const idStr = p.id ? p.id.toString().toLowerCase() : "";
      const propCode = "prop-" + idStr.padStart(3, "0");
      const suburb = p.suburb ? p.suburb.toLowerCase() : "";
      const city = p.city ? p.city.toLowerCase() : "";
      const roomType = p.room_type ? p.room_type.toLowerCase() : "";
      return (
        idStr.includes(term) ||
        propCode.includes(term) ||
        suburb.includes(term) ||
        city.includes(term) ||
        roomType.includes(term)
      );
    });
  }

  if (filterStatus !== "All statuses") {
    filteredProperties = filteredProperties.filter(
      p => (p.status || "Available") === filterStatus
    );
  }

  if (filterCity !== "All cities") {
    filteredProperties = filteredProperties.filter(p => p.city === filterCity);
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
    const rentPrice = parseFloat(formData.price);

    const { error } = await supabase.from("landlord_listings").insert([
      {
        whatsapp_number: cleanPhone,
        city: formData.city,
        suburb: formData.suburb.trim() || null,
        room_type: formData.room_type,
        price: rentPrice,
        has_borehole,
        has_municipal_water,
        has_solar_backup,
        has_electricity: has_solar_backup,
      },
    ]);

    if (error) {
      setSubmitError(error.message);
      return;
    }

    setFormData({
      whatsapp_number: "",
      city: "Harare",
      suburb: "",
      room_type: "Single Room",
      price: "",
      status: "Available",
    });
    setHasBorehole(false);
    setHasMunicipalWater(false);
    setHasSolarBackup(false);
    fetchProperties();
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
      <style>{`
        .filter-suite-responsive {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
          width: 100%;
        }
        @media (min-width: 768px) {
          .filter-suite-responsive {
            flex-direction: row;
            align-items: center;
          }
          .filter-search-box {
            flex: 2;
          }
          .filter-dropdown-box {
            flex: 1;
            min-width: 180px;
          }
        }
      `}</style>
      <div style={appContainerStyle}>
        {selectedProperty ? (
          /* SINGLE PROFILE VIEWER SHEET MODAL LAYER */
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
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
                  Properties
                </span>
                <h2
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "800",
                    margin: "4px 0 0 0",
                    color: "#ffffff",
                  }}
                >
                  PROP-{selectedProperty.id.toString().padStart(3, "0")} · {selectedProperty.room_type}
                </h2>
              </div>
              <a
                href={whatsappLink(
                  selectedProperty.whatsapp_number,
                  `Hi! I saw your property listing in ${selectedProperty.suburb || selectedProperty.city} on Mastanda Plug.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                style={messageTenantPillBtn}
              >
                Message landlord
              </a>
            </div>

            <div style={detailInnerCardBoxStyle}>
              <div style={metaFieldGroup}>
                <span style={metaFieldLabel}>Location</span>
                <span style={metaFieldValue}>
                  {selectedProperty.suburb ? `${selectedProperty.suburb}, ` : ""}{selectedProperty.city}
                </span>
              </div>
              <div style={metaFieldGroup}>
                <span style={metaFieldLabel}>Room type</span>
                <span style={metaFieldValue}>{selectedProperty.room_type}</span>
              </div>
              <div style={metaFieldGroup}>
                <span style={metaFieldLabel}>Monthly rent</span>
                <span style={{ ...metaFieldValue, color: "#10b981" }}>
                  ${selectedProperty.price}/month
                </span>
              </div>
              <div style={metaFieldGroup}>
                <span style={metaFieldLabel}>Listing status</span>
                <span style={metaFieldValue}>{selectedProperty.status || "Available"}</span>
              </div>
              <div style={metaFieldGroup}>
                <span style={metaFieldLabel}>WhatsApp</span>
                <span style={{ ...metaFieldValue, color: "#38bdf8" }}>
                  +{selectedProperty.whatsapp_number}
                </span>
              </div>
              <div style={metaFieldGroup}>
                <span style={metaFieldLabel}>Utilities included</span>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                  {selectedProperty.has_borehole && (
                    <span style={utilityBadgeStyle}>🚰 Borehole</span>
                  )}
                  {selectedProperty.has_municipal_water && (
                    <span style={utilityBadgeStyle}>🏢 Council</span>
                  )}
                  {(selectedProperty.has_solar_backup || selectedProperty.has_electricity) && (
                    <span style={utilityBadgeStyle}>💡 Solar</span>
                  )}
                  {!selectedProperty.has_borehole &&
                    !selectedProperty.has_municipal_water &&
                    !selectedProperty.has_solar_backup &&
                    !selectedProperty.has_electricity && (
                      <span style={{ color: "#777", fontSize: "0.85rem" }}>None specified</span>
                    )}
                </div>
              </div>
            </div>
            <div onClick={() => setSelectedProperty(null)} style={closeDetailPanelBtn}>
              ← Back to Properties Grid
            </div>
          </div>
        ) : (
          /* DYNAMIC HORIZONTAL SEARCH ROW MATRIX */
          <>
            {/* 1. Toggle States Header */}
            <div style={headerRowStyle}>
              <h1 style={titleStyle}>Properties</h1>
              <div
                onClick={() => setShowIntake(!showIntake)}
                style={{
                  backgroundColor: showIntake ? "#1f2937" : "#217d9d",
                  color: "#ffffff",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: "24px",
                  fontWeight: "700",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  transition: "background-color 0.2s ease",
                }}
              >
                {showIntake ? "✕ Close Intake" : "＋ Quick Property Intake"}
              </div>
            </div>

            {/* 4. Uniform Tracker Grid Filters: Search by name or ID, All statuses, All cities */}
            <div className="filter-suite-responsive" style={filterSuiteContainerStyle}>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by name or ID"
                style={searchBarFieldStyle}
                className="filter-search-box"
              />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={dropdownWidgetStyle}
                className="filter-dropdown-box"
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
                className="filter-dropdown-box"
              >
                <option value="All cities">All cities</option>
                {CITIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Structured Charcoal #141414 Table Schema */}
            <div style={tableViewportOuterWrapper}>
              <div style={scrollContainerIndicator}>
                <table style={mainDataTableLayout}>
                  <thead>
                    <tr style={tableHeaderRowStyle}>
                      <th style={thColumnHeadingStyle}>Property ↕</th>
                      <th style={thColumnHeadingStyle}>Location ↕</th>
                      <th style={thColumnHeadingStyle}>Type ↕</th>
                      <th style={thColumnHeadingStyle}>Rent ↕</th>
                      <th style={thColumnHeadingStyle}>Utilities ↕</th>
                      <th style={thColumnHeadingStyle}>Status ↕</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusLoading ? (
                      <tr>
                        <td
                          colSpan={6}
                          style={{ padding: "20px", color: "#666", textAlign: "center" }}
                        >
                          Loading...
                        </td>
                      </tr>
                    ) : filteredProperties.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          style={{ padding: "20px", color: "#666", textAlign: "center" }}
                        >
                          No active records found.
                        </td>
                      </tr>
                    ) : (
                      filteredProperties.map(item => (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedProperty(item)}
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
                            PROP-{item.id.toString().padStart(3, "0")}
                          </td>
                          <td style={tdCellStyle}>
                            {item.suburb ? `${item.suburb}, ` : ""}{item.city}
                          </td>
                          <td style={tdCellStyle}>{item.room_type}</td>
                          <td style={tdCellStyle}>${item.price}/mo</td>
                          <td style={tdCellStyle}>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                              {item.has_borehole && (
                                <span style={utilityBadgeStyle}>🚰 Borehole</span>
                              )}
                              {item.has_municipal_water && (
                                <span style={utilityBadgeStyle}>🏢 Council</span>
                              )}
                              {(item.has_solar_backup || item.has_electricity) && (
                                <span style={utilityBadgeStyle}>💡 Solar</span>
                              )}
                              {!item.has_borehole &&
                                !item.has_municipal_water &&
                                !item.has_solar_backup &&
                                !item.has_electricity && (
                                  <span style={{ color: "#666", fontSize: "0.75rem" }}>—</span>
                                )}
                            </div>
                          </td>
                          <td style={tdCellStyle}>
                            <span
                              style={
                                item.status === "Occupied"
                                  ? occupiedBadgeStyle
                                  : availableBadgeStyle
                              }
                            >
                              {item.status || "Available"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Identical Form Elements & 3. Utility Matrix Checkboxes */}
            {showIntake && (
              <div style={formCardStyle}>
                <h2 style={formTitleStyle}>Quick property intake</h2>
                <p style={formSubtitleStyle}>
                  Capture a landlord listing and add it to the matching queue
                </p>

                <form onSubmit={handleFormSubmit} style={formGridStructure}>
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
                      name="suburb"
                      value={formData.suburb}
                      onChange={handleInputChange}
                      placeholder="e.g. Avondale"
                      style={inputBoxStyle}
                    />
                  </div>

                  <div style={fieldBlockStyle}>
                    <label style={labelStyle}>Room type</label>
                    <select
                      name="room_type"
                      value={formData.room_type}
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
                    <label style={labelStyle}>Monthly rent price (USD)</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="e.g. 150"
                      min="0"
                      step="1"
                      required
                      style={inputBoxStyle}
                    />
                  </div>

                  {/* 3. Utility Matrix Checkboxes inside dark #0d0d0d background */}
                  <div style={utilityCardBoxStyle}>
                    <label style={checkboxLabelStyle}>
                      <input
                        type="checkbox"
                        checked={has_borehole}
                        onChange={e => setHasBorehole(e.target.checked)}
                        style={checkboxStyle}
                      />
                      Borehole clean water source
                    </label>
                    <label style={checkboxLabelStyle}>
                      <input
                        type="checkbox"
                        checked={has_municipal_water}
                        onChange={e => setHasMunicipalWater(e.target.checked)}
                        style={checkboxStyle}
                      />
                      Council municipal water line
                    </label>
                    <label style={{ ...checkboxLabelStyle, marginBottom: 0 }}>
                      <input
                        type="checkbox"
                        checked={has_solar_backup}
                        onChange={e => setHasSolarBackup(e.target.checked)}
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
                    Save property profile
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

// 1. Layout Sizing Constraints: Scale up to spacious widescreen dashboard boundary of maxWidth: '1200px'
const appContainerStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "0 16px",
  width: "100%",
  boxSizing: "border-box",
};

const panelContainerStyle = appContainerStyle;

const headerRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
  width: "100%",
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
  width: "100%",
};

// Data Table Structure
const tableViewportOuterWrapper: React.CSSProperties = {
  backgroundColor: "#141414",
  border: "1px solid #1f1f1f",
  borderRadius: "16px",
  overflow: "hidden",
  marginBottom: "24px",
  width: "100%",
  boxSizing: "border-box",
};

const scrollContainerIndicator: React.CSSProperties = {
  overflowX: "auto",
  WebkitOverflowScrolling: "touch",
  width: "100%",
};

const mainDataTableLayout: React.CSSProperties = {
  width: "100%",
  minWidth: "600px",
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

const availableBadgeStyle: React.CSSProperties = {
  ...baseBadgeStyle,
  backgroundColor: "#132f1d",
  color: "#10b981",
};

const occupiedBadgeStyle: React.CSSProperties = {
  ...baseBadgeStyle,
  backgroundColor: "#2a2a2a",
  color: "#888888",
};

const utilityBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "3px 8px",
  borderRadius: "8px",
  fontSize: "0.7rem",
  fontWeight: "700",
  backgroundColor: "#13232d",
  color: "#38bdf8",
  border: "1px solid #1e3a4b",
  whiteSpace: "nowrap",
};

// 2. Responsive Adjustments: Expand 'Quick property intake' container to maxWidth: '1000px'
const formCardStyle: React.CSSProperties = {
  backgroundColor: "#111111",
  border: "1px solid #222",
  borderRadius: "20px",
  padding: "24px",
  marginBottom: "24px",
  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)",
  maxWidth: "1000px",
  width: "100%",
  margin: "0 auto 24px auto",
  boxSizing: "border-box",
};

const formWrapperCardStyle = formCardStyle;

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
  backgroundColor: "#0d0d0d",
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

// force clean cache bypass production deploy
