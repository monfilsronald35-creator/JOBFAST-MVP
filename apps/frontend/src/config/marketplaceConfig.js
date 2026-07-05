// ============================================================
// JOBFAST — MARKETPLACE CONFIGURATION
// Single source of truth for per-role marketplace behavior.
//
// The Marketplace Core reads this file to:
//   - Adapt listing cards per role
//   - Configure the booking form (fields, labels)
//   - Define availability states per role
//   - Set review criteria per role
//   - Determine pricing model per role
//   - Set contact options per role
//
// Never put role logic in MarketplaceCore.jsx — put it here.
// ============================================================

// ── Shared availability states ───────────────────────────────
export const AVAILABILITY_STATES = Object.freeze({
  available:      { label: 'Disponib',       color: 'text-green-400',  bg: 'bg-green-500/10',   dot: '🟢' },
  busy:           { label: 'Okipe',          color: 'text-yellow-400', bg: 'bg-yellow-500/10',  dot: '🟡' },
  fully_booked:   { label: 'Rèzève Konplè', color: 'text-red-400',    bg: 'bg-red-500/10',     dot: '🔴' },
  closed:         { label: 'Fèmen',          color: 'text-slate-400',  bg: 'bg-slate-700/50',   dot: '⛔' },
  rented:         { label: 'Loue',           color: 'text-blue-400',   bg: 'bg-blue-500/10',    dot: '🔵' },
  maintenance:    { label: 'Antretyen',      color: 'text-orange-400', bg: 'bg-orange-500/10',  dot: '🔧' },
  unavailable:    { label: 'Indisponib',     color: 'text-rose-400',   bg: 'bg-rose-500/10',    dot: '🔴' },
  vacation:       { label: 'Vakans',         color: 'text-purple-400', bg: 'bg-purple-500/10',  dot: '✈️' },
  emergency_only: { label: 'Dijans Sèlman', color: 'text-red-500',    bg: 'bg-red-600/15',     dot: '🚨' },
});

// ── Shared booking status states ─────────────────────────────
export const BOOKING_STATUSES = Object.freeze({
  pending:   { label: 'Annatant',  color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  confirmed: { label: 'Konfime',   color: 'text-green-400',  bg: 'bg-green-500/10'  },
  rejected:  { label: 'Refize',    color: 'text-red-400',    bg: 'bg-red-500/10'    },
  cancelled: { label: 'Anile',     color: 'text-slate-400',  bg: 'bg-slate-700/50'  },
  completed: { label: 'Konplete',  color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
});

// ── Reputation factors (shared by all roles) ─────────────────
export const REPUTATION_FACTORS = Object.freeze({
  reviews:       { weight: 0.30, label: 'Evalyasyon'    },
  rating:        { weight: 0.25, label: 'Rating'        },
  verified:      { weight: 0.20, label: 'Verifikasyon'  },
  completeness:  { weight: 0.10, label: 'Pwofil Konplè' },
  bookings:      { weight: 0.10, label: 'Rezèvasyon'    },
  response_time: { weight: 0.05, label: 'Vitès Repons'  },
});

/**
 * Shared reputation score (0–100) for any marketplace listing.
 * No role-specific logic — pure arithmetic from shared metrics.
 */
export function computeMarketplaceReputation(user, marketplaceData) {
  const reviews   = (marketplaceData?.reviews  || []).length;
  const bookings  = (marketplaceData?.bookings || []).filter(b => b.status === 'completed').length;
  const rating    = marketplaceData?.avgRating ?? user?.stats?.rating ?? 0;
  const verified  = user?.verified ?? false;
  const complete  = user?.profileCompleteness ?? 0;

  return Math.min(100, Math.round(
    Math.min(reviews  / 10, 1) * 30
    + (rating / 5) * 25
    + (verified ? 1 : 0) * 20
    + (complete / 100) * 10
    + Math.min(bookings / 20, 1) * 10
    + 5,
  ));
}

// ── Per-role marketplace configurations ──────────────────────

const MARKETPLACE_ROLE_CONFIGS = {

  // ── Restaurant ───────────────────────────────────────────────
  restaurant: {
    listingType:       'restaurant',
    label:             'Restoran',
    icon:              '🍽️',
    accentColor:       'amber',
    browseTitle:       'Restoran ak Manje',
    browsePlaceholder: 'Chèche restoran, manje, livrezon...',
    gpsLabel:          'Restoran Pre w',
    showDistance:      true,

    tabs: [
      { id: 'all',          label: 'Tout',       icon: '🔍' },
      { id: 'menu',         label: 'Meni',        icon: '🍽️' },
      { id: 'delivery',     label: 'Livrezon',    icon: '🛵' },
      { id: 'pickup',       label: 'Pick-up',     icon: '🥡' },
    ],

    booking: {
      type:              'reservation',
      label:             'Rezève Tab',
      requiresDate:      true,
      requiresTime:      true,
      requiresPartySize: true,
      requiresDuration:  false,
      requiresNotes:     true,
      partySizeLabel:    'Kantite Moun',
      notesLabel:        'Demann Espesyal',
    },

    availabilityStates: ['available', 'busy', 'fully_booked', 'closed'],
    cardFields:         ['cuisine', 'rating', 'distance', 'availability'],
    reviewCriteria:     ['manje', 'sèvis', 'atmosfè', 'pri'],
    pricing:            { type: 'per_person', label: 'Pou chak moun', showRange: true },
    contactOptions:     ['call', 'book', 'directions', 'chat'],
    galleryType:        'food_photos',
    manageLabel:        'Jere Restoran Ou',
    manageTabs:         ['orders', 'reservations', 'menu', 'reviews'],
  },

  // ── Hotel ────────────────────────────────────────────────────
  hotel: {
    listingType:       'hotel',
    label:             'Hotel',
    icon:              '🏨',
    accentColor:       'cyan',
    browseTitle:       'Hotel ak Lodman',
    browsePlaceholder: 'Chèche hotel, chanm, swit...',
    gpsLabel:          'Hotel Pre w',
    showDistance:      true,

    tabs: [
      { id: 'all',     label: 'Tout',   icon: '🔍' },
      { id: 'rooms',   label: 'Chanm',  icon: '🛏️' },
      { id: 'suites',  label: 'Swit',   icon: '⭐' },
      { id: 'villas',  label: 'Vila',   icon: '🏡' },
    ],

    booking: {
      type:              'room_booking',
      label:             'Rezève Chanm',
      requiresDate:      true,
      requiresTime:      false,
      requiresPartySize: true,
      requiresDuration:  true,
      requiresNotes:     true,
      durationLabel:     'Kantite Nwit',
      partySizeLabel:    'Kantite Moun',
      notesLabel:        'Demann Espesyal',
    },

    availabilityStates: ['available', 'busy', 'fully_booked', 'closed'],
    cardFields:         ['room_type', 'rating', 'distance', 'amenities', 'availability'],
    reviewCriteria:     ['pwòpte', 'konfò', 'sèvis', 'lokalizasyon'],
    pricing:            { type: 'per_night', label: 'Pou chak nwit', showRange: false },
    contactOptions:     ['call', 'book', 'directions', 'chat'],
    galleryType:        'room_photos',
    manageLabel:        'Jere Hotel Ou',
    manageTabs:         ['rooms', 'reservations', 'guests', 'reviews'],
  },

  // ── Rental ───────────────────────────────────────────────────
  rental: {
    listingType:       'rental',
    label:             'Lwaye',
    icon:              '🏠',
    accentColor:       'emerald',
    browseTitle:       'Pwopriyete ak Lwaye',
    browsePlaceholder: 'Chèche kay, apàtman, machin, ekipman...',
    gpsLabel:          'Pwopriyete Pre w',
    showDistance:      true,

    tabs: [
      { id: 'all',        label: 'Tout',       icon: '🔍' },
      { id: 'house',      label: 'Kay',         icon: '🏠' },
      { id: 'apartment',  label: 'Apàtman',     icon: '🏢' },
      { id: 'vehicle',    label: 'Machin',      icon: '🚗' },
      { id: 'equipment',  label: 'Ekipman',     icon: '⚙️' },
      { id: 'office',     label: 'Biwo Lwaye',  icon: '🏛️' },
    ],

    booking: {
      type:              'rental_period',
      label:             'Loue',
      requiresDate:      true,
      requiresTime:      false,
      requiresPartySize: false,
      requiresDuration:  true,
      requiresNotes:     true,
      durationLabel:     'Kantite Jou',
      notesLabel:        'Rezon Lwaye / Nòt',
    },

    availabilityStates: ['available', 'rented', 'maintenance', 'unavailable'],
    cardFields:         ['property_type', 'rating', 'distance', 'availability'],
    reviewCriteria:     ['kondisyon', 'pwòpte', 'korespondans', 'valè'],
    pricing:            { type: 'per_day', label: 'Pou chak jou', showRange: true },
    contactOptions:     ['call', 'book', 'chat', 'directions'],
    galleryType:        'property_photos',
    manageLabel:        'Jere Pwopriyete Ou',
    manageTabs:         ['properties', 'bookings', 'tenants', 'reviews'],
  },

  // ── Office ───────────────────────────────────────────────────
  office: {
    listingType:       'office',
    label:             'Biwo',
    icon:              '🏛️',
    accentColor:       'slate',
    browseTitle:       'Biwo ak Espas Travay',
    browsePlaceholder: 'Chèche biwo, sal reyinyon, ko-travay...',
    gpsLabel:          'Biwo Pre w',
    showDistance:      true,

    tabs: [
      { id: 'all',       label: 'Tout',         icon: '🔍' },
      { id: 'workspace', label: 'Espas Travay',  icon: '💼' },
      { id: 'meeting',   label: 'Sal Reyinyon',  icon: '🤝' },
      { id: 'shared',    label: 'Ko-Travay',     icon: '👥' },
    ],

    booking: {
      type:              'workspace_booking',
      label:             'Rezève Espas',
      requiresDate:      true,
      requiresTime:      true,
      requiresPartySize: true,
      requiresDuration:  true,
      requiresNotes:     false,
      durationLabel:     'Kantite È',
      partySizeLabel:    'Kantite Moun',
      notesLabel:        'Nòt',
    },

    availabilityStates: ['available', 'busy', 'fully_booked', 'closed'],
    cardFields:         ['workspace_type', 'rating', 'distance', 'availability'],
    reviewCriteria:     ['espas', 'ekipman', 'lokalizasyon', 'pri'],
    pricing:            { type: 'per_hour', label: 'Pou chak è', showRange: true },
    contactOptions:     ['call', 'book', 'directions', 'chat'],
    galleryType:        'office_photos',
    manageLabel:        'Jere Biwo Ou',
    manageTabs:         ['workspaces', 'bookings', 'clients', 'reviews'],
  },

  // ── Tourism ──────────────────────────────────────────────────
  tourism: {
    listingType:       'tourism',
    label:             'Turizm',
    icon:              '✈️',
    accentColor:       'purple',
    browseTitle:       'Tou ak Aktivite Touristik',
    browsePlaceholder: 'Chèche tou, plaj, aktivite, transpò...',
    gpsLabel:          'Aktivite Pre w',
    showDistance:      true,

    tabs: [
      { id: 'all',         label: 'Tout',     icon: '🔍' },
      { id: 'tours',       label: 'Tou',       icon: '🗺️' },
      { id: 'attractions', label: 'Atrakson', icon: '🏖️' },
      { id: 'transport',   label: 'Transpò',  icon: '🚌' },
      { id: 'packages',    label: 'Pakèt',    icon: '🎁' },
    ],

    booking: {
      type:              'tour_booking',
      label:             'Rezève Tou',
      requiresDate:      true,
      requiresTime:      true,
      requiresPartySize: true,
      requiresDuration:  false,
      requiresNotes:     true,
      partySizeLabel:    'Kantite Touris',
      notesLabel:        'Preferans / Demann',
    },

    availabilityStates: ['available', 'busy', 'fully_booked', 'closed'],
    cardFields:         ['tour_type', 'rating', 'distance', 'language', 'availability'],
    reviewCriteria:     ['gid', 'eksperyans', 'sekirite', 'valè'],
    pricing:            { type: 'per_person', label: 'Pou chak touris', showRange: false },
    contactOptions:     ['call', 'book', 'chat', 'directions'],
    galleryType:        'tour_photos',
    manageLabel:        'Jere Sèvis Turizm Ou',
    manageTabs:         ['tours', 'bookings', 'tourists', 'reviews'],
  },

  // ── Hospital ─────────────────────────────────────────────────
  hospital: {
    listingType:       'hospital',
    label:             'Lopital',
    icon:              '🏥',
    accentColor:       'red',
    browseTitle:       'Lopital ak Sèvis Medikal',
    browsePlaceholder: 'Chèche lopital, doktè, dijans...',
    gpsLabel:          'Lopital Pre w',
    showDistance:      true,

    tabs: [
      { id: 'all',         label: 'Tout',      icon: '🔍' },
      { id: 'doctors',     label: 'Doktè',     icon: '👨‍⚕️' },
      { id: 'departments', label: 'Depatman',  icon: '🏥' },
      { id: 'emergency',   label: 'Dijans',    icon: '🚨' },
    ],

    booking: {
      type:              'appointment',
      label:             'Pran Randevou',
      requiresDate:      true,
      requiresTime:      true,
      requiresPartySize: false,
      requiresDuration:  false,
      requiresNotes:     true,
      notesLabel:        'Senpòm / Rezon Vizit',
    },

    availabilityStates: ['available', 'busy', 'emergency_only', 'closed'],
    cardFields:         ['specialty', 'rating', 'verified', 'distance', 'availability'],
    reviewCriteria:     ['sèvis', 'doktè', 'pwòpte', 'vitès'],
    pricing:            { type: 'per_session', label: 'Pou chak vizit', showRange: false },
    contactOptions:     ['call', 'book', 'directions', 'emergency'],
    galleryType:        'facility_photos',
    manageLabel:        'Jere Lopital Ou',
    manageTabs:         ['doctors', 'appointments', 'patients', 'reviews'],
  },

  // ── Clinic — reuses hospital structure ───────────────────────
  clinic: {
    listingType:       'clinic',
    label:             'Klinik',
    icon:              '⚕️',
    accentColor:       'teal',
    browseTitle:       'Klinik ak Doktè',
    browsePlaceholder: 'Chèche klinik, doktè, espesyalis...',
    gpsLabel:          'Klinik Pre w',
    showDistance:      true,

    tabs: [
      { id: 'all',      label: 'Tout',    icon: '🔍' },
      { id: 'doctors',  label: 'Doktè',   icon: '👨‍⚕️' },
      { id: 'services', label: 'Sèvis',   icon: '⚕️' },
    ],

    booking: {
      type:              'appointment',
      label:             'Pran Randevou',
      requiresDate:      true,
      requiresTime:      true,
      requiresPartySize: false,
      requiresDuration:  false,
      requiresNotes:     true,
      notesLabel:        'Senpòm / Rezon',
    },

    availabilityStates: ['available', 'busy', 'fully_booked', 'closed'],
    cardFields:         ['specialty', 'rating', 'verified', 'distance', 'availability'],
    reviewCriteria:     ['sèvis', 'doktè', 'pwòpte', 'vitès'],
    pricing:            { type: 'per_session', label: 'Pou chak konsiltasyon', showRange: false },
    contactOptions:     ['call', 'book', 'directions', 'chat'],
    galleryType:        'facility_photos',
    manageLabel:        'Jere Klinik Ou',
    manageTabs:         ['doctors', 'appointments', 'patients', 'reviews'],
  },

  // ── Service Provider ─────────────────────────────────────────
  service_provider: {
    listingType:       'service',
    label:             'Founisè Sèvis',
    icon:              '🔧',
    accentColor:       'yellow',
    browseTitle:       'Sèvis sou Demann',
    browsePlaceholder: 'Chèche elektrisyen, plombye, nèt, mekaniyen...',
    gpsLabel:          'Founisè Pre w',
    showDistance:      true,

    tabs: [
      { id: 'all',       label: 'Tout',      icon: '🔍' },
      { id: 'home',      label: 'Sèvis Kay', icon: '🏠' },
      { id: 'technical', label: 'Teknik',    icon: '⚙️' },
      { id: 'transport', label: 'Transpò',   icon: '🚗' },
      { id: 'health',    label: 'Sante',     icon: '⚕️' },
      { id: 'creative',  label: 'Kreyatif',  icon: '🎨' },
    ],

    booking: {
      type:              'service_request',
      label:             'Kontakte',
      requiresDate:      true,
      requiresTime:      true,
      requiresPartySize: false,
      requiresDuration:  false,
      requiresNotes:     true,
      notesLabel:        'Deskripsyon Pwoblèm lan',
    },

    availabilityStates: ['available', 'busy', 'unavailable', 'vacation'],
    cardFields:         ['service_type', 'trust_score', 'rating', 'experience', 'distance', 'availability'],
    reviewCriteria:     ['kalite', 'vitès', 'pri', 'pwofesyonalis'],
    pricing:            { type: 'per_service', label: 'Pou chak sèvis', showRange: true },
    contactOptions:     ['call', 'chat', 'book', 'directions'],
    galleryType:        'portfolio_photos',
    manageLabel:        'Jere Sèvis Ou',
    manageTabs:         ['services', 'bookings', 'clients', 'reviews'],
  },
};

// ── Role classification ───────────────────────────────────────
// Roles that primarily BROWSE the marketplace (customer/seeker perspective)
export const MARKETPLACE_BROWSER_ROLES = new Set(['worker', 'user']);

// Roles that are listed in the marketplace (provider perspective)
export const MARKETPLACE_PROVIDER_ROLES = new Set([
  'restaurant', 'hotel', 'rental', 'office',
  'tourism', 'hospital', 'clinic', 'service_provider',
]);

// Ordered list of all provider roles for the marketplace home
export const MARKETPLACE_CATEGORY_ORDER = [
  'restaurant', 'hotel', 'rental', 'tourism',
  'service_provider', 'hospital', 'clinic', 'office',
];

// ── Public API ────────────────────────────────────────────────
export const getMarketplaceConfig = (role) =>
  MARKETPLACE_ROLE_CONFIGS[role] ?? MARKETPLACE_ROLE_CONFIGS.service_provider;

export const isMarketplaceProvider = (role) =>
  MARKETPLACE_PROVIDER_ROLES.has(role);

export const isMarketplaceBrowser = (role) =>
  MARKETPLACE_BROWSER_ROLES.has(role);

export const getAllCategoryConfigs = () =>
  MARKETPLACE_CATEGORY_ORDER.map(role => ({
    role,
    ...MARKETPLACE_ROLE_CONFIGS[role],
  }));

export default MARKETPLACE_ROLE_CONFIGS;