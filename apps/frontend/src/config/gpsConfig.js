/**
 * gpsConfig.js
 *
 * Single source of truth for GPS/Location system behavior.
 * All radius options, cache settings, and role-specific availability
 * states live here. No role-specific logic in component code.
 */

// ── Radius options (km) ───────────────────────────────────────
export const GPS_RADIUS_OPTIONS = [2, 5, 10, 25, 50, 100];
export const GPS_DEFAULT_RADIUS_KM = 10;

// ── Timing ───────────────────────────────────────────────────
export const GPS_CACHE_TTL_MS            = 5  * 60 * 1000; // 5 min
export const GPS_THROTTLE_MS             = 30 * 1000;       // 30 sec between re-acquires
export const GPS_BACKGROUND_THROTTLE_MS  = 2  * 60 * 1000; // 2 min in background

// ── Permission / state labels ─────────────────────────────────
export const GPS_STATES = {
  idle:         'idle',
  acquiring:    'acquiring',
  ready:        'ready',
  low_accuracy: 'low_accuracy',
  cached:       'cached',
  denied:       'denied',
  blocked:      'blocked',
  disabled:     'disabled',
  unavailable:  'unavailable',
  offline:      'offline',
};

export const GPS_STATE_LABELS = {
  idle:         'Atann',
  acquiring:    'Ap jwenn lokasyon...',
  ready:        'GPS aktif',
  low_accuracy: 'Presizon ba',
  cached:       'Lokasyon cache',
  denied:       'GPS refize',
  blocked:      'GPS bloke',
  disabled:     'GPS dezaktive',
  unavailable:  'GPS pa disponib',
  offline:      'Mòd òflayn',
};

// ── Map clustering grid size ──────────────────────────────────
export const CLUSTER_GRID_KM = 1.5; // merge markers within 1.5 km

// ── Offline fallback: common cities ──────────────────────────
export const OFFLINE_CITIES = [
  { city: 'Port-au-Prince', country: 'Haiti',          lat: 18.5944,  lng: -72.3074 },
  { city: 'Cap-Haïtien',    country: 'Haiti',          lat: 19.7581,  lng: -72.2024 },
  { city: 'Les Cayes',      country: 'Haiti',          lat: 18.2011,  lng: -73.7500 },
  { city: 'Gonaïves',       country: 'Haiti',          lat: 19.4500,  lng: -72.6833 },
  { city: 'Saint-Marc',     country: 'Haiti',          lat: 19.1167,  lng: -72.7000 },
  { city: 'Jacmel',         country: 'Haiti',          lat: 18.2333,  lng: -72.5333 },
  { city: 'Pétion-Ville',   country: 'Haiti',          lat: 18.5122,  lng: -72.2867 },
  { city: 'Santo Domingo',  country: 'Dominican Republic', lat: 18.4861, lng: -69.9312 },
  { city: 'Miami',          country: 'United States',  lat: 25.7617,  lng: -80.1918 },
  { city: 'New York',       country: 'United States',  lat: 40.7128,  lng: -74.0060 },
  { city: 'Montreal',       country: 'Canada',         lat: 45.5017,  lng: -73.5673 },
  { city: 'Paris',          country: 'France',         lat: 48.8566,  lng:   2.3522 },
  { city: 'Kingston',       country: 'Jamaica',        lat: 17.9714,  lng: -76.7920 },
];

// ── Role-specific availability states ─────────────────────────
// Used by AvailabilityStatus page and anywhere availability is set.
export const ROLE_AVAILABILITY_STATES = {
  worker: [
    { id: 'available', label: 'Disponib',     emoji: '🟢', desc: 'Disponib pou travay imedyatman' },
    { id: 'busy',      label: 'Okipe',        emoji: '🟡', desc: 'Ap travay, demann limite' },
    { id: 'looking',   label: 'Ap Chèche',   emoji: '👀', desc: 'Ap chèche travay aktiyèlman' },
    { id: 'vacation',  label: 'Vakans',      emoji: '🏖️', desc: 'Nan vakans, pa disponib' },
  ],
  restaurant: [
    { id: 'available',    label: 'Louvri',         emoji: '🟢', desc: 'Restoran louvri pou kliyan' },
    { id: 'busy',         label: 'Chaje',           emoji: '🟡', desc: 'Anpil kliyan, atant posib' },
    { id: 'fully_booked', label: 'Konplè',         emoji: '🔴', desc: 'Pa gen plas disponib' },
    { id: 'closed',       label: 'Fèmen',          emoji: '⚫', desc: 'Restoran fèmen' },
  ],
  hotel: [
    { id: 'available',    label: 'Chanm Disponib', emoji: '🟢', desc: 'Chanm louvri pou rezèvasyon' },
    { id: 'busy',         label: 'Plen Pasyèlman', emoji: '🟡', desc: 'Kèk chanm disponib' },
    { id: 'fully_booked', label: 'Konplètman Plen',emoji: '🔴', desc: 'Pa gen chanm disponib' },
    { id: 'maintenance',  label: 'Antretyen',     emoji: '🔧', desc: 'Fèmen pou antretyen' },
  ],
  rental: [
    { id: 'available',   label: 'Disponib',     emoji: '🟢', desc: 'Pwopriyete disponib pou lwe' },
    { id: 'rented',      label: 'Lwe',          emoji: '🔴', desc: 'Deja lwe' },
    { id: 'maintenance', label: 'Antretyen',    emoji: '🔧', desc: 'Nan antretyen' },
    { id: 'unavailable', label: 'Pa Disponib',  emoji: '⚫', desc: 'Pa disponib pou moman' },
  ],
  office: [
    { id: 'available',    label: 'Espas Disponib', emoji: '🟢', desc: 'Espas travay disponib' },
    { id: 'fully_booked', label: 'Plen',           emoji: '🔴', desc: 'Pa gen espas' },
    { id: 'maintenance',  label: 'Antretyen',      emoji: '🔧', desc: 'Fèmen pou antretyen' },
    { id: 'closed',       label: 'Fèmen',          emoji: '⚫', desc: 'Ofis fèmen' },
  ],
  tourism: [
    { id: 'available',    label: 'Tou Disponib',  emoji: '🟢', desc: 'Tou ak aktivite disponib' },
    { id: 'busy',         label: 'Anpil Moun',    emoji: '🟡', desc: 'Plas limite' },
    { id: 'fully_booked', label: 'Konplè',        emoji: '🔴', desc: 'Rezèvasyon plen' },
    { id: 'unavailable',  label: 'Pa Disponib',   emoji: '⚫', desc: 'Pa ka fè tou kounye a' },
  ],
  hospital: [
    { id: 'available',      label: 'Louvri',        emoji: '🟢', desc: 'Ap resevwa pasyan' },
    { id: 'busy',           label: 'Chaje',         emoji: '🟡', desc: 'Atant long posib' },
    { id: 'emergency_only', label: 'Ijans Sèlman', emoji: '🚨', desc: 'Ijans sèlman' },
    { id: 'closed',         label: 'Fèmen',        emoji: '⚫', desc: 'Lopital fèmen' },
  ],
  clinic: [
    { id: 'available',      label: 'Louvri',        emoji: '🟢', desc: 'Ap resevwa pasyan' },
    { id: 'busy',           label: 'Chaje',         emoji: '🟡', desc: 'Atant long posib' },
    { id: 'emergency_only', label: 'Ijans Sèlman', emoji: '🚨', desc: 'Ijans sèlman' },
    { id: 'closed',         label: 'Fèmen',        emoji: '⚫', desc: 'Klinik fèmen' },
  ],
  service_provider: [
    { id: 'available',   label: 'Disponib',     emoji: '🟢', desc: 'Disponib pou sèvis' },
    { id: 'busy',        label: 'Okipe',        emoji: '🟡', desc: 'Ap travay kounye a' },
    { id: 'vacation',    label: 'Vakans',       emoji: '🏖️', desc: 'Pa disponib pou moman' },
    { id: 'unavailable', label: 'Pa Disponib',  emoji: '⚫', desc: 'Pa ka resevwa kliyan' },
  ],
  company: [
    { id: 'available',   label: 'Ap Rekrute',   emoji: '🟢', desc: 'Ap chèche anplwaye' },
    { id: 'busy',        label: 'Limite',       emoji: '🟡', desc: 'Kèk pòs disponib' },
    { id: 'unavailable', label: 'Pa Rekrute',   emoji: '⚫', desc: 'Pa ap rekrute pou kounye a' },
  ],
  enterprise: [
    { id: 'available',   label: 'Ap Rekrute',   emoji: '🟢', desc: 'Ap chèche anplwaye mondyalman' },
    { id: 'busy',        label: 'Limite',       emoji: '🟡', desc: 'Rekritman limite' },
    { id: 'unavailable', label: 'Pa Rekrute',   emoji: '⚫', desc: 'Pa ap rekrute pou kounye a' },
  ],
  user: [
    { id: 'available',   label: 'Disponib',     emoji: '🟢', desc: 'Disponib' },
    { id: 'busy',        label: 'Okipe',        emoji: '🟡', desc: 'Okipe' },
    { id: 'unavailable', label: 'Pa Disponib',  emoji: '⚫', desc: 'Pa disponib' },
  ],
};

/** Returns availability states for a given role (fallback: user states). */
export function getRoleAvailabilityStates(role) {
  return ROLE_AVAILABILITY_STATES[role] ?? ROLE_AVAILABILITY_STATES.user;
}

/** Returns all roles that can appear in nearby search results. */
export const NEARBY_SEARCHABLE_ROLES = [
  'worker', 'company', 'enterprise',
  'restaurant', 'hotel', 'rental', 'office',
  'tourism', 'hospital', 'clinic', 'service_provider',
];

/** Default roles for nearby search when none are specified. */
export const NEARBY_DEFAULT_ROLES = [
  'worker', 'restaurant', 'hotel', 'service_provider',
];

/** Role icon map for nearby result cards. */
export const ROLE_NEARBY_ICONS = {
  worker:           '👷',
  company:          '🏢',
  enterprise:       '🏛️',
  restaurant:       '🍽️',
  hotel:            '🏨',
  rental:           '🏠',
  office:           '💼',
  tourism:          '✈️',
  hospital:         '🏥',
  clinic:           '🩺',
  service_provider: '🔧',
};

export function getRoleNearbyIcon(role) {
  return ROLE_NEARBY_ICONS[role] ?? '📍';
}