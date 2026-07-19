import API from '../api/axios';

export const bookingAPI = {
  getMyBookings:  (params = {})  => API.get('/bookings', { params }),
  getBooking:     (id)           => API.get(`/bookings/${id}`),
  create:         (data)         => API.post('/bookings', data),
  cancel:         (id, reason)   => API.patch(`/bookings/${id}/status`, { status: 'cancelled', reason }),
  confirm:        (id)           => API.patch(`/bookings/${id}/status`, { status: 'confirmed' }),
  complete:       (id)           => API.patch(`/bookings/${id}/status`, { status: 'completed' }),
  getAvailability:(providerId, date) => API.get('/bookings/availability', { params: { providerId, date } }),
  rateBooking:    (id, data)     => API.post(`/bookings/${id}/rate`, data),
};
