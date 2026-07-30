export enum IdentityType {
  Worker        = 'worker',
  Customer      = 'customer',
  Freelancer    = 'freelancer',
  Merchant      = 'merchant',
  Company       = 'company',
  Enterprise    = 'enterprise',
  Government    = 'government',
  Telecom       = 'telecom',
  Hotel         = 'hotel',
  Hospital      = 'hospital',
  Restaurant    = 'restaurant',
  NGO           = 'ngo',
  School        = 'school',
  Bank          = 'bank',
  Insurance     = 'insurance',
  Administrator = 'administrator',
  APIPartner    = 'api_partner',
}

export enum AuthMethod {
  EmailPassword  = 'email_password',
  PhoneOTP       = 'phone_otp',
  MagicLink      = 'magic_link',
  Passkey        = 'passkey',
  Biometric      = 'biometric',
  Google         = 'google',
  Apple          = 'apple',
  Facebook       = 'facebook',
  Microsoft      = 'microsoft',
  GitHub         = 'github',
  LinkedIn       = 'linkedin',
  EnterpriseSAML = 'enterprise_saml',
  EnterpriseOIDC = 'enterprise_oidc',
}

export enum RiskLevel {
  Low      = 'low',
  Medium   = 'medium',
  High     = 'high',
  Critical = 'critical',
}

export enum MFAMethod {
  TOTP    = 'totp',
  SMS     = 'sms',
  Backup  = 'backup',
}

export enum RecoveryType {
  PasswordReset   = 'password_reset',
  EmailVerify     = 'email_verify',
  PhoneVerify     = 'phone_verify',
  MagicLink       = 'magic_link',
  BackupCode      = 'backup_code',
}

// ——— Identity type → default permissions ————————————————————————————————————

export const IDENTITY_TYPE_ROLES: Record<IdentityType, string[]> = {
  [IdentityType.Worker]:        ['worker'],
  [IdentityType.Customer]:      ['customer'],
  [IdentityType.Freelancer]:    ['worker', 'freelancer'],
  [IdentityType.Merchant]:      ['merchant'],
  [IdentityType.Company]:       ['company'],
  [IdentityType.Enterprise]:    ['enterprise'],
  [IdentityType.Government]:    ['government', 'enterprise'],
  [IdentityType.Telecom]:       ['telecom', 'enterprise'],
  [IdentityType.Hotel]:         ['hotel', 'merchant'],
  [IdentityType.Hospital]:      ['hospital', 'enterprise'],
  [IdentityType.Restaurant]:    ['restaurant', 'merchant'],
  [IdentityType.NGO]:           ['ngo'],
  [IdentityType.School]:        ['school', 'enterprise'],
  [IdentityType.Bank]:          ['bank', 'enterprise'],
  [IdentityType.Insurance]:     ['insurance', 'enterprise'],
  [IdentityType.Administrator]: ['admin', 'superadmin'],
  [IdentityType.APIPartner]:    ['api_partner'],
};

// ——— Core data shapes ——————————————————————————————————————————————————————

export interface SessionRecord {
  id:           string;
  userId:       string;
  deviceId?:    string;
  sessionToken: string;
  ipAddress?:   string;
  countryCode?: string;
  city?:        string;
  browser?:     string;
  os?:          string;
  appVersion?:  string;
  loginMethod:  AuthMethod;
  riskScore:    number;
  riskFlags:    string[];
  isActive:     boolean;
  mfaVerified:  boolean;
  expiresAt:    string;
  lastActive:   string;
  createdAt:    string;
}

export interface DeviceRecord {
  id:           string;
  userId:       string;
  deviceId:     string;
  deviceName?:  string;
  deviceType?:  string;
  browser?:     string;
  os?:          string;
  isTrusted:    boolean;
  trustExpires?:string;
  fingerprint?: string;
  lastSeen:     string;
  lastIp?:      string;
  createdAt:    string;
}

export interface TokenPair {
  accessToken:  string;
  refreshToken: string;
  expiresIn:    number;
  tokenType:    'Bearer';
}

export interface MFARecord {
  id:            string;
  userId:        string;
  totpSecret?:   string;
  totpEnabled:   boolean;
  backupCodes:   string[];
  phoneNumber?:  string;
  phoneVerified: boolean;
}

export interface RiskAssessment {
  score:   number;
  level:   RiskLevel;
  flags:   string[];
  action:  'allow' | 'mfa_required' | 'otp_required' | 'block';
}

export interface OAuthProfile {
  provider: AuthMethod;
  id:       string;
  email:    string;
  name?:    string;
  avatar?:  string;
  raw?:     Record<string, unknown>;
}
