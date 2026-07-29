import API from '../api/axios';

export const storiesAPI = {
  getFeed:       ()                                              => API.get('/stories/feed'),
  getMyStories:  ()                                              => API.get('/stories/mine'),
  create:        (data: unknown)                                 => API.post('/stories', data),
  view:          (id: string | number)                           => API.post(`/stories/${id}/view`),
  react:         (id: string | number, emoji: string)            => API.post(`/stories/${id}/react`, { emoji }),
  report:        (id: string | number, reason: string)           => API.post(`/stories/${id}/report`, { reason }),
  delete:        (id: string | number)                           => API.delete(`/stories/${id}`),
  addHighlight:  (id: string | number)                           => API.post(`/stories/${id}/highlight`),
  getHighlights: (userId: string | number)                       => API.get(`/stories/highlights/${userId}`),
};