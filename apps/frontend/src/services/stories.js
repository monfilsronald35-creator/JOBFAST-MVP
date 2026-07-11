import API from '../api/axios';

export const storiesAPI = {
  getFeed:     ()           => API.get('/stories/feed'),
  getMyStories:()           => API.get('/stories/mine'),
  create:      (data)       => API.post('/stories', data),
  view:        (id)         => API.post(`/stories/${id}/view`),
  react:       (id, emoji)  => API.post(`/stories/${id}/react`, { emoji }),
  report:      (id, reason) => API.post(`/stories/${id}/report`, { reason }),
  delete:      (id)         => API.delete(`/stories/${id}`),
  addHighlight:(id)         => API.post(`/stories/${id}/highlight`),
  getHighlights:(userId)    => API.get(`/stories/highlights/${userId}`),
};
