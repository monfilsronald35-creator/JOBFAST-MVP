export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface GeocodeResult {
  address:  string;
  lat:      number;
  lng:      number;
  city?:    string | undefined;
  country:  string;
  placeId?: string | undefined;
}

export interface NearbyWorker {
  userId:    string;
  name:      string;
  role:      string;
  lat:       number;
  lng:       number;
  distanceKm: number;
  rating:    number;
  isOnline:  boolean;
  category?: string | undefined;
}

export interface ServiceArea {
  id:          string;
  ownerId:     string;
  name:        string;
  centerLat:   number;
  centerLng:   number;
  radiusKm:    number;
  country:     string;
  city:        string;
  isActive:    boolean;
  createdAt:   string;
}

export interface TrackingPoint {
  entityId:    string;
  entityType:  'driver' | 'worker' | 'delivery' | 'ambulance';
  lat:         number;
  lng:         number;
  speed?:      number | undefined;
  heading?:    number | undefined;
  accuracy?:   number | undefined;
  recordedAt:  string;
}

export interface RouteResult {
  originLat:        number;
  originLng:        number;
  destLat:          number;
  destLng:          number;
  distanceKm:       number;
  estimatedMinutes: number;
  etaText:          string;
}