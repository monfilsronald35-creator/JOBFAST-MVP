/* ==================================================
   🌍 JOBFAST SEARCH PAGE (MVP STABLE COMPLETE)
   FILE: apps/frontend/src/pages/Search.jsx
   ================================================== */

import React, {
  useMemo,
  useState
} from "react";

import { useTranslation } from "react-i18next";

import LocationBadge from "../components/LocationBadge";

import LanguageSelector from "../components/LanguageSelector";

import {
  getCurrentPosition,
  attachDistance,
  sortByDistance,
  filterNearby
} from "../utils/location";

/* ==================================================
   🚀 SEARCH PAGE
   ================================================== */

function Search() {
  const { t } = useTranslation();

  /* ==================================================
     📍 STATES
     ================================================== */

  const [query, setQuery] =
    useState("");

  const [selectedType, setSelectedType] =
    useState("all");

  const [loadingGps, setLoadingGps] =
    useState(false);

  const [gpsError, setGpsError] =
    useState("");

  const [userLocation, setUserLocation] =
    useState(null);

  const [nearbyOnly, setNearbyOnly] =
    useState(false);

  /* ==================================================
     📍 MOCK DATA
     ================================================== */

  const mockResults = [
    /* =========================
       CONSTRUCTION
       ========================= */

    {
      id: 1,

      name: "Ronald Monfils",

      role: "mason",

      type: "construction",

      availability: "available",

      bio:
        "Professional mason available for construction jobs",

      location: {
        city: "Bavaro",
        state: "La Altagracia",
        country:
          "Dominican Republic",

        lat: 18.629,
        lng: -68.4055
      }
    },

    {
      id: 2,

      name: "Jean Build Pro",

      role: "electrician",

      type: "construction",

      availability: "working",

      bio:
        "Electrical installation and repair specialist",

      location: {
        city: "Veron",
        state: "La Altagracia",
        country:
          "Dominican Republic",

        lat: 18.5901,
        lng: -68.4301
      }
    },

    {
      id: 3,

      name: "Carlos Constructor",

      role: "boss",

      type: "construction",

      availability: "busy",

      bio:
        "Construction boss managing large projects",

      location: {
        city: "Higuey",
        state: "La Altagracia",
        country:
          "Dominican Republic",

        lat: 18.615,
        lng: -68.7079
      }
    },

    {
      id: 4,

      name: "Wood Expert",

      role: "carpenter",

      type: "construction",

      availability: "available",

      bio:
        "Custom wood and roofing specialist",

      location: {
        city: "Punta Cana",
        state: "La Altagracia",
        country:
          "Dominican Republic",

        lat: 18.582,
        lng: -68.3705
      }
    },

    /* =========================
       BUSINESSES
       ========================= */

    {
      id: 5,

      name: "Hotel Paradise",

      businessType: "hotel",

      type: "business",

      availability: "working",

      bio:
        "Luxury hotel in Punta Cana",

      location: {
        city: "Punta Cana",
        state: "La Altagracia",
        country:
          "Dominican Republic",

        lat: 18.5601,
        lng: -68.3725
      }
    },

    {
      id: 6,

      name: "Central Clinic",

      businessType: "clinic",

      type: "business",

      availability: "available",

      bio:
        "Medical clinic open everyday",

      location: {
        city: "Punta Cana",
        state: "La Altagracia",
        country:
          "Dominican Republic",

        lat: 18.5705,
        lng: -68.408
      }
    },

    {
      id: 7,

      name: "Bavaro Restaurant",

      businessType: "restaurant",

      type: "business",

      availability: "working",

      bio:
        "Caribbean restaurant and local food",

      location: {
        city: "Bavaro",
        state: "La Altagracia",
        country:
          "Dominican Republic",

        lat: 18.6402,
        lng: -68.4011
      }
    },

    {
      id: 8,

      name: "Global Lawyers",

      businessType: "lawyer",

      type: "business",

      availability: "available",

      bio:
        "Immigration and business legal services",

      location: {
        city: "Santo Domingo",
        state: "Distrito Nacional",
        country:
          "Dominican Republic",

        lat: 18.4861,
        lng: -69.9312
      }
    },

    {
      id: 9,

      name: "Tour Punta Cana",

      businessType: "tourGuide",

      type: "business",

      availability: "available",

      bio:
        "Tour guide services for visitors",

      location: {
        city: "Bavaro",
        state: "La Altagracia",
        country:
          "Dominican Republic",

        lat: 18.6285,
        lng: -68.4102
      }
    },

    /* =========================
       SERVICES
       ========================= */

    {
      id: 10,

      name: "Chef Jean",

      serviceType: "chef",

      type: "service",

      availability: "available",

      bio:
        "Private chef available anytime",

      location: {
        city: "Veron",
        state: "La Altagracia",
        country:
          "Dominican Republic",

        lat: 18.585,
        lng: -68.435
      }
    },

    {
      id: 11,

      name: "Quick Taxi",

      serviceType: "taxi",

      type: "service",

      availability: "busy",

      bio:
        "24/7 taxi nearby",

      location: {
        city: "Higuey",
        state: "La Altagracia",
        country:
          "Dominican Republic",

        lat: 18.615,
        lng: -68.7079
      }
    },

    {
      id: 12,

      name: "Clean Master",

      serviceType: "cleaning",

      type: "service",

      availability: "available",

      bio:
        "House and office cleaning services",

      location: {
        city: "Punta Cana",
        state: "La Altagracia",
        country:
          "Dominican Republic",

        lat: 18.5751,
        lng: -68.3999
      }
    },

    {
      id: 13,

      name: "Doctor Luis",

      serviceType: "doctor",

      type: "service",

      availability: "working",

      bio:
        "Home doctor consultation available",

      location: {
        city: "Bavaro",
        state: "La Altagracia",
        country:
          "Dominican Republic",

        lat: 18.6202,
        lng: -68.409
      }
    },

    {
      id: 14,

      name: "Creative Designer",

      serviceType: "designer",

      type: "service",

      availability: "available",

      bio:
        "Graphic design and branding services",

      location: {
        city: "Santo Domingo",
        state: "Distrito Nacional",
        country:
          "Dominican Republic",

        lat: 18.482,
        lng: -69.9301
      }
    }
  ];

  /* ==================================================
     📍 ENABLE GPS
     ================================================== */

  const handleEnableGps =
    async () => {
      try {
        setLoadingGps(true);

        setGpsError("");

        const position =
          await getCurrentPosition();

        setUserLocation(position);
      } catch (error) {
        setGpsError(
          t(
            "location.gpsUnavailable"
          )
        );
      } finally {
        setLoadingGps(false);
      }
    };

  /* ==================================================
     📍 DISTANCE
     ================================================== */

  const resultsWithDistance =
    useMemo(() => {
      if (!userLocation) {
        return mockResults;
      }

      return sortByDistance(
        attachDistance(
          mockResults,
          userLocation
        )
      );
    }, [userLocation]);

  /* ==================================================
     📍 FILTER RESULTS
     ================================================== */

  const filteredResults =
    useMemo(() => {
      const safeQuery =
        query.toLowerCase();

      let results =
        resultsWithDistance.filter(
          (item) => {
            const searchable =
              [
                item.name,
                item.role,
                item.type,
                item.businessType,
                item.serviceType,
                item.bio,
                item.location?.city
              ]
                .join(" ")
                .toLowerCase();

            return searchable.includes(
              safeQuery
            );
          }
        );

      if (
        selectedType !== "all"
      ) {
        results = results.filter(
          (item) =>
            item.type ===
            selectedType
        );
      }

      if (nearbyOnly) {
        results =
          filterNearby(
            results,
            10
          );
      }

      return results;
    }, [
      query,
      selectedType,
      nearbyOnly,
      resultsWithDistance
    ]);

  /* ==================================================
     📍 UI
     ================================================== */

  return (
    <div style={styles.container}>

      {/* =========================
          HEADER
         ========================= */}

      <div style={styles.header}>

        <div>
          <h1 style={styles.title}>
            JOBFAST
          </h1>

          <p style={styles.subtitle}>
            Construction •
            Businesses •
            Services On Demand
          </p>
        </div>

        <LanguageSelector
          compact
        />

      </div>

      {/* =========================
          SEARCH
         ========================= */}

      <input
        style={styles.input}
        placeholder={t(
          "search.placeholder"
        )}
        value={query}
        onChange={(e) =>
          setQuery(
            e.target.value
          )
        }
      />

      {/* =========================
          FILTERS
         ========================= */}

      <div style={styles.filters}>

        <button
          style={{
            ...styles.filterButton,
            background:
              selectedType ===
              "all"
                ? "#2563eb"
                : "#1e293b"
          }}
          onClick={() =>
            setSelectedType(
              "all"
            )
          }
        >
          All
        </button>

        <button
          style={{
            ...styles.filterButton,
            background:
              selectedType ===
              "construction"
                ? "#2563eb"
                : "#1e293b"
          }}
          onClick={() =>
            setSelectedType(
              "construction"
            )
          }
        >
          Construction
        </button>

        <button
          style={{
            ...styles.filterButton,
            background:
              selectedType ===
              "business"
                ? "#2563eb"
                : "#1e293b"
          }}
          onClick={() =>
            setSelectedType(
              "business"
            )
          }
        >
          Business
        </button>

        <button
          style={{
            ...styles.filterButton,
            background:
              selectedType ===
              "service"
                ? "#2563eb"
                : "#1e293b"
          }}
          onClick={() =>
            setSelectedType(
              "service"
            )
          }
        >
          Services
        </button>

      </div>

      {/* =========================
          ACTIONS
         ========================= */}

      <div style={styles.actions}>

        <button
          style={styles.button}
          onClick={
            handleEnableGps
          }
        >
          {loadingGps
            ? t("app.loading")
            : t(
                "location.enableGps"
              )}
        </button>

        <button
          style={{
            ...styles.button,
            background:
              nearbyOnly
                ? "#22c55e"
                : "#334155"
          }}
          onClick={() =>
            setNearbyOnly(
              !nearbyOnly
            )
          }
        >
          {t(
            "location.searchNearby"
          )}
        </button>

      </div>

      {/* =========================
          GPS ERROR
         ========================= */}

      {gpsError && (
        <div style={styles.error}>
          {gpsError}
        </div>
      )}

      {/* =========================
          RESULTS COUNT
         ========================= */}

      <div style={styles.resultsInfo}>
        {filteredResults.length}{" "}
        {t("search.results")}
      </div>

      {/* =========================
          RESULTS
         ========================= */}

      <div style={styles.list}>

        {filteredResults.length ===
        0 ? (
          <div style={styles.empty}>
            {t(
              "search.noResults"
            )}
          </div>
        ) : (
          filteredResults.map(
            (item) => (
              <div
                key={item.id}
                style={styles.card}
              >

                <div
                  style={
                    styles.topRow
                  }
                >

                  <div
                    style={{
                      flex: 1
                    }}
                  >
                    <h3
                      style={
                        styles.name
                      }
                    >
                      {item.name}
                    </h3>

                    <p
                      style={
                        styles.bio
                      }
                    >
                      {item.bio}
                    </p>
                  </div>

                  <span
                    style={
                      styles.type
                    }
                  >
                    {item.type}
                  </span>

                </div>

                <LocationBadge
                  location={
                    item.location
                  }

                  distanceKm={
                    item.distanceKm
                  }

                  availability={
                    item.availability
                  }

                  role={item.role}

                  businessType={
                    item.businessType
                  }

                  serviceType={
                    item.serviceType
                  }
                />

              </div>
            )
          )
        )}

      </div>

    </div>
  );
}

/* ==================================================
   🎨 STYLES
   ================================================== */

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0f172a",
    color: "#ffffff",
    padding: "20px",
    fontFamily: "Arial"
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "10px",
    marginBottom: "20px"
  },

  title: {
    margin: 0,
    fontSize: "30px",
    fontWeight: 700
  },

  subtitle: {
    marginTop: "5px",
    color: "#94a3b8",
    fontSize: "13px"
  },

  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border:
      "1px solid #334155",
    background: "#1e293b",
    color: "#ffffff",
    outline: "none",
    marginBottom: "15px",
    fontSize: "14px",
    boxSizing: "border-box"
  },

  filters: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "15px"
  },

  filterButton: {
    padding: "10px 14px",
    border: "none",
    borderRadius: "999px",
    cursor: "pointer",
    color: "#ffffff",
    fontWeight: 600
  },

  actions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "20px"
  },

  button: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: 600
  },

  error: {
    background:
      "rgba(239,68,68,0.15)",
    color: "#ef4444",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "15px"
  },

  resultsInfo: {
    color: "#94a3b8",
    marginBottom: "15px",
    fontSize: "14px"
  },

  list: {
    display: "grid",
    gap: "14px"
  },

  card: {
    background: "#1e293b",
    borderRadius: "12px",
    padding: "14px",
    border:
      "1px solid #334155"
  },

  topRow: {
    display: "flex",
    justifyContent:
      "space-between",
    gap: "10px",
    marginBottom: "12px"
  },

  name: {
    margin: 0,
    fontSize: "18px"
  },

  bio: {
    marginTop: "5px",
    color: "#94a3b8",
    fontSize: "13px",
    lineHeight: 1.5
  },

  type: {
    background:
      "rgba(255,255,255,0.08)",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    height: "fit-content",
    textTransform:
      "capitalize"
  },

  empty: {
    textAlign: "center",
    color: "#94a3b8",
    padding: "40px 0"
  }
};

export default Search;