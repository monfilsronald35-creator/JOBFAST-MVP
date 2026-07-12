import express from 'express';

const router = express.Router();

const bookings = [];

const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// POST /api/v1/bookings — create booking
router.post('/', (req, res) => {
  const { title, serviceType, providerId, clientId, date, time, location, price, notes } = req.body;

  if (!providerId || !clientId || !date) {
    return res.status(400).json({ success: false, message: 'providerId, clientId, and date are required' });
  }

  const booking = {
    id: Date.now().toString(),
    title: title || 'Service Booking',
    serviceType: serviceType || 'general',
    providerId,
    clientId,
    date,
    time: time || null,
    location: location || {},
    price: price || 0,
    notes: notes || '',
    status: BOOKING_STATUS.PENDING,
    createdAt: new Date(),
  };

  bookings.push(booking);

  return res.status(201).json({ success: true, data: booking });
});

// GET /api/v1/bookings — list bookings (filter by userId)
router.get('/', (req, res) => {
  const { userId, status } = req.query;

  let result = [...bookings];
  if (userId) result = result.filter(b => b.providerId === userId || b.clientId === userId);
  if (status) result = result.filter(b => b.status === status);

  return res.json({ success: true, data: result, total: result.length });
});

// GET /api/v1/bookings/:id — get single booking
router.get('/:id', (req, res) => {
  const booking = bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  return res.json({ success: true, data: booking });
});

// PATCH /api/v1/bookings/:id/status — update booking status
router.patch('/:id/status', (req, res) => {
  const booking = bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  const { status } = req.body;
  if (status && Object.values(BOOKING_STATUS).includes(status)) {
    booking.status = status;
  }

  return res.json({ success: true, data: booking });
});

// DELETE /api/v1/bookings/:id — cancel booking
router.delete('/:id', (req, res) => {
  const idx = bookings.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Booking not found' });

  bookings[idx].status = BOOKING_STATUS.CANCELLED;
  return res.json({ success: true, data: bookings[idx] });
});

export default router;
