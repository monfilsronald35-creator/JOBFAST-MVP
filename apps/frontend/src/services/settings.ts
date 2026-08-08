import API from '../api/axios';

export interface UserSettings {
  theme:           'light' | 'dark' | 'system';
  language:        string;
  timezone:        string;
  dateFormat:      string;
  currency:        string;
  notifications:   NotificationSettings;
  privacy:         PrivacySettings;
  accessibility:   AccessibilitySettings;
}

interface NotificationSettings {
  emailJobs:      boolean;
  emailPayments:  boolean;
  emailMarketing: boolean;
  pushEnabled:    boolean;
  pushJobs:       boolean;
  pushMessages:   boolean;
  pushPayments:   boolean;
  smsEnabled:     boolean;
}

interface PrivacySettings {
  profilePublic:  boolean;
  showEmail:      boolean;
  showPhone:      boolean;
  showLocation:   boolean;
  allowMessaging: 'everyone' | 'connections' | 'none';
  dataSharing:    boolean;
}

interface AccessibilitySettings {
  fontSize:    'sm' | 'md' | 'lg' | 'xl';
  highContrast: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
}

export const getSettings  = () => API.get('/users/settings').then(r => r.data as { settings: UserSettings });
export const patchSettings = (patch: Partial<UserSettings>) => API.patch('/users/settings', patch).then(r => r.data as { settings: UserSettings });

export const getSessions   = () => API.get('/users/sessions').then(r => r.data);
export const revokeSession = (id: string) => API.delete(`/users/sessions/${id}`).then(r => r.data);

export const getDevices   = () => API.get('/users/devices').then(r => r.data);
export const revokeDevice = (id: string) => API.delete(`/users/devices/${id}`).then(r => r.data);

export const deleteAccount = () => API.post('/users/delete-account').then(r => r.data);

export const changePassword = (old_password: string, new_password: string) =>
  API.post('/auth/change-password', { old_password, new_password }).then(r => r.data);
