"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../utils/supabaseClient";
import Link from "next/link";
import { useRouter } from 'next/navigation';

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
const PROPERTY_TYPES = [
  "Single Room / Bed Sitter",
  "Cottage",
  "Apartment",
  "Town House",
  "Standalone House",
  "Luxury Villa",
];
const ROOM_TYPES = PROPERTY_TYPES;

export default function TenantDashboard() {
  const router = useRouter();
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  
  // Theme state with localStorage persistence
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme !== null) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

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
    room_type_wanted: "Single Room / Bed Sitter",
    max_price: "",
    whatsapp_number: "",
    status: "Searching",
  });

  const [needs_borehole, setNeedsBorehole] = useState(false);
  const [needs_municipal_water, setNeedsMunicipalWater] = useState(false);
  const [needs_solar_backup, setNeedsSolarBackup] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const brandTeal = "#217d9d";

  const fetchTenants = async () => {
    const { data, error } = await supabase
      .from("tenant_requests")
      .select(
        "id, name, city, preferred_suburb, room_type_wanted, max_price, whatsapp_number, status, needs_borehole, needs_municipal_water, needs_solar_backup, created_at"
      )
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
        .select(
          "id, name, city, preferred_suburb, room_type_wanted, max_price, whatsapp_number, status, needs_borehole, needs_municipal_water, needs_solar_backup, created_at"
        )
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
    filteredTenants = filteredTenants.filter(t => {
      const idStr = t.id ? t.id.toString().toLowerCase() : "";
      const tenCode = "ten-" + idStr.padStart(3, "0");
      const name = t.name ? t.name.toLowerCase() : "";
      const suburb = t.preferred_suburb ? t.preferred_suburb.toLowerCase() : "";
      const city = t.city ? t.city.toLowerCase() : "";
      const roomType = t.room_type_wanted ? t.room_type_wanted.toLowerCase() : "";
      return (
        name.includes(term) ||
        idStr.includes(term) ||
        tenCode.includes(term) ||
        suburb.includes(term) ||
        city.includes(term) ||
        roomType.includes(term)
      );
    });
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
      room_type_wanted: "Single Room / Bed Sitter",
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

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX;
    handleSwipe();
  };

  const handleSwipe = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe left - go to Matches
        router.push('/matches');
      } else {
        // Swipe right - go to Properties
        router.push('/properties');
      }
    }
  };

  // Theme-aware style helpers
  const getPanelBgStyle = () => ({
    fontFamily: "sans-serif",
    backgroundColor: isDarkMode ? "#0d0d0d" : "#f8f9fa",
    color: isDarkMode ? "#ffffff" : "#212529",
    minHeight: "100vh",
    padding: "16px 0 100px 0",
  });

  const getPanelContainerStyle = () => ({
    maxWidth: "430px",
    margin: "0 auto",
    padding: "0 16px",
    width: "100%",
    boxSizing: "border-box",
    position: "relative",
  });

  const getHeaderRowStyle = () => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  });

  const getTitleStyle = () => ({
    margin: 0,
    fontSize: "1.4rem",
    fontWeight: "800",
  });

  const getSearchBarFieldStyle = () => ({
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

  const getDropdownWidgetStyle = () => ({
    ...getSearchBarFieldStyle(),
    appearance: "none",
  });

  const getFilterSuiteContainerStyle = () => ({
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "24px",
    width: "100%",
  });

  const getTableViewportOuterWrapper = () => ({
    backgroundColor: isDarkMode ? "#141414" : "#ffffff",
    border: isDarkMode ? "1px solid #1f1f1f" : "1px solid #e9ecef",
    borderRadius: "16px",
    overflow: "hidden",
    marginBottom: "24px",
    width: "100%",
    boxSizing: "border-box",
  });

  const getScrollContainerIndicator = () => ({
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    width: "100%",
  });

  const getMainDataTableLayout = () => ({
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

  const getSearchingBadgeStyle = () => ({
    ...getBaseBadgeStyle(),
    backgroundColor: "#3a230f",
    color: "#f59e0b",
  });

  const getMatchedBadgeStyle = () => ({
    ...getBaseBadgeStyle(),
    backgroundColor: "#181b3d",
    color: "#6366f1",
  });

  const getPlacedBadgeStyle = () => ({
    ...getBaseBadgeStyle(),
    backgroundColor: "#132f1d",
    color: "#10b981",
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

  const getFormWrapperCardStyle = () => ({
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

  const getFormGridStructure = () => ({
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  });

  const getFieldBlockStyle = () => ({
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  });

  const getLabelStyle = () => ({
    fontSize: "0.85rem",
    fontWeight: "600",
    color: isDarkMode ? "#ffffff" : "#212529",
  });

  const getInputBoxStyle = () => ({
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

  const getBaseButtonStyle = () => ({
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

  const getSubmitPillBtnStyle = () => ({
    ...getBaseButtonStyle(),
    backgroundColor: "#217d9d",
    color: "#ffffff",
  });

  const getMessageTenantPillBtn = () => ({
    ...getBaseButtonStyle(),
    display: "inline-block",
    width: "auto",
    padding: "10px 20px",
    backgroundColor: "#217d9d",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "0.85rem",
  });

  const getCloseDetailPanelBtn = () => ({
    ...getBaseButtonStyle(),
    padding: "12px",
    backgroundColor: isDarkMode ? "#222" : "#e9ecef",
    color: isDarkMode ? "#fff" : "#212529",
    borderRadius: "20px",
    fontWeight: "600",
    fontSize: "0.9rem",
  });

  const getDetailInnerCardBoxStyle = () => ({
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    backgroundColor: isDarkMode ? "#141414" : "#ffffff",
    border: isDarkMode ? "1px solid #222" : "1px solid #e9ecef",
    borderRadius: "18px",
    padding: "20px",
    marginBottom: "24px",
  });

  const getMetaFieldGroup = () => ({
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

  const getNavDockStyle = () => ({
    position: "fixed",
    bottom: "24px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "calc(100% - 32px)",
    maxWidth: "380px",
    borderRadius: "30px",
    padding: "8px 12px",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    zIndex: 9999,
    boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    backgroundColor: isDarkMode ? "rgba(26, 26, 26, 0.8)" : "rgba(255, 255, 255, 0.85)",
    border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.05)",
  });

  const getNavTabStyle = (isActive: boolean) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    textDecoration: "none",
    color: isActive ? brandTeal : isDarkMode ? "#666" : "#6c757d",
    cursor: "pointer",
    transition: "color 0.2s ease",
    padding: isActive ? "6px 16px" : "6px 12px",
    borderRadius: "20px",
    backgroundColor: isActive 
      ? (isDarkMode ? "rgba(33, 125, 157, 0.15)" : "rgba(33, 125, 157, 0.1)")
      : "transparent",
  });

  const getNavIconStyle = () => ({
    fontSize: "1.4rem",
  });

  const getNavLabelStyle = () => ({
    fontSize: "0.7rem",
    fontWeight: "600",
  });

  return (
    <div 
      style={getPanelBgStyle()}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        .filter-suite-responsive {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
          width: 100%;
        }
      `}</style>
      <div style={getPanelContainerStyle()}>
        {selectedTenant ? (
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
                  Tenants
                </span>
                <h2
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: "800",
                    margin: "4px 0 0 0",
                    color: isDarkMode ? "#ffffff" : "#212529",
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
                style={getMessageTenantPillBtn()}
              >
                Message tenant
              </a>
            </div>

            <div style={getDetailInnerCardBoxStyle()}>
              <div style={getMetaFieldGroup()}>
                <span style={getMetaFieldLabel()}>Search location</span>
                <span style={getMetaFieldValue()}>
                  {selectedTenant.preferred_suburb ? `${selectedTenant.preferred_suburb}, ` : ""}
                  {selectedTenant.city}
                </span>
              </div>
              <div style={getMetaFieldGroup()}>
                <span style={getMetaFieldLabel()}>Property type</span>
                <span style={getMetaFieldValue()}>{selectedTenant.room_type_wanted}</span>
              </div>
              <div style={getMetaFieldGroup()}>
                <span style={getMetaFieldLabel()}>Minimum bedrooms</span>
                <span style={getMetaFieldValue()}>1</span>
              </div>
              <div style={getMetaFieldGroup()}>
                <span style={getMetaFieldLabel()}>Maximum budget</span>
                <span style={{ ...getMetaFieldValue(), color: "#10b981" }}>
                  ${selectedTenant.max_price}/month
                </span>
              </div>
              <div style={getMetaFieldGroup()}>
                <span style={getMetaFieldLabel()}>Profile status</span>
                <span style={getMetaFieldValue()}>{selectedTenant.status}</span>
              </div>
              <div style={getMetaFieldGroup()}>
                <span style={getMetaFieldLabel()}>WhatsApp</span>
                <span style={{ ...getMetaFieldValue(), color: "#38bdf8" }}>
                  +{selectedTenant.whatsapp_number}
                </span>
              </div>
              <div style={getMetaFieldGroup()}>
                <span style={getMetaFieldLabel()}>Utilities requested</span>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                  {selectedTenant.needs_borehole && (
                    <span style={getUtilityBadgeStyle()}>🚰 Borehole</span>
                  )}
                  {selectedTenant.needs_municipal_water && (
                    <span style={getUtilityBadgeStyle()}>🏢 Council</span>
                  )}
                  {selectedTenant.needs_solar_backup && (
                    <span style={getUtilityBadgeStyle()}>💡 Solar</span>
                  )}
                  {!selectedTenant.needs_borehole &&
                    !selectedTenant.needs_municipal_water &&
                    !selectedTenant.needs_solar_backup && (
                      <span style={{ color: isDarkMode ? "#777" : "#6c757d", fontSize: "0.85rem" }}>None requested</span>
                    )}
                </div>
              </div>
            </div>
            <div onClick={() => setSelectedTenant(null)} style={getCloseDetailPanelBtn()}>
              ← Back to Tenant Grid
            </div>
          </div>
        ) : (
          <>
            <div style={getHeaderRowStyle()}>
              <h1 style={getTitleStyle()}>Tenants</h1>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div
                  onClick={() => setShowForm(!showForm)}
                  style={{
                    backgroundColor: showForm ? (isDarkMode ? "#1f2937" : "#e9ecef") : "#217d9d",
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
                  {showForm ? "✕ Close Intake" : "＋ Register tenant"}
                </div>
                <button
                  onClick={toggleTheme}
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
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={getDropdownWidgetStyle()}
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
                style={getDropdownWidgetStyle()}
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

            <div style={getTableViewportOuterWrapper()}>
              <div style={getScrollContainerIndicator()}>
                <table style={getMainDataTableLayout()}>
                  <thead>
                    <tr style={getTableHeaderRowStyle()}>
                      <th style={getThColumnHeadingStyle()}>Tenant ↕</th>
                      <th style={getThColumnHeadingStyle()}>Location ↕</th>
                      <th style={getThColumnHeadingStyle()}>PROPERTY TYPE ↕</th>
                      <th style={getThColumnHeadingStyle()}>Budget ↕</th>
                      <th style={getThColumnHeadingStyle()}>UTILITIES ↕</th>
                      <th style={getThColumnHeadingStyle()}>Status ↕</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusLoading ? (
                      <tr>
                        <td
                          colSpan={6}
                          style={{ padding: "20px", color: isDarkMode ? "#666" : "#6c757d", textAlign: "center" }}
                        >
                          Loading...
                        </td>
                      </tr>
                    ) : filteredTenants.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          style={{ padding: "20px", color: isDarkMode ? "#666" : "#6c757d", textAlign: "center" }}
                        >
                          No active records found.
                        </td>
                      </tr>
                    ) : (
                      filteredTenants.map(item => (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedTenant(item)}
                          style={getTableRowStyle()}
                        >
                          <td
                            style={{
                              ...getTdCellStyle(),
                              fontWeight: "700",
                              color: isDarkMode ? "#fff" : "#212529",
                              textDecoration: "underline",
                            }}
                          >
                            {item.name}
                          </td>
                          <td style={getTdCellStyle()}>
                            <span style={{ fontWeight: "700", color: isDarkMode ? "#ffffff" : "#212529" }}>
                              {item.preferred_suburb ? `${item.preferred_suburb}, ` : ""}{item.city}
                            </span>
                          </td>
                          <td style={getTdCellStyle()}>
                            <div
                              style={{
                                fontWeight: "700",
                                color: isDarkMode ? "#ffffff" : "#212529",
                              }}
                            >
                              {item.room_type_wanted}
                            </div>
                          </td>
                          <td style={{ ...getTdCellStyle(), fontWeight: "700" }}>${item.max_price}/mo</td>
                          <td style={getTdCellStyle()}>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                              {item.needs_borehole && (
                                <span style={getUtilityBadgeStyle()}>🚰 Borehole</span>
                              )}
                              {item.needs_municipal_water && (
                                <span style={getUtilityBadgeStyle()}>🏢 Council</span>
                              )}
                              {item.needs_solar_backup && (
                                <span style={getUtilityBadgeStyle()}>💡 Solar</span>
                              )}
                              {!item.needs_borehole &&
                                !item.needs_municipal_water &&
                                !item.needs_solar_backup && (
                                  <span style={{ color: isDarkMode ? "#666" : "#6c757d", fontSize: "0.75rem" }}>—</span>
                                )}
                            </div>
                          </td>
                          <td style={getTdCellStyle()}>
                            <span
                              style={
                                item.status === "Matched"
                                  ? getMatchedBadgeStyle()
                                  : item.status === "Placed"
                                  ? getPlacedBadgeStyle()
                                  : getSearchingBadgeStyle()
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

            {showForm && (
              <div style={getFormWrapperCardStyle()}>
                <h2 style={getFormTitleStyle()}>Quick tenant intake</h2>
                <p style={getFormSubtitleStyle()}>
                  Capture a WhatsApp enquiry and add it to the matching queue.
                </p>

                <form onSubmit={handleFormSubmit} style={getFormGridStructure()}>
                  <div style={getFieldBlockStyle()}>
                    <label style={getLabelStyle()}>Full name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Sarah Khumalo"
                      required
                      style={getInputBoxStyle()}
                    />
                  </div>

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
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      style={getInputBoxStyle()}
                    >
                      {CITIES.map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={getFieldBlockStyle()}>
                    <label style={getLabelStyle()}>Target suburb or area</label>
                    <input
                      type="text"
                      name="preferred_suburb"
                      value={formData.preferred_suburb}
                      onChange={handleInputChange}
                      placeholder="e.g. Avondale (optional)"
                      style={getInputBoxStyle()}
                    />
                  </div>

                  <div style={getFieldBlockStyle()}>
                    <label style={getLabelStyle()}>Property type</label>
                    <select
                      name="room_type_wanted"
                      value={formData.room_type_wanted}
                      onChange={handleInputChange}
                      required
                      style={getInputBoxStyle()}
                    >
                      {PROPERTY_TYPES.map(r => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={getFieldBlockStyle()}>
                    <label style={getLabelStyle()}>Maximum monthly budget (USD)</label>
                    <input
                      type="number"
                      name="max_price"
                      value={formData.max_price}
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
                        checked={needs_borehole}
                        onChange={e => setNeedsBorehole(e.target.checked)}
                        style={getCheckboxStyle()}
                      />
                      Borehole clean water source
                    </label>
                    <label style={getCheckboxLabelStyle()}>
                      <input
                        type="checkbox"
                        checked={needs_municipal_water}
                        onChange={e => setNeedsMunicipalWater(e.target.checked)}
                        style={getCheckboxStyle()}
                      />
                      Council municipal water line
                    </label>
                    <label style={{ ...getCheckboxLabelStyle(), marginBottom: 0 }}>
                      <input
                        type="checkbox"
                        checked={needs_solar_backup}
                        onChange={e => setNeedsSolarBackup(e.target.checked)}
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
                    Save tenant profile
                  </button>
                </form>
              </div>
            )}
          </>
        )}
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
        <Link href="/find-room" style={getNavTabStyle(true)}>
          <span style={getNavIconStyle()}>👥</span>
          <span style={getNavLabelStyle()}>Tenants</span>
        </Link>
      </div>
    </div>
  );
}
