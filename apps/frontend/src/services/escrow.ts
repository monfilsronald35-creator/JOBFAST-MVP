import API from '../api/axios';

export const escrowAPI = {
  getMyEscrows: (params: Record<string, unknown> = {}) => API.get('/escrow', { params }),
  getEscrow:    (id: string | number)                  => API.get(`/escrow/${id}`),
  fund:         (jobId: string | number, data: unknown) => API.post(`/escrow/${jobId}/fund`, data),
  validate:     (id: string | number)                  => API.post(`/escrow/${id}/validate`),
  release:      (id: string | number)                  => API.post(`/escrow/${id}/release`),
  dispute:      (id: string | number, reason: string)  => API.post(`/escrow/${id}/dispute`, { reason }),
  getHistory:   (params: Record<string, unknown> = {}) => API.get('/escrow/history', { params }),
};