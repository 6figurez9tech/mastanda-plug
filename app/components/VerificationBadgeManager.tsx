"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../utils/supabaseClient";

export interface VerificationBadgeManagerProps {
  id: string | number;
  isVerified?: boolean;
  status?: string;
  tableName: "landlord_listings" | "tenant_requests";
  onStatusChange: (id: string | number, isVerified: boolean, status: string) => void;
  isDarkMode?: boolean;
}

interface VerificationOption {
  label: string;
  isVerified: boolean;
  statusKey: string;
}

const VERIFICATION_OPTIONS: VerificationOption[] = [
  { label: "⏳ Pending", isVerified: false, statusKey: "pending" },
  { label: "❌ Unverified", isVerified: false, statusKey: "unverified" },
  { label: "🔵 Request Verification", isVerified: true, statusKey: "verified" },
];

export default function VerificationBadgeManager({
  id,
  isVerified = false,
  status,
  tableName,
  onStatusChange,
  isDarkMode = false,
}: VerificationBadgeManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectOption = async (option: VerificationOption) => {
    setIsOpen(false);
    setIsUpdating(true);

    try {
      // 1. Shift the tracking boolean parameter straight on Supabase backend column
      const { error } = await supabase
        .from(tableName)
        .update({ is_verified: option.isVerified })
        .eq("id", id);

      if (error) {
        console.error(`Error updating verification status in ${tableName}:`, error);
        alert(`Could not update verification status: ${error.message}`);
        return;
      }

      // 2. Seamlessly update frontend UI state without page reloads
      onStatusChange(id, option.isVerified, option.statusKey);
    } catch (err) {
      console.error("Unexpected error updating verification:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        verticalAlign: "middle",
        userSelect: "none",
      }}
    >
      {/* Badge Button Trigger Element */}
      {isVerified ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          title="Verified Profile (Click to change status)"
          style={{
            backgroundColor: "#1877f2",
            borderRadius: "50%",
            width: "16px",
            height: "16px",
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            marginLeft: "6px",
            border: "none",
            padding: 0,
            cursor: isUpdating ? "wait" : "pointer",
            outline: "none",
            flexShrink: 0,
            boxShadow: "0 1px 3px rgba(24, 119, 242, 0.35)",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              display: "block",
              fontSize: "10px",
              color: "#ffffff",
              fontWeight: "900",
            }}
          >
            <path
              d="M2.5 6.2L4.8 8.5L9.5 3.5"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : status === "unverified" ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          title="Unverified (Click to change status)"
          style={{
            backgroundColor: isDarkMode ? "#2d1b1b" : "#fee2e2",
            borderRadius: "50%",
            width: "16px",
            height: "16px",
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            marginLeft: "6px",
            border: isDarkMode ? "1px solid #4a2222" : "1px solid #fca5a5",
            padding: 0,
            cursor: isUpdating ? "wait" : "pointer",
            outline: "none",
            fontSize: "9px",
            color: "#ef4444",
            fontWeight: "900",
            flexShrink: 0,
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          ✕
        </button>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          title="Pending Verification (Click to change status)"
          style={{
            backgroundColor: isDarkMode ? "#2d2215" : "#fef3c7",
            borderRadius: "50%",
            width: "16px",
            height: "16px",
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            marginLeft: "6px",
            border: isDarkMode ? "1px solid #4a3318" : "1px solid #fcd34d",
            padding: 0,
            cursor: isUpdating ? "wait" : "pointer",
            outline: "none",
            fontSize: "9px",
            color: "#f59e0b",
            fontWeight: "900",
            flexShrink: 0,
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          ⏳
        </button>
      )}

      {/* Floating Overlay Menu Container */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 99999,
            borderRadius: "12px",
            padding: "4px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            backgroundColor: isDarkMode ? "#1e1e1e" : "#ffffff",
            border: isDarkMode ? "1px solid #2d2d2d" : "1px solid #e5e7eb",
            minWidth: "175px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {VERIFICATION_OPTIONS.map((opt) => {
            const isCurrentlySelected =
              opt.isVerified === isVerified &&
              (opt.statusKey === status || (!status && !opt.isVerified && opt.statusKey === "pending"));
            const isHovered = hoveredOption === opt.label;

            return (
              <button
                key={opt.label}
                type="button"
                disabled={isUpdating}
                onMouseEnter={() => setHoveredOption(opt.label)}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectOption(opt);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: isHovered
                    ? isDarkMode
                      ? "#2a2a2a"
                      : "#f3f4f6"
                    : isCurrentlySelected
                    ? isDarkMode
                      ? "#1b2533"
                      : "#eff6ff"
                    : "transparent",
                  color: isDarkMode ? "#ffffff" : "#1f2937",
                  fontSize: "0.8rem",
                  fontWeight: isCurrentlySelected ? "700" : "500",
                  cursor: isUpdating ? "wait" : "pointer",
                  textAlign: "left",
                  whiteSpace: "nowrap",
                  transition: "background-color 0.15s ease",
                }}
              >
                <span>{opt.label}</span>
                {isCurrentlySelected && (
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#1877f2",
                      marginLeft: "6px",
                      fontWeight: "900",
                    }}
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
