import API from '../api/axios';

// Super Admin reads from admin OS endpoints + integration + monetization
export const getSuperAdminStats      = () => API.get('/admin/os/stats').then(r => r.data);
export const listAllUsers            = (p?: { page?: number; limit?: number; country?: string; role?: string }) =>
  API.get('/users', { params: p }).then(r => r.data);
export const listCountries           = () => API.get('/localization/countries').then(r => r.data);
export const listCurrencies          = () => API.get('/localization/currencies').then(r => r.data);
export const listLanguages           = () => API.get('/localization/languages').then(r => r.data);
export const getSystemHealth         = () => API.get('/admin/os/health').then(r => r.data);
export const getFounderDashboard     = () => API.get('/admin/os/founder').then(r => r.data);
export const getRevenueSummary       = () => API.get('/monetization/revenue/dashboard').then(r => r.data);
export const getAuditLogs            = (p?: { limit?: number; action?: string }) =>
  API.get('/admin/os/audit', { params: p }).then(r => r.data);
export const getSecurityEvents       = () => API.get('/admin/os/security/threats').then(r => r.data);
export const getIntegrationStats     = () => API.get('/integration/monitoring/partners').then(r => r.data);
export const listFeatureFlags        = () => API.get('/flags').then(r => r.data);
export const updateFeatureFlag       = (name: string, enabled: boolean) =>
  API.patch(`/admin/os/flags/${name}`, { enabled }).then(r => r.data);
export const activateEmergencyMode   = (reason: string) =>
  API.post('/admin/os/emergency/activate', { reason }).then(r => r.data);
export const deactivateEmergencyMode = () =>
  API.post('/admin/os/emergency/deactivate').then(r => r.data);
export const broadcastNotification   = (body: { title: string; message: string; target: string }) =>
  API.post('/admin/os/broadcast', body).then(r => r.data);
export const getDeployments          = () => API.get('/admin/os/health').then(r => r.data);
export const getAIConfig             = () => API.get('/admin/os/ai').then(r => r.data);
