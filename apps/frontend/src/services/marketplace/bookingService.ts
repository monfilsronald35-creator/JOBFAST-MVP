import { supabase } from '../../lib/supabase';
import type {
  ServiceCategory,
  Service,
  ServicePackage,
  ServiceAvailability,
  ServiceLocation,
  ServiceBooking,
  BookingStatus,
} from '../../types/services';

// ai_embedding (VECTOR 1536) and search_vector (TSVECTOR) excluded from selects.
const SERVICE_SELECT_COLS =
  'id, provider_id, category_id, country_id, title, slug, description, ' +
  'price, pricing_model, duration_minutes, is_active, created_at, updated_at';

// ---- Row types (snake_case) ----

type ServiceCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  created_at: string;
};

type ServiceRow = {
  id: string;
  provider_id: string;
  category_id: string | null;
  country_id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  pricing_model: string;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ServicePackageRow = {
  id: string;
  service_id: string;
  name: string;
  description: string | null;
  price: number;
  delivery_days: number;
  revisions: number;
  features: unknown[];
};

type ServiceAvailabilityRow = {
  id: string;
  provider_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
};

type ServiceLocationRow = {
  id: string;
  service_id: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  coordinates: string | null;
  is_remote: boolean;
};

type ServiceBookingRow = {
  id: string;
  service_id: string;
  client_id: string;
  provider_id: string;
  package_id: string | null;
  scheduled_at: string;
  completed_at: string | null;
  status: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// ---- Mappers ----

function mapServiceCategory(r: ServiceCategoryRow): ServiceCategory {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    icon: r.icon,
    createdAt: r.created_at,
  };
}

function mapService(r: ServiceRow): Service {
  return {
    id: r.id,
    providerId: r.provider_id,
    categoryId: r.category_id,
    countryId: r.country_id,
    title: r.title,
    slug: r.slug,
    description: r.description,
    price: r.price,
    pricingModel: r.pricing_model,
    durationMinutes: r.duration_minutes,
    isActive: r.is_active,
    aiEmbedding: null,
    searchVector: null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapServicePackage(r: ServicePackageRow): ServicePackage {
  return {
    id: r.id,
    serviceId: r.service_id,
    name: r.name,
    description: r.description,
    price: r.price,
    deliveryDays: r.delivery_days,
    revisions: r.revisions,
    features: r.features,
  };
}

function mapServiceAvailability(r: ServiceAvailabilityRow): ServiceAvailability {
  return {
    id: r.id,
    providerId: r.provider_id,
    dayOfWeek: r.day_of_week,
    startTime: r.start_time,
    endTime: r.end_time,
    isAvailable: r.is_available,
  };
}

function mapServiceLocation(r: ServiceLocationRow): ServiceLocation {
  return {
    id: r.id,
    serviceId: r.service_id,
    address: r.address,
    city: r.city,
    state: r.state,
    country: r.country,
    coordinates: r.coordinates,
    isRemote: r.is_remote,
  };
}

function mapServiceBooking(r: ServiceBookingRow): ServiceBooking {
  return {
    id: r.id,
    serviceId: r.service_id,
    clientId: r.client_id,
    providerId: r.provider_id,
    packageId: r.package_id,
    scheduledAt: r.scheduled_at,
    completedAt: r.completed_at,
    status: r.status as BookingStatus,
    totalAmount: r.total_amount,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ================================================================
// === Service Categories
// ================================================================

export async function getServiceCategories(): Promise<ServiceCategory[]> {
  const { data, error } = await supabase
    .from('service_categories')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data as ServiceCategoryRow[]).map(mapServiceCategory);
}

export async function getServiceCategoryBySlug(
  slug: string
): Promise<ServiceCategory | null> {
  const { data, error } = await supabase
    .from('service_categories')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapServiceCategory(data as ServiceCategoryRow) : null;
}

// ================================================================
// === Services
// ================================================================

type GetActiveServicesOptions = {
  countryId?: string;
  categoryId?: string;
  maxPrice?: number;
  limit?: number;
};

export async function getActiveServices(
  options: GetActiveServicesOptions = {}
): Promise<Service[]> {
  let q = supabase
    .from('services')
    .select(SERVICE_SELECT_COLS)
    .eq('is_active', true);

  if (options.countryId) q = q.eq('country_id', options.countryId);
  if (options.categoryId) q = q.eq('category_id', options.categoryId);
  if (options.maxPrice !== undefined) q = q.lte('price', options.maxPrice);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as ServiceRow[]).map(mapService);
}

export async function getServiceBySlug(
  countryId: string,
  slug: string
): Promise<Service | null> {
  const { data, error } = await supabase
    .from('services')
    .select(SERVICE_SELECT_COLS)
    .eq('country_id', countryId)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  return data ? mapService(data as ServiceRow) : null;
}

export async function searchServices(
  query: string,
  countryId?: string
): Promise<Service[]> {
  let q = supabase
    .from('services')
    .select(SERVICE_SELECT_COLS)
    .eq('is_active', true)
    .textSearch('search_vector', query, { type: 'plain' });

  if (countryId) q = q.eq('country_id', countryId);

  const { data, error } = await q.limit(50);
  if (error) throw error;
  return (data as ServiceRow[]).map(mapService);
}

export async function getMyServices(): Promise<Service[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('services')
    .select(SERVICE_SELECT_COLS)
    .eq('provider_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ServiceRow[]).map(mapService);
}

// ================================================================
// === Service Packages
// ================================================================

export async function getServicePackages(
  serviceId: string
): Promise<ServicePackage[]> {
  const { data, error } = await supabase
    .from('service_packages')
    .select('*')
    .eq('service_id', serviceId)
    .order('price', { ascending: true });
  if (error) throw error;
  return (data as ServicePackageRow[]).map(mapServicePackage);
}

// ================================================================
// === Service Availability
// ================================================================

export async function getProviderAvailability(
  providerId: string
): Promise<ServiceAvailability[]> {
  const { data, error } = await supabase
    .from('service_availability')
    .select('*')
    .eq('provider_id', providerId)
    .eq('is_available', true)
    .order('day_of_week', { ascending: true });
  if (error) throw error;
  return (data as ServiceAvailabilityRow[]).map(mapServiceAvailability);
}

export async function getMyAvailability(): Promise<ServiceAvailability[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('service_availability')
    .select('*')
    .eq('provider_id', user.id)
    .order('day_of_week', { ascending: true });
  if (error) throw error;
  return (data as ServiceAvailabilityRow[]).map(mapServiceAvailability);
}

export async function setMyAvailabilitySlot(
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  isAvailable = true
): Promise<ServiceAvailability> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const { data, error } = await supabase
    .from('service_availability')
    .upsert(
      {
        provider_id: user.id,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        is_available: isAvailable,
      },
      { onConflict: 'provider_id,day_of_week' }
    )
    .select('*')
    .single();
  if (error) throw error;
  return mapServiceAvailability(data as ServiceAvailabilityRow);
}

// ================================================================
// === Service Locations
// ================================================================

export async function getServiceLocation(
  serviceId: string
): Promise<ServiceLocation | null> {
  const { data, error } = await supabase
    .from('service_locations')
    .select('id, service_id, address, city, state, country, coordinates, is_remote')
    .eq('service_id', serviceId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapServiceLocation(data as ServiceLocationRow) : null;
}

// ================================================================
// === Service Bookings
// ================================================================

export async function createBooking(
  serviceId: string,
  providerId: string,
  scheduledAt: string,
  totalAmount: number,
  options: { packageId?: string; notes?: string } = {}
): Promise<ServiceBooking> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const payload: Record<string, unknown> = {
    service_id: serviceId,
    client_id: user.id,
    provider_id: providerId,
    scheduled_at: scheduledAt,
    total_amount: totalAmount,
  };
  if (options.packageId !== undefined) payload['package_id'] = options.packageId;
  if (options.notes !== undefined) payload['notes'] = options.notes;

  const { data, error } = await supabase
    .from('service_bookings')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return mapServiceBooking(data as ServiceBookingRow);
}

export async function getMyBookingsAsClient(
  status?: BookingStatus
): Promise<ServiceBooking[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let q = supabase
    .from('service_bookings')
    .select('*')
    .eq('client_id', user.id);

  if (status) q = q.eq('status', status);

  const { data, error } = await q.order('scheduled_at', { ascending: false });
  if (error) throw error;
  return (data as ServiceBookingRow[]).map(mapServiceBooking);
}

export async function getMyBookingsAsProvider(
  status?: BookingStatus
): Promise<ServiceBooking[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let q = supabase
    .from('service_bookings')
    .select('*')
    .eq('provider_id', user.id);

  if (status) q = q.eq('status', status);

  const { data, error } = await q.order('scheduled_at', { ascending: true });
  if (error) throw error;
  return (data as ServiceBookingRow[]).map(mapServiceBooking);
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus
): Promise<ServiceBooking> {
  const payload: Record<string, unknown> = { status };
  if (status === 'completed') {
    payload['completed_at'] = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('service_bookings')
    .update(payload)
    .eq('id', bookingId)
    .select('*')
    .single();
  if (error) throw error;
  return mapServiceBooking(data as ServiceBookingRow);
}
