import React, { useMemo } from "react";
import { formatLocation } from "../utils/location";

// ==================================================
// 🌍 STATUS COLORS
// ==================================================
const STATUS_COLORS = Object.freeze({
  busy: "#f59e0b",
  working: "#3b82f6",
  offline: "#ef4444",
  available: "#22c55e"
});

// ==================================================
// 🎨 STATIC STYLES (OUT OF RENDER FLOW = MEMORY EFFICIENT)
// ==================================================
const baseBox = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  border: "1px solid #334155",
  borderRadius: "10px",
  background: "#1e293b",
  width: "100%",
  fontFamily: "Inter, Arial, sans-serif",
  transition: "all 0.2s ease",
  willChange: "transform"
};

const headerBox = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px"
};

const textWhite = {
  fontSize: "14px",
  fontWeight: 600,
  textTransform: "capitalize",
  color: "#ffffff"
};

const locationTextStyle = {
  fontSize: "14px",
  color: "#cbd5e1",
  wordBreak: "break-word",
  lineHeight: "1.3"
};

const distanceStyle = {
  fontSize: "13px",
  color: "#94a3b8"
};

const badgeBase = {
  display: "inline-flex",
  alignItems: "center",
  width: "fit-content",
  padding: "4px 8px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  fontSize: "12px",
  fontWeight: 600,
  textTransform: "capitalize"
};

// ==================================================
// 📍 COMPONENT (PRODUCTION READY)
// ==================================================
export default function LocationBadge({
  location = null,
  distanceKm = null,
  availability = "available",
  role = "",
  businessType = "",
  serviceType = "",
  compact = false
}) {
  // ==================================================
  // 📍 LOCATION (SAFE + CLEAN)
  // ==================================================
  const locationText = useMemo(() => {
    const formatted = formatLocation(location);
    const clean = typeof formatted === "string" ? formatted.trim() : "";

    return clean || "Unknown location";
  }, [location?.lat, location?.lng, location?.address]);

  // ==================================================
  // 📍 CATEGORY
  // ==================================================
  const category = useMemo(() => {
    return (role || businessType || serviceType || "general")
      .trim()
      .toLowerCase();
  }, [role, businessType, serviceType]);

  // ==================================================
  // 📍 STATUS
  // ==================================================
  const normalizedStatus = (availability || "available").toLowerCase();

  const statusColor = useMemo(() => {
    return STATUS_COLORS[normalizedStatus] ?? STATUS_COLORS.available;
  }, [normalizedStatus]);

  // ==================================================
  // 📍 DISTANCE
  // ==================================================
  const safeDistance = useMemo(() => {
    if (typeof distanceKm !== "number" || !Number.isFinite(distanceKm) || distanceKm < 0) {
      return null;
    }
    return distanceKm.toFixed(1);
  }, [distanceKm]);

  // ==================================================
  // 📦 ROOT STYLE
  // ==================================================
  const containerStyle = useMemo(() => ({
    ...baseBox,
    padding: compact ? "8px" : "12px"
  }), [compact]);

  // ==================================================
  // 📍 UI
  // ==================================================
  return (
    <div style={containerStyle}>
      
      {/* HEADER */}
      <div style={headerBox}>
        <span style={textWhite}>{category}</span>

        <span
          aria-label={normalizedStatus}
          title={normalizedStatus}
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: statusColor,
            boxShadow: `0 0 0 3px ${statusColor}22`
          }}
        />
      </div>

      {/* LOCATION */}
      <div style={locationTextStyle} title={locationText}>
        📍 {locationText}
      </div>

      {/* DISTANCE */}
      {safeDistance && (
        <div style={distanceStyle}>
          🚗 {safeDistance} km
        </div>
      )}

      {/* STATUS */}
      <div
        style={{
          ...badgeBase,
          color: statusColor
        }}
      >
        {normalizedStatus}
      </div>
    </div>
  );
}
