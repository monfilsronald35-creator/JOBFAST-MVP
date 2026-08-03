export type RiskLevel    = 'low' | 'medium' | 'high' | 'critical';
export type RiskScore    = number; // 0–100

export type AuditAction =
  | 'auth.login' | 'auth.logout' | 'auth.failed' | 'auth.mfa'
  | 'auth.token_refresh' | 'auth.password_reset'
  | 'payment.initiated' | 'payment.completed' | 'payment.failed' | 'payment.refund'
  | 'wallet.transfer' | 'wallet.withdrawal' | 'wallet.topup'
  | 'admin.action' | 'admin.role_change' | 'admin.user_suspend'
  | 'document.upload' | 'document.download' | 'document.delete'
  | 'gov.permit_approved' | 'gov.cert_issued' | 'gov.identity_verified'
  | 'health.record_access' | 'health.prescription'
  | 'ai.decision' | 'chat.moderation'
  | 'security.incident' | 'security.block' | 'security.threat';

export type AuditResult = 'success' | 'failure' | 'blocked' | 'escalated';

export interface DeviceInfo {
  deviceId:   string;
  userAgent:  string;
  browser:    string;
  os:         string;
  isMobile:   boolean;
  ip:         string;
  country:    string;
  language?:  string | undefined;
  timezone?:  string | undefined;
  riskScore:  RiskScore;
  isTrusted:  boolean;
  isBot:      boolean;
}

export interface SecurityContext {
  ip:         string;
  country:    string;
  deviceId:   string;
  riskLevel:  RiskLevel;
  botScore:   RiskScore;
  isTrusted:  boolean;
  isBot:      boolean;
}

export interface AuditEntry {
  id:          string;
  userId?:     string | undefined;
  sessionId?:  string | undefined;
  action:      AuditAction | string;
  targetId?:   string | undefined;
  targetType?: string | undefined;
  ip:          string;
  country:     string;
  deviceId:    string;
  userAgent:   string;
  result:      AuditResult;
  riskScore:   RiskScore;
  metadata:    Record<string, unknown>;
  createdAt:   string;
}

export type IncidentType =
  | 'unusual_login' | 'impossible_travel' | 'mass_payment' | 'mass_download'
  | 'mass_message' | 'api_attack' | 'credential_stuffing' | 'bot_detected'
  | 'fraud_detected' | 'data_breach' | 'suspicious_behavior';

export type IncidentStatus   = 'open' | 'investigating' | 'resolved' | 'false_positive';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityIncident {
  id:            string;
  type:          IncidentType;
  severity:      IncidentSeverity;
  userId?:       string | undefined;
  ip?:           string | undefined;
  description:   string;
  status:        IncidentStatus;
  assignedTo?:   string | undefined;
  metadata:      Record<string, unknown>;
  resolvedAt?:   string | undefined;
  resolvedBy?:   string | undefined;
  resolution?:   string | undefined;
  createdAt:     string;
}

export type BlockedEntityType = 'ip' | 'device' | 'user';

export interface BlockedEntity {
  id:           string;
  type:         BlockedEntityType;
  value:        string;
  reason:       string;
  blockedUntil?: string | undefined;
  createdBy:    string;
  createdAt:    string;
}

export interface FraudSignal {
  type:     string;
  score:    RiskScore;
  evidence: string;
}

export interface SecurityStats {
  incidentsOpen:    number;
  incidentsToday:   number;
  blockedIPs:       number;
  riskUsersHigh:    number;
  auditLogsToday:   number;
  avgRiskScore:     number;
  topThreatType:    string;
  generatedAt:      string;
}