import API from '../api/axios';

export const escrowAPI = {
  getMyEscrows: (params = {}) => API.get('/escrow', { params }),
  getEscrow:    (id)          => API.get(`/escrow/${id}`),
  fund:         (jobId, data) => API.post(`/escrow/${jobId}/fund`, data),
  validate:     (id)          => API.post(`/escrow/${id}/validate`),
  release:      (id)          => API.post(`/escrow/${id}/release`),
  dispute:      (id, reason)  => API.post(`/escrow/${id}/dispute`, { reason }),
  getHistory:   (params = {}) => API.get('/escrow/history', { params }),
};
