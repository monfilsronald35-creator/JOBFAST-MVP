/**
 * governanceConfig.js
 *
 * Frontend mirror of backend/src/config/governance.js.
 * Used by AdminGovernance.jsx and any component that needs
 * to display governance data (feature flags, country configs, etc.)
 *
 * No business logic here — presentation metadata only.
 */

// ─────────────────────────────────────────────────────────────
// FEATURE FLAG DISPLAY METADATA
// ─────────────────────────────────────────────────────────────

export const FLAG_CATEGORIES = {
  core:      { label: 'Core',          color: '#3b82f6' },
  reputation:{ label: 'Réputation',    color: '#8b5cf6' },
  location:  { label: 'Lokasyon',      color: '#22c55e' },
  business:  { label: 'Biznis',        color: '#f59e0b' },
  security:  { label: 'Sekirite',      color: '#ef4444' },
  beta:      { label: 'Beta',          color: '#f97316' },
};

export const FLAG_ICONS = {
  gps_live_tracking:     '📍',
  marketplace_reviews:   '⭐',
  trust_score_public:    '🛡️',
  enterprise_module:     '🏢',
  complaint_system:      '📋',
  badge_system:          '🏅',
  ai_fraud_detection:    '🤖',
  document_verification: '📄',
  radius_alerts:         '🔔',
  multi_language:        '🌍',
};

// ─────────────────────────────────────────────────────────────
// COUNTRY DISPLAY METADATA
// ─────────────────────────────────────────────────────────────

export const COUNTRY_FLAGS = {
  HT: '🇭🇹',
  DO: '🇩🇴',
  US: '🇺🇸',
  FR: '🇫🇷',
  CA: '🇨🇦',
  JM: '🇯🇲',
};

export const COUNTRY_LABELS = {
  HT: 'Haiti',
  DO: 'Repiblik Dominikèn',
  US: 'Etazini',
  FR: 'Lafrans',
  CA: 'Kanada',
  JM: 'Jamaïk',
};

// ─────────────────────────────────────────────────────────────
// AUDIT LOG TYPES (display labels)
// ─────────────────────────────────────────────────────────────

export const AUDIT_TYPE_LABELS = {
  role_change:           'Chanjman Wòl',
  permission_change:     'Chanjman Pèmisyon',
  user_verified:         'Itilizatè Verifye',
  user_suspended:        'Itilizatè Sispann',
  user_banned:           'Itilizatè Bloke',
  user_restored:         'Itilizatè Retabli',
  profile_visibility:    'Vizibilite Pwofil',
  job_lifecycle:         'Sik lavi Travay',
  booking_action:        'Aksyon Rezèvasyon',
  trust_score_change:    'Chanjman Skor Konfyans',
  verification_change:   'Chanjman Verifikasyon',
  review_moderation:     'Moderasyon Evalyasyon',
  badge_awarded:         'Baj Akòde',
  badge_revoked:         'Baj Retire',
  complaint_action:      'Aksyon Plent',
  dispute_escalated:     'Eskalasyon Dispute',
  gps_permission:        'Pèmisyon GPS',
  location_update:       'Mise à jour Lokasyon',
  admin_action:          'Aksyon Admin',
  moderation_action:     'Aksyon Moderasyon',
  fraud_investigation:   'Envestigasyon Fwòd',
  feature_flag_change:   'Chanjman Fonksyon',
  country_config_change: 'Konfigirasyon Peyi',
  permission_matrix:     'Matris Pèmisyon',
  consent_change:        'Chanjman Konsantman',
  security_event:        'Evènman Sekirite',
  system_health:         'Sante Sistèm',
};

export const AUDIT_TYPE_COLORS = {
  user_suspended:        '#f97316',
  user_banned:           '#ef4444',
  user_restored:         '#22c55e',
  user_verified:         '#3b82f6',
  fraud_investigation:   '#dc2626',
  security_event:        '#dc2626',
  feature_flag_change:   '#8b5cf6',
  country_config_change: '#f59e0b',
  review_moderation:     '#6366f1',
  complaint_action:      '#f59e0b',
};

// ─────────────────────────────────────────────────────────────
// MODERATION ITEM TYPES
// ─────────────────────────────────────────────────────────────

export const MODERATION_TYPES = [
  { id: 'all',          label: 'Tout',           icon: '📋' },
  { id: 'verification', label: 'Verifikasyon',   icon: '🪪' },
  { id: 'review',       label: 'Evalyasyon',     icon: '⭐' },
  { id: 'complaint',    label: 'Plent',          icon: '⚠️' },
  { id: 'user',         label: 'Itilizatè',      icon: '👤' },
];

export const MODERATION_ACTIONS = {
  user: [
    { id: 'verify',   label: 'Verifye',   color: '#22c55e' },
    { id: 'suspend',  label: 'Sispann',   color: '#f97316' },
    { id: 'restore',  label: 'Retabli',   color: '#3b82f6' },
    { id: 'ban',      label: 'Bloke',     color: '#ef4444' },
  ],
  review: [
    { id: 'approve',  label: 'Apwouve',   color: '#22c55e' },
    { id: 'reject',   label: 'Rejte',     color: '#ef4444' },
  ],
  complaint: [
    { id: 'resolve',  label: 'Rezoud',    color: '#22c55e' },
    { id: 'reject',   label: 'Rejte',     color: '#6b7280' },
    { id: 'escalate', label: 'Eskalasyon',color: '#f97316' },
  ],
  verification: [
    { id: 'verify',   label: 'Apwouve',   color: '#22c55e' },
    { id: 'reject',   label: 'Rejte',     color: '#ef4444' },
  ],
};

// ─────────────────────────────────────────────────────────────
// PERMISSION LABELS
// ─────────────────────────────────────────────────────────────

export const PERMISSION_LABELS = {
  read:               'Li',
  create:             'Kreye',
  update:             'Modifye',
  delete:             'Efase',
  approve:            'Apwouve',
  reject:             'Rejte',
  suspend:            'Sispann',
  moderate:           'Modere',
  verify:             'Verifye',
  export:             'Ekspòte',
  audit:              'Odit',
  featureFlags:       'Jere Fonksyon',
  countryConfig:      'Konfigirasyon Peyi',
  laborRules:         'Règ Travay',
  fraudInvestigation: 'Envestigasyon Fwòd',
  disputeResolution:  'Rezolisyon Dispute',
};

export const ROLES_WITH_PERMISSIONS = [
  'super_admin', 'admin', 'enterprise', 'company',
  'worker', 'user', 'restaurant',
];

// ─────────────────────────────────────────────────────────────
// CONSENT TYPES (frontend)
// ─────────────────────────────────────────────────────────────

export const CONSENT_TYPE_LABELS = {
  gps:           'GPS / Lokasyon',
  notifications: 'Notifikasyon App',
  email:         'Email Maketing',
  sms:           'SMS',
  push:          'Push Notifications',
  cookies:       'Cookies Analitik',
  analytics:     'Analitik Platfòm',
  documents:     'Telechajman Dokiman',
  identity:      'Verifikasyon Idantite',
};

// ─────────────────────────────────────────────────────────────
// GOVERNANCE TABS
// ─────────────────────────────────────────────────────────────

export const GOVERNANCE_TABS = [
  { id: 'audit',       label: 'Jounal Audit',     icon: '📋' },
  { id: 'moderation',  label: 'Moderasyon',       icon: '🛡️' },
  { id: 'fraud',       label: 'Deteksyon Fwòd',   icon: '🔍' },
  { id: 'disputes',    label: 'Dispute',           icon: '⚖️' },
  { id: 'flags',       label: 'Fonksyon',          icon: '🚩' },
  { id: 'countries',   label: 'Konfigirasyon Peyi',icon: '🌍' },
  { id: 'permissions', label: 'Pèmisyon',          icon: '🔐' },
  { id: 'consent',     label: 'Konsantman',        icon: '📝' },
  { id: 'health',      label: 'Sante Sistèm',      icon: '❤️' },
];

// ─────────────────────────────────────────────────────────────
// COMPLAINT STATUS DISPLAY
// ─────────────────────────────────────────────────────────────

export const COMPLAINT_STATUS_CONFIG = {
  open:          { label: 'Louvri',         color: '#f59e0b', bg: '#fef3c7' },
  under_review:  { label: 'Anba Revizyon', color: '#3b82f6', bg: '#dbeafe' },
  investigating: { label: 'Envestigasyon', color: '#8b5cf6', bg: '#ede9fe' },
  resolved:      { label: 'Rezoud',        color: '#22c55e', bg: '#dcfce7' },
  rejected:      { label: 'Rejete',        color: '#ef4444', bg: '#fee2e2' },
  escalated:     { label: 'Eskalasyon',    color: '#f97316', bg: '#ffedd5' },
  closed:        { label: 'Fèmen',         color: '#6b7280', bg: '#f3f4f6' },
};