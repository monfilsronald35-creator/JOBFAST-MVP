import API from '../api/axios';

export const bookingAPI = {
  getMyBookings:   (params: Record<string, unknown> = {}) => API.get('/bookings', { params }),
  getBooking:      (id: string | number)                  => API.get(`/bookings/${id}`),
  create:          (data: unknown)                        => API.post('/bookings', data),
  cancel:          (id: string | number, reason: string)  => API.patch(`/bookings/${id}/status`, { status: 'cancelled', reason }),
  confirm:         (id: string | number)                  => API.patch(`/bookings/${id}/status`, { status: 'confirmed' }),
  complete:        (id: string | number)                  => API.patch(`/bookings/${id}/status`, { status: 'completed' }),
  getAvailability: (providerId: string | number, date: string) => API.get('/bookings/availability', { params: { providerId, date } }),
  rateBooking:     (id: string | number, data: unknown)   => API.post(`/bookings/${id}/rate`, data),
};