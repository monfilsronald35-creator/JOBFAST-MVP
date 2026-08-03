export type UUID = string;
export type Email = string;
export type Phone = string;
export type Url = string;
export type UnixMs = number;
/** All monetary amounts in integer minor units (e.g. $10.50 = 1050 cents) */
export type MinorUnits = number;
export type Locale = 'ht' | 'fr' | 'en' | 'es' | 'pt' | 'ar';
export type Currency = 'HTG' | 'USD' | 'EUR' | 'GBP' | 'BRL' | 'CAD';
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        nextCursor?: string;
        total?: number;
        limit: number;
    };
}
export interface ApiSuccess<T> {
    success: true;
    data: T;
}
export interface ApiError {
    success: false;
    code: string;
    message: string;
    fields?: Record<string, string>;
}
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
export type UserRole = 'worker' | 'client' | 'business' | 'admin' | 'superadmin';
export type UserStatus = 'active' | 'suspended' | 'pending_verification' | 'deleted';
export interface UserProfile {
    id: UUID;
    email: Email;
    fullName: string;
    phone?: Phone;
    avatarUrl?: Url;
    role: UserRole;
    status: UserStatus;
    locale: Locale;
    country?: string;
    verifiedAt?: UnixMs;
    createdAt: UnixMs;
    updatedAt: UnixMs;
}
export type JobStatus = 'draft' | 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
export type JobCategory = string;
export interface JobSummary {
    id: UUID;
    title: string;
    description: string;
    category: JobCategory;
    status: JobStatus;
    budget: MinorUnits;
    currency: Currency;
    clientId: UUID;
    workerId?: UUID;
    location?: {
        lat: number;
        lng: number;
        address: string;
    };
    createdAt: UnixMs;
}
export type NotificationType = 'job_update' | 'message' | 'payment' | 'review' | 'system' | 'promo';
export type NotificationChannel = 'in_app' | 'push' | 'email' | 'sms' | 'whatsapp';
export interface NotificationPayload {
    type: NotificationType;
    title: string;
    body: string;
    imageUrl?: Url;
    actionUrl?: Url;
    data?: Record<string, unknown>;
}
export interface GeoPoint {
    lat: number;
    lng: number;
}
export interface GeoAddress extends GeoPoint {
    address: string;
    city?: string;
    country?: string;
    postalCode?: string;
}
export interface MediaRef {
    mediaId: UUID;
    url: Url;
    type: 'image' | 'video' | 'audio' | 'document';
    mimeType: string;
    size: number;
}
//# sourceMappingURL=index.d.ts.map