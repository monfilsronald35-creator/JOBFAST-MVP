export enum VerificationType {
  Email        = 'email',
  Phone        = 'phone',
  Identity     = 'identity',          // Government ID
  Address      = 'address',
  Business     = 'business',          // Business registration
  Government   = 'government',        // Government entity verification
  Banking      = 'banking',           // Bank account ownership
  KYC          = 'kyc',               // Know Your Customer
  KYB          = 'kyb',               // Know Your Business
}

export enum VerificationStatus {
  Pending    = 'pending',
  InReview   = 'in_review',
  Approved   = 'approved',
  Rejected   = 'rejected',
  Expired    = 'expired',
  Revoked    = 'revoked',
}

export enum DocumentType {
  Passport       = 'passport',
  NationalID     = 'national_id',
  DriverLicense  = 'driver_license',
  Certificate    = 'certificate',
  Diploma        = 'diploma',
  Contract       = 'contract',
  CV             = 'cv',
  Insurance      = 'insurance',
  TaxDocument    = 'tax_document',
  BusinessReg    = 'business_registration',
  BankStatement  = 'bank_statement',
  UtilityBill    = 'utility_bill',
  Other          = 'other',
}

export interface VerificationRecord {
  id:             string;
  userId:         string;
  type:           VerificationType;
  status:         VerificationStatus;
  submittedAt?:   string;
  reviewedAt?:    string;
  expiresAt?:     string;
  reviewedBy?:    string;
  rejectionReason?: string;
  metadata:       Record<string, unknown>;
  createdAt:      string;
  updatedAt:      string;
}

export interface DocumentRecord {
  id:           string;
  userId:       string;
  type:         DocumentType;
  fileName:     string;
  fileUrl:      string;
  fileSize:     number;
  mimeType:     string;
  isVerified:   boolean;
  expiresAt?:   string;
  metadata:     Record<string, unknown>;
  uploadedAt:   string;
}

export interface VerificationSummary {
  email:      boolean;
  phone:      boolean;
  identity:   boolean;
  address:    boolean;
  business:   boolean;
  government: boolean;
  banking:    boolean;
  kyc:        boolean;
  kyb:        boolean;
  overallLevel: 'unverified' | 'basic' | 'standard' | 'advanced' | 'enterprise';
  trustBadge:  'none' | 'verified' | 'trusted' | 'certified';
}
