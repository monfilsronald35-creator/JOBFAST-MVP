/* ==================================================
   🌍 JOBFAST LOCATION BADGE (MVP STABLE)
   FILE: apps/frontend/src/components/LocationBadge.jsx
   ================================================== */

import React from "react";

import {
  formatLocation
} from "../utils/location";

/* ==================================================
   📍 COMPONENT
   ================================================== */

export default function LocationBadge({
  location = {},
  distanceKm = null,
  availability = "available",
  role = "",
  businessType = "",
  serviceType = "",
  compact = false
}) {
  /* ==================================================
     📍 LOCATION TEXT
     ================================================== */

  const locationText =
    formatLocation(location);

  /* ==================================================
     📍 STATUS COLOR
     ================================================== */

  const getStatusColor = () => {
    switch (availability) {
      case "busy":
        return "#f59e0b";

      case "working":
        return "#3b82f6";

      case "offline":
        return "#ef4444";

      default:
        return "#22c55e";
    }
  };

  /* ==================================================
     📍 CATEGORY LABEL
     ================================================== */

  const category =
    role ||
    businessType ||
    serviceType ||
    "general";

  /* ==================================================
     📍 UI
     ================================================== */

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",

        padding: compact
          ? "8px"
          : "12px",

        border:
          "1px solid #334155",

        borderRadius: "10px",

        background: "#1e293b",

        width: "100%"
      }}
    >
      {/* =========================
          CATEGORY
         ========================= */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",

          gap: "10px"
        }}
      >
        <span
          style={{
            fontSize: "14px",
            fontWeight: 600,

            textTransform:
              "capitalize",

            color: "#ffffff"
          }}
        >
          {category}
        </span>

        <span
          style={{
            width: "10px",
            height: "10px",

            borderRadius: "50%",

            background:
              getStatusColor()
          }}
        />
      </div>

      {/* =========================
          LOCATION
         ========================= */}

      <div
        style={{
          fontSize: "14px",
          color: "#cbd5e1",

          wordBreak: "break-word"
        }}
      >
        📍{" "}
        {locationText ||
          "Unknown location"}
      </div>

      {/* =========================
          DISTANCE
         ========================= */}

      {distanceKm !== null && (
        <div
          style={{
            fontSize: "13px",
            color: "#94a3b8"
          }}
        >
          🚗 {distanceKm} km
        </div>
      )}

      {/* =========================
          AVAILABILITY
         ========================= */}

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",

          width: "fit-content",

          padding: "4px 8px",

          borderRadius: "999px",

          background:
            "rgba(255,255,255,0.06)",

          fontSize: "12px",

          fontWeight: 600,

          textTransform:
            "capitalize",

          color: getStatusColor()
        }}
      >
        {availability}
      </div>
    </div>
  );
}