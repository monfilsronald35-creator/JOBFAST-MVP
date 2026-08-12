export interface CountryGroup {
  id: string;
  code: string;
  name: string;
  type: string | null;
  sortOrder: number;
  description: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Country {
  id: string;
  isoAlpha2: string;
  isoAlpha3: string;
  isoNumeric: string;
  name: string;
  slug: string;
  nativeName: string | null;
  capital: string | null;
  phoneCode: string | null;
  currencyId: string | null;
  defaultLanguageId: string | null;
  timezoneId: string | null;
  groupId: string | null;
  continent: string | null;
  subregion: string | null;
  emoji: string | null;
  flagSvgUrl: string | null;
  flagPngUrl: string | null;
  population: number | null;
  areaKm2: number | null;
  internetTld: string[] | null;
  callingCodes: string[] | null;
  isActive: boolean;
  isSupported: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
  searchVector: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface State {
  id: string;
  countryId: string;
  code: string;
  name: string;
  slug: string;
  nativeName: string | null;
  isoCode: string | null;
  fipsCode: string | null;
  latitude: number | null;
  longitude: number | null;
  isDeleted: boolean;
  deletedAt: string | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
  searchVector: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Region {
  id: string;
  countryId: string;
  stateId: string | null;
  name: string;
  slug: string;
  code: string | null;
  boundary: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
  searchVector: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface City {
  id: string;
  countryId: string;
  stateId: string | null;
  regionId: string | null;
  name: string;
  slug: string;
  postalCodeFormat: string | null;
  placeType: string;
  latitude: number | null;
  longitude: number | null;
  elevationM: number | null;
  location: string | null;
  boundary: string | null;
  population: number | null;
  timezoneId: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
  searchVector: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface District {
  id: string;
  countryId: string;
  cityId: string;
  code: string | null;
  name: string;
  boundary: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Neighborhood {
  id: string;
  countryId: string;
  cityId: string;
  districtId: string | null;
  code: string | null;
  name: string;
  boundary: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
  createdAt: string;
  updatedAt: string;
}
