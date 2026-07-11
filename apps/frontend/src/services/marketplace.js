import API from '../api/axios';

export const marketplaceAPI = {
  getListings:    (params = {}) => API.get('/marketplace/listings', { params }),
  getListing:     (id)         => API.get(`/marketplace/listings/${id}`),
  createListing:  (data)       => API.post('/marketplace/listings', data),
  updateListing:  (id, data)   => API.put(`/marketplace/listings/${id}`, data),
  deleteListing:  (id)         => API.delete(`/marketplace/listings/${id}`),
  toggleFavorite: (listingId)  => API.post('/marketplace/favorites/toggle', { listingId }),
  getFavorites:   (userId)     => API.get('/marketplace/favorites', { params: { userId } }),
  contactSeller:  (listingId)  => API.post('/marketplace/contact', { listingId }),
};
