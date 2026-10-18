// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../utils/supabaseClient";
import VerificationBadgeManager from "../components/VerificationBadgeManager";

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
  has_security?: boolean;
  has_parking?: boolean;
  has_internet?: boolean;
  whatsapp_number: string;
  status?: string;
  is_available?: boolean;
  is_verified?: boolean;
  verification_status?: string;
  availability_date?: string;
  preferred_move_in_date?: string;
  lease_length?: string;
  max_occupants?: number;
  created_by?: string;
  image_urls?: string[];
  property_images?: string[];
}

interface PropertyFormData {
  whatsapp_number: string;
  city: string;
  suburb: string;
  room_type: string;
  price: string;
  status: string;
  availability_date: string;
  preferred_move_in_date: string;
  lease_length: string;
  max_occupants: string;
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
  const router = useRouter();

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

  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [statusLoading, setStatusLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All statuses");
  const [filterCity, setFilterCity] = useState("All cities");
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [justSavedId, setJustSavedId] = useState<string | number | null>(null);

  const handleVerificationChange = (id: string | number, isVerified: boolean, statusKey: string) => {
    setProperties((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, is_verified: isVerified, verification_status: statusKey } : p
      )
    );
    setSelectedProperty((prev) => {
      if (prev && prev.id === id) {
        return { ...prev, is_verified: isVerified, verification_status: statusKey };
      }
      return prev;
    });
  };

  const [showIntake, setShowIntake] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [formData, setFormData] = useState<PropertyFormData>({
    whatsapp_number: "",
    city: "Harare",
    suburb: "",
    room_type: "Single Room / Bed Sitter",
    price: "",
    status: "Available",
    availability_date: "",
    preferred_move_in_date: "",
    lease_length: "",
    max_occupants: "",
  });

  const [has_borehole, setHasBorehole] = useState(false);
  const [has_municipal_water, setHasMunicipalWater] = useState(false);
  const [has_solar_backup, setHasSolarBackup] = useState(false);
  const [has_security, setHasSecurity] = useState(false);
  const [has_parking, setHasParking] = useState(false);
  const [has_internet, setHasInternet] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);

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

  const handleImageUpload = async (files: File[]) => {
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const urls: string[] = [];

    try {
      for (const file of files) {
        // Verify file is a valid File object with proper binary payload
        if (!(file instanceof File) || file.size === 0) {
          console.error('Invalid file payload:', file);
          continue;
        }

        // Enforce randomized path names - isolated from any listing variables
        const fileExt = file.name.split('.').pop();
        const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `listings/${uniqueFileName}`;

        try {
          const { error: uploadError } = await supabase.storage
            .from('property-images')
            .upload(filePath, file, { upsert: false });

          if (uploadError) {
            console.error('Storage upload error:', uploadError);
            continue;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('property-images')
            .getPublicUrl(filePath);

          urls.push(publicUrl);
        } catch (networkError) {
          console.error('Network upload failure:', networkError);
          alert("Storage upload failed: Please check your internet connection or local .env configuration strings.");
          setUploadingImages(false);
          return;
        }
      }

      // Symmetrical array merging post-upload - append new URLs without mutating old array pointers
      setUploadedImageUrls(prev => [...prev, ...urls]);
    } catch (error) {
      console.error('Image upload error:', error);
      alert("Storage upload failed: Please check your internet connection or local .env configuration strings.");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    // Strict async barrier - wait for all image uploads to complete before proceeding
    if (uploadingImages) {
      setSubmitError("Please wait for images to finish uploading.");
      return;
    }

    const cleanPhone = String(formData.whatsapp_number || "").replace(/[^0-9]/g, "");
    const rentPrice = parseFloat(formData.price);
    const maxOccupants = parseInt(formData.max_occupants) || null;
    const deviceId = getDeviceId();

    let finalImageUrls = uploadedImageUrls;

    // If editing, fetch existing images and merge with newly uploaded ones
    if (editingId) {
      const { data: existingProperty } = await supabase
        .from("landlord_listings")
        .select("image_urls")
        .eq('id', editingId)
        .single();

      if (existingProperty) {
        // Merge existing images with newly uploaded ones (deduplicate)
        const existingUrls = Array.isArray(existingProperty.image_urls) ? existingProperty.image_urls : [];
        const allUrls = [...existingUrls, ...uploadedImageUrls];
        finalImageUrls = Array.from(new Set(allUrls)); // Remove duplicates
        console.log('Edit mode - Merged image URLs:', finalImageUrls);
      } else {
        console.log('Edit mode - No existing property found, using new images only:', finalImageUrls);
      }
    }

    const listingData = {
      whatsapp_number: cleanPhone,
      city: formData.city,
      suburb: formData.suburb.trim() || null,
      room_type: formData.room_type,
      price: rentPrice,
      has_borehole,
      has_municipal_water,
      has_solar_backup,
      has_electricity: has_solar_backup,
      has_security,
      has_parking,
      has_internet,
      availability_date: formData.availability_date || null,
      preferred_move_in_date: formData.preferred_move_in_date || null,
      lease_length: formData.lease_length || null,
      max_occupants: maxOccupants,
      image_urls: finalImageUrls,
      property_images: finalImageUrls,
      created_by: deviceId,
    };

    if (editingId) {
      // Update existing listing with strict async barrier - ensures complete array is passed
      console.log('Updating property with ID:', editingId, 'and image_urls:', finalImageUrls);
      const { data, error } = await supabase
        .from("landlord_listings")
        .update(listingData)
        .eq('id', editingId)
        .select();

      if (error) {
        console.error('Update error:', error);
        setSubmitError(error.message);
        return;
      }

      // Write-confirmation guard - a null error is NOT proof of success. When RLS
      // blocks the write, .update().eq().select() resolves with an empty payload,
      // so assert at least one row was actually modified before declaring victory.
      if (!data || data.length === 0) {
        console.error('Update wrote 0 rows (false-positive) for id:', editingId);
        setUploadingImages(false);
        alert("Database Update Warning: Profile modifications could not be written to the server. Please verify your table RLS policies.");
        return;
      }
      console.log('Update successful');

      // 1. Clear the stale modal view reference instantly. Nulling the selected
      //    property forces the open detail modal to unmount completely, breaking
      //    its cached memory hold on the old property object layout, and closes
      //    the main intake form drawer.
      setSelectedProperty(null);
      setShowIntake(false);

      // 2. Trigger a global list re-fetch, then force the Next.js client-side
      //    router cache to bust open so the browser pulls the newly updated image
      //    array straight from the Supabase rows on the next card click.
      await fetchProperties();
      router.refresh();

      // 3. Reset editing state now that the modal cache has been purged.
      setEditingId(null);
    } else {
      // Insert new listing
      const { data, error } = await supabase.from("landlord_listings").insert([
        {
          ...listingData,
          is_available: true,
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

      // Fetch properties after insert
      await fetchProperties();
    }

    // Reset states only after successful update/insert
    setFormData({
      whatsapp_number: "",
      city: "Harare",
      suburb: "",
      room_type: "Single Room / Bed Sitter",
      price: "",
      status: "Available",
      availability_date: "",
      preferred_move_in_date: "",
      lease_length: "",
      max_occupants: "",
    });
    setHasBorehole(false);
    setHasMunicipalWater(false);
    setHasSolarBackup(false);
    setHasSecurity(false);
    setHasParking(false);
    setHasInternet(false);
    setImageFiles([]);
    setUploadedImageUrls([]);
  };

  const handleEditProperty = (property: PropertyListing) => {
    const deviceId = getDeviceId();

    // Ownership lockout check
    if (property.created_by && property.created_by !== deviceId) {
      alert("Access Denied: You can only edit profiles or listings you registered yourself.");
      return;
    }

    setEditingId(property.id);
    setFormData({
      whatsapp_number: property.whatsapp_number || "",
      city: property.city,
      suburb: property.suburb || "",
      room_type: property.room_type,
      price: String(property.price),
      status: property.status || "Available",
      availability_date: property.availability_date || "",
      preferred_move_in_date: property.preferred_move_in_date || "",
      lease_length: property.lease_length || "",
      max_occupants: String(property.max_occupants || ""),
    });
    setHasBorehole(property.has_borehole || false);
    setHasMunicipalWater(property.has_municipal_water || false);
    setHasSolarBackup(property.has_solar_backup || false);
    setHasSecurity(property.has_security || false);
    setHasParking(property.has_parking || false);
    setHasInternet(property.has_internet || false);
    setUploadedImageUrls(property.image_urls || []);
    setShowIntake(true);

    // Automatic smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleAvailability = async (property: PropertyListing) => {
    const newStatus = !property.is_available;
    const { error } = await supabase
      .from("landlord_listings")
      .update({ is_available: newStatus })
      .eq('id', property.id);

    if (!error) {
      fetchProperties();
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

  const getStatusPillStyle = (isAvailable: boolean) => ({
    ...getBaseBadgeStyle(),
    backgroundColor: isAvailable ? "#132f1d" : "#3a230f",
    color: isAvailable ? "#10b981" : "#f59e0b",
    cursor: "pointer",
    transition: "all 0.2s ease",
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

  const getHeroImageStyle = () => ({
    width: "100%",
    height: "250px",
    objectFit: "cover",
    borderRadius: "16px",
    backgroundColor: isDarkMode ? "#1a1a1a" : "#e9ecef",
  });

  const getPlaceholderImageStyle = () => ({
    width: "100%",
    height: "250px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "16px",
    backgroundColor: isDarkMode ? "#1a1a1a" : "#e9ecef",
    border: `2px dashed #217d9d`,
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

    // Verify file payloads are valid File objects
    if (!(idFile instanceof File) || idFile.size === 0 || !(passportFile instanceof File) || passportFile.size === 0) {
      alert("Invalid file payloads. Please select valid image files.");
      return;
    }

    try {
      // Upload National ID
      const idExt = idFile.name.split('.').pop();
      const idFileName = `verification_${Date.now()}_id.${idExt}`;
      const idPath = `verification-documents/${idFileName}`;

      try {
        const { error: idUploadError } = await supabase.storage.from('verification-documents').upload(idPath, idFile);
        if (idUploadError) {
          console.error('National ID upload error:', idUploadError);
          alert("Storage upload failed: Please check your internet connection or local .env configuration strings.");
          return;
        }
      } catch (networkError) {
        console.error('National ID network failure:', networkError);
        alert("Storage upload failed: Please check your internet connection or local .env configuration strings.");
        return;
      }

      const { data: { publicUrl: idPublicUrl } } = supabase.storage.from('verification-documents').getPublicUrl(idPath);

      // Upload Passport Photo
      const passportExt = passportFile.name.split('.').pop();
      const passportFileName = `verification_${Date.now()}_passport.${passportExt}`;
      const passportPath = `verification-documents/${passportFileName}`;

      try {
        const { error: passportUploadError } = await supabase.storage.from('verification-documents').upload(passportPath, passportFile);
        if (passportUploadError) {
          console.error('Passport photo upload error:', passportUploadError);
          alert("Storage upload failed: Please check your internet connection or local .env configuration strings.");
          return;
        }
      } catch (networkError) {
        console.error('Passport photo network failure:', networkError);
        alert("Storage upload failed: Please check your internet connection or local .env configuration strings.");
        return;
      }

      const { data: { publicUrl: passportPublicUrl } } = supabase.storage.from('verification-documents').getPublicUrl(passportPath);

      // Insert verification record
      const deviceId = getDeviceId();
      await supabase.from('user_verifications').insert({
        device_id: deviceId,
        national_id_url: idPublicUrl,
        passport_photo_url: passportPublicUrl,
        listing_id: justSavedId,
        status: 'pending',
      });

      // Update listing to pending verification
      if (justSavedId) {
        await supabase.from('landlord_listings').update({ is_verified: false }).eq('id', justSavedId);
      }

      alert("Documents uploaded successfully! Your verification badge is pending administrator approval.");
      setShowVerification(false);
      setJustSavedId(null);
      fetchProperties();
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
      <div style={getAppContainerStyle()}>
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
        ) : selectedProperty ? (
          <div style={{ maxWidth: "430px", margin: "0 auto" }}>
            {/* Hero Image Section */}
            {selectedProperty.image_urls && selectedProperty.image_urls.length > 0 ? (
              <img
                src={selectedProperty.image_urls[0]}
                alt="Property"
                style={getHeroImageStyle()}
              />
            ) : (
              <div style={getPlaceholderImageStyle()}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#217d9d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
            )}

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
                  <VerificationBadgeManager
                    id={selectedProperty.id}
                    isVerified={selectedProperty.is_verified}
                    status={selectedProperty.verification_status}
                    tableName="landlord_listings"
                    onStatusChange={handleVerificationChange}
                    isDarkMode={isDarkMode}
                  />
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
                <span style={getMetaFieldLabel()}>Availability status</span>
                <span style={getStatusPillStyle(selectedProperty.is_available ?? true)}>
                  {selectedProperty.is_available ? "Available" : "Taken"}
                </span>
              </div>
              {selectedProperty.availability_date && (
                <div style={getMetaFieldGroup()}>
                  <span style={getMetaFieldLabel()}>Availability confirmed date</span>
                  <span style={getMetaFieldValue()}>{selectedProperty.availability_date}</span>
                </div>
              )}
              {selectedProperty.preferred_move_in_date && (
                <div style={getMetaFieldGroup()}>
                  <span style={getMetaFieldLabel()}>Preferred move-in date</span>
                  <span style={getMetaFieldValue()}>{selectedProperty.preferred_move_in_date}</span>
                </div>
              )}
              {selectedProperty.lease_length && (
                <div style={getMetaFieldGroup()}>
                  <span style={getMetaFieldLabel()}>Lease length</span>
                  <span style={getMetaFieldValue()}>{selectedProperty.lease_length}</span>
                </div>
              )}
              {selectedProperty.max_occupants && (
                <div style={getMetaFieldGroup()}>
                  <span style={getMetaFieldLabel()}>Max occupants allowed</span>
                  <span style={getMetaFieldValue()}>{selectedProperty.max_occupants}</span>
                </div>
              )}
              <div style={getMetaFieldGroup()}>
                <span style={getMetaFieldLabel()}>Utilities included</span>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                  {selectedProperty.has_borehole && <span style={getUtilityBadgeStyle()}>🚰 Borehole</span>}
                  {selectedProperty.has_municipal_water && <span style={getUtilityBadgeStyle()}>🏢 Council</span>}
                  {selectedProperty.has_solar_backup && <span style={getUtilityBadgeStyle()}>💡 Solar</span>}
                  {selectedProperty.has_security && <span style={getUtilityBadgeStyle()}>🛡️ Security</span>}
                  {selectedProperty.has_parking && <span style={getUtilityBadgeStyle()}>🚗 Parking</span>}
                  {selectedProperty.has_internet && <span style={getUtilityBadgeStyle()}>📶 Internet</span>}
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
              ← Back to Property Grid
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
                    if (!showIntake) {
                      setEditingId(null);
                      setFormData({
                        whatsapp_number: "",
                        city: "Harare",
                        suburb: "",
                        room_type: "Single Room / Bed Sitter",
                        price: "",
                        status: "Available",
                        availability_date: "",
                        preferred_move_in_date: "",
                        lease_length: "",
                        max_occupants: "",
                      });
                      setHasBorehole(false);
                      setHasMunicipalWater(false);
                      setHasSolarBackup(false);
                      setHasSecurity(false);
                      setHasParking(false);
                      setHasInternet(false);
                      setUploadedImageUrls([]);
                    }
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
                  {showIntake ? "✕ Close Intake" : "＋ List Property"}
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
                placeholder="Search by ID, suburb, or type"
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
                      <th style={getThColumnHeadingStyle()}>PROPERTY ↕</th>
                      <th style={getThColumnHeadingStyle()}>LOCATION ↕</th>
                      <th style={getThColumnHeadingStyle()}>RENT ↕</th>
                      <th style={getThColumnHeadingStyle()}>UTILITIES ↕</th>
                      <th style={getThColumnHeadingStyle()}>STATUS ↕</th>
                      <th style={getThColumnHeadingStyle()}>ACTIONS ↕</th>
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
                    ) : filteredProperties.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          style={{ padding: "20px", color: isDarkMode ? "#666" : "#6c757d", textAlign: "center" }}
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
                          <td
                            style={{
                              ...getTdCellStyle(),
                              fontWeight: "700",
                              color: isDarkMode ? "#fff" : "#212529",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center" }}>
                              <span>{item.room_type}</span>
                              <VerificationBadgeManager
                                id={item.id}
                                isVerified={item.is_verified}
                                status={item.verification_status}
                                tableName="landlord_listings"
                                onStatusChange={handleVerificationChange}
                                isDarkMode={isDarkMode}
                              />
                            </div>
                          </td>
                          <td style={getTdCellStyle()}>
                            <span style={{ fontWeight: "700", color: isDarkMode ? "#ffffff" : "#212529" }}>
                              {item.suburb ? `${item.suburb}, ` : ""}{item.city}
                            </span>
                          </td>
                          <td style={{ ...getTdCellStyle(), fontWeight: "700" }}>${item.price}/mo</td>
                          <td style={getTdCellStyle()}>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                              {item.has_borehole && <span style={getUtilityBadgeStyle()}>🚰</span>}
                              {item.has_municipal_water && <span style={getUtilityBadgeStyle()}>🏢</span>}
                              {item.has_solar_backup && <span style={getUtilityBadgeStyle()}>💡</span>}
                              {item.has_security && <span style={getUtilityBadgeStyle()}>🛡️</span>}
                              {item.has_parking && <span style={getUtilityBadgeStyle()}>🚗</span>}
                              {item.has_internet && <span style={getUtilityBadgeStyle()}>📶</span>}
                            </div>
                          </td>
                          <td style={getTdCellStyle()}>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleAvailability(item);
                              }}
                              style={getStatusPillStyle(item.is_available ?? true)}
                            >
                              {item.is_available ? "Available" : "Taken"}
                            </span>
                          </td>
                          <td style={getTdCellStyle()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditProperty(item);
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

            {showIntake && (
              <div style={getFormCardStyle()}>
                <h2 style={getFormTitleStyle()}>
                  {editingId ? "Update property profile" : "List a new property"}
                </h2>
                <p style={getFormSubtitleStyle()}>
                  {editingId ? "Edit the property details below." : "Add a vacant property room to the marketplace."}
                </p>

                <form onSubmit={handleFormSubmit} style={getFormGridStructure()}>
                  <div style={getFieldBlockStyle()}>
                    <label style={getLabelStyle()}>Property images (multiple allowed)</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files) {
                          // Absolute isolation of file objects - save as raw binary chunks immediately
                          const newFiles = Array.from(e.target.files);
                          setImageFiles(newFiles);
                          handleImageUpload(newFiles);
                        }
                      }}
                      disabled={uploadingImages}
                      style={getInputBoxStyle()}
                    />
                    {uploadingImages && <span style={getInputHelpTextStyle()}>Uploading images...</span>}
                    {uploadedImageUrls.length > 0 && (
                      <span style={getInputHelpTextStyle()}>
                        {uploadedImageUrls.length} image(s) uploaded
                      </span>
                    )}
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
                    <label style={getLabelStyle()}>City</label>
                    <CustomDropdown
                      value={formData.city}
                      options={CITIES}
                      placeholder="Select city"
                      onSelect={(value) => setFormData(prev => ({ ...prev, city: value }))}
                      isDarkMode={isDarkMode}
                    />
                  </div>

                  <div style={getFieldBlockStyle()}>
                    <label style={getLabelStyle()}>Suburb or area</label>
                    <input
                      type="text"
                      name="suburb"
                      value={formData.suburb}
                      onChange={handleInputChange}
                      placeholder="e.g. Avondale (optional)"
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
                    <label style={getLabelStyle()}>Monthly rent (USD)</label>
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

                  <div style={getFieldBlockStyle()}>
                    <label style={getLabelStyle()}>Availability confirmed date</label>
                    <input
                      type="date"
                      name="availability_date"
                      value={formData.availability_date}
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
                    <label style={getLabelStyle()}>Lease length / duration</label>
                    <input
                      type="text"
                      name="lease_length"
                      value={formData.lease_length}
                      onChange={handleInputChange}
                      placeholder="e.g. 6-12 Months"
                      style={getInputBoxStyle()}
                    />
                  </div>

                  <div style={getFieldBlockStyle()}>
                    <label style={getLabelStyle()}>Max occupants allowed</label>
                    <input
                      type="number"
                      name="max_occupants"
                      value={formData.max_occupants}
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
                    <label style={getCheckboxLabelStyle()}>
                      <input
                        type="checkbox"
                        checked={has_solar_backup}
                        onChange={e => setHasSolarBackup(e.target.checked)}
                        style={getCheckboxStyle()}
                      />
                      Constant solar electrical backup
                    </label>
                    <label style={getCheckboxLabelStyle()}>
                      <input
                        type="checkbox"
                        checked={has_security}
                        onChange={e => setHasSecurity(e.target.checked)}
                        style={getCheckboxStyle()}
                      />
                      Security monitoring guard
                    </label>
                    <label style={getCheckboxLabelStyle()}>
                      <input
                        type="checkbox"
                        checked={has_parking}
                        onChange={e => setHasParking(e.target.checked)}
                        style={getCheckboxStyle()}
                      />
                      Secure parking slot space
                    </label>
                    <label style={{ ...getCheckboxLabelStyle(), marginBottom: 0 }}>
                      <input
                        type="checkbox"
                        checked={has_internet}
                        onChange={e => setHasInternet(e.target.checked)}
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

                  <button 
                    type="submit" 
                    style={getSubmitPillBtnStyle()}
                    disabled={uploadingImages}
                  >
                    {uploadingImages ? "Uploading images..." : (editingId ? "Update property profile" : "Save property profile")}
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
