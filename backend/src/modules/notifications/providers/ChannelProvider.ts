import { NotifChannel } from '../types/notification.types.js';

export interface ChannelPayload {
  to:        string;
  title:     string;
  body:      string;
  data?:     Record<string, unknown> | undefined;
  imageUrl?: string | undefined;
  subject?:  string | undefined;
  richHtml?: string | undefined;
}

export interface ChannelResult {
  success:    boolean;
  provider:   string;
  externalId?: string | undefined;
  error?:      string | undefined;
}

export interface IChannelProvider {
  channel:  NotifChannel;
  name:     string;
  send(payload: ChannelPayload): Promise<ChannelResult>;
}

// ── Push (FCM stub) ──────────────────────────────────────────────────────────
export const PushProvider: IChannelProvider = {
  channel: NotifChannel.Push,
  name:    'fcm',
  async send(payload: ChannelPayload): Promise<ChannelResult> {
    console.log(`[PUSH] to=${payload.to} title="${payload.title}"`);
    return { success: true, provider: 'fcm', externalId: `fcm_${Date.now()}` };
  },
};

// ── Email (SMTP stub) ────────────────────────────────────────────────────────
export const EmailProvider: IChannelProvider = {
  channel: NotifChannel.Email,
  name:    'smtp',
  async send(payload: ChannelPayload): Promise<ChannelResult> {
    console.log(`[EMAIL] to=${payload.to} subject="${payload.subject ?? payload.title}"`);
    return { success: true, provider: 'smtp', externalId: `email_${Date.now()}` };
  },
};

// ── SMS (Twilio stub) ────────────────────────────────────────────────────────
export const SMSProvider: IChannelProvider = {
  channel: NotifChannel.SMS,
  name:    'twilio',
  async send(payload: ChannelPayload): Promise<ChannelResult> {
    console.log(`[SMS] to=${payload.to} body="${payload.body.slice(0, 60)}"`);
    return { success: true, provider: 'twilio', externalId: `sms_${Date.now()}` };
  },
};

// ── WhatsApp (360dialog stub) ────────────────────────────────────────────────
export const WhatsAppProvider: IChannelProvider = {
  channel: NotifChannel.WhatsApp,
  name:    '360dialog',
  async send(payload: ChannelPayload): Promise<ChannelResult> {
    console.log(`[WHATSAPP] to=${payload.to} body="${payload.body.slice(0, 60)}"`);
    return { success: true, provider: '360dialog', externalId: `wa_${Date.now()}` };
  },
};

// ── Telegram (Bot API stub) ──────────────────────────────────────────────────
export const TelegramProvider: IChannelProvider = {
  channel: NotifChannel.Telegram,
  name:    'telegram_bot',
  async send(payload: ChannelPayload): Promise<ChannelResult> {
    console.log(`[TELEGRAM] to=${payload.to} text="${payload.body.slice(0, 60)}"`);
    return { success: true, provider: 'telegram_bot', externalId: `tg_${Date.now()}` };
  },
};

// ── In-App (Socket.IO) ───────────────────────────────────────────────────────
export const InAppProvider: IChannelProvider = {
  channel: NotifChannel.InApp,
  name:    'socket_io',
  async send(payload: ChannelPayload): Promise<ChannelResult> {
    // Actual socket push is handled in OrchestratorService via req.app.get('io')
    console.log(`[IN_APP] to=${payload.to} title="${payload.title}"`);
    return { success: true, provider: 'socket_io', externalId: `inapp_${Date.now()}` };
  },
};

export const ProviderRegistry = new Map<NotifChannel, IChannelProvider>([
  [NotifChannel.Push,    PushProvider],
  [NotifChannel.Email,   EmailProvider],
  [NotifChannel.SMS,     SMSProvider],
  [NotifChannel.WhatsApp, WhatsAppProvider],
  [NotifChannel.Telegram, TelegramProvider],
  [NotifChannel.InApp,   InAppProvider],
]);