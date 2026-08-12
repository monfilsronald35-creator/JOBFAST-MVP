export const CONTENT_TYPES = [
  'plain_text',
  'markdown',
  'html',
] as const;

export type ContentType = typeof CONTENT_TYPES[number];

export const GENDER_RULES = [
  'neutral',
  'male',
  'female',
  'company',
  'other',
] as const;

export type GenderRule = typeof GENDER_RULES[number];

export const PLURAL_FORMS = [
  'zero',
  'one',
  'two',
  'few',
  'many',
  'other',
] as const;

export type PluralForm = typeof PLURAL_FORMS[number];

export const WORKFLOW_STATUSES = [
  'draft',
  'pending',
  'approved',
  'rejected',
  'archived',
] as const;

export type WorkflowStatus = typeof WORKFLOW_STATUSES[number];

export const TRANSLATION_PROVIDERS = [
  'human',
  'google',
  'deepl',
  'openai',
  'microsoft',
  'other',
] as const;

export type TranslationProvider = typeof TRANSLATION_PROVIDERS[number];

export const MESSAGE_CHANNELS = [
  'push',
  'sms',
  'email',
  'in_app',
  'whatsapp',
] as const;

export type MessageChannel = typeof MESSAGE_CHANNELS[number];

export interface TranslationNamespace {
  id: string;
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

export interface TranslationKey {
  id: string;
  namespaceId: string;
  keyName: string;
  context: string | null;
  description: string | null;
  screenName: string | null;
  pageName: string | null;
  screenshotUrl: string | null;
  maxLength: number | null;
  contentType: ContentType;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  searchVector: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Translation {
  id: string;
  translationKeyId: string;
  languageId: string;
  locale: string;
  translatedText: string;
  genderRule: GenderRule;
  pluralForm: PluralForm;
  workflowStatus: WorkflowStatus;
  isVerified: boolean;
  verifiedBy: string | null;
  aiGenerated: boolean;
  aiModel: string | null;
  confidenceScore: number | null;
  translationProvider: TranslationProvider | null;
  variablesValid: boolean;
  ttsVoice: string | null;
  voiceSpeed: number;
  voiceGender: string;
  embeddingVector: number[] | null;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  searchVector: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TranslationHistory {
  id: string;
  translationId: string;
  previousText: string | null;
  newText: string;
  workflowStatus: string | null;
  changedBy: string | null;
  changeReason: string | null;
  createdAt: string;
}

export interface TranslationAuditLog {
  id: string;
  action: string;
  tableName: string;
  recordId: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  performedBy: string | null;
  clientIp: string | null;
  deviceInfo: string | null;
  createdAt: string;
}

export interface LocalizedMessage {
  id: string;
  messageCode: string;
  languageId: string;
  locale: string;
  subject: string | null;
  body: string;
  channel: MessageChannel;
  rtlCss: string | null;
  rtlFont: string | null;
  rtlOverrides: Record<string, unknown>;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  searchVector: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocalizedCategory {
  id: string;
  categorySlug: string;
  languageId: string;
  locale: string;
  name: string;
  description: string | null;
  parentId: string | null;
  iconUrl: string | null;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  searchVector: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TranslationCache {
  id: string;
  languageCode: string;
  namespaceName: string;
  cachePayload: Record<string, string>;
  compiledAt: string;
}

export interface MvTranslationCache {
  languageCode: string;
  namespaceName: string;
  translationsMap: Record<string, string>;
}
