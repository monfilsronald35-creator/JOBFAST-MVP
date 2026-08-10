export interface AvailabilityStateDisplay {
  label: string;
  color: string;
  bg: string;
  dot: string;
}

export const AVAILABILITY_STATES: Record<string, AvailabilityStateDisplay> = {
  available:      { label: 'Disponib',       color: 'text-green-400',  bg: 'bg-green-500/10',   dot: '🟢' },
  busy:           { label: 'Okipe',          color: 'text-yellow-400', bg: 'bg-yellow-500/10',  dot: '🟡' },
  fully_booked:   { label: 'Rèzève Konplè', color: 'text-red-400',    bg: 'bg-red-500/10',     dot: '🔴' },
  closed:         { label: 'Fèmen',          color: 'text-slate-400',  bg: 'bg-slate-700/50',   dot: '⛔' },
  rented:         { label: 'Loue',           color: 'text-blue-400',   bg: 'bg-blue-500/10',    dot: '🔵' },
  maintenance:    { label: 'Antretyen',      color: 'text-orange-400', bg: 'bg-orange-500/10',  dot: '🔧' },
  unavailable:    { label: 'Indisponib',     color: 'text-rose-400',   bg: 'bg-rose-500/10',    dot: '🔴' },
  vacation:       { label: 'Vakans',         color: 'text-purple-400', bg: 'bg-purple-500/10',  dot: '✈️' },
  emergency_only: { label: 'Dijans Sèlman', color: 'text-red-500',    bg: 'bg-red-600/15',     dot: '🚨' },
} as const;

export interface BookingStatusDisplay {
  label: string;
  color: string;
  bg: string;
}

export const BOOKING_STATUSES: Record<string, BookingStatusDisplay> = {
  pending:   { label: 'Annatant', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  confirmed: { label: 'Konfime',  color: 'text-green-400',  bg: 'bg-green-500/10'  },
  rejected:  { label: 'Refize',   color: 'text-red-400',    bg: 'bg-red-500/10'    },
  cancelled: { label: 'Anile',    color: 'text-slate-400',  bg: 'bg-slate-700/50'  },
  completed: { label: 'Konplete', color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
} as const;

export interface ReputationFactor {
  weight: number;
  label: string;
}

export const REPUTATION_FACTORS: Record<string, ReputationFactor> = {
  reviews:       { weight: 0.30, label: 'Evalyasyon'    },
  rating:        { weight: 0.25, label: 'Rating'        },
  verified:      { weight: 0.20, label: 'Verifikasyon'  },
  completeness:  { weight: 0.10, label: 'Pwofil Konplè' },
  bookings:      { weight: 0.10, label: 'Rezèvasyon'    },
  response_time: { weight: 0.05, label: 'Vitès Repons'  },
} as const;

type AnyUser = Record<string, unknown>;
type MarketplaceData = Record<string, unknown> | null | undefined;

export function computeMarketplaceReputation(user: AnyUser, marketplaceData: MarketplaceData): number {
  const reviews   = Array.isArray(marketplaceData?.['reviews'])  ? (marketplaceData!['reviews']  as unknown[]).length : 0;
  const allBookings = Array.isArray(marketplaceData?.['bookings']) ? marketplaceData!['bookings'] as AnyUser[] : [];
  const bookings  = allBookings.filter((b) => b['status'] === 'completed').length;
  const rating    = (marketplaceData?.['avgRating'] as number | undefined) ?? ((user['stats'] as AnyUser | undefined)?.['rating'] as number | undefined) ?? 0;
  const verified  = (user['verified'] as boolean | undefined) ?? false;
  const complete  = (user['profileCompleteness'] as number | undefined) ?? 0;

  return Math.min(100, Math.round(
    Math.min(reviews  / 10, 1) * 30
    + (rating / 5) * 25
    + (verified ? 1 : 0) * 20
    + (complete / 100) * 10
    + Math.min(bookings / 20, 1) * 10
    + 5,
  ));
}

// ── Per-role configs ──────────────────────────────────────────

export interface BookingConfig {
  type:               string;
  labelKey:           string;
  requiresDate:       boolean;
  requiresTime:       boolean;
  requiresPartySize:  boolean;
  requiresDuration:   boolean;
  requiresNotes:      boolean;
  durationLabel?:     string;
  partySizeLabel?:    string;
  notesLabel?:        string;
}

export interface MarketplaceTab {
  id:       string;
  labelKey: string;
  icon:     string;
}

export interface PricingConfig {
  type:      string;
  label:     string;
  showRange: boolean;
}

export interface MarketplaceRoleConfig {
  listingType:          string;
  label:                string;
  icon:                 string;
  accentColor:          string;
  browseTitleKey:       string;
  browsePlaceholderKey: string;
  gpsLabelKey:          string;
  showDistance:         boolean;
  tabs:                 MarketplaceTab[];
  booking:              BookingConfig;
  availabilityStates:   string[];
  cardFields:           string[];
  reviewCriteriaKeys:   string[];
  pricing:              PricingConfig;
  contactOptions:       string[];
  galleryType:          string;
  manageLabel:          string;
  manageTabs:           string[];
}

const MARKETPLACE_ROLE_CONFIGS: Record<string, MarketplaceRoleConfig> = {
  restaurant: {
    listingType: 'restaurant', label: 'Restoran', icon: '🍽️', accentColor: 'amber',
    browseTitleKey: 'marketplace.browse.restaurant',
    browsePlaceholderKey: 'marketplace.search.restaurant',
    gpsLabelKey: 'marketplace.gps.restaurant',
    showDistance: true,
    tabs: [
      { id: 'all',      labelKey: 'marketplace.tab.all',      icon: '🔍' },
      { id: 'menu',     labelKey: 'marketplace.tab.menu',     icon: '🍽️' },
      { id: 'delivery', labelKey: 'marketplace.tab.delivery', icon: '🛵' },
      { id: 'pickup',   labelKey: 'marketplace.tab.pickup',   icon: '🥡' },
    ],
    booking: { type: 'reservation', labelKey: 'marketplace.booking.restaurant', requiresDate: true, requiresTime: true, requiresPartySize: true, requiresDuration: false, requiresNotes: true, partySizeLabel: 'Kantite Moun', notesLabel: 'Demann Espesyal' },
    availabilityStates: ['available', 'busy', 'fully_booked', 'closed'],
    cardFields: ['cuisine', 'rating', 'distance', 'availability'],
    reviewCriteriaKeys: ['marketplace.criteria.food', 'marketplace.criteria.service', 'marketplace.criteria.atmosphere', 'marketplace.criteria.price'],
    pricing: { type: 'per_person', label: 'Pou chak moun', showRange: true },
    contactOptions: ['call', 'book', 'directions', 'chat'],
    galleryType: 'food_photos', manageLabel: 'Jere Restoran Ou', manageTabs: ['orders', 'reservations', 'menu', 'reviews'],
  },
  hotel: {
    listingType: 'hotel', label: 'Hotel', icon: '🏨', accentColor: 'cyan',
    browseTitleKey: 'marketplace.browse.hotel',
    browsePlaceholderKey: 'marketplace.search.hotel',
    gpsLabelKey: 'marketplace.gps.hotel',
    showDistance: true,
    tabs: [
      { id: 'all',    labelKey: 'marketplace.tab.all',    icon: '🔍' },
      { id: 'rooms',  labelKey: 'marketplace.tab.rooms',  icon: '🛏️' },
      { id: 'suites', labelKey: 'marketplace.tab.suites', icon: '⭐' },
      { id: 'villas', labelKey: 'marketplace.tab.villas', icon: '🏡' },
    ],
    booking: { type: 'room_booking', labelKey: 'marketplace.booking.hotel', requiresDate: true, requiresTime: false, requiresPartySize: true, requiresDuration: true, requiresNotes: true, durationLabel: 'Kantite Nwit', partySizeLabel: 'Kantite Moun', notesLabel: 'Demann Espesyal' },
    availabilityStates: ['available', 'busy', 'fully_booked', 'closed'],
    cardFields: ['room_type', 'rating', 'distance', 'amenities', 'availability'],
    reviewCriteriaKeys: ['marketplace.criteria.cleanliness', 'marketplace.criteria.comfort', 'marketplace.criteria.service', 'marketplace.criteria.location'],
    pricing: { type: 'per_night', label: 'Pou chak nwit', showRange: false },
    contactOptions: ['call', 'book', 'directions', 'chat'],
    galleryType: 'room_photos', manageLabel: 'Jere Hotel Ou', manageTabs: ['rooms', 'reservations', 'guests', 'reviews'],
  },
  rental: {
    listingType: 'rental', label: 'Lwaye', icon: '🏠', accentColor: 'emerald',
    browseTitleKey: 'marketplace.browse.rental',
    browsePlaceholderKey: 'marketplace.search.rental',
    gpsLabelKey: 'marketplace.gps.rental',
    showDistance: true,
    tabs: [
      { id: 'all',       labelKey: 'marketplace.tab.all',           icon: '🔍' },
      { id: 'house',     labelKey: 'marketplace.tab.house',         icon: '🏠' },
      { id: 'apartment', labelKey: 'marketplace.tab.apartment',     icon: '🏢' },
      { id: 'vehicle',   labelKey: 'marketplace.tab.vehicle',       icon: '🚗' },
      { id: 'equipment', labelKey: 'marketplace.tab.equipment',     icon: '⚙️' },
      { id: 'office',    labelKey: 'marketplace.tab.office_rental', icon: '🏛️' },
    ],
    booking: { type: 'rental_period', labelKey: 'marketplace.booking.rental', requiresDate: true, requiresTime: false, requiresPartySize: false, requiresDuration: true, requiresNotes: true, durationLabel: 'Kantite Jou', notesLabel: 'Rezon Lwaye / Nòt' },
    availabilityStates: ['available', 'rented', 'maintenance', 'unavailable'],
    cardFields: ['property_type', 'rating', 'distance', 'availability'],
    reviewCriteriaKeys: ['marketplace.criteria.condition', 'marketplace.criteria.cleanliness', 'marketplace.criteria.correspondence', 'marketplace.criteria.value'],
    pricing: { type: 'per_day', label: 'Pou chak jou', showRange: true },
    contactOptions: ['call', 'book', 'chat', 'directions'],
    galleryType: 'property_photos', manageLabel: 'Jere Pwopriyete Ou', manageTabs: ['properties', 'bookings', 'tenants', 'reviews'],
  },
  office: {
    listingType: 'office', label: 'Biwo', icon: '🏛️', accentColor: 'slate',
    browseTitleKey: 'marketplace.browse.office',
    browsePlaceholderKey: 'marketplace.search.office',
    gpsLabelKey: 'marketplace.gps.office',
    showDistance: true,
    tabs: [
      { id: 'all',       labelKey: 'marketplace.tab.all',          icon: '🔍' },
      { id: 'workspace', labelKey: 'marketplace.tab.workspace',    icon: '💼' },
      { id: 'meeting',   labelKey: 'marketplace.tab.meeting_room', icon: '🤝' },
      { id: 'shared',    labelKey: 'marketplace.tab.coworking',    icon: '👥' },
    ],
    booking: { type: 'workspace_booking', labelKey: 'marketplace.booking.office', requiresDate: true, requiresTime: true, requiresPartySize: true, requiresDuration: true, requiresNotes: false, durationLabel: 'Kantite È', partySizeLabel: 'Kantite Moun', notesLabel: 'Nòt' },
    availabilityStates: ['available', 'busy', 'fully_booked', 'closed'],
    cardFields: ['workspace_type', 'rating', 'distance', 'availability'],
    reviewCriteriaKeys: ['marketplace.criteria.space', 'marketplace.criteria.equipment', 'marketplace.criteria.location', 'marketplace.criteria.price'],
    pricing: { type: 'per_hour', label: 'Pou chak è', showRange: true },
    contactOptions: ['call', 'book', 'directions', 'chat'],
    galleryType: 'office_photos', manageLabel: 'Jere Biwo Ou', manageTabs: ['workspaces', 'bookings', 'clients', 'reviews'],
  },
  tourism: {
    listingType: 'tourism', label: 'Turizm', icon: '🌴', accentColor: 'teal',
    browseTitleKey: 'marketplace.browse.tourism',
    browsePlaceholderKey: 'marketplace.search.tourism',
    gpsLabelKey: 'marketplace.gps.tourism',
    showDistance: true,
    tabs: [
      { id: 'all',          labelKey: 'marketplace.tab.all',          icon: '🔍' },
      { id: 'destinations', labelKey: 'marketplace.tab.destinations', icon: '🗺️' },
      { id: 'attractions',  labelKey: 'marketplace.tab.attractions',  icon: '🏛️' },
      { id: 'activities',   labelKey: 'marketplace.tab.activities',   icon: '🏄' },
      { id: 'tours',        labelKey: 'marketplace.tab.tours',        icon: '🎒' },
      { id: 'guides',       labelKey: 'marketplace.tab.guides',       icon: '🧭' },
      { id: 'events',       labelKey: 'marketplace.tab.events',       icon: '🎉' },
      { id: 'beaches',      labelKey: 'marketplace.tab.beaches',      icon: '🏖️' },
      { id: 'mountains',    labelKey: 'marketplace.tab.mountains',    icon: '⛰️' },
      { id: 'heritage',     labelKey: 'marketplace.tab.heritage',     icon: '🏰' },
      { id: 'nature',       labelKey: 'marketplace.tab.nature',       icon: '🌿' },
      { id: 'cultural',     labelKey: 'marketplace.tab.cultural',     icon: '🎭' },
    ],
    booking: { type: 'tourism', labelKey: 'marketplace.booking.tourism', requiresDate: true, requiresTime: true, requiresPartySize: true, requiresDuration: true, requiresNotes: true, durationLabel: 'Kantite Jou', partySizeLabel: 'Kantite Touris', notesLabel: 'Preferans / Demann' },
    availabilityStates: ['available', 'busy', 'fully_booked', 'closed'],
    cardFields: ['tour_type', 'rating', 'distance', 'experience', 'trust_score', 'language', 'availability'],
    reviewCriteriaKeys: ['marketplace.criteria.guide', 'marketplace.criteria.experience', 'marketplace.criteria.security', 'marketplace.criteria.value'],
    pricing: { type: 'per_person', label: 'Pou chak touris', showRange: false },
    contactOptions: ['chat', 'call', 'book', 'directions'],
    galleryType: 'tour_photos', manageLabel: 'Jere Sèvis Turizm Ou', manageTabs: ['tours', 'bookings', 'tourists', 'reviews'],
  },
  hospital: {
    listingType: 'hospital', label: 'Lopital', icon: '🏥', accentColor: 'red',
    browseTitleKey: 'marketplace.browse.hospital',
    browsePlaceholderKey: 'marketplace.search.hospital',
    gpsLabelKey: 'marketplace.gps.hospital',
    showDistance: true,
    tabs: [
      { id: 'all',         labelKey: 'marketplace.tab.all',         icon: '🔍' },
      { id: 'doctors',     labelKey: 'marketplace.tab.doctors',     icon: '👨‍⚕️' },
      { id: 'departments', labelKey: 'marketplace.tab.departments', icon: '🏥' },
      { id: 'emergency',   labelKey: 'marketplace.tab.emergency',   icon: '🚨' },
    ],
    booking: { type: 'appointment', labelKey: 'marketplace.booking.hospital', requiresDate: true, requiresTime: true, requiresPartySize: false, requiresDuration: false, requiresNotes: true, notesLabel: 'Senpòm / Rezon Vizit' },
    availabilityStates: ['available', 'busy', 'emergency_only', 'closed'],
    cardFields: ['specialty', 'rating', 'verified', 'distance', 'availability'],
    reviewCriteriaKeys: ['marketplace.criteria.service', 'marketplace.criteria.doctor', 'marketplace.criteria.cleanliness', 'marketplace.criteria.speed'],
    pricing: { type: 'per_session', label: 'Pou chak vizit', showRange: false },
    contactOptions: ['call', 'book', 'directions', 'emergency'],
    galleryType: 'facility_photos', manageLabel: 'Jere Lopital Ou', manageTabs: ['doctors', 'appointments', 'patients', 'reviews'],
  },
  clinic: {
    listingType: 'clinic', label: 'Klinik', icon: '⚕️', accentColor: 'teal',
    browseTitleKey: 'marketplace.browse.clinic',
    browsePlaceholderKey: 'marketplace.search.clinic',
    gpsLabelKey: 'marketplace.gps.clinic',
    showDistance: true,
    tabs: [
      { id: 'all',     labelKey: 'marketplace.tab.all',     icon: '🔍' },
      { id: 'doctors', labelKey: 'marketplace.tab.doctors', icon: '👨‍⚕️' },
      { id: 'services',labelKey: 'marketplace.tab.services',icon: '⚕️' },
    ],
    booking: { type: 'appointment', labelKey: 'marketplace.booking.clinic', requiresDate: true, requiresTime: true, requiresPartySize: false, requiresDuration: false, requiresNotes: true, notesLabel: 'Senpòm / Rezon' },
    availabilityStates: ['available', 'busy', 'fully_booked', 'closed'],
    cardFields: ['specialty', 'rating', 'verified', 'distance', 'availability'],
    reviewCriteriaKeys: ['marketplace.criteria.service', 'marketplace.criteria.doctor', 'marketplace.criteria.cleanliness', 'marketplace.criteria.speed'],
    pricing: { type: 'per_session', label: 'Pou chak konsiltasyon', showRange: false },
    contactOptions: ['call', 'book', 'directions', 'chat'],
    galleryType: 'facility_photos', manageLabel: 'Jere Klinik Ou', manageTabs: ['doctors', 'appointments', 'patients', 'reviews'],
  },
  service_provider: {
    listingType: 'service', label: 'Founisè Sèvis', icon: '🔧', accentColor: 'yellow',
    browseTitleKey: 'marketplace.browse.services',
    browsePlaceholderKey: 'marketplace.search.services',
    gpsLabelKey: 'marketplace.gps.services',
    showDistance: true,
    tabs: [
      { id: 'all',       labelKey: 'marketplace.tab.all',           icon: '🔍' },
      { id: 'home',      labelKey: 'marketplace.tab.home_services', icon: '🏠' },
      { id: 'technical', labelKey: 'marketplace.tab.technical',     icon: '⚙️' },
      { id: 'transport', labelKey: 'marketplace.tab.transport',     icon: '🚗' },
      { id: 'health',    labelKey: 'marketplace.tab.health',        icon: '⚕️' },
      { id: 'creative',  labelKey: 'marketplace.tab.creative',      icon: '🎨' },
    ],
    booking: { type: 'service_request', labelKey: 'marketplace.booking.services', requiresDate: true, requiresTime: true, requiresPartySize: false, requiresDuration: false, requiresNotes: true, notesLabel: 'Deskripsyon Pwoblèm lan' },
    availabilityStates: ['available', 'busy', 'unavailable', 'vacation'],
    cardFields: ['service_type', 'trust_score', 'rating', 'experience', 'distance', 'availability'],
    reviewCriteriaKeys: ['marketplace.criteria.quality', 'marketplace.criteria.speed', 'marketplace.criteria.price', 'marketplace.criteria.professionalism'],
    pricing: { type: 'per_service', label: 'Pou chak sèvis', showRange: true },
    contactOptions: ['call', 'chat', 'book', 'directions'],
    galleryType: 'portfolio_photos', manageLabel: 'Jere Sèvis Ou', manageTabs: ['services', 'bookings', 'clients', 'reviews'],
  },
};

export const MARKETPLACE_BROWSER_ROLES = new Set(['worker', 'user']);
export const MARKETPLACE_PROVIDER_ROLES = new Set([
  'restaurant', 'hotel', 'rental', 'office',
  'tourism', 'hospital', 'clinic', 'service_provider',
]);
export const MARKETPLACE_CATEGORY_ORDER: readonly string[] = [
  'restaurant', 'hotel', 'rental', 'tourism',
  'service_provider', 'hospital', 'clinic', 'office',
];

export function getMarketplaceConfig(role: string): MarketplaceRoleConfig {
  return MARKETPLACE_ROLE_CONFIGS[role] ?? MARKETPLACE_ROLE_CONFIGS['service_provider']!;
}

export function isMarketplaceProvider(role: string): boolean {
  return MARKETPLACE_PROVIDER_ROLES.has(role);
}

export function isMarketplaceBrowser(role: string): boolean {
  return MARKETPLACE_BROWSER_ROLES.has(role);
}

export function getAllCategoryConfigs(): Array<MarketplaceRoleConfig & { role: string }> {
  return MARKETPLACE_CATEGORY_ORDER.map((role) => ({
    role,
    ...MARKETPLACE_ROLE_CONFIGS[role]!,
  }));
}

export default MARKETPLACE_ROLE_CONFIGS;
