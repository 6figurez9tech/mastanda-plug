// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../utils/supabaseClient";

interface TenantRequest {
  id: string | number;
  name: string;
  tenant_name?: string;
  city: string;
  preferred_suburb?: string | null;
  suburb?: string | null;
  room_type_wanted: string;
  room_type?: string;
  property_type?: string;
  max_price: number | string;
  whatsapp_number: string;
  status: string;
  needs_borehole?: boolean;
  needs_municipal_water?: boolean;
  needs_solar_backup?: boolean;
  needs_security?: boolean;
  needs_parking?: boolean;
  needs_internet?: boolean;
  created_at?: string;
  is_searching?: boolean;
  is_verified?: boolean;
  searching_confirmed_date?: string;
  preferred_move_in_date?: string;
  lease_length_wanted?: string;
  number_of_occupants?: number;
  created_by?: string;
  profile_photo_url?: string;
}

interface TenantFormData {
  name: string;
  city: string;
  preferred_suburb: string;
  room_type_wanted: string;
  max_price: string;
  whatsapp_number: string;
  status: string;
  searching_confirmed_date: string;
  preferred_move_in_date: string;
  lease_length_wanted: string;
  number_of_occupants: string;
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

export default function TenantDashboard() {
  // Theme state with localStorage persistence
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  useEffect(() => {
    const readTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      setIsDarkMode(savedTheme === null ? true : savedTheme === 'dark');
    };

    const raf = requestAnimationFrame(readTheme);
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

  // Device ownership tracking
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('mastanda_device_id');
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('mastanda_device_id', deviceId);
    }
    return deviceId;
  };

  const [tenants, setTenants] = useState<TenantRequest[]>([]);
  const [statusLoading, setStatusLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const searchTerm = searchQuery;
  const setSearchTerm = setSearchQuery;
  const [filterStatus, setFilterStatus] = useState("All statuses");
  const [cityFilter, setCityFilter] = useState("");
  const filterCity = cityFilter || "All cities";
  const setFilterCity = (val: string) => setCityFilter(val === "All cities" ? "" : val);
  const [selectedTenant, setSelectedTenant] = useState<TenantRequest | null>(null);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [justSavedId, setJustSavedId] = useState<string | number | null>(null);

  const [formData, setFormData] = useState<TenantFormData>({
    name: "",
    city: "Harare",
    preferred_suburb: "",
    room_type_wanted: "Single Room / Bed Sitter",
    max_price: "",
    whatsapp_number: "",
    status: "Searching",
    searching_confirmed_date: "",
    preferred_move_in_date: "",
    lease_length_wanted: "",
    number_of_occupants: "",
  });

  const [needs_borehole, setNeedsBorehole] = useState(false);
  const [needs_municipal_water, setNeedsMunicipalWater] = useState(false);
  const [needs_solar_backup, setNeedsSolarBackup] = useState(false);
  const [needs_security, setNeedsSecurity] = useState(false);
  const [needs_parking, setNeedsParking] = useState(false);
  const [needs_internet, setNeedsInternet] = useState(false);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [uploadedProfilePhotoUrl, setUploadedProfilePhotoUrl] = useState<string>("");

  const [showForm, setShowForm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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

  const filteredTenants = tenants.filter(item => {
    const matchesSearch = searchQuery ? (
      ((item.tenant_name || item.name) && (item.tenant_name || item.name).toLowerCase().includes(searchQuery.toLowerCase())) ||
      ((item.suburb || item.preferred_suburb) && (item.suburb || item.preferred_suburb).toLowerCase().includes(searchQuery.toLowerCase())) ||
      ((item.room_type || item.room_type_wanted || item.property_type) && (item.room_type || item.room_type_wanted || item.property_type).toLowerCase().includes(searchQuery.toLowerCase()))
    ) : true;
    
    const matchesCity = cityFilter ? item.city === cityFilter : true;
    return matchesSearch && matchesCity;
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfilePhotoUpload = async (file: File | null) => {
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `tenant-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('tenant-photos')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('tenant-photos')
        .getPublicUrl(filePath);

      setUploadedProfilePhotoUrl(publicUrl);
    } catch (error) {
      console.error('Photo upload error:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    const cleanPhone = String(formData.whatsapp_number || "").replace(/[^0-9]/g, "");
    const maxPrice = parseFloat(formData.max_price);
    const numOccupants = parseInt(formData.number_of_occupants) || null;
    const deviceId = getDeviceId();

    const tenantData = {
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
      needs_security,
      needs_parking,
      needs_internet,
      searching_confirmed_date: formData.searching_confirmed_date || null,
      preferred_move_in_date: formData.preferred_move_in_date || null,
      lease_length_wanted: formData.lease_length_wanted || null,
      number_of_occupants: numOccupants,
      profile_photo_url: uploadedProfilePhotoUrl,
      created_by: deviceId,
    };

    if (editingId) {
      // Update existing tenant request
      const { data, error } = await supabase
        .from("tenant_requests")
        .update(tenantData)
        .eq('id', editingId)
        .select();

      if (error) {
        setSubmitError(error.message);
        return;
      }

      // Write-confirmation guard - a null error does not prove the row changed.
      // When RLS blocks the write, .update().eq().select() resolves with an empty
      // payload, so assert at least one row was actually modified. (No
      // setUploadingImages state exists in this view, so only the alert fires here.)
      if (!data || data.length === 0) {
        alert("Database Update Warning: Profile modifications could not be written to the server. Please verify your table RLS policies.");
        return;
      }
      setEditingId(null);
    } else {
      // Insert new tenant request
      const { data, error } = await supabase.from("tenant_requests").insert([
        {
          ...tenantData,
          is_searching: true,
          is_verified: false,
        },
      ]).select();

      if (error) {
        setSubmitError(error.message);
        return;
      }

      if (data && data[0]) {
        setJustSavedId(data[0].id);
        setShowVerification(true);
      }
    }

    setFormData({
      name: "",
      city: "Harare",
      preferred_suburb: "",
      room_type_wanted: "Single Room / Bed Sitter",
      max_price: "",
      whatsapp_number: "",
      status: "Searching",
      searching_confirmed_date: "",
      preferred_move_in_date: "",
      lease_length_wanted: "",
      number_of_occupants: "",
    });
    setNeedsBorehole(false);
    setNeedsMunicipalWater(false);
    setNeedsSolarBackup(false);
    setNeedsSecurity(false);
    setNeedsParking(false);
    setNeedsInternet(false);
    setProfilePhotoFile(null);
    setUploadedProfilePhotoUrl("");
    setShowForm(false);
    fetchTenants();
  };

  const handleEditTenant = (tenant: TenantRequest) => {
    const deviceId = getDeviceId();

    // Ownership lockout check
    if (tenant.created_by && tenant.created_by !== deviceId) {
      alert("Access Denied: You can only edit profiles or listings you registered yourself.");
      return;
    }

    setEditingId(tenant.id);
    setFormData({
      name: tenant.name,
      city: tenant.city,
      preferred_suburb: tenant.preferred_suburb || "",
      room_type_wanted: tenant.room_type_wanted,
      max_price: String(tenant.max_price),
      whatsapp_number: tenant.whatsapp_number,
      status: tenant.status,
      searching_confirmed_date: tenant.searching_confirmed_date || "",
      preferred_move_in_date: tenant.preferred_move_in_date || "",
      lease_length_wanted: tenant.lease_length_wanted || "",
      number_of_occupants: String(tenant.number_of_occupants || ""),
    });
    setNeedsBorehole(tenant.needs_borehole || false);
    setNeedsMunicipalWater(tenant.needs_municipal_water || false);
    setNeedsSolarBackup(tenant.needs_solar_backup || false);
    setNeedsSecurity(tenant.needs_security || false);
    setNeedsParking(tenant.needs_parking || false);
    setNeedsInternet(tenant.needs_internet || false);
    setUploadedProfilePhotoUrl(tenant.profile_photo_url || "");
    setShowForm(true);

    // Automatic smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleSearching = async (tenant: TenantRequest) => {
    const newStatus = !tenant.is_searching;
    const { error } = await supabase
      .from("tenant_requests")
      .update({ is_searching: newStatus })
      .eq('id', tenant.id);

    if (!error) {
      fetchTenants();
    }
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
    padding: "0 16px 90px 16px",
    color: isDarkMode ? "#ffffff" : "#212529",
    flex: 1,
    boxSizing: "border-box" as const,
  });

  const getPanelContainerStyle = () => ({
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
  });

  const getTitleStyle = () => ({
    margin: 0,
    fontSize: "1.4rem",
    fontWeight: "800",
  });

  const getSearchBarFieldStyle = (): React.CSSProperties => ({
    boxSizing: 'border-box',
    width: '100%',
    padding: '12px 16px',
    backgroundColor: isDarkMode ? '#111111' : '#f1f3f5',
    border: isDarkMode ? '1px solid #222' : '1px solid #e9ecef',
    borderRadius: '24px',
    color: isDarkMode ? '#ffffff' : '#212529',
    fontSize: '0.95rem',
    outline: 'none',
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
    minWidth: "800px",
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

  const getPendingBadgeStyle = () => ({
    ...getBaseBadgeStyle(),
    backgroundColor: "#3a230f",
    color: "#f59e0b",
  });

  const getVerifiedBadgeStyle = () => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "0.72rem",
    fontWeight: "700",
    backgroundColor: "rgba(33, 125, 157, 0.1)",
    color: "#217d9d",
    border: "1px solid #217d9d",
    marginLeft: "8px",
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

  const getStatusPillStyle = (isSearching: boolean) => ({
    ...getBaseBadgeStyle(),
    backgroundColor: isSearching ? "#3a230f" : "#2a2a2a",
    color: isSearching ? "#f59e0b" : "#888888",
    cursor: "pointer",
    transition: "all 0.2s ease",
  });

  const getFormWrapperCardStyle = (): React.CSSProperties => ({
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

  const getEditIconButtonStyle = () => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "6px 12px",
    backgroundColor: isDarkMode ? "#1a1a1a" : "#f1f3f5",
    border: isDarkMode ? "1px solid #2a2a2a" : "1px solid #e9ecef",
    borderRadius: "8px",
    color: isDarkMode ? "#ffffff" : "#212529",
    fontSize: "0.75rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
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

  const getProfilePhotoStyle = () => ({
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    objectFit: "cover",
    backgroundColor: isDarkMode ? "#1a1a1a" : "#e9ecef",
    border: `3px solid #217d9d`,
  });

  const getPlaceholderPhotoStyle = () => ({
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: isDarkMode ? "#1a1a1a" : "#e9ecef",
    border: `3px dashed #217d9d`,
  });

  const getVerificationCardStyle = () => ({
    backgroundColor: isDarkMode ? "#141414" : "#ffffff",
    border: isDarkMode ? "1px solid #222" : "1px solid #e9ecef",
    borderRadius: "20px",
    padding: "32px 24px",
    marginBottom: "24px",
    boxShadow: isDarkMode ? "0 10px 15px -3px rgba(0,0,0,0.3)" : "0 10px 15px -3px rgba(0,0,0,0.1)",
    width: "100%",
    boxSizing: "border-box",
  });

  const getUploadZoneStyle = () => ({
    border: `2px dashed ${isDarkMode ? "#2a2a2a" : "#e9ecef"}`,
    borderRadius: "12px",
    padding: "24px",
    textAlign: "center" as const,
    cursor: "pointer",
    transition: "all 0.2s ease",
    backgroundColor: isDarkMode ? "#0d0d0d" : "#f8f9fa",
  });

  const handleVerificationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const idFile = formData.get('national_id') as File;
    const passportFile = formData.get('passport_photo') as File;

    if (!idFile || !passportFile) {
      alert("Please upload both documents to continue.");
      return;
    }

    try {
      // Upload National ID
      const idExt = idFile.name.split('.').pop();
      const idFileName = `verification_${Date.now()}_id.${idExt}`;
      const idPath = `verification-documents/${idFileName}`;
      await supabase.storage.from('verification-documents').upload(idPath, idFile);
      const { data: { publicUrl: idPublicUrl } } = supabase.storage.from('verification-documents').getPublicUrl(idPath);

      // Upload Passport Photo
      const passportExt = passportFile.name.split('.').pop();
      const passportFileName = `verification_${Date.now()}_passport.${passportExt}`;
      const passportPath = `verification-documents/${passportFileName}`;
      await supabase.storage.from('verification-documents').upload(passportPath, passportFile);
      const { data: { publicUrl: passportPublicUrl } } = supabase.storage.from('verification-documents').getPublicUrl(passportPath);

      // Insert verification record
      const deviceId = getDeviceId();
      await supabase.from('user_verifications').insert({
        device_id: deviceId,
        national_id_url: idPublicUrl,
        passport_photo_url: passportPublicUrl,
        tenant_request_id: justSavedId,
        status: 'pending',
      });

      // Update tenant to pending verification
      if (justSavedId) {
        await supabase.from('tenant_requests').update({ is_verified: false }).eq('id', justSavedId);
      }

      alert("Documents uploaded successfully! Your verification badge is pending administrator approval.");
      setShowVerification(false);
      setJustSavedId(null);
      fetchTenants();
    } catch (error) {
      console.error('Verification upload error:', error);
      alert("Error uploading documents. Please try again.");
    }
  };

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
      <div style={getPanelContainerStyle()}>
        {showVerification ? (
          <div style={getVerificationCardStyle()}>
            <h2 style={{ ...getFormTitleStyle(), marginBottom: "8px" }}>Account Security & Trust Verification</h2>
            <p style={getFormSubtitleStyle()}>
              To minimize local scams and protect our community, please provide identification credentials to verify your profile listing safely.
            </p>
            <form onSubmit={handleVerificationSubmit} style={getFormGridStructure()}>
              <div style={getFieldBlockStyle()}>
                <label style={getLabelStyle()}>National ID Full Picture Upload</label>
                <div style={getUploadZoneStyle()}>
                  <input
                    type="file"
                    name="national_id"
                    accept="image/*"
                    required
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
              <div style={getFieldBlockStyle()}>
                <label style={getLabelStyle()}>Passport Size Photo of Yourself</label>
                <div style={getUploadZoneStyle()}>
                  <input
                    type="file"
                    name="passport_photo"
                    accept="image/*"
                    required
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
              <button type="submit" style={getSubmitPillBtnStyle()}>
                Submit Verification Documents
              </button>
              <button
                type="button"
                onClick={() => setShowVerification(false)}
                style={{ ...getCloseDetailPanelBtn(), marginTop: "8px" }}
              >
                Skip for Now
              </button>
            </form>
          </div>
        ) : selectedTenant ? (
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
                  {selectedTenant.is_verified ? (
                    <span style={getVerifiedBadgeStyle()}>🛡️ Verified Tenant</span>
                  ) : (
                    <span style={getPendingBadgeStyle()}>⏳ Pending Verification</span>
                  )}
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
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                {selectedTenant.profile_photo_url ? (
                  <img
                    src={selectedTenant.profile_photo_url}
                    alt="Profile"
                    style={getProfilePhotoStyle()}
                  />
                ) : (
                  <div style={getPlaceholderPhotoStyle()}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#217d9d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                )}
              </div>

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
                <span style={getMetaFieldLabel()}>Searching status</span>
                <span style={getStatusPillStyle(selectedTenant.is_searching ?? true)}>
                  {selectedTenant.is_searching ? "Searching" : "Placed"}
                </span>
              </div>
              {selectedTenant.searching_confirmed_date && (
                <div style={getMetaFieldGroup()}>
                  <span style={getMetaFieldLabel()}>Searching confirmed date</span>
                  <span style={getMetaFieldValue()}>{selectedTenant.searching_confirmed_date}</span>
                </div>
              )}
              {selectedTenant.preferred_move_in_date && (
                <div style={getMetaFieldGroup()}>
                  <span style={getMetaFieldLabel()}>Preferred move-in date</span>
                  <span style={getMetaFieldValue()}>{selectedTenant.preferred_move_in_date}</span>
                </div>
              )}
              {selectedTenant.lease_length_wanted && (
                <div style={getMetaFieldGroup()}>
                  <span style={getMetaFieldLabel()}>Lease length wanted</span>
                  <span style={getMetaFieldValue()}>{selectedTenant.lease_length_wanted}</span>
                </div>
              )}
              {selectedTenant.number_of_occupants && (
                <div style={getMetaFieldGroup()}>
                  <span style={getMetaFieldLabel()}>Number of occupants</span>
                  <span style={getMetaFieldValue()}>{selectedTenant.number_of_occupants}</span>
                </div>
              )}
              <div style={getMetaFieldGroup()}>
                <span style={getMetaFieldLabel()}>Utilities requested</span>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                  {selectedTenant.needs_borehole && <span style={getUtilityBadgeStyle()}>🚰 Borehole</span>}
                  {selectedTenant.needs_municipal_water && <span style={getUtilityBadgeStyle()}>🏢 Council</span>}
                  {selectedTenant.needs_solar_backup && <span style={getUtilityBadgeStyle()}>💡 Solar</span>}
                  {selectedTenant.needs_security && <span style={getUtilityBadgeStyle()}>🛡️ Security</span>}
                  {selectedTenant.needs_parking && <span style={getUtilityBadgeStyle()}>🚗 Parking</span>}
                  {selectedTenant.needs_internet && <span style={getUtilityBadgeStyle()}>📶 Internet</span>}
                </div>
              </div>
            </div>
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTenant(null);
              }} 
              style={getCloseDetailPanelBtn()}
            >
              ← Back to Tenant Grid
            </div>
          </div>
        ) : (
          <>
            <div style={getHeaderRowStyle()}>
              <h1 style={getTitleStyle()}>Tenants</h1>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowForm(!showForm);
                    if (!showForm) {
                      setEditingId(null);
                      setFormData({
                        name: "",
                        city: "Harare",
                        preferred_suburb: "",
                        room_type_wanted: "Single Room / Bed Sitter",
                        max_price: "",
                        whatsapp_number: "",
                        status: "Searching",
                        searching_confirmed_date: "",
                        preferred_move_in_date: "",
                        lease_length_wanted: "",
                        number_of_occupants: "",
                      });
                      setNeedsBorehole(false);
                      setNeedsMunicipalWater(false);
                      setNeedsSolarBackup(false);
                      setNeedsSecurity(false);
                      setNeedsParking(false);
                      setNeedsInternet(false);
                      setUploadedProfilePhotoUrl("");
                    }
                  }}
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
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, suburb, or type..."
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
                      <th style={getThColumnHeadingStyle()}>TENANT ↕</th>
                      <th style={getThColumnHeadingStyle()}>LOCATION ↕</th>
                      <th style={getThColumnHeadingStyle()}>PROPERTY TYPE ↕</th>
                      <th style={getThColumnHeadingStyle()}>BUDGET ↕</th>
                      <th style={getThColumnHeadingStyle()}>UTILITIES ↕</th>
                      <th style={getThColumnHeadingStyle()}>STATUS ↕</th>
                      <th style={getThColumnHeadingStyle()}>ACTIONS ↕</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusLoading ? (
                      <tr>
                        <td
                          colSpan={7}
                          style={{ padding: "20px", color: isDarkMode ? "#666" : "#6c757d", textAlign: "center" }}
                        >
                          Loading...
                        </td>
                      </tr>
                    ) : filteredTenants.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          style={{ padding: "20px", color: isDarkMode ? "#666" : "#6c757d", textAlign: "center" }}
                        >
                          No active records found.
                        </td>
                      </tr>
                    ) : (
                      filteredTenants.map(item => (
                        <tr
                          key={item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTenant(item);
                          }}
                          style={getTableRowStyle()}
                        >
                          <td
                            style={{
                              ...getTdCellStyle(),
                              fontWeight: "700",
                              color: isDarkMode ? "#fff" : "#212529",
                            }}
                          >
                            <div>
                              {item.name}
                              {item.is_verified ? (
                                <span style={getVerifiedBadgeStyle()}>🛡️ Verified</span>
                              ) : (
                                <span style={getPendingBadgeStyle()}>⏳ Pending</span>
                              )}
                            </div>
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
                              {item.needs_borehole && <span style={getUtilityBadgeStyle()}>🚰</span>}
                              {item.needs_municipal_water && <span style={getUtilityBadgeStyle()}>🏢</span>}
                              {item.needs_solar_backup && <span style={getUtilityBadgeStyle()}>💡</span>}
                              {item.needs_security && <span style={getUtilityBadgeStyle()}>🛡️</span>}
                              {item.needs_parking && <span style={getUtilityBadgeStyle()}>🚗</span>}
                              {item.needs_internet && <span style={getUtilityBadgeStyle()}>📶</span>}
                            </div>
                          </td>
                          <td style={getTdCellStyle()}>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSearching(item);
                              }}
                              style={getStatusPillStyle(item.is_searching ?? true)}
                            >
                              {item.is_searching ? "Searching" : "Placed"}
                            </span>
                          </td>
                          <td style={getTdCellStyle()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTenant(item);
                              }}
                              style={getEditIconButtonStyle()}
                            >
                              ✏️ Edit
                            </button>
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
                <h2 style={getFormTitleStyle()}>
                  {editingId ? "Update tenant profile" : "Quick tenant intake"}
                </h2>
                <p style={getFormSubtitleStyle()}>
                  {editingId ? "Edit the tenant details below." : "Capture a WhatsApp enquiry and add it to the matching queue."}
                </p>

                <form onSubmit={handleFormSubmit} style={getFormGridStructure()}>
                  <div style={getFieldBlockStyle()}>
                    <label style={getLabelStyle()}>Profile photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setProfilePhotoFile(e.target.files[0]);
                          handleProfilePhotoUpload(e.target.files[0]);
                        }
                      }}
                      disabled={uploadingPhoto}
                      style={getInputBoxStyle()}
                    />
                    {uploadingPhoto && <span style={getInputHelpTextStyle()}>Uploading photo...</span>}
                  </div>

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
                      name="preferred_suburb"
                      value={formData.preferred_suburb}
                      onChange={handleInputChange}
                      placeholder="e.g. Avondale (optional)"
                      style={getInputBoxStyle()}
                    />
                  </div>

                  <div style={getFieldBlockStyle()}>
                    <label style={getLabelStyle()}>Property type</label>
                    <CustomDropdown
                      value={formData.room_type_wanted}
                      options={PROPERTY_TYPES}
                      placeholder="Select property type"
                      onSelect={(value) => setFormData(prev => ({ ...prev, room_type_wanted: value }))}
                      isDarkMode={isDarkMode}
                    />
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

                  <div style={getFieldBlockStyle()}>
                    <label style={getLabelStyle()}>Searching confirmed date</label>
                    <input
                      type="date"
                      name="searching_confirmed_date"
                      value={formData.searching_confirmed_date}
                      onChange={handleInputChange}
                      style={getInputBoxStyle()}
                    />
                  </div>

                  <div style={getFieldBlockStyle()}>
                    <label style={getLabelStyle()}>Preferred move-in date</label>
                    <input
                      type="date"
                      name="preferred_move_in_date"
                      value={formData.preferred_move_in_date}
                      onChange={handleInputChange}
                      style={getInputBoxStyle()}
                    />
                  </div>

                  <div style={getFieldBlockStyle()}>
                    <label style={getLabelStyle()}>Lease length wanted</label>
                    <input
                      type="text"
                      name="lease_length_wanted"
                      value={formData.lease_length_wanted}
                      onChange={handleInputChange}
                      placeholder="e.g. 6-12 Months"
                      style={getInputBoxStyle()}
                    />
                  </div>

                  <div style={getFieldBlockStyle()}>
                    <label style={getLabelStyle()}>Number of occupants</label>
                    <input
                      type="number"
                      name="number_of_occupants"
                      value={formData.number_of_occupants}
                      onChange={handleInputChange}
                      placeholder="e.g. 2"
                      min="1"
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
                    <label style={getCheckboxLabelStyle()}>
                      <input
                        type="checkbox"
                        checked={needs_solar_backup}
                        onChange={e => setNeedsSolarBackup(e.target.checked)}
                        style={getCheckboxStyle()}
                      />
                      Constant solar electrical backup
                    </label>
                    <label style={getCheckboxLabelStyle()}>
                      <input
                        type="checkbox"
                        checked={needs_security}
                        onChange={e => setNeedsSecurity(e.target.checked)}
                        style={getCheckboxStyle()}
                      />
                      Security monitoring guard
                    </label>
                    <label style={getCheckboxLabelStyle()}>
                      <input
                        type="checkbox"
                        checked={needs_parking}
                        onChange={e => setNeedsParking(e.target.checked)}
                        style={getCheckboxStyle()}
                      />
                      Secure parking slot space
                    </label>
                    <label style={{ ...getCheckboxLabelStyle(), marginBottom: 0 }}>
                      <input
                        type="checkbox"
                        checked={needs_internet}
                        onChange={e => setNeedsInternet(e.target.checked)}
                        style={getCheckboxStyle()}
                      />
                      High-speed internet connection link
                    </label>
                  </div>

                  {submitError && (
                    <div style={{ color: "#f87171", fontSize: "0.85rem" }}>
                      {submitError}
                    </div>
                  )}

                  <button type="submit" style={getSubmitPillBtnStyle()}>
                    {editingId ? "Update tenant profile" : "Save tenant profile"}
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
