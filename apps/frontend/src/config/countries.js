// ============================================================
// JOBFAST — Country & Zone configuration
// Consumed by: Register/Step3_BasicInfo.jsx
// Shape expected:
//   COUNTRY_DATA   — Array<{ code, flag, labels: {ht,fr,en,es}, phonePrefix }>
//   getCountryLabel(country, locale) → string
//   getZones(country, locale)        → string[]
// ============================================================

// ── Regional zones per country ────────────────────────────────
const ZONES = {
  ht: [
    "Ouest",
    "Nord",
    "Nord-Est",
    "Nord-Ouest",
    "Artibonite",
    "Centre",
    "Nippes",
    "Grand'Anse",
    "Sud",
    "Sud-Est",
  ],
  do: [
    "Distrito Nacional",
    "Santo Domingo",
    "Santiago",
    "La Romana",
    "San Pedro de Macorís",
    "Puerto Plata",
    "La Vega",
    "Duarte",
    "San Cristóbal",
    "Azua",
    "Barahona",
    "El Seibo",
    "Espaillat",
    "Hato Mayor",
    "Independencia",
    "La Altagracia",
    "María Trinidad Sánchez",
    "Monseñor Nouel",
    "Monte Cristi",
    "Monte Plata",
    "Pedernales",
    "Peravia",
    "Samaná",
    "Sánchez Ramírez",
    "San José de Ocoa",
    "San Juan",
    "Valverde",
  ],
  us: [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California",
    "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
    "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
    "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
    "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri",
    "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
    "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
    "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
    "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
  ],
  ca: [
    "Ontario",
    "Québec",
    "British Columbia",
    "Alberta",
    "Manitoba",
    "Saskatchewan",
    "Nova Scotia",
    "New Brunswick",
    "Newfoundland and Labrador",
    "Prince Edward Island",
    "Northwest Territories",
    "Nunavut",
    "Yukon",
  ],
  fr: [
    "Île-de-France",
    "Auvergne-Rhône-Alpes",
    "Nouvelle-Aquitaine",
    "Occitanie",
    "Hauts-de-France",
    "Grand Est",
    "Provence-Alpes-Côte d'Azur",
    "Pays de la Loire",
    "Normandie",
    "Bretagne",
    "Bourgogne-Franche-Comté",
    "Centre-Val de Loire",
    "Corse",
  ],
  mx: [
    "Ciudad de México", "Jalisco", "Nuevo León", "Puebla",
    "Guanajuato", "Chihuahua", "Baja California", "Veracruz",
    "Tamaulipas", "Coahuila",
  ],
  br: [
    "São Paulo", "Rio de Janeiro", "Minas Gerais", "Bahia",
    "Paraná", "Rio Grande do Sul", "Pernambuco", "Ceará", "Pará", "Goiás",
  ],
  es: [
    "Andalucía", "Cataluña", "Madrid", "Valencia", "Galicia",
    "País Vasco", "Castilla y León", "Canarias", "Castilla-La Mancha", "Murcia",
  ],
  gb: ["England", "Scotland", "Wales", "Northern Ireland"],
  pt: [
    "Lisboa", "Porto", "Braga", "Setúbal", "Aveiro",
    "Leiria", "Faro", "Coimbra", "Santarém", "Viseu",
  ],
};

// ── Country data ──────────────────────────────────────────────
export const COUNTRY_DATA = [
  {
    code:        "ht",
    flag:        "🇭🇹",
    phonePrefix: "+509",
    labels: { ht: "Ayiti", fr: "Haïti", en: "Haiti", es: "Haití" },
  },
  {
    code:        "do",
    flag:        "🇩🇴",
    phonePrefix: "+1-809",
    labels: { ht: "Repiblik Dominiken", fr: "Rép. Dominicaine", en: "Dominican Republic", es: "Rep. Dominicana" },
  },
  {
    code:        "us",
    flag:        "🇺🇸",
    phonePrefix: "+1",
    labels: { ht: "Etazini", fr: "États-Unis", en: "United States", es: "Estados Unidos" },
  },
  {
    code:        "ca",
    flag:        "🇨🇦",
    phonePrefix: "+1",
    labels: { ht: "Kanada", fr: "Canada", en: "Canada", es: "Canadá" },
  },
  {
    code:        "fr",
    flag:        "🇫🇷",
    phonePrefix: "+33",
    labels: { ht: "Lafrans", fr: "France", en: "France", es: "Francia" },
  },
  {
    code:        "mx",
    flag:        "🇲🇽",
    phonePrefix: "+52",
    labels: { ht: "Meksik", fr: "Mexique", en: "Mexico", es: "México" },
  },
  {
    code:        "br",
    flag:        "🇧🇷",
    phonePrefix: "+55",
    labels: { ht: "Brezil", fr: "Brésil", en: "Brazil", es: "Brasil" },
  },
  {
    code:        "es",
    flag:        "🇪🇸",
    phonePrefix: "+34",
    labels: { ht: "Espay", fr: "Espagne", en: "Spain", es: "España" },
  },
  {
    code:        "gb",
    flag:        "🇬🇧",
    phonePrefix: "+44",
    labels: { ht: "Wayòm Ini", fr: "Royaume-Uni", en: "United Kingdom", es: "Reino Unido" },
  },
  {
    code:        "pt",
    flag:        "🇵🇹",
    phonePrefix: "+351",
    labels: { ht: "Pòtigal", fr: "Portugal", en: "Portugal", es: "Portugal" },
  },
];

// ── Helpers ───────────────────────────────────────────────────

/**
 * Return the display label for a country in the given locale.
 * Falls back to English, then the first available label.
 */
export function getCountryLabel(country, locale) {
  if (!country) return "";
  const loc = (locale || "en").slice(0, 2).toLowerCase();
  return country.labels?.[loc] || country.labels?.en || Object.values(country.labels || {})[0] || country.code;
}

/**
 * Return the list of zones/regions for a country.
 * Locale param kept for future translation; currently zones are proper nouns.
 */
export function getZones(country, _locale) {
  if (!country) return [];
  return ZONES[country.code] || [];
}
