export type KYCStatus       = 'unverified' | 'pending' | 'verified' | 'rejected' | 'expired';
export type KYCDocumentType = 'passport' | 'national_id' | 'drivers_license' | 'utility_bill' | 'bank_statement' | 'selfie';
export type AMLRiskLevel    = 'low' | 'medium' | 'high' | 'critical';
export type KYCLevel        = 1 | 2 | 3;  // 1=basic, 2=enhanced, 3=full/EDD

export interface KYCDocument {
  id:               string;
  userId:           string;
  type:             KYCDocumentType;
  status:           KYCStatus;
  documentUrl?:     string;   // pre-signed S3 URL — never stored client-side
  expiresAt?:       number;
  verifiedAt?:      number;
  rejectionReason?: string;
  createdAt:        number;
}

export interface KYCProfile {
  userId:           string;
  status:           KYCStatus;
  level:            KYCLevel;
  documents:        KYCDocument[];
  dailyLimit:       number;    // minor units per day allowed
  monthlyLimit:     number;
  lastVerifiedAt?:  number;
  reviewedBy?:      string;
  notes?:           string;
}

export interface KYBDocument {
  businessId:  string;
  type:        'registration_cert' | 'tax_id' | 'ownership_doc' | 'bank_letter';
  status:      KYCStatus;
  documentUrl?: string;
  verifiedAt?: number;
  createdAt:   number;
}

export interface KYBProfile {
  businessId:   string;
  status:       KYCStatus;
  documents:    KYBDocument[];
  uboVerified:  boolean;   // ultimate beneficial owners
  verifiedAt?:  number;
}

export interface AMLFlag {
  id:           string;
  transactionId: string;
  userId:       string;
  type:         'structuring' | 'rapid_movement' | 'unusual_pattern' | 'high_risk_country' | 'pep_match' | 'sanction_hit' | 'velocity';
  severity:     AMLRiskLevel;
  description:  string;
  autoFlagged:  boolean;
  reviewed:     boolean;
  reviewedAt?:  number;
  reviewedBy?:  string;
  resolution?:  'cleared' | 'reported' | 'escalated' | 'blocked';
  timestamp:    number;
}

export interface RiskAssessment {
  userId?:         string;
  transactionId?:  string;
  score:           number;    // 0–100
  level:           AMLRiskLevel;
  signals:         string[];
  recommendation:  'allow' | 'review' | 'block';
  timestamp:       number;
}

export interface SanctionResult {
  matched:         boolean;
  name?:           string;
  listName?:       string;   // 'OFAC_SDN' | 'UN_CONSOLIDATED' | 'EU_CONSOLIDATED'
  matchScore?:     number;   // 0–100 similarity
  matchedOn?:      string;
  checkTimestamp:  number;
}

export interface TransactionMonitoringAlert {
  id:            string;
  transactionId: string;
  ruleId:        string;
  ruleName:      string;
  severity:      AMLRiskLevel;
  details:       string;
  autoBlocked:   boolean;
  timestamp:     number;
}

export interface PCIAuditEntry {
  id:           string;
  action:       string;
  userId?:      string;
  ipAddress?:   string;
  resource:     string;
  outcome:      'success' | 'failure' | 'denied';
  timestamp:    number;
}