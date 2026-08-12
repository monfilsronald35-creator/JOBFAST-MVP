export const HOLIDAY_SCOPES = [
  'national',
  'regional',
  'city',
  'company',
  'religious',
  'optional',
] as const;

export type HolidayScope = typeof HOLIDAY_SCOPES[number];

export const HOLIDAY_TYPES = [
  'public',
  'religious',
  'bank',
  'observance',
  'company',
] as const;

export type HolidayType = typeof HOLIDAY_TYPES[number];

export interface Timezone {
  id: string;
  zoneName: string;
  countryId: string | null;
  countryCode: string | null;
  abbreviation: string;
  utcOffset: string;
  utcOffsetString: string;
  utcOffsetMinutes: number;
  ianaVersion: string;
  dstObserved: boolean;
  rawOffsetSeconds: number;
  dstOffsetSeconds: number;
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
  createdIp: string | null;
  updatedIp: string | null;
  createdDevice: string | null;
  updatedDevice: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DstRule {
  id: string;
  timezoneId: string;
  year: number;
  dstStartUtc: string;
  dstEndUtc: string;
  offsetAppliedSeconds: number;
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

export interface WorkingDay {
  id: string;
  countryId: string | null;
  entityId: string | null;
  dayOfWeek: number;
  isWorkingDay: boolean;
  isHalfDay: boolean;
  halfDayStart: string | null;
  halfDayEnd: string | null;
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

export interface BusinessHours {
  id: string;
  countryId: string | null;
  entityId: string | null;
  timezoneId: string | null;
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  is24Hours: boolean;
  crossesMidnight: boolean;
  isClosed: boolean;
  breakStart: string | null;
  breakEnd: string | null;
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

export interface Holiday {
  id: string;
  countryId: string;
  name: string;
  localName: string | null;
  holidayDate: string;
  holidayScope: HolidayScope;
  holidayType: HolidayType;
  isRecurringAnnually: boolean;
  isWorkingHoliday: boolean;
  isBankClosed: boolean;
  isGovernmentClosed: boolean;
  isSchoolClosed: boolean;
  description: string | null;
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
