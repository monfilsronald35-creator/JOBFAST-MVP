import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import * as SettingsAPI from '@/services/settings';
import type { UserSettings } from '@/services/settings';
import { changeLanguage } from '@/i18n';

// ─── Icons (inline SVG) ──────────────────────────────────────────────────────
const icons: Record<string, React.ReactNode> = {
  general:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>,
  account:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  privacy:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  security:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  password:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  devices:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>,
  notifications: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  languages:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>,
  theme:         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
  accessibility: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
  storage:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  downloads:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  help:          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>,
  about:         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  developer:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
};

const SECTIONS = [
  'general','account','privacy','security','password',
  'devices','notifications','languages','theme','accessibility',
  'storage','downloads','help','about','developer',
] as const;
type Section = (typeof SECTIONS)[number];

// LABELS now resolved at render time via t() — see SettingsPage

// ─── Toggle component ─────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: value ? '#FACC15' : '#374151', transition: 'background .2s', position: 'relative',
      }}
    >
      <span style={{
        position: 'absolute', top: 2,
        left: value ? 22 : 2,
        width: 20, height: 20, borderRadius: '50%',
        background: '#fff', transition: 'left .2s',
      }} />
    </button>
  );
}

// ─── Section panes ─────────────────────────────────────────────────────────────
function GeneralPane({ s, onPatch }: { s: UserSettings; onPatch: (p: Partial<UserSettings>) => void }) {
  const { t } = useTranslation();
  return (
    <div style={paneStyle}>
      <h2 style={h2}>{t('settings.general.title', 'General Settings')}</h2>
      <Row label={t('settings.general.timezone', 'Timezone')}>
        <select style={selectStyle} value={s.timezone} onChange={e => onPatch({ timezone: e.target.value })}>
          {['America/Port-au-Prince','America/New_York','America/Chicago','Europe/Paris','Africa/Abidjan'].map(tz =>
            <option key={tz} value={tz}>{tz}</option>
          )}
        </select>
      </Row>
      <Row label={t('settings.general.dateFormat', 'Date format')}>
        <select style={selectStyle} value={s.dateFormat} onChange={e => onPatch({ dateFormat: e.target.value })}>
          {['DD/MM/YYYY','MM/DD/YYYY','YYYY-MM-DD'].map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </Row>
      <Row label={t('settings.general.currency', 'Currency')}>
        <select style={selectStyle} value={s.currency} onChange={e => onPatch({ currency: e.target.value })}>
          {['HTG','USD','EUR','CAD'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </Row>
    </div>
  );
}

function AccountPane({ user }: { user: ReturnType<typeof useAuth>['user'] }) {
  const { t } = useTranslation();
  return (
    <div style={paneStyle}>
      <h2 style={h2}>{t('settings.account.title', 'User Account')}</h2>
      <div style={infoBlock}>
        <label style={labelStyle}>{t('settings.account.id', 'ID')}</label>
        <span style={valueStyle}>{user?._id || '—'}</span>
      </div>
      <div style={infoBlock}>
        <label style={labelStyle}>{t('settings.account.role', 'Role')}</label>
        <span style={{ ...valueStyle, ...badge }}>{String(user?.role || 'user')}</span>
      </div>
      <div style={infoBlock}>
        <label style={labelStyle}>{t('common.status', 'Status')}</label>
        <span style={{ ...valueStyle, color: '#4ADE80' }}>{String(user?.status || 'active')}</span>
      </div>
      <p style={{ color: '#94A3B8', fontSize: 13, marginTop: 16 }}>
        {t('settings.account.editHint', 'To edit name, email and photo — go to Profile → Edit Profile.')}
      </p>
    </div>
  );
}

function PrivacyPane({ s, onPatch }: { s: UserSettings; onPatch: (p: Partial<UserSettings>) => void }) {
  const { t } = useTranslation();
  const pr = s.privacy;
  const set = (k: keyof UserSettings['privacy'], v: unknown) => onPatch({ privacy: { ...pr, [k]: v } });
  return (
    <div style={paneStyle}>
      <h2 style={h2}>{t('settings.privacy.title', 'Privacy')}</h2>
      <Row label={t('settings.privacy.publicProfile', 'Public profile')}><Toggle value={pr.profilePublic} onChange={v => set('profilePublic', v)} /></Row>
      <Row label={t('settings.privacy.showEmail', 'Show email')}><Toggle value={pr.showEmail} onChange={v => set('showEmail', v)} /></Row>
      <Row label={t('settings.privacy.showPhone', 'Show phone')}><Toggle value={pr.showPhone} onChange={v => set('showPhone', v)} /></Row>
      <Row label={t('settings.privacy.showLocation', 'Show location')}><Toggle value={pr.showLocation} onChange={v => set('showLocation', v)} /></Row>
      <Row label={t('settings.privacy.messaging', 'Who can message you?')}>
        <select style={selectStyle} value={pr.allowMessaging} onChange={e => set('allowMessaging', e.target.value)}>
          <option value="everyone">{t('common.everyone', 'Everyone')}</option>
          <option value="connections">{t('common.connectionsOnly', 'Connections only')}</option>
          <option value="none">{t('common.nobody', 'Nobody')}</option>
        </select>
      </Row>
      <Row label={t('settings.privacy.dataSharing', 'Data sharing')}><Toggle value={pr.dataSharing} onChange={v => set('dataSharing', v)} /></Row>
    </div>
  );
}

function SecurityPane() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SettingsAPI.getSessions()
      .then((r: Record<string, unknown>) => setSessions((r['sessions'] as unknown[]) ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const revoke = async (id: string) => {
    await SettingsAPI.revokeSession(id);
    setSessions(prev => (prev as Array<Record<string,unknown>>).filter(s => s['id'] !== id));
  };

  return (
    <div style={paneStyle}>
      <h2 style={h2}>{t('settings.security.title', 'Security')}</h2>
      <p style={{ color: '#94A3B8', fontSize: 13, marginBottom: 16 }}>{t('settings.security.sessions', 'Active sessions')}</p>
      {loading && <p style={{ color: '#64748B' }}>{t('settings.security.loading', 'Loading...')}</p>}
      {!loading && sessions.length === 0 && <p style={{ color: '#64748B' }}>{t('common.noData', 'No active sessions')}</p>}
      {(sessions as Array<Record<string,unknown>>).map(s => (
        <div key={String(s['id'])} style={sessionCard}>
          <div>
            <p style={{ fontWeight: 600, color: '#F1F5F9', margin: 0 }}>{String(s['device_name'] || t('common.unknownDevice', 'Unknown device'))}</p>
            <p style={{ color: '#64748B', fontSize: 12, margin: '2px 0 0' }}>{String(s['ip_address'] || '')}</p>
          </div>
          <button onClick={() => revoke(String(s['id']))} style={dangerBtn}>{t('settings.security.revoke', 'Revoke')}</button>
        </div>
      ))}
    </div>
  );
}

function PasswordPane() {
  const { t } = useTranslation();
  const [old_password, setOld] = useState('');
  const [new_password, setNew] = useState('');
  const [confirm, setConfirm]  = useState('');
  const [msg, setMsg]          = useState('');
  const [ok, setOk]            = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    if (new_password !== confirm) { setMsg(t('errors.passwordMismatch', 'Passwords do not match')); return; }
    if (new_password.length < 8)  { setMsg(t('errors.passwordTooShort', 'Password must be at least 8 characters')); return; }
    try {
      await SettingsAPI.changePassword(old_password, new_password);
      setOk(true);
      setMsg(t('settings.password.success', 'Password changed!'));
      setOld(''); setNew(''); setConfirm('');
    } catch {
      setMsg(t('settings.password.error', 'Error. Please try again.'));
    }
  };

  return (
    <div style={paneStyle}>
      <h2 style={h2}>{t('settings.password.title', 'Change Password')}</h2>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360 }}>
        <input type="password" placeholder={t('settings.password.current', 'Current password')} value={old_password} onChange={e => setOld(e.target.value)} style={inputStyle} required />
        <input type="password" placeholder={t('settings.password.new', 'New password')} value={new_password} onChange={e => setNew(e.target.value)} style={inputStyle} required />
        <input type="password" placeholder={t('settings.password.confirm', 'Confirm password')} value={confirm} onChange={e => setConfirm(e.target.value)} style={inputStyle} required />
        {msg && <p style={{ color: ok ? '#4ADE80' : '#F87171', fontSize: 13 }}>{msg}</p>}
        <button type="submit" style={primaryBtn}>{t('settings.password.submit', 'Change')}</button>
      </form>
    </div>
  );
}

function DevicesPane() {
  const { t } = useTranslation();
  const [devices, setDevices] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SettingsAPI.getDevices()
      .then((r: Record<string, unknown>) => setDevices((r['devices'] as unknown[]) ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const revoke = async (id: string) => {
    await SettingsAPI.revokeDevice(id);
    setDevices(prev => (prev as Array<Record<string,unknown>>).filter(d => d['id'] !== id));
  };

  return (
    <div style={paneStyle}>
      <h2 style={h2}>{t('settings.devices.title', 'Connected Devices')}</h2>
      {loading && <p style={{ color: '#64748B' }}>{t('common.loading', 'Loading...')}</p>}
      {!loading && devices.length === 0 && <p style={{ color: '#64748B' }}>{t('common.noData', 'No registered devices')}</p>}
      {(devices as Array<Record<string,unknown>>).map(d => (
        <div key={String(d['id'])} style={sessionCard}>
          <div>
            <p style={{ fontWeight: 600, color: '#F1F5F9', margin: 0 }}>{String(d['device_name'] || t('common.device', 'Device'))}</p>
            <p style={{ color: '#64748B', fontSize: 12, margin: '2px 0 0' }}>{String(d['platform'] || '')} · {String(d['device_type'] || '')}</p>
          </div>
          {d['is_trusted']
            ? <button onClick={() => revoke(String(d['id']))} style={dangerBtn}>{t('settings.devices.revoke', 'Disconnect')}</button>
            : <span style={{ color: '#64748B', fontSize: 12 }}>{t('common.untrusted', 'Untrusted')}</span>
          }
        </div>
      ))}
    </div>
  );
}

function NotificationsPane({ s, onPatch }: { s: UserSettings; onPatch: (p: Partial<UserSettings>) => void }) {
  const { t } = useTranslation();
  const n = s.notifications;
  const set = (k: keyof UserSettings['notifications'], v: boolean) => onPatch({ notifications: { ...n, [k]: v } });
  return (
    <div style={paneStyle}>
      <h2 style={h2}>{t('settings.notifications.title', 'Notifications')}</h2>
      <p style={sectionLabel}>{t('settings.notifications.emailSection', 'Email')}</p>
      <Row label={t('settings.notifications.jobs', 'Jobs')}><Toggle value={n.emailJobs} onChange={v => set('emailJobs', v)} /></Row>
      <Row label={t('settings.notifications.payments', 'Payments')}><Toggle value={n.emailPayments} onChange={v => set('emailPayments', v)} /></Row>
      <Row label={t('settings.notifications.marketing', 'Promotions')}><Toggle value={n.emailMarketing} onChange={v => set('emailMarketing', v)} /></Row>
      <p style={{ ...sectionLabel, marginTop: 16 }}>{t('settings.notifications.pushSection', 'Push Notifications')}</p>
      <Row label={t('settings.notifications.enablePush', 'Enable push')}><Toggle value={n.pushEnabled} onChange={v => set('pushEnabled', v)} /></Row>
      <Row label={t('settings.notifications.jobs', 'Jobs')}><Toggle value={n.pushJobs} onChange={v => set('pushJobs', v)} /></Row>
      <Row label={t('settings.notifications.messages', 'Messages')}><Toggle value={n.pushMessages} onChange={v => set('pushMessages', v)} /></Row>
      <Row label={t('settings.notifications.payments', 'Payments')}><Toggle value={n.pushPayments} onChange={v => set('pushPayments', v)} /></Row>
      <p style={{ ...sectionLabel, marginTop: 16 }}>{t('settings.notifications.smsSection', 'SMS')}</p>
      <Row label={t('settings.notifications.enableSms', 'Enable SMS')}><Toggle value={n.smsEnabled} onChange={v => set('smsEnabled', v)} /></Row>
    </div>
  );
}

function LanguagesPane({ s, onPatch }: { s: UserSettings; onPatch: (p: Partial<UserSettings>) => void }) {
  const { t } = useTranslation();
  const LANGS = [
    { code: 'ht', name: 'Kreyòl Ayisyen' }, { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' }, { code: 'es', name: 'Español' },
  ];
  return (
    <div style={paneStyle}>
      <h2 style={h2}>{t('settings.languages.title', 'App Language')}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 }}>
        {LANGS.map(l => (
          <button
            key={l.code}
            onClick={() => { void changeLanguage(l.code); onPatch({ language: l.code }); }}
            style={{
              padding: '12px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left',
              background: s.language === l.code ? '#FACC15' : '#1E293B',
              color: s.language === l.code ? '#020617' : '#F1F5F9', fontWeight: 600,
            }}
          >{l.name}</button>
        ))}
      </div>
    </div>
  );
}

function ThemePane({ s, onPatch }: { s: UserSettings; onPatch: (p: Partial<UserSettings>) => void }) {
  const { t } = useTranslation();
  const THEMES = [
    { val: 'light' as const, labelKey: 'settings.theme.light', fallback: 'Light', icon: '☀️' },
    { val: 'dark'  as const, labelKey: 'settings.theme.dark',  fallback: 'Dark',  icon: '🌙' },
    { val: 'system'as const, labelKey: 'settings.theme.system',fallback: 'System',icon: '💻' },
  ];
  return (
    <div style={paneStyle}>
      <h2 style={h2}>{t('settings.theme.title', 'Theme')}</h2>
      <div style={{ display: 'flex', gap: 12 }}>
        {THEMES.map(th => (
          <button
            key={th.val}
            onClick={() => onPatch({ theme: th.val })}
            style={{
              flex: 1, padding: '20px 8px', borderRadius: 12, border: s.theme === th.val ? '2px solid #FACC15' : '2px solid #1E293B',
              background: '#0F172A', color: '#F1F5F9', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>{th.icon}</div>
            {t(th.labelKey, th.fallback)}
          </button>
        ))}
      </div>
    </div>
  );
}

function AccessibilityPane({ s, onPatch }: { s: UserSettings; onPatch: (p: Partial<UserSettings>) => void }) {
  const { t } = useTranslation();
  const a = s.accessibility;
  const set = (k: keyof UserSettings['accessibility'], v: unknown) => onPatch({ accessibility: { ...a, [k]: v } });
  return (
    <div style={paneStyle}>
      <h2 style={h2}>{t('settings.accessibility.title', 'Accessibility')}</h2>
      <Row label={t('settings.accessibility.fontSize', 'Text size')}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['sm','md','lg','xl'] as const).map(sz => (
            <button key={sz} onClick={() => set('fontSize', sz)} style={{
              padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: a.fontSize === sz ? '#FACC15' : '#1E293B',
              color: a.fontSize === sz ? '#020617' : '#F1F5F9', fontWeight: 700,
            }}>{sz.toUpperCase()}</button>
          ))}
        </div>
      </Row>
      <Row label={t('settings.accessibility.highContrast', 'High contrast')}><Toggle value={a.highContrast} onChange={v => set('highContrast', v)} /></Row>
      <Row label={t('settings.accessibility.reduceMotion', 'Reduce motion')}><Toggle value={a.reduceMotion} onChange={v => set('reduceMotion', v)} /></Row>
      <Row label={t('settings.accessibility.screenReader', 'Screen reader')}><Toggle value={a.screenReader} onChange={v => set('screenReader', v)} /></Row>
    </div>
  );
}

function StoragePane() {
  const { t } = useTranslation();
  const keys = Object.keys(localStorage);
  const size = keys.reduce((acc, k) => acc + (localStorage.getItem(k) ?? '').length, 0);
  return (
    <div style={paneStyle}>
      <h2 style={h2}>{t('settings.storage.title', 'Local Storage')}</h2>
      <div style={infoBlock}><label style={labelStyle}>{t('settings.storage.keys', 'Keys')}</label><span style={valueStyle}>{keys.length}</span></div>
      <div style={infoBlock}><label style={labelStyle}>{t('settings.storage.size', 'Size')}</label><span style={valueStyle}>{(size / 1024).toFixed(1)} KB</span></div>
      <button onClick={() => { const k = 'jobfast_user'; const u = localStorage.getItem(k); localStorage.clear(); if (u) localStorage.setItem(k, u); }} style={{ ...dangerBtn, marginTop: 16 }}>
        {t('settings.storage.clearBtn', 'Clear cache (keep session)')}
      </button>
    </div>
  );
}

function DownloadsPane() {
  const { t } = useTranslation();
  return (
    <div style={paneStyle}>
      <h2 style={h2}>{t('settings.downloads.title', 'Downloads')}</h2>
      <p style={{ color: '#94A3B8' }}>{t('settings.downloads.desc', 'Manage files downloaded in the app.')}</p>
      <p style={{ color: '#64748B', fontSize: 13, marginTop: 8 }}>{t('settings.downloads.soon', 'This feature will be available in a future version.')}</p>
    </div>
  );
}

function HelpPane() {
  const { t } = useTranslation();
  const FAQ = t('settings.help.faq', { returnObjects: true }) as Array<{ q: string; a: string }>;
  return (
    <div style={paneStyle}>
      <h2 style={h2}>{t('settings.help.title', 'Help & Support')}</h2>
      <p style={{ color: '#94A3B8', marginBottom: 16 }}>{t('settings.help.email', 'support@jobfasthq.com')}</p>
      <a href="https://jobfast-mvp-spzy.vercel.app" style={{ display: 'block', color: '#FACC15', fontSize: 13, marginBottom: 16 }}>jobfast-mvp-spzy.vercel.app</a>
      {Array.isArray(FAQ) && FAQ.map((f, i) => (
        <div key={i} style={{ marginBottom: 16, padding: '12px 16px', background: '#0F172A', borderRadius: 10 }}>
          <p style={{ fontWeight: 700, color: '#FACC15', margin: '0 0 4px' }}>{f.q}</p>
          <p style={{ color: '#94A3B8', fontSize: 13, margin: 0 }}>{f.a}</p>
        </div>
      ))}
    </div>
  );
}

function AboutPane() {
  const { t } = useTranslation();
  return (
    <div style={paneStyle}>
      <h2 style={h2}>{t('settings.about.title', 'About JOBFAST')}</h2>
      <div style={infoBlock}><label style={labelStyle}>{t('settings.about.version', 'Version')}</label><span style={valueStyle}>4.0.0</span></div>
      <div style={infoBlock}><label style={labelStyle}>{t('settings.about.platform', 'Platform')}</label><span style={valueStyle}>JOBFAST HQ Global</span></div>
      <div style={infoBlock}><label style={labelStyle}>{t('settings.about.website', 'Website')}</label><a href="https://jobfast-mvp-spzy.vercel.app" style={{ color: '#FACC15' }}>jobfast-mvp-spzy.vercel.app</a></div>
      <div style={infoBlock}><label style={labelStyle}>{t('settings.about.email', 'Email')}</label><span style={valueStyle}>hello@jobfasthq.com</span></div>
      <div style={{ ...infoBlock, marginTop: 20 }}>
        <p style={{ color: '#94A3B8', fontSize: 12 }}>{t('settings.about.copyright', '© 2025 JOBFAST. All rights reserved.')}</p>
      </div>
    </div>
  );
}

function DeveloperPane() {
  const { t } = useTranslation();
  const env = import.meta.env;
  return (
    <div style={paneStyle}>
      <h2 style={h2}>{t('settings.developer.title', 'Developer Tools')}</h2>
      <div style={infoBlock}><label style={labelStyle}>{t('settings.developer.apiUrl', 'API URL')}</label><span style={valueStyle}>{String(env['VITE_API_URL'] || '/api/v1')}</span></div>
      <div style={infoBlock}><label style={labelStyle}>{t('settings.developer.environment', 'Environment')}</label><span style={valueStyle}>{String(env['MODE'] || 'development')}</span></div>
      <div style={infoBlock}><label style={labelStyle}>React</label><span style={valueStyle}>18.x</span></div>
      <div style={infoBlock}><label style={labelStyle}>{t('settings.developer.build', 'Build')}</label><span style={valueStyle}>{String(typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '—')}</span></div>
      <button onClick={() => { console.log('[JOBFAST DEBUG]', { localStorage: { ...localStorage }, env }); alert(t('settings.developer.debugAlert', 'Console open — see devtools')); }} style={{ ...primaryBtn, marginTop: 16 }}>
        {t('settings.developer.debugBtn', 'Write debug to console')}
      </button>
    </div>
  );
}

// ─── Layout helpers ────────────────────────────────────────────────────────────
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1E293B' }}>
      <span style={{ color: '#CBD5E1', fontSize: 14 }}>{label}</span>
      {children}
    </div>
  );
}

const paneStyle: React.CSSProperties  = { maxWidth: 560 };
const h2: React.CSSProperties         = { color: '#F1F5F9', fontWeight: 700, fontSize: 20, marginBottom: 20 };
const infoBlock: React.CSSProperties  = { display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid #1E293B', alignItems: 'center' };
const labelStyle: React.CSSProperties = { color: '#64748B', fontSize: 13, minWidth: 120 };
const valueStyle: React.CSSProperties = { color: '#F1F5F9', fontSize: 14, fontWeight: 600 };
const sectionLabel: React.CSSProperties = { color: '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '8px 0 4px' };
const badge: React.CSSProperties = { background: '#1E293B', borderRadius: 6, padding: '2px 8px' };
const inputStyle: React.CSSProperties = { padding: '10px 14px', borderRadius: 10, border: '1px solid #1E293B', background: '#0F172A', color: '#F1F5F9', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' };
const selectStyle: React.CSSProperties = { ...inputStyle, width: 'auto', minWidth: 160 };
const primaryBtn: React.CSSProperties  = { padding: '10px 20px', borderRadius: 10, border: 'none', background: '#FACC15', color: '#020617', fontWeight: 700, cursor: 'pointer', fontSize: 14 };
const dangerBtn: React.CSSProperties   = { padding: '6px 14px', borderRadius: 8, border: 'none', background: '#7F1D1D', color: '#FCA5A5', fontWeight: 600, cursor: 'pointer', fontSize: 12 };
const sessionCard: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#0F172A', borderRadius: 10, marginBottom: 8 };

// ─── Main Settings page ────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { t }     = useTranslation();
  const { user }  = useAuth();
  const [section, setSection]   = useState<Section>('general');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    SettingsAPI.getSettings()
      .then(r => setSettings(r.settings))
      .catch(() => {});
  }, []);

  const onPatch = useCallback(async (patch: Partial<UserSettings>) => {
    if (!settings) return;
    const next = { ...settings, ...patch } as UserSettings;
    setSettings(next);
    setSaved(false);
    setSaving(true);
    try {
      const r = await SettingsAPI.patchSettings(patch);
      setSettings(r.settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // revert
      setSettings(settings);
    } finally { setSaving(false); }
  }, [settings]);

  const renderPane = () => {
    if (!settings) return <p style={{ color: '#64748B' }}>{t('settings.loading', 'Loading settings...')}</p>;
    switch (section) {
      case 'general':       return <GeneralPane s={settings} onPatch={onPatch} />;
      case 'account':       return <AccountPane user={user} />;
      case 'privacy':       return <PrivacyPane s={settings} onPatch={onPatch} />;
      case 'security':      return <SecurityPane />;
      case 'password':      return <PasswordPane />;
      case 'devices':       return <DevicesPane />;
      case 'notifications': return <NotificationsPane s={settings} onPatch={onPatch} />;
      case 'languages':     return <LanguagesPane s={settings} onPatch={onPatch} />;
      case 'theme':         return <ThemePane s={settings} onPatch={onPatch} />;
      case 'accessibility': return <AccessibilityPane s={settings} onPatch={onPatch} />;
      case 'storage':       return <StoragePane />;
      case 'downloads':     return <DownloadsPane />;
      case 'help':          return <HelpPane />;
      case 'about':         return <AboutPane />;
      case 'developer':     return <DeveloperPane />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050B18', display: 'flex', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <nav style={{ width: 220, background: '#0A1628', borderRight: '1px solid #1E293B', padding: '24px 0', flexShrink: 0 }}>
        <h1 style={{ color: '#F1F5F9', fontSize: 16, fontWeight: 800, padding: '0 16px 20px', margin: 0, borderBottom: '1px solid #1E293B' }}>
          {t('settings.title', 'Settings')}
        </h1>
        {SECTIONS.map(s => (
          <button
            key={s}
            onClick={() => setSection(s)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px',
              border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: 600,
              background: section === s ? '#1E293B' : 'transparent',
              color: section === s ? '#FACC15' : '#94A3B8',
              borderLeft: section === s ? '3px solid #FACC15' : '3px solid transparent',
            }}
          >
            <span style={{ width: 16, height: 16, flexShrink: 0 }}>{icons[s]}</span>
            {t(`settings.sections.${s}`, s)}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div />
          {saving && <span style={{ color: '#64748B', fontSize: 12 }}>{t('settings.saving', 'Saving...')}</span>}
          {saved  && <span style={{ color: '#4ADE80', fontSize: 12 }}>{t('settings.saved', '✓ Saved')}</span>}
        </div>
        {renderPane()}
      </main>
    </div>
  );
}

// Declare __APP_VERSION__ for TypeScript
declare const __APP_VERSION__: string;
