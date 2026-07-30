export enum NotifChannel {
  InApp    = 'in_app',
  Push     = 'push',
  Email    = 'email',
  SMS      = 'sms',
  WhatsApp = 'whatsapp',
  Telegram = 'telegram',
}

export enum NotifPriority {
  Critical   = 'critical',
  Emergency  = 'emergency',
  High       = 'high',
  Normal     = 'normal',
  Low        = 'low',
  Background = 'background',
}

export enum NotifStatus {
  Pending   = 'pending',
  Queued    = 'queued',
  Sending   = 'sending',
  Delivered = 'delivered',
  Read      = 'read',
  Failed    = 'failed',
  Cancelled = 'cancelled',
}

export enum NotifEventType {
  // Jobs
  JobCreated          = 'job.created',
  JobAssigned         = 'job.assigned',
  JobCompleted        = 'job.completed',
  ApplicationAccepted = 'application.accepted',
  // Payments
  PaymentSuccess      = 'payment.success',
  PaymentFailed       = 'payment.failed',
  RefundApproved      = 'refund.approved',
  InvoiceSent         = 'invoice.sent',
  // Wallet
  WalletCredited      = 'wallet.credited',
  WalletDebited       = 'wallet.debited',
  // Chat
  MessageReceived     = 'message.received',
  VideoCallIncoming   = 'video.call.incoming',
  // Commerce
  BookingConfirmed    = 'booking.confirmed',
  OrderDelivered      = 'order.delivered',
  // Account
  AccountVerified     = 'account.verified',
  PasswordChanged     = 'password.changed',
  LoginNewDevice      = 'login.new_device',
  FraudAlert          = 'fraud.alert',
  // System
  OTP                 = 'otp',
  Promotion           = 'promotion',
  SystemMaintenance   = 'system.maintenance',
  EmergencyAlert      = 'emergency.alert',
  AIRecommendation    = 'ai.recommendation',
  Welcome             = 'welcome',
}

export enum DeliveryStatus {
  Pending   = 'pending',
  Sent      = 'sent',
  Delivered = 'delivered',
  Failed    = 'failed',
  Bounced   = 'bounced',
}

export enum ScheduleType {
  Instant     = 'instant',
  Delayed     = 'delayed',
  Scheduled   = 'scheduled',
  Recurring   = 'recurring',
}

// Channel routing rules — which channels for each event type
export const CHANNEL_RULES: Record<NotifEventType, NotifChannel[]> = {
  [NotifEventType.OTP]:               [NotifChannel.SMS,     NotifChannel.Push],
  [NotifEventType.PaymentSuccess]:    [NotifChannel.Push,    NotifChannel.InApp,    NotifChannel.Email],
  [NotifEventType.PaymentFailed]:     [NotifChannel.Push,    NotifChannel.InApp,    NotifChannel.Email],
  [NotifEventType.InvoiceSent]:       [NotifChannel.Email],
  [NotifEventType.EmergencyAlert]:    [NotifChannel.Push,    NotifChannel.SMS,      NotifChannel.WhatsApp],
  [NotifEventType.FraudAlert]:        [NotifChannel.Push,    NotifChannel.SMS,      NotifChannel.Email],
  [NotifEventType.Promotion]:         [NotifChannel.Push],
  [NotifEventType.MessageReceived]:   [NotifChannel.Push,    NotifChannel.InApp],
  [NotifEventType.VideoCallIncoming]: [NotifChannel.Push],
  [NotifEventType.LoginNewDevice]:    [NotifChannel.Push,    NotifChannel.Email],
  [NotifEventType.JobAssigned]:       [NotifChannel.Push,    NotifChannel.InApp],
  [NotifEventType.JobCreated]:        [NotifChannel.InApp],
  [NotifEventType.JobCompleted]:      [NotifChannel.Push,    NotifChannel.InApp,    NotifChannel.Email],
  [NotifEventType.ApplicationAccepted]: [NotifChannel.Push,  NotifChannel.InApp],
  [NotifEventType.WalletCredited]:    [NotifChannel.Push,    NotifChannel.InApp],
  [NotifEventType.WalletDebited]:     [NotifChannel.Push,    NotifChannel.InApp],
  [NotifEventType.BookingConfirmed]:  [NotifChannel.Push,    NotifChannel.InApp,    NotifChannel.Email],
  [NotifEventType.OrderDelivered]:    [NotifChannel.Push,    NotifChannel.InApp,    NotifChannel.Email],
  [NotifEventType.RefundApproved]:    [NotifChannel.Push,    NotifChannel.InApp,    NotifChannel.Email],
  [NotifEventType.AccountVerified]:   [NotifChannel.Push,    NotifChannel.InApp],
  [NotifEventType.PasswordChanged]:   [NotifChannel.Email,   NotifChannel.Push],
  [NotifEventType.SystemMaintenance]: [NotifChannel.InApp,   NotifChannel.Email],
  [NotifEventType.AIRecommendation]:  [NotifChannel.InApp],
  [NotifEventType.Welcome]:           [NotifChannel.InApp,   NotifChannel.Email],
};

export const EVENT_PRIORITY: Record<NotifEventType, NotifPriority> = {
  [NotifEventType.EmergencyAlert]:    NotifPriority.Emergency,
  [NotifEventType.FraudAlert]:        NotifPriority.Critical,
  [NotifEventType.OTP]:               NotifPriority.Critical,
  [NotifEventType.VideoCallIncoming]: NotifPriority.Critical,
  [NotifEventType.PaymentFailed]:     NotifPriority.High,
  [NotifEventType.LoginNewDevice]:    NotifPriority.High,
  [NotifEventType.PaymentSuccess]:    NotifPriority.High,
  [NotifEventType.WalletCredited]:    NotifPriority.High,
  [NotifEventType.WalletDebited]:     NotifPriority.High,
  [NotifEventType.RefundApproved]:    NotifPriority.High,
  [NotifEventType.JobAssigned]:       NotifPriority.High,
  [NotifEventType.MessageReceived]:   NotifPriority.Normal,
  [NotifEventType.BookingConfirmed]:  NotifPriority.Normal,
  [NotifEventType.OrderDelivered]:    NotifPriority.Normal,
  [NotifEventType.ApplicationAccepted]: NotifPriority.Normal,
  [NotifEventType.JobCompleted]:      NotifPriority.Normal,
  [NotifEventType.AccountVerified]:   NotifPriority.Normal,
  [NotifEventType.PasswordChanged]:   NotifPriority.Normal,
  [NotifEventType.InvoiceSent]:       NotifPriority.Normal,
  [NotifEventType.JobCreated]:        NotifPriority.Low,
  [NotifEventType.SystemMaintenance]: NotifPriority.Low,
  [NotifEventType.Welcome]:           NotifPriority.Low,
  [NotifEventType.AIRecommendation]:  NotifPriority.Low,
  [NotifEventType.Promotion]:         NotifPriority.Background,
};

export interface NotifNotification {
  id:          string;
  userId:      string;
  eventType:   NotifEventType;
  title:       string;
  body:        string;
  priority:    NotifPriority;
  status:      NotifStatus;
  channels:    NotifChannel[];
  imageUrl?:   string | undefined;
  actionUrl?:  string | undefined;
  data?:       Record<string, unknown> | undefined;
  lang?:       string | undefined;
  isRead:      boolean;
  readAt?:     string | undefined;
  scheduledAt?: string | undefined;
  sentAt?:     string | undefined;
  createdAt:   string;
  updatedAt:   string;
}

export interface NotifDelivery {
  id:          string;
  notifId:     string;
  channel:     NotifChannel;
  status:      DeliveryStatus;
  provider?:   string | undefined;
  attempt:     number;
  error?:      string | undefined;
  sentAt?:     string | undefined;
  deliveredAt?: string | undefined;
  createdAt:   string;
}

export interface NotifTemplate {
  id:         string;
  eventType:  NotifEventType;
  channel:    NotifChannel;
  lang:       string;
  subject?:   string | undefined;
  titleTpl:   string;
  bodyTpl:    string;
  richHtml?:  string | undefined;
  isActive:   boolean;
  createdAt:  string;
  updatedAt:  string;
}

export interface NotifPreference {
  userId:         string;
  channel:        NotifChannel;
  category:       string;
  enabled:        boolean;
  quietHoursFrom?: string | undefined;
  quietHoursTo?:  string | undefined;
  timezone?:      string | undefined;
  updatedAt:      string;
}

export interface NotifCampaign {
  id:           string;
  name:         string;
  eventType:    NotifEventType;
  channels:     NotifChannel[];
  title:        string;
  body:         string;
  targetRoles?: string[] | undefined;
  targetCountries?: string[] | undefined;
  targetLangs?: string[] | undefined;
  scheduledAt?: string | undefined;
  sentAt?:      string | undefined;
  totalTargets: number;
  sentCount:    number;
  createdBy:    string;
  createdAt:    string;
}

export interface SendNotifInput {
  userId:       string;
  eventType:    NotifEventType;
  title:        string;
  body:         string;
  data?:        Record<string, unknown> | undefined;
  actionUrl?:   string | undefined;
  imageUrl?:    string | undefined;
  lang?:        string | undefined;
  channels?:    NotifChannel[] | undefined;
  scheduledAt?: string | undefined;
}
