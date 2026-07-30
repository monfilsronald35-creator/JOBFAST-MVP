-- 016_notification_service.sql — Global Notification Platform
-- Run in Supabase SQL Editor

-- ── Notifications ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notif_notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id),
  event_type   TEXT NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  priority     TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('critical','emergency','high','normal','low','background')),
  status       TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','queued','sending','delivered','read','failed','cancelled')),
  channels     JSONB NOT NULL DEFAULT '[]',
  image_url    TEXT,
  action_url   TEXT,
  data         JSONB,
  lang         TEXT DEFAULT 'ht',
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  read_at      TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  sent_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Delivery Attempts ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notif_deliveries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notif_id     UUID NOT NULL REFERENCES notif_notifications(id) ON DELETE CASCADE,
  channel      TEXT NOT NULL CHECK (channel IN ('in_app','push','email','sms','whatsapp','telegram')),
  status       TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','delivered','failed','bounced')),
  provider     TEXT,
  attempt      SMALLINT NOT NULL DEFAULT 1,
  error        TEXT,
  sent_at      TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Templates ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notif_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  TEXT NOT NULL,
  channel     TEXT NOT NULL CHECK (channel IN ('in_app','push','email','sms','whatsapp','telegram')),
  lang        TEXT NOT NULL DEFAULT 'ht',
  subject     TEXT,
  title_tpl   TEXT NOT NULL,
  body_tpl    TEXT NOT NULL,
  rich_html   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_type, channel, lang)
);

-- ── User Preferences ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notif_preferences (
  user_id           UUID NOT NULL REFERENCES profiles(id),
  channel           TEXT NOT NULL CHECK (channel IN ('in_app','push','email','sms','whatsapp','telegram')),
  category          TEXT NOT NULL,
  enabled           BOOLEAN NOT NULL DEFAULT TRUE,
  quiet_hours_from  TEXT,
  quiet_hours_to    TEXT,
  timezone          TEXT DEFAULT 'America/Port-au-Prince',
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, channel, category)
);

-- ── Schedules (delayed / recurring) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notif_schedules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notif_id     UUID REFERENCES notif_notifications(id) ON DELETE CASCADE,
  schedule_type TEXT NOT NULL DEFAULT 'instant'
    CHECK (schedule_type IN ('instant','delayed','scheduled','recurring')),
  run_at       TIMESTAMPTZ NOT NULL,
  cron_expr    TEXT,
  timezone     TEXT DEFAULT 'UTC',
  processed    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Dead Letter Queue ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notif_dead_letters (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notif_id     UUID REFERENCES notif_notifications(id),
  channel      TEXT NOT NULL,
  error        TEXT NOT NULL,
  attempts     SMALLINT NOT NULL DEFAULT 3,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Enterprise Campaigns ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notif_campaigns (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  event_type       TEXT NOT NULL,
  channels         JSONB NOT NULL DEFAULT '[]',
  title            TEXT NOT NULL,
  body             TEXT NOT NULL,
  target_roles     JSONB,
  target_countries JSONB,
  target_langs     JSONB,
  scheduled_at     TIMESTAMPTZ,
  sent_at          TIMESTAMPTZ,
  total_targets    INTEGER NOT NULL DEFAULT 0,
  sent_count       INTEGER NOT NULL DEFAULT 0,
  created_by       UUID NOT NULL REFERENCES profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Analytics Aggregates ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notif_analytics (
  date         DATE NOT NULL,
  channel      TEXT NOT NULL,
  event_type   TEXT NOT NULL,
  sent         INTEGER NOT NULL DEFAULT 0,
  delivered    INTEGER NOT NULL DEFAULT 0,
  opened       INTEGER NOT NULL DEFAULT 0,
  clicked      INTEGER NOT NULL DEFAULT 0,
  failed       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (date, channel, event_type)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notif_user_status  ON notif_notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_scheduled    ON notif_schedules(run_at)    WHERE processed = FALSE;
CREATE INDEX IF NOT EXISTS idx_notif_deliveries   ON notif_deliveries(notif_id);
CREATE INDEX IF NOT EXISTS idx_notif_analytics    ON notif_analytics(date DESC, channel, event_type);

-- ── Default templates (Haitian Creole + English) ─────────────────────────────
INSERT INTO notif_templates (event_type, channel, lang, title_tpl, body_tpl) VALUES
  ('job.assigned',       'in_app', 'ht', 'Nouvo travay!',               'Travay {{jobId}} asiye ba ou. Klike pou wè detay.'),
  ('job.assigned',       'push',   'ht', 'Nouvo travay pou ou!',         'Klike pou aksepte travay {{jobId}} la.'),
  ('job.assigned',       'in_app', 'en', 'New job assigned!',            'Job {{jobId}} has been assigned to you.'),
  ('job.completed',      'in_app', 'ht', 'Travay fini!',                 'Travay {{jobId}} konfime fini. Peman ap trete.'),
  ('job.completed',      'email',  'ht', 'Travay {{jobId}} fini',        'Felisitasyon! Travay la fini. Peman ap voye nan {{walletId}}.'),
  ('payment.success',    'in_app', 'ht', 'Peman reyisi!',                'Ou resevwa {{amount}} {{currency}}.'),
  ('payment.success',    'push',   'ht', '💰 Peman konfime',             '{{amount}} {{currency}} kредите sou kont ou.'),
  ('payment.success',    'email',  'ht', 'Konfirmasyon peman ou an',     'Peman {{amount}} {{currency}} — ID: {{transactionId}}'),
  ('payment.failed',     'push',   'ht', '❌ Peman echwe',               'Peman {{amount}} {{currency}} echwe. Eseye ankò.'),
  ('payment.failed',     'email',  'ht', 'Peman ou an echwe',            'Peman {{amount}} {{currency}} pa reyisi. Rezon: {{reason}}.'),
  ('wallet.credited',    'in_app', 'ht', 'Kont ou kreye!',              '+{{amount}} {{currency}} ajoute sou kont ou.'),
  ('wallet.debited',     'in_app', 'ht', 'Kont ou debrize',             '-{{amount}} {{currency}} retire nan kont ou.'),
  ('message.received',   'push',   'ht', '💬 {{senderName}} voye mesaj', '{{preview}}'),
  ('video.call.incoming','push',   'ht', '📹 Apèl videyo ap vini',      '{{callerName}} ap rele ou.'),
  ('fraud.alert',        'push',   'ht', '🚨 Alèt sekirite!',           'Aktivite sispèk sou kont ou. Aksyon nesesè.'),
  ('fraud.alert',        'email',  'ht', 'Alèt sekirite enpòtan',       'Nou detekte aktivite sispèk sou kont ou {{userId}}.'),
  ('fraud.alert',        'sms',    'ht', 'JOBFAST ALÈT',                'Aktivite sispèk. Konekte sou app la. Kont: {{userId}}'),
  ('emergency.alert',    'push',   'ht', '🆘 Ijans!',                   '{{message}}'),
  ('emergency.alert',    'sms',    'ht', 'JOBFAST IJANS',               '{{message}}'),
  ('otp',                'sms',    'ht', 'Kòd JOBFAST',                 'Kòd ou: {{code}}. Valid 5 minit.'),
  ('otp',                'push',   'ht', 'Kòd verifikasyon',            'Kòd ou: {{code}}'),
  ('welcome',            'in_app', 'ht', 'Byenvini sou JOBFAST!',       'Kont {{fullName}} kreye avèk siksè.'),
  ('welcome',            'email',  'ht', 'Byenvini sou JOBFAST, {{fullName}}!', 'Kont ou kreye. Kòmanse eksplore platfòm lan.'),
  ('account.verified',   'in_app', 'ht', '✅ Kont ou verifye!',         'Identite ou konfime. Ou ka itilize tout fonksyon yo.'),
  ('login.new_device',   'push',   'ht', '⚠️ Nouvo koneksyon',          'Koneksyon depi aparèy nouvo. Si se pa ou, chanje modpas ou.'),
  ('promotion',          'push',   'ht', '🎁 {{title}}',                 '{{body}}'),
  ('booking.confirmed',  'in_app', 'ht', '✅ Rezèvasyon konfime!',      'Rezèvasyon {{bookingId}} ou an konfime.'),
  ('order.delivered',    'push',   'ht', '📦 Lòd livré!',              'Lòd {{orderId}} ou an livré avèk siksè.'),
  ('refund.approved',    'push',   'ht', '💰 Ranbousman apwouve!',     '{{amount}} {{currency}} ap retounen sou kont ou.')
ON CONFLICT (event_type, channel, lang) DO NOTHING;
