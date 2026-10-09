"use client";

import React, { useState, useEffect, useRef } from "react";
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
const PROPERTY_TYPES = [
  "Single Room / Bed Sitter",
  "Cottage",
  "Apartment",
  "Town House",
  "Standalone House",
  "Luxury Villa",
];

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

  const getTriggerStyle = (): React.CSSProperties => ({
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

export default function PropertiesDashboard() {
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

  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [statusLoading, setStatusLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All statuses");
  const [filterCity, setFilterCity] = useState("All cities");
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);

  const [showIntake, setShowIntake] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formData, setFormData] = useState<PropertyFormData>({
    whatsapp_number: "",
    city: "Harare",
    suburb: "",
    room_type: "Single Room / Bed Sitter",
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
      room_type: "Single Room / Bed Sitter",
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

  // Theme-aware style helpers
  const getPanelBgStyle = (): React.CSSProperties => ({
    fontFamily: "sans-serif",
    backgroundColor: isDarkMode ? "#0d0d0d" : "#f8f9fa",
    minHeight: "100vh",
    height: "auto",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    margin: 0,
    padding: "0 16px var(--bottom-nav-clearance) 16px",
    color: isDarkMode ? "#ffffff" : "#212529",
    flex: 1,
    boxSizing: "border-box" as const,
  });

  const getAppContainerStyle = () => ({
    width: "100%",
    maxWidth: "430px",
    margin: "0 auto",
    boxSizing: "border-box" as const,
    position: "relative" as const,
  });

  const getHeaderRowStyle = () => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "16px",
    marginBottom: "20px",
    width: "100%",
  });

  const getTitleStyle = () => ({
    margin: 0,
    fontSize: "1.4rem",
    fontWeight: "800",
  });

  const getSearchBarFieldStyle = (): React.CSSProperties => ({
    boxSizing: "border-box",
    width: "100%",
    padding: "12px 16px",
    backgroundColor: isDarkMode ? "#111111" : "#f1f3f5",
    border: isDarkMode ? "1px solid #222" : "1px solid #e9ecef",
    borderRadius: "24px",
    color: isDarkMode ? "#ffffff" : "#212529",
    fontSize: "0.95rem",
    outline: "none",
  });

  const getFilterSuiteContainerStyle = (): React.CSSProperties => ({
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "24px",
    width: "100%",
  });

  const getTableViewportOuterWrapper = (): React.CSSProperties => ({
    backgroundColor: isDarkMode ? "#141414" : "#ffffff",
    border: isDarkMode ? "1px solid #1f1f1f" : "1px solid #e9ecef",
    borderRadius: "16px",
    overflow: "hidden",
    marginBottom: "24px",
    width: "100%",
    boxSizing: "border-box",
  });

  const getScrollContainerIndicator = (): React.CSSProperties => ({
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    width: "100%",
  });

  const getMainDataTableLayout = (): React.CSSProperties => ({
    width: "100%",
    minWidth: "600px",
    borderCollapse: "collapse",
    textAlign: "left",
  });

  const getTableHeaderRowStyle = () => ({
    backgroundColor: isDarkMode ? "#161616" : "#f8f9fa",
    borderBottom: isDarkMode ? "1px solid #1f1f1f" : "1px solid #e9ecef",
  });

  const getThColumnHeadingStyle = () => ({
    padding: "12px 14px",
    fontSize: "0.75rem",
    fontWeight: "700",
    color: isDarkMode ? "#777777" : "#6c757d",
    textTransform: "uppercase",
  });

  const getTableRowStyle = () => ({
    borderBottom: isDarkMode ? "1px solid #161616" : "1px solid #e9ecef",
    cursor: "pointer",
  });

  const getTdCellStyle = () => ({
    padding: "14px",
    fontSize: "0.85rem",
    color: isDarkMode ? "#cccccc" : "#495057",
  });

  const getBaseBadgeStyle = () => ({
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "700",
  });

  const getAvailableBadgeStyle = () => ({
    ...getBaseBadgeStyle(),
    backgroundColor: "#132f1d",
    color: "#10b981",
  });

  const getOccupiedBadgeStyle = () => ({
    ...getBaseBadgeStyle(),
    backgroundColor: isDarkMode ? "#2a2a2a" : "#e9ecef",
    color: isDarkMode ? "#888888" : "#6c757d",
  });

  const getUtilityBadgeStyle = () => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "3px 8px",
    borderRadius: "8px",
    fontSize: "0.72rem",
    fontWeight: "700",
    backgroundColor: "#13232d",
    color: "#38bdf8",
    border: "1px solid #1e3a4b",
    whiteSpace: "nowrap",
  });

  const getFormCardStyle = (): React.CSSProperties => ({
    backgroundColor: isDarkMode ? "#141414" : "#ffffff",
    border: isDarkMode ? "1px solid #222" : "1px solid #e9ecef",
    borderRadius: "20px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: isDarkMode ? "0 10px 15px -3px rgba(0,0,0,0.3)" : "0 10px 15px -3px rgba(0,0,0,0.1)",
    width: "100%",
    boxSizing: "border-box",
  });

  const getFormTitleStyle = () => ({
    margin: "0 0 4px 0",
    color: isDarkMode ? "#ffffff" : "#212529",
    fontSize: "1.4rem",
    fontWeight: "800",
  });

  const getFormSubtitleStyle = () => ({
    margin: "0 0 20px 0",
    color: isDarkMode ? "#888888" : "#6c757d",
    fontSize: "0.85rem",
    lineHeight: "1.4",
  });

  const getFormGridStructure = (): React.CSSProperties => ({
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  });

  const getFieldBlockStyle = (): React.CSSProperties => ({
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  });

  const getLabelStyle = () => ({
    fontSize: "0.85rem",
    fontWeight: "600",
    color: isDarkMode ? "#ffffff" : "#212529",
  });

  const getInputBoxStyle = (): React.CSSProperties => ({
    boxSizing: "border-box",
    width: "100%",
    padding: "12px",
    backgroundColor: isDarkMode ? "#1a1a1a" : "#f1f3f5",
    border: isDarkMode ? "1px solid #2a2a2a" : "1px solid #e9ecef",
    borderRadius: "10px",
    color: isDarkMode ? "#fff" : "#212529",
    fontSize: "0.95rem",
    outline: "none",
  });

  const getInputHelpTextStyle = () => ({
    marginTop: "2px",
    color: isDarkMode ? "#666666" : "#6c757d",
    fontSize: "0.75rem",
  });

  const getUtilityCardBoxStyle = () => ({
    backgroundColor: isDarkMode ? "#0d0d0d" : "#f8f9fa",
    padding: "14px",
    borderRadius: "10px",
    border: isDarkMode ? "1px solid #222222" : "1px solid #e9ecef",
  });

  const getCheckboxLabelStyle = () => ({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: isDarkMode ? "#e5e7eb" : "#212529",
    fontSize: "0.85rem",
    marginBottom: "10px",
    cursor: "pointer",
  });

  const getCheckboxStyle = () => ({
    width: "16px",
    height: "16px",
    accentColor: "#217d9d",
    cursor: "pointer",
  });

  const getBaseButtonStyle = (): React.CSSProperties => ({
    display: "block",
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "24px",
    fontSize: "0.95rem",
    fontWeight: "700",
    cursor: "pointer",
    textAlign: "center",
  });

  const getSubmitPillBtnStyle = (): React.CSSProperties => ({
    ...getBaseButtonStyle(),
    backgroundColor: "#217d9d",
    color: "#ffffff",
  });

  const getMessageTenantPillBtn = (): React.CSSProperties => ({
    ...getBaseButtonStyle(),
    display: "inline-block",
    width: "auto",
    padding: "10px 20px",
    backgroundColor: "#217d9d",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "0.85rem",
  });

  const getCloseDetailPanelBtn = (): React.CSSProperties => ({
    ...getBaseButtonStyle(),
    padding: "12px",
    backgroundColor: isDarkMode ? "#222" : "#e9ecef",
    color: isDarkMode ? "#fff" : "#212529",
    borderRadius: "20px",
    fontWeight: "600",
    fontSize: "0.9rem",
  });

  const getDetailInnerCardBoxStyle = (): React.CSSProperties => ({
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    backgroundColor: isDarkMode ? "#141414" : "#ffffff",
    border: isDarkMode ? "1px solid #222" : "1px solid #e9ecef",
    borderRadius: "18px",
    padding: "20px",
    marginBottom: "24px",
  });

  const getMetaFieldGroup = (): React.CSSProperties => ({
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  });

  const getMetaFieldLabel = () => ({
    fontSize: "0.8rem",
    fontWeight: "600",
    color: isDarkMode ? "#555555" : "#6c757d",
  });

  const getMetaFieldValue = () => ({
    fontSize: "0.92rem",
    fontWeight: "700",
    color: isDarkMode ? "#ffffff" : "#212529",
  });

  return (
    <div style={getPanelBgStyle()}>
      <style>{`
        .filter-suite-responsive {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
          width: 100%;
        }
      `}</style>
      <div style={getAppContainerStyle()}>
        {selectedProperty ? (
          <div style={{ maxWidth: "430px", margin: "0 auto" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
                paddingBottom: "12px",
                borderBottom: isDarkMode ? "1px solid #222" : "1px solid #e9ecef",
              }}
            >
              <div>
                <span style={{ fontSize: "0.8rem", color: isDarkMode ? "#666" : "#6c757d", fontWeight: "bold" }}>
                  Properties
                </span>
                <h2
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: "800",
                    margin: "4px 0 0 0",
                    color: isDarkMode ? "#ffffff" : "#212529",
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
                style={getMessageTenantPillBtn()}
              >
                Message landlord
              </a>
            </div>

            <div style={getDetailInnerCardBoxStyle()}>
              <div style={getMetaFieldGroup()}>
                <span style={getMetaFieldLabel()}>Location</span>
                <span style={getMetaFieldValue()}>
                  {selectedProperty.suburb ? `${selectedProperty.suburb}, ` : ""}{selectedProperty.city}
                </span>
              </div>
              <div style={getMetaFieldGroup()}>
                <span style={getMetaFieldLabel()}>Property type</span>
                <span style={getMetaFieldValue()}>{selectedProperty.room_type}</span>
              </div>
              <div style={getMetaFieldGroup()}>
                <span style={getMetaFieldLabel()}>Monthly rent</span>
                <span style={{ ...getMetaFieldValue(), color: "#10b981" }}>
                  ${selectedProperty.price}/month
                </span>
              </div>
              <div style={getMetaFieldGroup()}>
                <span style={getMetaFieldLabel()}>Listing status</span>
                <span style={getMetaFieldValue()}>{selectedProperty.status || "Available"}</span>
              </div>
              <div style={getMetaFieldGroup()}>
                <span style={getMetaFieldLabel()}>WhatsApp</span>
                <span style={{ ...getMetaFieldValue(), color: "#38bdf8" }}>
                  +{selectedProperty.whatsapp_number}
                </span>
              </div>
              <div style={getMetaFieldGroup()}>
                <span style={getMetaFieldLabel()}>Utilities included</span>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                  {selectedProperty.has_borehole && (
                    <span style={getUtilityBadgeStyle()}>🚰 Borehole</span>
                  )}
                  {selectedProperty.has_municipal_water && (
                    <span style={getUtilityBadgeStyle()}>🏢 Council</span>
                  )}
                  {(selectedProperty.has_solar_backup || selectedProperty.has_electricity) && (
                    <span style={getUtilityBadgeStyle()}>💡 Solar</span>
                  )}
                  {!selectedProperty.has_borehole &&
                    !selectedProperty.has_municipal_water &&
                    !selectedProperty.has_solar_backup &&
                    !selectedProperty.has_electricity && (
                      <span style={{ color: isDarkMode ? "#777" : "#6c757d", fontSize: "0.85rem" }}>None specified</span>
                    )}
                </div>
              </div>
            </div>
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedProperty(null);
              }} 
              style={getCloseDetailPanelBtn()}
            >
              ← Back to Properties Grid
            </div>
          </div>
        ) : (
          <>
            <div style={getHeaderRowStyle()}>
              <h1 style={getTitleStyle()}>Properties</h1>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowIntake(!showIntake);
                  }}
                  style={{
                    backgroundColor: showIntake ? (isDarkMode ? "#1f2937" : "#e9ecef") : "#217d9d",
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTheme();
                  }}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    fontSize: "1.2rem",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  {isDarkMode ? "☀️" : "🌙"}
                </button>
              </div>
            </div>

            <div className="filter-suite-responsive" style={getFilterSuiteContainerStyle()}>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by name or ID"
                style={getSearchBarFieldStyle()}
                className="filter-search-box"
              />
              <CustomDropdown
                value={filterStatus}
                options={STATUSES}
                placeholder="All statuses"
                onSelect={setFilterStatus}
                isDarkMode={isDarkMode}
              />
              <CustomDropdown
                value={filterCity}
                options={["All cities", ...CITIES]}
                placeholder="All cities"
                onSelect={setFilterCity}
                isDarkMode={isDarkMode}
              />
            </div>

            <div style={getTableViewportOuterWrapper()}>
              <div style={getScrollContainerIndicator()}>
                <table style={getMainDataTableLayout()}>
                  <thead>
                    <tr style={getTableHeaderRowStyle()}>
                      <th style={getThColumnHeadingStyle()}>PROPERTY TYPE ↕</th>
                      <th style={getThColumnHeadingStyle()}>LOCATION ↕</th>
                      <th style={getThColumnHeadingStyle()}>RENT ↕</th>
                      <th style={getThColumnHeadingStyle()}>UTILITIES ↕</th>
                      <th style={getThColumnHeadingStyle()}>STATUS ↕</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusLoading ? (
                      <tr>
                        <td
                          colSpan={5}
                          style={{ padding: "24px", color: isDarkMode ? "#666" : "#6c757d", textAlign: "center" }}
                        >
                          Loading...
                        </td>
                      </tr>
                    ) : filteredProperties.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          style={{ padding: "24px", color: isDarkMode ? "#666" : "#6c757d", textAlign: "center" }}
                        >
                          No active records found.
                        </td>
                      </tr>
                    ) : (
                      filteredProperties.map(item => (
                        <tr
                          key={item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProperty(item);
                          }}
                          style={getTableRowStyle()}
                        >
                          <td style={getTdCellStyle()}>
                            <div
                              style={{
                                fontWeight: "700",
                                color: isDarkMode ? "#ffffff" : "#212529",
                              }}
                            >
                              {item.room_type}
                            </div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: isDarkMode ? "#888888" : "#6c757d",
                                marginTop: "2px",
                                textDecoration: "underline",
                              }}
                            >
                              PROP-{item.id.toString().padStart(3, "0")}
                            </div>
                          </td>
                          <td style={getTdCellStyle()}>
                            <span style={{ fontWeight: "700", color: isDarkMode ? "#ffffff" : "#212529" }}>
                              {item.suburb ? `${item.suburb}, ` : ""}{item.city}
                            </span>
                          </td>
                          <td style={{ ...getTdCellStyle(), color: "#10b981", fontWeight: "700" }}>
                            ${item.price}/mo
                          </td>
                          <td style={getTdCellStyle()}>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                              {item.has_borehole && (
                                <span style={getUtilityBadgeStyle()}>🚰 Borehole</span>
                              )}
                              {item.has_municipal_water && (
                                <span style={getUtilityBadgeStyle()}>🏢 Council</span>
                              )}
                              {(item.has_solar_backup || item.has_electricity) && (
                                <span style={getUtilityBadgeStyle()}>💡 Solar</span>
                              )}
                              {!item.has_borehole &&
                                !item.has_municipal_water &&
                                !item.has_solar_backup &&
                                !item.has_electricity && (
                                  <span style={{ color: isDarkMode ? "#666" : "#6c757d", fontSize: "0.75rem" }}>—</span>
                                )}
                            </div>
                          </td>
                          <td style={getTdCellStyle()}>
                            <span
                              style={
                                item.status === "Occupied"
                                  ? getOccupiedBadgeStyle()
                                  : getAvailableBadgeStyle()
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

            {showIntake && (
              <div style={getFormCardStyle()}>
                <h2 style={getFormTitleStyle()}>Quick property intake</h2>
                <p style={getFormSubtitleStyle()}>
                  Capture a landlord listing and add it to the matching queue
                </p>

                <form onSubmit={handleFormSubmit} style={getFormGridStructure()}>
                  <div style={getFieldBlockStyle()}>
                    <label style={getLabelStyle()}>WhatsApp number</label>
                    <input
                      type="tel"
                      name="whatsapp_number"
                      value={formData.whatsapp_number}
                      onChange={handleInputChange}
                      placeholder="e.g. 0771234567"
                      required
                      style={getInputBoxStyle()}
                    />
                    <span style={getInputHelpTextStyle()}>
                      Include the leading 0, e.g. 0771234567
                    </span>
                  </div>

                  <div style={getFieldBlockStyle()}>
                    <label style={getLabelStyle()}>Target city</label>
                    <CustomDropdown
                      value={formData.city}
                      options={CITIES}
                      placeholder="Select city"
                      onSelect={(value) => setFormData(prev => ({ ...prev, city: value }))}
                      isDarkMode={isDarkMode}
                    />
                  </div>

                  <div style={getFieldBlockStyle()}>
                    <label style={getLabelStyle()}>Target suburb or area</label>
                    <input
                      type="text"
                      name="suburb"
                      value={formData.suburb}
                      onChange={handleInputChange}
                      placeholder="e.g. Avondale"
                      style={getInputBoxStyle()}
                    />
                  </div>

                  <div style={getFieldBlockStyle()}>
                    <label style={getLabelStyle()}>Property type</label>
                    <CustomDropdown
                      value={formData.room_type}
                      options={PROPERTY_TYPES}
                      placeholder="Select property type"
                      onSelect={(value) => setFormData(prev => ({ ...prev, room_type: value }))}
                      isDarkMode={isDarkMode}
                    />
                  </div>

                  <div style={getFieldBlockStyle()}>
                    <label style={getLabelStyle()}>Monthly rent price</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="e.g. 150"
                      min="0"
                      step="1"
                      required
                      style={getInputBoxStyle()}
                    />
                  </div>

                  <div style={getUtilityCardBoxStyle()}>
                    <label style={getCheckboxLabelStyle()}>
                      <input
                        type="checkbox"
                        checked={has_borehole}
                        onChange={e => setHasBorehole(e.target.checked)}
                        style={getCheckboxStyle()}
                      />
                      Borehole clean water source
                    </label>
                    <label style={getCheckboxLabelStyle()}>
                      <input
                        type="checkbox"
                        checked={has_municipal_water}
                        onChange={e => setHasMunicipalWater(e.target.checked)}
                        style={getCheckboxStyle()}
                      />
                      Council municipal water line
                    </label>
                    <label style={{ ...getCheckboxLabelStyle(), marginBottom: 0 }}>
                      <input
                        type="checkbox"
                        checked={has_solar_backup}
                        onChange={e => setHasSolarBackup(e.target.checked)}
                        style={getCheckboxStyle()}
                      />
                      Constant solar electrical backup
                    </label>
                  </div>

                  {submitError && (
                    <div style={{ color: "#f87171", fontSize: "0.85rem" }}>
                      {submitError}
                    </div>
                  )}

                  <button type="submit" style={getSubmitPillBtnStyle()}>
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
