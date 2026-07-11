import API from '../api/axios';

export const bookingAPI = {
  getMyBookings:  (params = {})  => API.get('/bookings', { params }),
  getBooking:     (id)           => API.get(`/bookings/${id}`),
  create:         (data)         => API.post('/bookings', data),
  cancel:         (id, reason)   => API.put(`/bookings/${id}/cancel`, { reason }),
  confirm:        (id)           => API.put(`/bookings/${id}/confirm`),
  complete:       (id)           => API.put(`/bookings/${id}/complete`),
  getAvailability:(providerId, date) => API.get('/bookings/availability', { params: { providerId, date } }),
  rateBooking:    (id, data)     => API.post(`/bookings/${id}/rate`, data),
};
