export type AgencyType =
  | 'national' | 'regional' | 'municipality' | 'immigration'
  | 'tax' | 'civil_registry' | 'licensing' | 'employment'
  | 'transport' | 'social_services';

export interface GovernmentAgency {
  id:           string;
  name:         string;
  type:         AgencyType;
  country:      string;
  region?:      string | undefined;
  city?:        string | undefined;
  address?:     string | undefined;
  phone?:       string | undefined;
  email?:       string | undefined;
  lat?:         number | undefined;
  lng?:         number | undefined;
  isActive:     boolean;
  createdAt:    string;
}

// ── Permits ──────────────────────────────────────────────────────────────────
export type PermitType   = 'building' | 'work' | 'business' | 'construction' | 'travel' | 'import' | 'export';
export type PermitStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'expired';

export interface GovernmentPermit {
  id:             string;
  citizenId:      string;
  agencyId:       string;
  type:           PermitType;
  status:         PermitStatus;
  title:          string;
  description?:   string | undefined;
  referenceNo:    string;
  qrCode?:        string | undefined;
  expiresAt?:     string | undefined;
  reviewNote?:    string | undefined;
  reviewedBy?:    string | undefined;
  reviewedAt?:    string | undefined;
  createdAt:      string;
  updatedAt:      string;
}

// ── Licenses ─────────────────────────────────────────────────────────────────
export type LicenseType   = 'business' | 'professional' | 'construction' | 'taxi' | 'restaurant' | 'hotel' | 'healthcare';
export type LicenseStatus = 'active' | 'suspended' | 'expired' | 'pending_renewal';

export interface GovernmentLicense {
  id:            string;
  holderId:      string;
  agencyId:      string;
  type:          LicenseType;
  status:        LicenseStatus;
  licenseNo:     string;
  holderName:    string;
  qrCode?:       string | undefined;
  issuedAt:      string;
  expiresAt:     string;
  renewedAt?:    string | undefined;
  suspendReason?: string | undefined;
  createdAt:     string;
}

// ── Taxes ─────────────────────────────────────────────────────────────────────
export type TaxType      = 'income' | 'corporate' | 'vat' | 'property' | 'import' | 'export';
export type TaxStatus    = 'pending' | 'declared' | 'paid' | 'overdue' | 'refund_requested' | 'refunded';

export interface TaxRecord {
  id:              string;
  taxpayerId:      string;
  agencyId:        string;
  type:            TaxType;
  status:          TaxStatus;
  period:          string;
  baseAmount:      number;
  taxAmount:       number;
  currency:        string;
  dueDate:         string;
  paidAt?:         string | undefined;
  paymentRef?:     string | undefined;
  installmentCount?: number | undefined;
  receiptQr?:      string | undefined;
  createdAt:       string;
}

// ── Certificates ─────────────────────────────────────────────────────────────
export type CertificateType   = 'birth' | 'marriage' | 'death' | 'residence' | 'business' | 'employment' | 'education';
export type CertificateStatus = 'pending' | 'processing' | 'ready' | 'delivered' | 'expired';

export interface GovernmentCertificate {
  id:            string;
  requesterId:   string;
  agencyId:      string;
  type:          CertificateType;
  status:        CertificateStatus;
  referenceNo:   string;
  subjectName:   string;
  qrCode?:       string | undefined;
  verifyUrl?:    string | undefined;
  issuedAt?:     string | undefined;
  expiresAt?:    string | undefined;
  deliveredAt?:  string | undefined;
  fee:           number;
  currency:      string;
  createdAt:     string;
}

// ── Appointments ─────────────────────────────────────────────────────────────
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface GovAppointment {
  id:            string;
  citizenId:     string;
  agencyId:      string;
  serviceType:   string;
  status:        AppointmentStatus;
  scheduledAt:   string;
  confirmCode:   string;
  officeAddress?: string | undefined;
  notes?:        string | undefined;
  completedAt?:  string | undefined;
  cancelledAt?:  string | undefined;
  createdAt:     string;
}

// ── Identity Verification ─────────────────────────────────────────────────────
export type IdDocumentType   = 'passport' | 'national_id' | 'residence_permit' | 'business_registration';
export type VerificationStatus = 'pending' | 'verified' | 'failed' | 'expired';

export interface IdentityVerification {
  id:             string;
  userId:         string;
  documentType:   IdDocumentType;
  status:         VerificationStatus;
  documentNo?:    string | undefined;
  verifiedAt?:    string | undefined;
  failureReason?: string | undefined;
  expiresAt?:     string | undefined;
  createdAt:      string;
}

// ── Citizen Dashboard ─────────────────────────────────────────────────────────
export interface CitizenDashboard {
  citizenId:        string;
  permits:          GovernmentPermit[];
  licenses:         GovernmentLicense[];
  taxes:            TaxRecord[];
  certificates:     GovernmentCertificate[];
  appointments:     GovAppointment[];
  identityStatus:   VerificationStatus | 'not_started';
  pendingPayments:  number;
  notifications:    Array<{ message: string; type: string; createdAt: string }>;
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export interface GovAnalytics {
  agencyId:          string;
  period:            string;
  totalApplications: number;
  approved:          number;
  rejected:          number;
  pending:           number;
  avgProcessingDays: number;
  totalRevenue:      number;
  currency:          string;
  peakDay:           string;
  citizenSatisfaction: number;
  serviceBreakdown:  Array<{ service: string; count: number }>;
}