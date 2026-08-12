export const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'disputed',
] as const;

export type BookingStatus = typeof BOOKING_STATUSES[number];

export const PRICING_MODELS = ['hourly', 'fixed', 'project'] as const;

export type PricingModel = typeof PRICING_MODELS[number];

// ---- Entity interfaces ----

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  createdAt: string;
}

export interface Service {
  id: string;
  providerId: string;
  categoryId: string | null;
  countryId: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  pricingModel: string;
  durationMinutes: number;
  isActive: boolean;
  aiEmbedding: number[] | null;
  searchVector: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServicePackage {
  id: string;
  serviceId: string;
  name: string;
  description: string | null;
  price: number;
  deliveryDays: number;
  revisions: number;
  features: unknown[];
}

export interface ServiceAvailability {
  id: string;
  providerId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface ServiceLocation {
  id: string;
  serviceId: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  coordinates: string | null;
  isRemote: boolean;
}

export interface ServiceBooking {
  id: string;
  serviceId: string;
  clientId: string;
  providerId: string;
  packageId: string | null;
  scheduledAt: string;
  completedAt: string | null;
  status: BookingStatus;
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
