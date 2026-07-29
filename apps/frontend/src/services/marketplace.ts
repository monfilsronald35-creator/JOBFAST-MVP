import API from '../api/axios';

export const marketplaceAPI = {
  getListings:    (params: Record<string, unknown> = {}) => API.get('/marketplace/listings', { params }),
  getListing:     (id: string | number)                  => API.get(`/marketplace/listings/${id}`),
  createListing:  (data: unknown)                        => API.post('/marketplace/listings', data),
  updateListing:  (id: string | number, data: unknown)   => API.put(`/marketplace/listings/${id}`, data),
  deleteListing:  (id: string | number)                  => API.delete(`/marketplace/listings/${id}`),
  toggleFavorite: (listingId: string | number)           => API.post('/marketplace/favorites/toggle', { listingId }),
  getFavorites:   (userId: string | number)              => API.get('/marketplace/favorites', { params: { userId } }),
  contactSeller:  (listingId: string | number)           => API.post('/marketplace/contact', { listingId }),
};