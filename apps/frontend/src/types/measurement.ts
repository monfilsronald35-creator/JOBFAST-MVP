export const MEASUREMENT_CATEGORIES = [
  'distance',
  'weight',
  'temperature',
  'volume',
  'pressure',
  'speed',
  'energy',
  'currency',
  'time',
  'area',
] as const;

export type MeasurementCategory = typeof MEASUREMENT_CATEGORIES[number];

export interface MeasurementSystem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MeasurementUnit {
  id: string;
  measurementSystemId: string | null;
  code: string;
  name: string;
  symbol: string;
  category: MeasurementCategory;
  dimensionType: string;
  conversionFactorToBase: number;
  baseOffset: number;
  precisionDigits: number;
  isBaseUnit: boolean;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  searchVector: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CountryMeasurementPreference {
  id: string;
  countryId: string;
  measurementSystemId: string;
  distanceUnitId: string | null;
  weightUnitId: string | null;
  temperatureUnitId: string | null;
  volumeUnitId: string | null;
  isDefault: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  version: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
